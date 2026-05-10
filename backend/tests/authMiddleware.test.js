const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middleware/authMiddleware');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('authMiddleware devuelve 401 si no hay Authorization header', () => {
  const req = { header: () => undefined };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Acceso denegado. No hay token.');
});

test('authMiddleware devuelve 401 si el token es inválido', () => {
  const req = { header: () => 'Bearer token-invalido' };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Token inválido');
});

test('authMiddleware valida token, setea req.user y llama next', () => {
  process.env.JWT_SECRET = 'test_secret';

  const token = jwt.sign({ id: 'user_123', role: 'admin' }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'user_123', role: 'admin' });
  assert.equal(res.statusCode, 200);
});


test('authMiddleware asigna role user por compatibilidad si el token no lo trae', () => {
  process.env.JWT_SECRET = 'test_secret_default_role';

  const token = jwt.sign({ id: 'legacy_user' }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'legacy_user', role: 'user' });
  assert.equal(res.statusCode, 200);
});
