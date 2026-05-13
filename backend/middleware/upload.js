const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

/* CONFIGURACIÓN CLOUDINARY */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ALMACENAMIENTO EN CLOUDINARY */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = "auto";
    let folder = "afrocrecer";

    if (file.mimetype.startsWith("image/")) {
      folder = "afrocrecer/imagenes";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "afrocrecer/videos";
    } else {
      folder = "afrocrecer/documentos";
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "mp4",
        "mov",
        "avi",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
      ],
    };
  },
});

/* FILTRO IMÁGENES, VIDEO Y DOCUMENTOS */

const fileFilter = (req, file, cb) => {
  console.log("MIMETYPE:", file.mimetype);

  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes, videos o documentos"));
  }
};

/* CONFIGURACIÓN MULTER */

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = upload;