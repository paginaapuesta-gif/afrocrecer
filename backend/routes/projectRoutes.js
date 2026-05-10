const express = require("express");

const router = express.Router();

const projectController = require("../controllers/projectController");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
/* =========================
   CREAR PUBLICACIÓN
========================= */

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.any()(req, res, function (err) {

      if (err) {
        console.log("MULTER ERROR:", err.message);
        return res.status(400).json({ message: err.message });
      }

      next();

    });
  },
  projectController.crearProyecto
);

/* =========================
   OBTENER PUBLICACIONES
========================= */

router.get(
  "/",
  optionalAuth,
  projectController.obtenerProyectos
);

/* =========================
   OBTENER POR ID
========================= */

router.get(
  "/:id",
  optionalAuth,
  projectController.obtenerProyectoPorId
);

/* =========================
   ACTUALIZAR
========================= */
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    upload.any()(req, res, function (err) {
      if (err) {
        console.log("MULTER ERROR:", err.message);
        return res.status(400).json({ message: err.message });
      }

      next();
    });
  },
  projectController.actualizarProyecto
);

/* =========================
   LIKE
========================= */

router.put(
  "/:id/like",
  authMiddleware,
  projectController.likeProyecto
);

/* =========================
   COMENTARIO
========================= */

router.post(
  "/:id/comment",
  authMiddleware,
  projectController.comentarProyecto
);

/* =========================
   ELIMINAR
========================= */

router.delete(
  "/:id",
  authMiddleware, // 🔥 CAMBIO AQUÍ
  projectController.eliminarProyecto
);

module.exports = router;
