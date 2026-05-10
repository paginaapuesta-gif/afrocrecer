const test = require("node:test");
const assert = require("node:assert/strict");

const router = require("../routes/contentRoutes");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

function getRoute(path, method) {
  const layer = router.stack.find((stackLayer) => {
    if (!stackLayer.route) return false;
    if (stackLayer.route.path !== path) return false;
    return Boolean(stackLayer.route.methods[method]);
  });

  return layer ? layer.route : null;
}

test("contentRoutes expone GET /:clave como público", () => {
  const route = getRoute("/:clave", "get");

  assert.ok(route, "GET /:clave debe existir");
  assert.equal(route.stack.length, 1);
});

test("contentRoutes protege PUT /:clave con authMiddleware y adminMiddleware", () => {
  const route = getRoute("/:clave", "put");

  assert.ok(route, "PUT /:clave debe existir");

  const hasAuthMiddleware = route.stack.some((handlerLayer) => handlerLayer.handle === authMiddleware);
  const hasAdminMiddleware = route.stack.some((handlerLayer) => handlerLayer.handle === adminMiddleware);

  assert.equal(hasAuthMiddleware, true, "PUT /:clave debe incluir authMiddleware");
  assert.equal(hasAdminMiddleware, true, "PUT /:clave debe incluir adminMiddleware");
});
