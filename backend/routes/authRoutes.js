const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/* REGISTRO */
router.post("/registro", authController.registrarUsuario);

/* LOGIN */
router.post("/login", authController.loginUsuario);

/* REGISTRO ADMIN */
router.post("/registro-admin", authController.registroAdmin);

module.exports = router;
