import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkRateLimit,
  getRateLimitClient,
  RATE_LIMIT_SCRIPT,
  type RateLimiterClient,
  type RedisClientFactory,
} from './redis';

function runRateLimitScriptWithFailedExpiry(script: string): { keyExists: boolean } {
  const { lua, lauxlib, lualib, to_luastring } = require('fengari');
  const state = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(state);
  let keyExists = false;

  function redisCall(): number {
    const command = lua.lua_tojsstring(state, 1);
    if (command === 'INCR') {
      keyExists = true;
      lua.lua_pushinteger(state, 1);
      return 1;
    }
    if (command === 'DEL') {
      keyExists = false;
      lua.lua_pushinteger(state, 1);
      return 1;
    }
    if (command === 'TTL') {
      lua.lua_pushinteger(state, keyExists ? -1 : -2);
      return 1;
    }
    throw new Error(`Unexpected redis.call command: ${command}`);
  }

  function redisPcall(): number {
    const command = lua.lua_tojsstring(state, 1);
    if (command !== 'EXPIRE') throw new Error(`Unexpected redis.pcall command: ${command}`);

    lua.lua_newtable(state);
    lua.lua_pushstring(state, to_luastring('forced expiry failure'));
    lua.lua_setfield(state, -2, to_luastring('err'));
    return 1;
  }

  lua.lua_newtable(state);
  lua.lua_pushjsfunction(state, redisCall);
  lua.lua_setfield(state, -2, to_luastring('call'));
  lua.lua_pushjsfunction(state, redisPcall);
  lua.lua_setfield(state, -2, to_luastring('pcall'));
  lua.lua_setglobal(state, to_luastring('redis'));

  lua.lua_newtable(state);
  lua.lua_pushstring(state, to_luastring('rate-limit:test'));
  lua.lua_rawseti(state, -2, 1);
  lua.lua_setglobal(state, to_luastring('KEYS'));
  lua.lua_newtable(state);
  lua.lua_pushstring(state, to_luastring('300'));
  lua.lua_rawseti(state, -2, 1);
  lua.lua_setglobal(state, to_luastring('ARGV'));

  assert.equal(lauxlib.luaL_loadstring(state, to_luastring(script)), lua.LUA_OK);
  assert.equal(lua.lua_pcall(state, 0, 1, 0), lua.LUA_OK);
  return { keyExists };
}

test('checkRateLimit atomically increments and blocks over the limit using the Redis TTL', async (t) => {
  t.mock.method(console, 'error', () => undefined);
  const calls: Array<{ script: string; key: string; windowSeconds: string }> = [];
  const results = [[1, 300], [2, 299], [3, 42]];
  const client: RateLimiterClient = {
    eval: async (script, _keyCount, key, windowSeconds) => {
      calls.push({ script, key, windowSeconds });
      return results.shift()!;
    },
  };

  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), {
    allowed: false,
    retryAfterSeconds: 42,
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(({ key, windowSeconds }) => ({ key, windowSeconds })), [
    { key: 'login:127.0.0.1', windowSeconds: '300' },
    { key: 'login:127.0.0.1', windowSeconds: '300' },
    { key: 'login:127.0.0.1', windowSeconds: '300' },
  ]);
  assert.match(calls[0].script, /redis\.call\('INCR', KEYS\[1\]\)/);
  assert.match(calls[0].script, /redis\.pcall\('EXPIRE', KEYS\[1\], ARGV\[1\]\)/);
  assert.match(calls[0].script, /redis\.call\('TTL', KEYS\[1\]\)/);
});

test('checkRateLimit fails open when Redis is not configured', async () => {
  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, null), { allowed: true });
});

test('checkRateLimit fails open when Redis returns an error', async (t) => {
  const logs: string[] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => logs.push(args.map(String).join(' ')));
  const secret = 'redis://user:super-secret@redis.example:6379/0';
  const client: RateLimiterClient = {
    eval: async () => {
      throw new Error(secret);
    },
  };

  assert.deepEqual(await checkRateLimit('login:127.0.0.1', 2, 300, client), { allowed: true });
  assert.ok(logs.every((line) => !line.includes(secret)));
});

test('the atomic rate-limit script deletes the key when expiry fails', () => {
  const result = runRateLimitScriptWithFailedExpiry(RATE_LIMIT_SCRIPT);
  assert.equal(result.keyExists, false);
});

test('getRateLimitClient recreates an ended client and does not log connection secrets', (t) => {
  const originalUrl = process.env.REDIS_URL;
  const secret = 'redis://user:super-secret@redis.example:6379/0';
  process.env.REDIS_URL = secret;

  const logs: string[] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => logs.push(args.map(String).join(' ')));

  let connectionErrorHandler: ((error: Error) => void) | undefined;
  const firstClient = {
    status: 'ready',
    eval: async () => [1, 300],
    on: (_event: 'error', handler: (error: Error) => void) => {
      connectionErrorHandler = handler;
    },
  };
  const secondClient = {
    status: 'ready',
    eval: async () => [1, 300],
    on: () => undefined,
  };
  const clients = [firstClient, secondClient];
  const factoryOptions: Array<{
    lazyConnect?: boolean;
    maxRetriesPerRequest?: number | null;
    retryStrategy?: ((times: number) => unknown) | null;
  }> = [];
  const factory: RedisClientFactory = ((_url, options) => {
    factoryOptions.push(options);
    return clients.shift()!;
  }) as RedisClientFactory;

  try {
    assert.equal(getRateLimitClient(factory), firstClient);
    connectionErrorHandler!(new Error(secret));
    assert.ok(logs.every((line) => !line.includes(secret)));

    firstClient.status = 'end';
    assert.equal(getRateLimitClient(factory), secondClient);
    assert.equal(factoryOptions.length, 2);
    assert.ok(factoryOptions.every((options) => options.lazyConnect === true));
    assert.ok(factoryOptions.every((options) => options.maxRetriesPerRequest === 1));
    assert.ok(factoryOptions.every((options) => options.retryStrategy?.(1) === null));
  } finally {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  }
});
