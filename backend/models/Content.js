const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  clave: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  valor: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Content", contentSchema);
