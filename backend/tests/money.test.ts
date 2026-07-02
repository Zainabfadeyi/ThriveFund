import test from 'node:test';
import assert from 'node:assert/strict';
import { fromKobo, toKobo } from '../src/lib/money';

test('money helpers convert naira and kobo', () => {
  assert.equal(toKobo(35), 3500);
  assert.equal(fromKobo(3500), 35);
  assert.equal(toKobo(5000), 500000);
});
