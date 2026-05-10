const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const adminMiddleware = require("../middleware/adminMiddleware");

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

test("adminMiddleware devuelve 401 si no hay Authorization header ni req.user", () => {
  const req = { header: () => undefined };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "No autorizado");
});

test("adminMiddleware devuelve 403 cuando el rol no es admin", () => {
  process.env.JWT_SECRET = "test_secret_admin";

  const token = jwt.sign({ id: "user_1", role: "user" }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Solo admin");
});

test("adminMiddleware permite acceso cuando req.user ya es admin", () => {
  const req = {
    user: { id: "admin_1", role: "admin" },
    header: () => undefined
  };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("adminMiddleware valida token Bearer y setea req.user admin", () => {
  process.env.JWT_SECRET = "test_secret_admin_2";

  const token = jwt.sign({ id: "admin_2", role: "admin" }, process.env.JWT_SECRET);
  const req = { header: () => `Bearer ${token}` };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: "admin_2", role: "admin" });
  assert.equal(res.statusCode, 200);
});
