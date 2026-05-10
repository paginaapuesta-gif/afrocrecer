const test = require("node:test");
const assert = require("node:assert/strict");

const router = require("../routes/adminUsersRoutes");
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

test("adminUsersRoutes expone endpoints requeridos", () => {
  assert.ok(getRoute("/pending", "get"));
  assert.ok(getRoute("/:id/approve", "put"));
  assert.ok(getRoute("/:id/reject", "put"));
});

test("adminUsersRoutes protege todas las rutas con auth + admin middleware", () => {
  const routes = [
    { path: "/pending", method: "get" },
    { path: "/:id/approve", method: "put" },
    { path: "/:id/reject", method: "put" }
  ];

  for (const routeConfig of routes) {
    const route = getRoute(routeConfig.path, routeConfig.method);
    assert.ok(route, `${routeConfig.method.toUpperCase()} ${routeConfig.path} debe existir`);

    const hasAuthMiddleware = route.stack.some((layer) => layer.handle === authMiddleware);
    const hasAdminMiddleware = route.stack.some((layer) => layer.handle === adminMiddleware);

    assert.equal(hasAuthMiddleware, true, `${routeConfig.path} debe incluir authMiddleware`);
    assert.equal(hasAdminMiddleware, true, `${routeConfig.path} debe incluir adminMiddleware`);
  }
});
