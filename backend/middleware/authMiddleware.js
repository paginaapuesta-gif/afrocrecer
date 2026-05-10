const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        message: "Acceso denegado. No hay token.",
      });
    }

    // 🔥 MANERA SEGURA
    let token;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    } else {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({
        message: "Token no válido",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    console.log("ERROR JWT:", error.message);

    return res.status(401).json({
      message: "Token inválido",
    });
  }
};
