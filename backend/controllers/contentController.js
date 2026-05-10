const Content = require("../models/Content");

const normalizeText = (value) => String(value || "").trim();

exports.obtenerContenidoPorClave = async (req, res) => {
  try {
    const clave = normalizeText(req.params.clave);

    if (!clave) {
      return res.status(400).json({
        message: "La clave es obligatoria",
        code: "CONTENT_VALIDATION_REQUIRED_KEY"
      });
    }

    const contenido = await Content.findOne({ clave });

    if (!contenido) {
      return res.status(404).json({
        message: "Contenido no encontrado",
        code: "CONTENT_NOT_FOUND",
        clave
      });
    }

    res.json({
      clave: contenido.clave,
      valor: contenido.valor
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error obteniendo contenido",
      code: "CONTENT_GET_ERROR"
    });
  }
};

exports.guardarContenidoPorClave = async (req, res) => {
  try {
    const clave = normalizeText(req.params.clave);

    if (!clave) {
      return res.status(400).json({
        message: "La clave es obligatoria",
        code: "CONTENT_VALIDATION_REQUIRED_KEY"
      });
    }

    const contenidoActualizado = await Content.findOneAndUpdate(
      { clave },
      {
        clave,
        valor: String(req.body.valor || "")
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    res.json({
      message: "Contenido actualizado",
      content: {
        clave: contenidoActualizado.clave,
        valor: contenidoActualizado.valor
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error guardando contenido",
      code: "CONTENT_SAVE_ERROR"
    });
  }
};
