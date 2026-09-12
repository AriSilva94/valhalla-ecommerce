export type AuthTokens = { accessToken: string; refreshToken: string };

export type AuthCookieInstruction = {
  name: 'valhalla_access' | 'valhalla_refresh';
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax';
    path: '/';
    maxAge: number;
  };
};

export function buildAuthCookieInstructions(
  tokens: AuthTokens,
  secure: boolean
): AuthCookieInstruction[] {
  return [
    {
      name: 'valhalla_access',
      value: tokens.accessToken,
      options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 600 },
    },
    {
      name: 'valhalla_refresh',
      value: tokens.refreshToken,
      options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 1209600 },
    },
  ];
}

export type OauthNonceCookieInstruction = {
  name: 'valhalla_oauth_nonce';
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax';
    path: '/';
    maxAge: number;
  };
};

export function buildOauthNonceCookieInstruction(
  nonce: string,
  secure: boolean
): OauthNonceCookieInstruction {
  return {
    name: 'valhalla_oauth_nonce',
    value: nonce,
    options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 600 },
  };
}

export function buildClearAuthCookieInstructions(secure: boolean): AuthCookieInstruction[] {
  return [
    {
      name: 'valhalla_access',
      value: '',
      options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 },
    },
    {
      name: 'valhalla_refresh',
      value: '',
      options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 },
    },
  ];
}

export function buildClearOauthNonceCookieInstruction(
  secure: boolean
): OauthNonceCookieInstruction {
  return {
    name: 'valhalla_oauth_nonce',
    value: '',
    options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 },
  };
}
