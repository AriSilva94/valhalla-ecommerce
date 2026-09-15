declare module 'fengari' {
  type LuaState = object;
  type LuaCallback = () => number;

  export const lua: {
    LUA_OK: number;
    lua_newtable(state: LuaState): void;
    lua_pcall(state: LuaState, argumentsCount: number, resultsCount: number, errorFunction: number): number;
    lua_pushinteger(state: LuaState, value: number): void;
    lua_pushjsfunction(state: LuaState, callback: LuaCallback): void;
    lua_pushstring(state: LuaState, value: Uint8Array): void;
    lua_rawseti(state: LuaState, index: number, key: number): void;
    lua_setfield(state: LuaState, index: number, key: Uint8Array): void;
    lua_setglobal(state: LuaState, name: Uint8Array): void;
    lua_tojsstring(state: LuaState, index: number): string;
  };

  export const lauxlib: {
    luaL_loadstring(state: LuaState, source: Uint8Array): number;
    luaL_newstate(): LuaState;
  };

  export const lualib: {
    luaL_openlibs(state: LuaState): void;
  };

  export function to_luastring(value: string): Uint8Array;
}
