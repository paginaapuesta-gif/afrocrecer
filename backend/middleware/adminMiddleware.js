const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

module.exports = (req, res, next) => {
  try {
    const currentRole = req.user?.role || "user";

    if (req.user?.id && currentRole === "admin") {
      return next();
    }

    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : authHeader;

    const decoded = jwt.verify(token, getJwtSecret());

    req.user = {
      id: decoded.id,
      role: decoded.role || "user"
    };

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Solo admin" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
