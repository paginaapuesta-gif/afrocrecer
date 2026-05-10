const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const userController = require("../controllers/userController");


/* =========================
   OBTENER PERFIL
========================= */

router.get("/perfil", authMiddleware, userController.obtenerPerfil);


/* =========================
   ACTUALIZAR AVATAR
========================= */

router.put(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.actualizarAvatar
);


/* =========================
   RUTA TEST
========================= */

router.get("/", (req, res) => {
  res.send("Ruta de usuarios funcionando");
});


module.exports = router;