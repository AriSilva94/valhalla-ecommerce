import test from 'node:test';
import assert from 'node:assert/strict';

import { getClientIp, isOriginAllowed } from './auth-request';

test('isOriginAllowed: exact match returns true', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { origin: 'https://valhalla.example.com' },
  });
  assert.equal(isOriginAllowed(request, 'https://valhalla.example.com'), true);
});

test('isOriginAllowed: missing Origin header returns false', () => {
  const request = new Request('http://localhost/api/auth/login');
  assert.equal(isOriginAllowed(request, 'https://valhalla.example.com'), false);
});

test('isOriginAllowed: subdomain does not match (no wildcarding)', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { origin: 'https://evil.valhalla.example.com' },
  });
  assert.equal(isOriginAllowed(request, 'https://valhalla.example.com'), false);
});

test('isOriginAllowed: different scheme does not match', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { origin: 'http://valhalla.example.com' },
  });
  assert.equal(isOriginAllowed(request, 'https://valhalla.example.com'), false);
});

test('getClientIp: returns first entry of x-forwarded-for', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
  });
  assert.equal(getClientIp(request), '203.0.113.1');
});

test('getClientIp: falls back to "unknown" when header is absent', () => {
  const request = new Request('http://localhost/api/auth/login');
  assert.equal(getClientIp(request), 'unknown');
});
