const test = require("node:test");
const assert = require("node:assert/strict");

const Content = require("../models/Content");
const contentController = require("../controllers/contentController");

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

test("obtenerContenidoPorClave devuelve el contenido público por clave", async () => {
  const originalFindOne = Content.findOne;

  Content.findOne = async ({ clave }) => ({ clave, valor: "Texto dinámico" });

  const req = { params: { clave: "home.hero" } };
  const res = createRes();

  try {
    await contentController.obtenerContenidoPorClave(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { clave: "home.hero", valor: "Texto dinámico" });
  } finally {
    Content.findOne = originalFindOne;
  }
});

test("obtenerContenidoPorClave devuelve 404 si la clave no existe", async () => {
  const originalFindOne = Content.findOne;

  Content.findOne = async () => null;

  const req = { params: { clave: "home.missing" } };
  const res = createRes();

  try {
    await contentController.obtenerContenidoPorClave(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, "CONTENT_NOT_FOUND");
  } finally {
    Content.findOne = originalFindOne;
  }
});

test("guardarContenidoPorClave usa upsert para crear o actualizar sin duplicados", async () => {
  const originalFindOneAndUpdate = Content.findOneAndUpdate;

  let receivedArgs = null;
  Content.findOneAndUpdate = async (...args) => {
    receivedArgs = args;
    return {
      clave: args[1].clave,
      valor: args[1].valor
    };
  };

  const req = {
    params: { clave: "home.hero" },
    body: { valor: "Nuevo contenido" }
  };
  const res = createRes();

  try {
    await contentController.guardarContenidoPorClave(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(receivedArgs[0].clave, "home.hero");
    assert.deepEqual(receivedArgs[2], {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    });
    assert.equal(res.body.content.valor, "Nuevo contenido");
  } finally {
    Content.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
