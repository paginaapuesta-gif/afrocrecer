const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const optionalAuth = require("../middleware/optionalAuth");

test("optionalAuth continúa sin req.user cuando no hay Authorization header", () => {
  const req = { header: () => undefined };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user, undefined);
});

test("optionalAuth setea req.user cuando el token es válido", () => {
  process.env.JWT_SECRET = "test_secret_optional";

  const token = jwt.sign({ id: "user_456", role: "admin" }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: "user_456", role: "admin" });
});

test("optionalAuth ignora tokens inválidos y continúa como invitado", () => {
  const req = { header: () => "Bearer token-invalido" };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user, undefined);
});


test("optionalAuth asigna role user por compatibilidad si el token no lo trae", () => {
  process.env.JWT_SECRET = "test_secret_optional_default_role";

  const token = jwt.sign({ id: "legacy_optional" }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: "legacy_optional", role: "user" });
});
