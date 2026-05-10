const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

module.exports = (req, _res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = {
      id: decoded.id,
      role: decoded.role || "user"
    };
  } catch (_error) {
    // En endpoints públicos ignoramos tokens inválidos y continuamos como invitado.
  }

  next();
};
