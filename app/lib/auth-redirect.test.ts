import test from 'node:test';
import assert from 'node:assert/strict';

import { safeRedirect } from './auth-redirect';

const FALLBACK = '/conta';

test('safeRedirect: valid relative path passes through', () => {
  assert.equal(safeRedirect('/conta/pedidos', FALLBACK), '/conta/pedidos');
});

test('safeRedirect: root path passes through', () => {
  assert.equal(safeRedirect('/', FALLBACK), '/');
});

test('safeRedirect: protocol-relative URL falls back', () => {
  assert.equal(safeRedirect('//evil.example', FALLBACK), FALLBACK);
});

test('safeRedirect: absolute https URL falls back', () => {
  assert.equal(safeRedirect('https://evil.example', FALLBACK), FALLBACK);
});

test('safeRedirect: backslash variant falls back', () => {
  assert.equal(safeRedirect('/\\evil.example', FALLBACK), FALLBACK);
});

test('safeRedirect: javascript scheme falls back', () => {
  assert.equal(safeRedirect('javascript:alert(1)', FALLBACK), FALLBACK);
});

test('safeRedirect: empty string falls back', () => {
  assert.equal(safeRedirect('', FALLBACK), FALLBACK);
});

test('safeRedirect: null falls back', () => {
  assert.equal(safeRedirect(null, FALLBACK), FALLBACK);
});

test('safeRedirect: undefined falls back', () => {
  assert.equal(safeRedirect(undefined, FALLBACK), FALLBACK);
});

test('safeRedirect: path without leading slash falls back', () => {
  assert.equal(safeRedirect('conta/pedidos', FALLBACK), FALLBACK);
});

test('safeRedirect: embedded scheme after leading slash falls back', () => {
  assert.equal(safeRedirect('/https://evil.example', FALLBACK), FALLBACK);
});
