import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidEmail, isValidPassword, parseJsonBody } from './auth-validation';

test('parseJsonBody: rejects a body over the byte limit', async () => {
  const body = 'a'.repeat(16385);
  const request = new Request('http://localhost/api/auth/login', { method: 'POST', body });
  const result = await parseJsonBody(request, 16384);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'VALIDATION_ERROR');
});

test('parseJsonBody: accepts a body at exactly the limit', async () => {
  const payload = JSON.stringify({ a: 'x'.repeat(16384 - 10) });
  const request = new Request('http://localhost/api/auth/login', { method: 'POST', body: payload });
  const result = await parseJsonBody(request, 16384);
  assert.equal(result.ok, true);
});

test('parseJsonBody: rejects invalid JSON', async () => {
  const request = new Request('http://localhost/api/auth/login', { method: 'POST', body: '{not json' });
  const result = await parseJsonBody(request);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'VALIDATION_ERROR');
});

test('parseJsonBody: accepts valid JSON', async () => {
  const request = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'joe@example.com', password: 'password123' }),
  });
  const result = await parseJsonBody(request);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { identifier: 'joe@example.com', password: 'password123' });
  }
});

test('isValidEmail: accepts valid addresses', () => {
  assert.equal(isValidEmail('joe@example.com'), true);
  assert.equal(isValidEmail('a.b+c@sub.example.co'), true);
});

test('isValidEmail: rejects invalid addresses', () => {
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('missing@domain'), false);
  assert.equal(isValidEmail('@example.com'), false);
  assert.equal(isValidEmail(''), false);
});

test('isValidPassword: accepts 8+ characters', () => {
  assert.equal(isValidPassword('password123'), true);
  assert.equal(isValidPassword('12345678'), true);
});

test('isValidPassword: rejects under 8 characters', () => {
  assert.equal(isValidPassword('short1'), false);
  assert.equal(isValidPassword(''), false);
});
