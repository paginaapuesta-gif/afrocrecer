const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* CONFIGURAR ALMACENAMIENTO */

const storage = multer.diskStorage({

destination: function (req, file, cb) {

cb(null, UPLOAD_DIR);

},

filename: function (req, file, cb) {

const uniqueName = Date.now() + path.extname(file.originalname);

cb(null, uniqueName);

}

});

/* FILTRO IMÁGENES Y VIDEO */

const fileFilter = (req, file, cb) => {

  console.log("MIMETYPE:", file.mimetype);
  console.log("EXT:", path.extname(file.originalname));

 if (
  file.mimetype.startsWith("image/") ||
  file.mimetype.startsWith("video/") ||
  file.mimetype === "application/pdf" ||
  file.mimetype === "application/msword" ||
  file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
  file.mimetype === "application/vnd.ms-excel" ||
  file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
  fileSize: 50 * 1024 * 1024
}

});

module.exports = upload;
