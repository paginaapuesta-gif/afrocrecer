const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const userController = require("../controllers/userController");

router.get("/pending", authMiddleware, adminMiddleware, userController.listarUsuariosPendientes);

router.put("/:id/approve", authMiddleware, adminMiddleware, (req, res, next) => {
  req.body.status = "approved";
  return userController.actualizarEstadoUsuario(req, res, next);
});

router.put("/:id/reject", authMiddleware, adminMiddleware, (req, res, next) => {
  req.body.status = "rejected";
  return userController.actualizarEstadoUsuario(req, res, next);
});

module.exports = router;
