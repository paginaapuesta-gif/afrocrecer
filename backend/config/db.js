const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/afrocrece_digital";

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado correctamente");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
