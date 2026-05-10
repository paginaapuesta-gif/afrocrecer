const Project = require("../models/Project");

const ALLOWED_TYPES = ["project", "service", "food", "product", "event"];
const PUBLIC_USER_FIELDS = "_id name avatar lastLoginAt";
const PRIVATE_USER_FIELDS = "_id name email avatar lastLoginAt";

const normalizeText = (value) => String(value || "").trim();
const normalizeNullableDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "INVALID_DATE" : parsed;
};
const buildLegacyPriceFromValor = (valorCultural) => {
  const normalized = normalizeText(valorCultural).replace(",", ".");
  if (!normalized) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};
const getUserProjection = (req) => (req.user?.id ? PRIVATE_USER_FIELDS : PUBLIC_USER_FIELDS);
const canManageProject = (req, project) => {
  const currentUserId = String(req.user?.id || "").trim();
  const currentUserRole = req.user?.role || "user";

  if (!currentUserId || !project?.author) return false;
  if (currentUserRole === "admin") return true;

  return project.author.toString() === currentUserId;
};

const toPositiveInt = (value, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

/* =========================
   CREAR PROYECTO
========================= */
exports.crearProyecto = async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const description = normalizeText(req.body.description);
    const type = normalizeText(req.body.type) || "project";
    const category = normalizeText(req.body.category) || "General";
    const territorio = normalizeText(req.body.territorio || req.body.location) || "Veracruz, Cumaral";
    const location = normalizeText(req.body.location || req.body.territorio) || territorio;
    const fuente = normalizeText(req.body.fuente);
    const portadorTradicion = normalizeText(req.body.portadorTradicion);
    const contextoHistorico = normalizeText(req.body.contextoHistorico);
    const fechaCultural = normalizeNullableDate(req.body.fechaCultural);
    const valorCultural = normalizeText(req.body.valorCultural || req.body.price);

    const parsedPrice = req.body.price === "" || req.body.price === undefined
      ? null
      : Number(req.body.price);
    const legacyPrice = parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : buildLegacyPriceFromValor(valorCultural);

    if (!title || !description) {
      return res.status(400).json({
        message: "Título y descripción son obligatorios",
        code: "PROJECT_VALIDATION_REQUIRED_FIELDS"
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        message: "Tipo de publicación no válido",
        code: "PROJECT_VALIDATION_INVALID_TYPE"
      });
    }

    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      return res.status(400).json({
        message: "El precio debe ser un número mayor o igual a cero",
        code: "PROJECT_VALIDATION_INVALID_PRICE"
      });
    }

    if (fechaCultural === "INVALID_DATE") {
      return res.status(400).json({
        message: "La fecha cultural no es válida",
        code: "PROJECT_VALIDATION_INVALID_CULTURAL_DATE"
      });
    }

    const archivos = Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : (req.file ? [req.file] : []);

    const nuevoProyecto = new Project({
      title,
      description,
      type,
      category,
      price: legacyPrice,
      valorCultural,
      fuente,
      territorio,
      fechaCultural,
      portadorTradicion,
      contextoHistorico,
      location,
      image: archivos[0] ? `/uploads/${archivos[0].filename}` : "",
      author: req.user.id,
      status: "approved"
    });

    await nuevoProyecto.save();

    res.status(201).json(nuevoProyecto);

  } catch (error) {

    console.log("ERROR EN CREAR PROYECTO:", error);

    res.status(500).json({
      message: error.message || "Error creando proyecto",
      code: "PROJECT_CREATE_ERROR"
    });
  }
};

/* =========================
   OBTENER PROYECTOS
========================= */

exports.obtenerProyectos = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 50);
    const type = normalizeText(req.query.type);

    let filter = {};



    if (type && type !== "todos") {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({
          message: "Filtro de tipo inválido",
          code: "PROJECT_VALIDATION_INVALID_FILTER_TYPE"
        });
      }

      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const [proyectos, total] = await Promise.all([
      Project.find(filter)
        .populate("author", getUserProjection(req))
        .populate("comments.user", getUserProjection(req))
        .populate("likes", getUserProjection(req))
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter)
    ]);

    res.json({
      data: proyectos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error obteniendo proyectos",
      code: "PROJECT_LIST_ERROR"
    });
  }
};

/* =========================
   OBTENER PROYECTO POR ID
========================= */

exports.obtenerProyectoPorId = async (req, res) => {
  try {
    const proyecto = await Project
      .findById(req.params.id)
      .populate("author", getUserProjection(req))
      .populate("comments.user", getUserProjection(req))
      .populate("likes", getUserProjection(req));

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
        code: "PROJECT_NOT_FOUND"
      });
    }

    res.json(proyecto);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error obteniendo proyecto",
      code: "PROJECT_GET_ERROR"
    });
  }
};

/* =========================
   ACTUALIZAR PROYECTO
========================= */

