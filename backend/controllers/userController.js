const mongoose = require("mongoose");
const User = require("../models/User");


/* =========================
   OBTENER PERFIL
========================= */

exports.obtenerPerfil = async (req, res) => {

  try {

    const usuario = await User.findById(req.user.id).select("-password");

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    res.json(usuario);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      mensaje: "Error obteniendo perfil"
    });

  }

};



/* =========================
   ACTUALIZAR AVATAR
========================= */

exports.actualizarAvatar = async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        mensaje: "No se envió imagen"
      });
    }

    const avatar = "/uploads/" + req.file.filename;

    const usuario = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    );

    res.json({
      mensaje: "Avatar actualizado",
      avatar: usuario.avatar
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      mensaje: "Error actualizando avatar"
    });

  }

};

/* =========================
   ADMIN · LISTAR PENDIENTES
========================= */

exports.listarUsuariosPendientes = async (req, res) => {
  try {
    const usuarios = await User.find({ status: "pending" })
      .select("name email role status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      message: "Usuarios pendientes obtenidos correctamente",
      users: usuarios
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error obteniendo usuarios pendientes"
    });
  }
};

/* =========================
   ADMIN · APROBAR/RECHAZAR
========================= */

exports.actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Estado inválido"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Id de usuario inválido"
      });
    }

    const usuario = await User.findById(id);

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    if (usuario.role === "admin" && status === "rejected") {
      return res.status(400).json({
        message: "No se puede rechazar una cuenta administradora"
      });
    }

    usuario.status = status;
    await usuario.save();

    res.json({
      message: `Usuario ${status === "approved" ? "aprobado" : "rechazado"} correctamente`,
      user: {
        _id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        status: usuario.status
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error actualizando estado del usuario"
    });
  }
};
