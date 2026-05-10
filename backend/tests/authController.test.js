const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const authController = require("../controllers/authController");
const User = require("../models/User");

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

test("registrarUsuario crea cuentas nuevas con status pending", async () => {
  const originalFindOne = User.findOne;
  const originalPrototypeSave = User.prototype.save;

  let capturedStatus = null;

  User.findOne = async () => null;
  User.prototype.save = async function saveMock() {
    capturedStatus = this.status;
    return this;
  };

  const req = {
    body: { name: "Nuevo", email: "nuevo@correo.com", password: "12345678" }
  };
  const res = createRes();

  try {
    await authController.registrarUsuario(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedStatus, "pending");
    assert.equal(
      res.body.message,
      "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador"
    );
  } finally {
    User.findOne = originalFindOne;
    User.prototype.save = originalPrototypeSave;
  }
});

test("loginUsuario bloquea cuentas pending", async () => {
  const originalFindOne = User.findOne;

  const passwordHash = await bcrypt.hash("12345678", 4);

  User.findOne = async () => ({
    _id: "u1",
    email: "pending@afro.com",
    name: "Pending",
    role: "user",
    status: "pending",
    password: passwordHash,
    save: async () => {}
  });

  const req = {
    body: { email: "pending@afro.com", password: "12345678" }
  };
  const res = createRes();

  try {
    await authController.loginUsuario(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "AUTH_ACCOUNT_PENDING");
  } finally {
    User.findOne = originalFindOne;
  }
});

test("loginUsuario bloquea cuentas rejected", async () => {
  const originalFindOne = User.findOne;

  const passwordHash = await bcrypt.hash("12345678", 4);

  User.findOne = async () => ({
    _id: "u2",
    email: "rejected@afro.com",
    name: "Rejected",
    role: "user",
    status: "rejected",
    password: passwordHash,
    save: async () => {}
  });

  const req = {
    body: { email: "rejected@afro.com", password: "12345678" }
  };
  const res = createRes();

  try {
    await authController.loginUsuario(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "AUTH_ACCOUNT_REJECTED");
  } finally {
    User.findOne = originalFindOne;
  }
});


test("loginUsuario permite acceso al admin aunque tenga status pending", async () => {
  const originalFindOne = User.findOne;

  process.env.JWT_SECRET = "test_secret_admin_login";
  const passwordHash = await bcrypt.hash("12345678", 4);

  const adminUser = {
    _id: "admin1",
    email: "admin@afro.com",
    name: "Admin",
    role: "admin",
    status: "pending",
    password: passwordHash,
    avatar: "",
    lastLoginAt: null,
    save: async function saveMock() { return this; }
  };

  User.findOne = async () => adminUser;

  const req = {
    body: { email: "admin@afro.com", password: "12345678" }
  };
  const res = createRes();

  try {
    await authController.loginUsuario(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, "Login exitoso");
    assert.equal(res.body.user.role, "admin");
    assert.equal(res.body.user.status, "approved");
    assert.ok(res.body.token);
  } finally {
    User.findOne = originalFindOne;
  }
});
