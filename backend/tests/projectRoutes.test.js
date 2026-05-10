const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../routes/projectRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

function getRoute(path, method) {
  const layer = router.stack.find((stackLayer) => {
    if (!stackLayer.route) return false;
    if (stackLayer.route.path !== path) return false;
    return Boolean(stackLayer.route.methods[method]);
  });

  return layer ? layer.route : null;
}

test('projectRoutes expone GET / y GET /:id', () => {
  const listRoute = getRoute('/', 'get');
  const detailRoute = getRoute('/:id', 'get');

  assert.ok(listRoute, 'GET / debe existir');
  assert.ok(detailRoute, 'GET /:id debe existir');

  const listHasOptionalAuth = listRoute.stack.some((handlerLayer) => handlerLayer.handle === optionalAuth);
  const detailHasOptionalAuth = detailRoute.stack.some((handlerLayer) => handlerLayer.handle === optionalAuth);

  assert.equal(listHasOptionalAuth, true, 'GET / debe incluir optionalAuth');
  assert.equal(detailHasOptionalAuth, true, 'GET /:id debe incluir optionalAuth');
});

test('projectRoutes protege con authMiddleware las rutas mutables', () => {
  const protectedRoutes = [
    { path: '/', method: 'post' },
    { path: '/:id', method: 'put' },
    { path: '/:id/like', method: 'put' },
    { path: '/:id/comment', method: 'post' },
    { path: '/:id', method: 'delete' }
  ];

  for (const routeConfig of protectedRoutes) {
    const route = getRoute(routeConfig.path, routeConfig.method);
    assert.ok(route, `${routeConfig.method.toUpperCase()} ${routeConfig.path} debe existir`);

    const hasAuthMiddleware = route.stack.some((handlerLayer) => handlerLayer.handle === authMiddleware);
    assert.equal(
      hasAuthMiddleware,
      true,
      `${routeConfig.method.toUpperCase()} ${routeConfig.path} debe incluir authMiddleware`
    );
  }
});