exports.actualizarProyecto = async (req, res) => {
  try {
    const proyecto = await Project.findById(req.params.id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
        code: "PROJECT_NOT_FOUND"
      });
    }

    if (!canManageProject(req, proyecto)) {
      return res.status(403).json({
        message: "No autorizado para editar este proyecto",
        code: "PROJECT_FORBIDDEN_EDIT"
      });
    }

    const { title, description, type, category, price, location, valorCultural, fuente, territorio, fechaCultural, portadorTradicion, contextoHistorico } = req.body;

    if (title !== undefined) {
      const value = normalizeText(title);
      if (!value) {
        return res.status(400).json({ message: "El título no puede estar vacío", code: "PROJECT_VALIDATION_EMPTY_TITLE" });
      }
      proyecto.title = value;
    }

    if (description !== undefined) {
      const value = normalizeText(description);
      if (!value) {
        return res.status(400).json({ message: "La descripción no puede estar vacía", code: "PROJECT_VALIDATION_EMPTY_DESCRIPTION" });
      }
      proyecto.description = value;
    }

    if (type !== undefined) {
      const value = normalizeText(type);
      if (!ALLOWED_TYPES.includes(value)) {
        return res.status(400).json({ message: "Tipo de publicación no válido", code: "PROJECT_VALIDATION_INVALID_TYPE" });
      }
      proyecto.type = value;
    }

    if (category !== undefined) proyecto.category = normalizeText(category) || "General";

    if (price !== undefined) {
      if (price === "") {
        proyecto.price = null;
      } else {
        const parsedPrice = Number(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ message: "El precio debe ser un número mayor o igual a cero", code: "PROJECT_VALIDATION_INVALID_PRICE" });
        }
        proyecto.price = parsedPrice;
      }
    }

    if (valorCultural !== undefined) {
      const value = normalizeText(valorCultural);
      proyecto.valorCultural = value;
      if (price === undefined) {
        const legacyPrice = buildLegacyPriceFromValor(value);
        if (legacyPrice !== null) proyecto.price = legacyPrice;
      }
    }

    if (fuente !== undefined) proyecto.fuente = normalizeText(fuente);
    if (territorio !== undefined) {
      const value = normalizeText(territorio) || "Veracruz, Cumaral";
      proyecto.territorio = value;
      if (location === undefined) proyecto.location = value;
    }

    if (fechaCultural !== undefined) {
      const value = normalizeNullableDate(fechaCultural);
      if (value === "INVALID_DATE") {
        return res.status(400).json({ message: "La fecha cultural no es válida", code: "PROJECT_VALIDATION_INVALID_CULTURAL_DATE" });
      }
      proyecto.fechaCultural = value;
    }

    if (portadorTradicion !== undefined) proyecto.portadorTradicion = normalizeText(portadorTradicion);
    if (contextoHistorico !== undefined) proyecto.contextoHistorico = normalizeText(contextoHistorico);

    if (location !== undefined) proyecto.location = normalizeText(location) || proyecto.territorio || "Cumaral";

    const archivos = Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : (req.file ? [req.file] : []);

    if (archivos.length > 0) {
      proyecto.image = `/uploads/${archivos[0].filename}`;
    }

    proyecto.updatedAt = new Date();

    await proyecto.save();

    res.json({
      message: "Proyecto actualizado",
      project: proyecto
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error actualizando proyecto",
      code: "PROJECT_UPDATE_ERROR"
    });
  }
};

/* =========================
   LIKE PROYECTO
========================= */

exports.likeProyecto = async (req, res) => {
  try {
    const proyecto = await Project.findById(req.params.id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
        code: "PROJECT_NOT_FOUND"
      });
    }

    const yaLike = proyecto.likes.some(
      (id) => id.toString() === req.user.id
    );

    if (yaLike) {
      proyecto.likes = proyecto.likes.filter(
        (id) => id.toString() !== req.user.id
      );
    } else {
      proyecto.likes.push(req.user.id);
    }

    await proyecto.save();

    res.json({
      message: "Like actualizado"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error dando like",
      code: "PROJECT_LIKE_ERROR"
    });
  }
};

/* =========================
   COMENTAR PROYECTO
========================= */

exports.comentarProyecto = async (req, res) => {
  try {
    const text = normalizeText(req.body.text);

    if (!text) {
      return res.status(400).json({
        message: "El comentario no puede estar vacío",
        code: "PROJECT_VALIDATION_EMPTY_COMMENT"
      });
    }

    const proyecto = await Project.findById(req.params.id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
        code: "PROJECT_NOT_FOUND"
      });
    }

    const nuevoComentario = {
      user: req.user.id,
      text
    };

    proyecto.comments.push(nuevoComentario);

    await proyecto.save();

    res.json({
      message: "Comentario agregado"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error comentando",
      code: "PROJECT_COMMENT_ERROR"
    });
  }
};

/* =========================
   ELIMINAR PROYECTO
========================= */

exports.eliminarProyecto = async (req, res) => {
  try {
    const proyecto = await Project.findById(req.params.id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
        code: "PROJECT_NOT_FOUND"
      });
    }

    if (!canManageProject(req, proyecto)) {
      return res.status(403).json({
        message: "No autorizado para eliminar este proyecto",
        code: "PROJECT_FORBIDDEN_DELETE"
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      message: "Proyecto eliminado"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error eliminando proyecto",
      code: "PROJECT_DELETE_ERROR"
    });
  }
};
