import test from 'node:test';
import assert from 'node:assert/strict';

import { getClientIp, isOriginAllowed, getAllowedOrigin } from './auth-request';

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

test('getClientIp: returns rightmost entry of x-forwarded-for (trusted proxy hop)', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
  });
  assert.equal(getClientIp(request), '10.0.0.1');
});

test('getClientIp: multi-hop header still uses the rightmost (last) hop, not an attacker-spoofed leftmost one', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': '198.51.100.9 (spoofed), 203.0.113.1, 10.0.0.5' },
  });
  assert.equal(getClientIp(request), '10.0.0.5');
});

test('getClientIp: single entry is returned as-is', () => {
  const request = new Request('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  });
  assert.equal(getClientIp(request), '203.0.113.1');
});

test('getClientIp: falls back to "unknown" when header is absent', () => {
  const request = new Request('http://localhost/api/auth/login');
  assert.equal(getClientIp(request), 'unknown');
});

test('getAllowedOrigin: returns the origin for an http URL (local dev)', () => {
  assert.equal(
    getAllowedOrigin({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }),
    'http://localhost:3000',
  );
});

test('getAllowedOrigin: returns the origin for an https URL, dropping path/query', () => {
  assert.equal(
    getAllowedOrigin({ NEXT_PUBLIC_SITE_URL: 'https://valhalla.example.com/foo?bar=1' }),
    'https://valhalla.example.com',
  );
});

test('getAllowedOrigin: returns empty string when unset', () => {
  assert.equal(getAllowedOrigin({}), '');
});

test('getAllowedOrigin: returns empty string for an unparseable value', () => {
  assert.equal(getAllowedOrigin({ NEXT_PUBLIC_SITE_URL: 'not a url' }), '');
});
