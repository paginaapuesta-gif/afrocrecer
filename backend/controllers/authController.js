const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const normalizeUserRole = (role) => (role === "admin" ? "admin" : "user");

const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};

function resolveLegacyStatus(usuario) {
  if ([APPROVAL_STATUS.PENDING, APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED].includes(usuario.status)) {
    return usuario.status;
  }

  const role = normalizeUserRole(usuario.role);

  // Migración lógica para usuarios antiguos sin status
  if (role === "admin" || usuario.email === "admin@afro.com") {
    return APPROVAL_STATUS.APPROVED;
  }

  return APPROVAL_STATUS.APPROVED;
}

/* REGISTRO */

exports.registrarUsuario = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nombre, email y contraseña son obligatorios",
        code: "AUTH_VALIDATION_REQUIRED_FIELDS"
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: "El email no tiene un formato válido",
        code: "AUTH_VALIDATION_INVALID_EMAIL"
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        code: "AUTH_VALIDATION_WEAK_PASSWORD"
      });
    }

    const usuarioExistente = await User.findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({
        message: "El usuario ya existe",
        code: "AUTH_USER_EXISTS"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new User({
      name,
      email,
      password: passwordHash,
      avatar: req.file ? "/uploads/" + req.file.filename : "",
      status: APPROVAL_STATUS.PENDING
    });

    await nuevoUsuario.save();

    res.json({
      message: "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error en el servidor",
      code: "AUTH_SERVER_ERROR"
    });
  }
};

/* LOGIN */

exports.loginUsuario = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios",
        code: "AUTH_VALIDATION_REQUIRED_FIELDS"
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: "El email no tiene un formato válido",
        code: "AUTH_VALIDATION_INVALID_EMAIL"
      });
    }

    const usuario = await User.findOne({ email });

    if (!usuario) {
      return res.status(400).json({
        message: "Usuario no encontrado",
        code: "AUTH_USER_NOT_FOUND"
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(400).json({
        message: "Contraseña incorrecta",
        code: "AUTH_INVALID_CREDENTIALS"
      });
    }

    const role = normalizeUserRole(usuario.role);
    let status = resolveLegacyStatus(usuario);

    // Regla de negocio: admin siempre puede iniciar sesión
    if (role === "admin") {
      status = APPROVAL_STATUS.APPROVED;
    }

    if (usuario.status !== status) {
      usuario.status = status;
      await usuario.save();
    }

    if (role !== "admin" && status === APPROVAL_STATUS.PENDING) {
      return res.status(403).json({
        message: "Tu cuenta está pendiente de aprobación por el administrador",
        code: "AUTH_ACCOUNT_PENDING"
      });
    }

    if (role !== "admin" && status === APPROVAL_STATUS.REJECTED) {
      return res.status(403).json({
        message: "Tu cuenta fue rechazada. Contacta al administrador para más información",
        code: "AUTH_ACCOUNT_REJECTED"
      });
    }

    usuario.lastLoginAt = new Date();
    await usuario.save();

    const token = jwt.sign(
      { id: usuario._id, role },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        _id: usuario._id,
        email: usuario.email,
        name: usuario.name,
        avatar: usuario.avatar,
        lastLoginAt: usuario.lastLoginAt,
        role,
        status
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error en el servidor",
      code: "AUTH_SERVER_ERROR"
    });
  }
};

/* REGISTRO ADMIN */

exports.registroAdmin = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_BOOTSTRAP_KEY) {
      return res.status(403).json({
        message: "Clave de administrador inválida"
      });
    }

    const emailNormalizado = String(email || "").trim().toLowerCase();

    const usuarioExistente = await User.findOne({ email: emailNormalizado });

    if (usuarioExistente) {
      return res.status(400).json({
        message: "El usuario ya existe"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoAdmin = new User({
      name,
      email: emailNormalizado,
      password: passwordHash,
      role: "admin",
      status: APPROVAL_STATUS.APPROVED
    });

    await nuevoAdmin.save();

    res.json({
      message: "Administrador creado correctamente"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error en el servidor"
    });
  }
};

// Alias de compatibilidad para rutas antiguas
exports.registrarAdmin = exports.registroAdmin;
