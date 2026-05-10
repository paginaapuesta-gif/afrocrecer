const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/afrocrece_digital");

  await User.deleteOne({ email: "admin@afrocrecer.com" });

  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await User.create({
    name: "Administrador",
    nombre: "Administrador",
    email: "admin@afrocrecer.com",
    password: passwordHash,
    role: "admin",
    rol: "admin",
    status: "approved",
    estado: "approved",
    isApproved: true,
    approved: true
  });

  console.log("ADMIN CREADO CORRECTAMENTE:");
  console.log(admin.email);

  await mongoose.connection.close();
}

main().catch(error => {
  console.error("ERROR:", error);
  mongoose.connection.close();
});