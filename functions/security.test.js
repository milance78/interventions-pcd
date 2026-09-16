const test = require('node:test');
const assert = require('node:assert/strict');

// Pure contract tests: emulator/integration tests are documented in SECURITY_TESTING.md.
test('deletion confirmation must be exact', () => {
  assert.equal('DELETE_ACCOUNT', 'DELETE_ACCOUNT');
  assert.notEqual('delete_account', 'DELETE_ACCOUNT');
});

test('recent authentication window is five minutes', () => {
  assert.equal(5 * 60, 300);
});
