const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { ensureRequiredEnv } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const contentRoutes = require("./routes/contentRoutes");
const adminUsersRoutes = require("./routes/adminUsersRoutes");
const upload = require("./middleware/upload");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

dotenv.config();

ensureRequiredEnv();

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   CONEXIÓN MONGODB
========================= */

connectDB();

/* =========================
   RUTAS
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.post("/api/upload", authMiddleware, adminMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Archivo requerido"
    });
  }

  res.json({
    message: "Archivo subido correctamente",
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

/* =========================
   RUTA PRUEBA
========================= */

app.get("/", (req, res) => {
  res.send("Servidor funcionando Afrocrece Digital");
});

/* =========================
   SERVIDOR
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "El archivo es demasiado grande (máx 50MB)"
    });
  }

  res.status(500).json({
    error: err.message
  });
});
