const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  /* NOMBRE DEL USUARIO */
  name: {
    type: String,
    required: true,
    trim: true
  },

  /* EMAIL */
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  /* CONTRASEÑA */
  password: {
    type: String,
    required: true
  },

  /* FOTO DE PERFIL */
  avatar: {
    type: String,
    default: ""
  },

  /* ROL */
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  /* ESTADO DE APROBACIÓN */
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  /* ÚLTIMA CONEXIÓN */
  lastLoginAt: {
    type: Date,
    default: null
  }

},
{
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
