const express = require("express");

const router = express.Router();

const contentController = require("../controllers/contentController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/:clave", contentController.obtenerContenidoPorClave);

router.put(
  "/:clave",
  authMiddleware,
  adminMiddleware,
  contentController.guardarContenidoPorClave
);

module.exports = router;
