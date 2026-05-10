const isProduction = process.env.NODE_ENV === "production";

const ensureRequiredEnv = () => {
  if (isProduction && !process.env.JWT_SECRET) {
    throw new Error("Falta JWT_SECRET en entorno de producción");
  }

  if (isProduction && !process.env.MONGODB_URI) {
    throw new Error("Falta MONGODB_URI en entorno de producción");
  }
};

const getJwtSecret = () => process.env.JWT_SECRET || "clave_secreta";

module.exports = {
  ensureRequiredEnv,
  getJwtSecret
};
