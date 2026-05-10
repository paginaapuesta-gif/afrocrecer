const test = require("node:test");
const assert = require("node:assert/strict");

const Project = require("../models/Project");
const projectController = require("../controllers/projectController");

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

test("actualizarProyecto permite al admin editar un proyecto ajeno", async () => {
  const originalFindById = Project.findById;

  let saveCalled = false;
  Project.findById = async () => ({
    author: { toString: () => "owner_1" },
    updatedAt: null,
    save: async () => {
      saveCalled = true;
    }
  });

  const req = {
    params: { id: "project_1" },
    user: { id: "admin_1", role: "admin" },
    body: {},
    files: []
  };
  const res = createRes();

  try {
    await projectController.actualizarProyecto(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(saveCalled, true);
    assert.equal(res.body.message, "Proyecto actualizado");
  } finally {
    Project.findById = originalFindById;
  }
});

test("actualizarProyecto mantiene 403 para usuario normal que no es autor", async () => {
  const originalFindById = Project.findById;

  Project.findById = async () => ({
    author: { toString: () => "owner_1" }
  });

  const req = {
    params: { id: "project_1" },
    user: { id: "user_2", role: "user" },
    body: {},
    files: []
  };
  const res = createRes();

  try {
    await projectController.actualizarProyecto(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "PROJECT_FORBIDDEN_EDIT");
  } finally {
    Project.findById = originalFindById;
  }
});

test("eliminarProyecto permite al admin eliminar un proyecto ajeno", async () => {
  const originalFindById = Project.findById;
  const originalFindByIdAndDelete = Project.findByIdAndDelete;

  let deletedId = null;
  Project.findById = async () => ({
    author: { toString: () => "owner_1" }
  });
  Project.findByIdAndDelete = async (id) => {
    deletedId = id;
  };

  const req = {
    params: { id: "project_2" },
    user: { id: "admin_1", role: "admin" }
  };
  const res = createRes();

  try {
    await projectController.eliminarProyecto(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(deletedId, "project_2");
    assert.equal(res.body.message, "Proyecto eliminado");
  } finally {
    Project.findById = originalFindById;
    Project.findByIdAndDelete = originalFindByIdAndDelete;
  }
});

test("eliminarProyecto mantiene 403 para usuario normal que no es autor", async () => {
  const originalFindById = Project.findById;
  const originalFindByIdAndDelete = Project.findByIdAndDelete;

  let deleteCalled = false;
  Project.findById = async () => ({
    author: { toString: () => "owner_1" }
  });
  Project.findByIdAndDelete = async () => {
    deleteCalled = true;
  };

  const req = {
    params: { id: "project_3" },
    user: { id: "user_2", role: "user" }
  };
  const res = createRes();

  try {
    await projectController.eliminarProyecto(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "PROJECT_FORBIDDEN_DELETE");
    assert.equal(deleteCalled, false);
  } finally {
    Project.findById = originalFindById;
    Project.findByIdAndDelete = originalFindByIdAndDelete;
  }
});
