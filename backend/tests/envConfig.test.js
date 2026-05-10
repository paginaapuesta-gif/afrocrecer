const test = require('node:test');
const assert = require('node:assert/strict');

const envModulePath = require.resolve('../config/env');

function loadEnvModule() {
  delete require.cache[envModulePath];
  return require('../config/env');
}

test('ensureRequiredEnv no falla fuera de producción si faltan variables', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;
  const originalMongo = process.env.MONGODB_URI;

  process.env.NODE_ENV = 'development';
  delete process.env.JWT_SECRET;
  delete process.env.MONGODB_URI;

  const { ensureRequiredEnv } = loadEnvModule();

  assert.doesNotThrow(() => ensureRequiredEnv());

  process.env.NODE_ENV = originalNodeEnv;
  process.env.JWT_SECRET = originalJwt;
  process.env.MONGODB_URI = originalMongo;
});

test('ensureRequiredEnv falla en producción si faltan variables críticas', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwt = process.env.JWT_SECRET;
  const originalMongo = process.env.MONGODB_URI;

  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  delete process.env.MONGODB_URI;

  const { ensureRequiredEnv } = loadEnvModule();

  assert.throws(() => ensureRequiredEnv(), /JWT_SECRET|MONGODB_URI/);

  process.env.NODE_ENV = originalNodeEnv;
  process.env.JWT_SECRET = originalJwt;
  process.env.MONGODB_URI = originalMongo;
});
