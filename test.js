const assert = require('assert');
const app = require('./app');

// Simple smoke test without starting the HTTP server
assert.strictEqual(typeof app, 'function', 'Express app should be created');

console.log('All tests passed');
