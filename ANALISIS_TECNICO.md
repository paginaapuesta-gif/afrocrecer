# Análisis técnico del repositorio `afrocrece-digital`

## 1) Resumen de arquitectura

- El proyecto está dividido en **frontend estático** (`frontend/*.html`, `frontend/js/*.js`) y **backend Node/Express + MongoDB** (`backend/*`).
- El backend expone endpoints para autenticación y publicaciones de proyectos.
- El frontend consume la API vía `fetch` apuntando a `http://localhost:3000`.

## 2) Hallazgos principales

### Fortalezas

1. **Separación básica por capas en backend**: rutas, controladores, modelos y middleware están desacoplados.
2. **Persistencia con Mongoose**: existen esquemas claros para usuarios y proyectos con relaciones (`author`, `likes`, `comments`).
3. **Flujos principales cubiertos**: login/registro, crear publicación, comentar, like y eliminar.
4. **Soporte de carga de imágenes** con `multer` y validación de tipo/tamaño.

### Riesgos / deuda técnica

1. **Secreto JWT hardcodeado** (`"clave_secreta"`) en controlador y middleware.
   - Riesgo: exposición de credenciales y tokens comprometibles.
2. **Conexión Mongo duplicada/inconsistente**:
   - `server.js` conecta a `afrocrece`.
   - `config/db.js` conecta a `afrocrece_digital` pero no se usa.
3. **Inconsistencia de campos de error** (`message` vs `mensaje`) entre endpoints.
   - Riesgo: manejo de errores frágil en frontend.
4. **Rutas faltantes frente a consumo del frontend**:
   - El frontend llama `GET /api/projects/:id` y `PUT /api/projects/:id` desde `editar.js`, pero esas rutas no existen.
5. **Autorización incompleta en borrado**:
   - `DELETE /api/projects/:id` elimina sin verificar propiedad/autorización del autor.
6. **Posibles errores por datos no normalizados**:
   - En frontend se usan campos `createdAt || date`, señal de contrato API inestable.
7. **Dependencias instaladas dentro del repo** (`backend/node_modules`), lo cual ensucia control de versiones y dificulta revisiones.
8. **Scripts de test ausentes** (ambos `package.json` tienen script placeholder que falla).

## 3) Observaciones por módulo

### Backend

- **Auth**
  - Registro encripta contraseña con `bcrypt` correctamente.
  - Login emite JWT con expiración de 7 días.
  - No hay validación explícita de formato/fortaleza de password ni sanitización de entradas.

- **Proyectos**
  - Crear proyecto permite token opcional, pero el modelo exige `author` requerido.
    - Si no hay token, puede fallar por validación de Mongoose.
  - `like` y `comment` requieren token y funcionan con toggle/simple append.
  - Falta paginación y/o límites en `GET /api/projects`.

- **Uploads**
  - Validación por extensión y mime-type, con límite de 5MB.
  - Las rutas de subida usan carpeta relativa `uploads/` (conviene resolver con ruta absoluta para robustez en despliegue).

### Frontend

- **Acoplamiento fuerte a localhost**
  - URL de API hardcodeada en múltiples archivos JS.
- **Duplicación funcional**
  - Hay lógica de publicación en `app.js` y también en `publicar.js`.
- **Manejo de sesión**
  - Token/email en `localStorage` sin capa de expiración ni refresh.
- **UX aceptable para MVP**
  - filtros por tipo, modal de login, feed con likes/comentarios.

## 4) Recomendaciones priorizadas

### Prioridad alta (seguridad y estabilidad)

1. Pasar `JWT_SECRET`, `MONGODB_URI`, `PORT`, `CORS_ORIGIN` a variables de entorno (`dotenv`).
2. Centralizar conexión a DB usando `config/db.js` y remover duplicidades.
3. Añadir middleware de autorización para verificar que solo el autor edite/elimine su proyecto.
4. Implementar las rutas faltantes `GET /api/projects/:id` y `PUT /api/projects/:id`.
5. Estandarizar respuestas de error (`{ message, code, details }`).

### Prioridad media

1. Incorporar validación de payload (`zod`, `joi` o `express-validator`).
2. Agregar paginación/ordenamiento en listados de proyectos.
3. Extraer `API_BASE_URL` en un solo módulo frontend.
4. Limitar campos retornados en populates para minimizar payload.

### Prioridad baja

1. Añadir tests unitarios básicos de controladores y middleware JWT.
2. Agregar lint/format (`eslint` + `prettier`) y hooks de calidad.
3. Documentar endpoints con OpenAPI/Swagger.

## 5) Plan sugerido de refactor incremental (sin romper MVP)

1. **Sprint 1**: variables de entorno + estandarización de errores + cleanup DB connection.
2. **Sprint 2**: endpoints faltantes de edición + autorización por autor.
3. **Sprint 3**: validación de entradas + paginación.
4. **Sprint 4**: tests + documentación API + desacople de `localhost` en frontend.

---

Este análisis se centra en el estado actual del código y en acciones de alto impacto para robustecer seguridad, mantenibilidad y consistencia del producto.
