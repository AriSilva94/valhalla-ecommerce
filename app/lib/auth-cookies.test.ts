import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthCookieInstructions,
  buildClearAuthCookieInstructions,
  buildClearOauthNonceCookieInstruction,
  buildOauthNonceCookieInstruction,
} from './auth-cookies';

test('buildAuthCookieInstructions cria cookies HTTP-only de sessão', () => {
  const cookies = buildAuthCookieInstructions(
    { accessToken: 'access-secret', refreshToken: 'refresh-secret' },
    true
  );

  assert.deepEqual(cookies, [
    {
      name: 'valhalla_access',
      value: 'access-secret',
      options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 },
    },
    {
      name: 'valhalla_refresh',
      value: 'refresh-secret',
      options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 1209600 },
    },
  ]);
});

test('buildAuthCookieInstructions repassa secure=false', () => {
  const cookies = buildAuthCookieInstructions(
    { accessToken: 'a', refreshToken: 'r' },
    false
  );
  assert.equal(cookies[0].options.secure, false);
  assert.equal(cookies[1].options.secure, false);
  assert.equal(cookies[0].options.httpOnly, true);
  assert.equal(cookies[0].options.sameSite, 'lax');
});

test('buildOauthNonceCookieInstruction cria cookie HTTP-only de 10 minutos', () => {
  const cookie = buildOauthNonceCookieInstruction('nonce-value', true);
  assert.deepEqual(cookie, {
    name: 'valhalla_oauth_nonce',
    value: 'nonce-value',
    options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 },
  });
});

test('buildOauthNonceCookieInstruction repassa secure=false', () => {
  const cookie = buildOauthNonceCookieInstruction('nonce-value', false);
  assert.equal(cookie.options.secure, false);
});

test('buildClearAuthCookieInstructions zera valor e maxAge', () => {
  const cookies = buildClearAuthCookieInstructions(true);
  assert.deepEqual(cookies, [
    {
      name: 'valhalla_access',
      value: '',
      options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 },
    },
    {
      name: 'valhalla_refresh',
      value: '',
      options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 },
    },
  ]);
});

test('buildClearOauthNonceCookieInstruction zera valor e maxAge', () => {
  const cookie = buildClearOauthNonceCookieInstruction(false);
  assert.deepEqual(cookie, {
    name: 'valhalla_oauth_nonce',
    value: '',
    options: { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 0 },
  });
});
