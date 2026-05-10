/* =========================
   FILTRO ACTUAL
========================= */

let tipoFiltro = "todos";
let usuarioActivoFiltro = null;
let textoBusqueda = "";
let ordenFeed = "recientes";
let tipoFiltroSolicitado = "";

const FILTER_LABELS = {
todos: "Todo el archivo",
project: "Historias, danzas y memoria",
food: "Tradición y gastronomía",
service: "Saberes y oficios",
product: "Archivo documental",
event: "Eventos comunitarios"
};

const FILTER_URL_ALIASES = {
historia: "project",
danza: "project"
};

const FILTER_CONTEXT_LABELS = {
historia: "Historias de la comunidad",
danza: "Danzas y expresiones culturales"
};

const ORDER_LABELS = {
recientes: "Más recientes",
antiguas: "Más antiguas",
likes: "Más valoradas",
comentarios: "Más comentadas"
};

const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function obtenerUsuarioActual(){
return getStoredUser();
}

function getStoredUser(){
try{
return JSON.parse(localStorage.getItem("user") || "null");
}catch(error){
console.warn("No se pudo leer user desde localStorage", error);
return null;
}
}

function obtenerClaveUsuario(user){
if(!user) return "";
return String(user._id || user.email || user.name || "").trim();
}

let postHashProcesado = "";

function abrirPostDesdeHashSiAplica(){
const hash = String(window.location.hash || "");
if(!hash.startsWith("#post-")) return;

const postId = hash.slice("#post-".length).trim();
if(!postId || postHashProcesado === postId) return;

postHashProcesado = postId;
abrirPost(postId);
}

function obtenerEtiquetaFiltro(tipo, fallback = ""){
return FILTER_CONTEXT_LABELS[fallback] || FILTER_LABELS[tipo] || tipo || "Archivo cultural";
}

function resolverTipoFiltroDesdeURL(valor){
const normalizado = String(valor || "").trim().toLowerCase();
if(!normalizado) return null;
if(FILTER_LABELS[normalizado]) return { tipo: normalizado, raw: normalizado };
if(FILTER_URL_ALIASES[normalizado]) return { tipo: FILTER_URL_ALIASES[normalizado], raw: normalizado };
return null;
}

function aplicarFiltroInicialDesdeURL(){
const params = new URLSearchParams(window.location.search);
const typeParam = params.get("type");
const resolved = resolverTipoFiltroDesdeURL(typeParam);
if(!resolved) return;
tipoFiltro = resolved.tipo;
tipoFiltroSolicitado = resolved.raw;
}

function esArchivoVideo(path = ""){
const value = String(path || "").toLowerCase();
return value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".ogg");
}

function esArchivoImagen(path = ""){
const value = String(path || "").toLowerCase();
return value.endsWith(".jpg") ||
value.endsWith(".jpeg") ||
value.endsWith(".png") ||
value.endsWith(".webp") ||
value.endsWith(".gif") ||
value.endsWith(".bmp") ||
value.endsWith(".avif") ||
value.endsWith(".jfif") ||
value.endsWith(".svg");
}

const STORAGE_KEY_FEED_PREFS = "feedPrefsAfrocrece";

function formatearFechaHora(fecha){

if(!fecha) return "Sin registro";

const d = new Date(fecha);
if(Number.isNaN(d.getTime())) return "Sin registro";

const fechaTxt = d.toLocaleDateString("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const horaTxt = d.toLocaleTimeString("es-ES", {
  hour: "2-digit",
  minute: "2-digit"
});

return `${fechaTxt} ${horaTxt}`;

}

function tiempoRelativo(fecha){

if(!fecha) return "Sin conexión reciente";

const d = new Date(fecha);
if(Number.isNaN(d.getTime())) return "Sin conexión reciente";

const diffMs = Date.now() - d.getTime();
const minutos = Math.floor(diffMs / 60000);

if(minutos < 1) return "Hace unos segundos";
if(minutos < 60) return `Hace ${minutos} min`;

const horas = Math.floor(minutos / 60);
if(horas < 24) return `Hace ${horas} h`;

const dias = Math.floor(horas / 24);
if(dias < 30) return `Hace ${dias} d`;

const meses = Math.floor(dias / 30);
if(meses < 12) return `Hace ${meses} mes${meses > 1 ? "es" : ""}`;

const anios = Math.floor(meses / 12);
return `Hace ${anios} año${anios > 1 ? "s" : ""}`;

}

function estadoConexion(fecha){

if(!fecha){
return { clase: "offline", texto: "Sin conexión" };
}

const d = new Date(fecha);
if(Number.isNaN(d.getTime())){
return { clase: "offline", texto: "Sin conexión" };
}

const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);

if(diffMin <= 15){
return { clase: "online", texto: "En línea" };
}

return { clase: "offline", texto: "Desconectado" };

}

function aplicarFiltroUsuarioActivo(userKey, userLabel){

usuarioActivoFiltro = userKey || null;

const estado = document.getElementById("usuariosActivosEstado");
if(estado){
if(usuarioActivoFiltro){
const etiqueta = escapeHtml(userLabel || usuarioActivoFiltro);
estado.innerHTML = `<span class="usuarios-activos-estado-chip">Filtrando por: ${etiqueta} <button class="usuarios-activos-clear" onclick="limpiarFiltroUsuarioActivo()">Limpiar</button></span>`;
}else{
estado.innerHTML = "";
}
}

guardarPreferenciasFeed();
renderFiltrosActivosFeed();
cargarProyectos();

}

function limpiarFiltroUsuarioActivo(){
aplicarFiltroUsuarioActivo(null);
}

function guardarPreferenciasFeed(){
const payload = {
tipoFiltro,
textoBusqueda,
usuarioActivoFiltro,
ordenFeed
};
localStorage.setItem(STORAGE_KEY_FEED_PREFS, JSON.stringify(payload));
}

function cargarPreferenciasFeed(){
try{
const raw = localStorage.getItem(STORAGE_KEY_FEED_PREFS);
if(!raw) return;
const prefs = JSON.parse(raw);
if(prefs.tipoFiltro) tipoFiltro = prefs.tipoFiltro;
if(typeof prefs.textoBusqueda === "string") textoBusqueda = prefs.textoBusqueda;
if(typeof prefs.usuarioActivoFiltro === "string") usuarioActivoFiltro = prefs.usuarioActivoFiltro || null;
if(typeof prefs.ordenFeed === "string") ordenFeed = prefs.ordenFeed || "recientes";
}catch(_error){
// ignorar datos corruptos
}
}

function actualizarOrdenFeed(valor){
ordenFeed = valor || "recientes";
guardarPreferenciasFeed();
renderFiltrosActivosFeed();
cargarProyectos();
}

function aplicarOrdenProyectos(items){
const list = [...items];

if(ordenFeed === "antiguas"){
list.sort((a,b) => new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0));
return list;
}

if(ordenFeed === "likes"){
list.sort((a,b) => (b.likes?.length || 0) - (a.likes?.length || 0));
return list;
}

if(ordenFeed === "comentarios"){
list.sort((a,b) => (b.comments?.length || 0) - (a.comments?.length || 0));
return list;
}

list.sort((a,b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
return list;
}

function actualizarResumenResultados(total){
const el = document.getElementById("feedResultadosResumen");
if(!el) return;
const n = Number(total || 0);
if(n === 0){
el.textContent = "Sin resultados";
return;
}
el.textContent = `${n} resultado${n === 1 ? "" : "s"}`;
}

function renderResumenFeedSidebar(proyectos, visibles){
const box = document.getElementById("resumenFeedSidebar");
if(!box) return;

const total = proyectos.length;
const visiblesCount = visibles.length;

const likes = proyectos.reduce((acc, p) => acc + (Array.isArray(p.likes) ? p.likes.length : 0), 0);
const comentarios = proyectos.reduce((acc, p) => acc + (Array.isArray(p.comments) ? p.comments.length : 0), 0);

const conteoTipos = proyectos.reduce((acc, p) => {
const t = p.type || "project";
acc[t] = (acc[t] || 0) + 1;
return acc;
}, {});

const topTipo = Object.entries(conteoTipos).sort((a,b) => b[1]-a[1])[0];

const etiquetas = {
project: "Historias, danzas y memoria",
food: "Tradición y gastronomía",
service: "Saberes y oficios",
product: "Archivo documental",
event: "Eventos comunitarios"
};

box.innerHTML = `
<div class="resumen-feed-grid">
<div><strong>${visiblesCount}</strong><span>visibles</span></div>
<div><strong>${total}</strong><span>totales</span></div>
<div><strong>${likes}</strong><span>valoraciones</span></div>
<div><strong>${comentarios}</strong><span>comentarios</span></div>
</div>
<p class="resumen-feed-top">Colección destacada: <strong>${topTipo ? (etiquetas[topTipo[0]] || topTipo[0]) : "N/A"}</strong></p>
`;
}

function obtenerInteresesEventos(){
try{
return JSON.parse(localStorage.getItem("interesesEventosAfrocrece") || "{}");
}catch(error){
return {};
}
}

function guardarInteresesEventos(data){
localStorage.setItem("interesesEventosAfrocrece", JSON.stringify(data));
}

function toggleInteresEvento(eventoId){
const intereses = obtenerInteresesEventos();
intereses[eventoId] = !intereses[eventoId];
guardarInteresesEventos(intereses);
cargarProyectos();
}

function extraerMetaEvento(evento){
const descripcion = (evento.description || "").toLowerCase();
const cuposMatch = descripcion.match(/cupos?\s*[:\-]?\s*(\d{1,3})/i);
const fechaMatch = descripcion.match(/fecha\s*[:\-]?\s*([\d\/-]{6,10})/i);
const horaMatch = descripcion.match(/hora\s*[:\-]?\s*([\d:]{4,5}(?:\s?[ap]m)?)/i);

const cupos = cuposMatch ? Number(cuposMatch[1]) : 30;
const fecha = fechaMatch ? fechaMatch[1] : formatearFechaHora(evento.createdAt || new Date());
const hora = horaMatch ? horaMatch[1] : "Por confirmar";

return { cupos, fecha, hora };
}

function renderAgendaComunitaria(proyectos){
const box = document.getElementById("agendaComunitariaSidebar");
if(!box) return;

const intereses = obtenerInteresesEventos();

const eventos = proyectos
.filter(p => p.type === "event")
.sort((a,b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
.slice(0, 3);

if(eventos.length === 0){
box.innerHTML = `
<p class="agenda-empty">Todavía no hay eventos. ¡Anímate a publicar el primero en la comunidad!</p>
<button class="quick-action-btn agenda-cta" onclick="document.getElementById('crear').scrollIntoView({behavior:'smooth'})">Publicar actividad</button>
`;
return;
}

const agendaCards = eventos.map((evento) => {
const titulo = escapeHtml(evento.title || "Actividad comunitaria");
const ubicacion = escapeHtml(evento.location || "Vereda Veracruz");
const autor = escapeHtml(evento.author?.name || "Comunidad");
const { cupos, fecha, hora } = extraerMetaEvento(evento);
const interesado = Boolean(intereses[evento._id]);

return `
<div class="agenda-item" role="button" tabindex="0" onclick="filtrarPublicaciones('event', document.getElementById('quickActionEventos'))">
<p class="agenda-item-title">${titulo}</p>
<p class="agenda-item-meta">📍 ${ubicacion}</p>
<p class="agenda-item-meta">👤 ${autor}</p>
<p class="agenda-item-date">📅 ${escapeHtml(fecha)} • ⏰ ${escapeHtml(hora)}</p>
<div class="agenda-item-footer">
<span class="agenda-cupos">👥 Cupos estimados: ${cupos}</span>
<button class="btn-interesa ${interesado ? 'activo' : ''}" onclick="event.stopPropagation(); toggleInteresEvento('${evento._id}')">${interesado ? '✓ Te interesa' : 'Me interesa'}</button>
</div>
${interesado ? '<p class="agenda-interes-msg">Guardado en este dispositivo</p>' : ''}
</div>
`;
}).join("");

box.innerHTML = `
<p class="agenda-helper">Tip: usa “Me interesa” para guardar recordatorios rápidos en tu dispositivo.</p>
${agendaCards}
`;
}

function normalizarUbicacionTexto(texto){
if(!texto) return "Vereda Veracruz";
return texto.split(",")[0].trim();
}

function renderMapaVereda(proyectos){
const box = document.getElementById("mapaVeredaSidebar");
if(!box) return;

const conUbicacion = proyectos.filter(p => p.location).slice(0,5);
const centro = encodeURIComponent("Vereda Veracruz, Cumaral, Meta");

const lista = conUbicacion.length
? conUbicacion.map((p) => `<li><strong>${escapeHtml(normalizarUbicacionTexto(p.location))}</strong> · ${escapeHtml(p.title || 'Publicación')}</li>`).join("")
: '<li>Sin ubicaciones recientes</li>';

box.innerHTML = `
<div class="mapa-embed-wrap">
<iframe title="Mapa vereda Veracruz" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${centro}&output=embed"></iframe>
</div>
<ul class="mapa-ubicaciones-lista">${lista}</ul>
<a class="mapa-link" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${centro}">Abrir mapa completo</a>
`;
}

function prepararPublicacionComunitaria(prefijo, tipoSugerido){
const crear = document.getElementById("crear");
if(crear){
crear.scrollIntoView({ behavior: "smooth" });
}

const tipo = document.getElementById("tipoProyecto");
if(tipo && tipoSugerido){
tipo.value = tipoSugerido;
}

const descripcion = document.getElementById("descripcionProyecto");
if(descripcion && !descripcion.value.trim()){
descripcion.value = prefijo;
descripcion.focus();
}
}

function renderNecesidadesOfertas(proyectos){
const box = document.getElementById("necesidadesOfertasSidebar");
if(!box) return;

const necesidades = proyectos
.filter((p) => /necesito|busco|urgente|apoyo|transporte|empleo/i.test(`${p.title || ''} ${p.description || ''}`))
.slice(0,2);

const ofertas = proyectos
.filter((p) => /ofrezco|servicio|vendo|disponible|clases|ayudo/i.test(`${p.title || ''} ${p.description || ''}`) || ["service","product"].includes(p.type))
.slice(0,2);

const necesidadesHtml = necesidades.length
? necesidades.map((p) => `<li>🆘 ${escapeHtml(p.title || 'Necesidad comunitaria')}</li>`).join('')
: '<li>Sin necesidades nuevas</li>';

const ofertasHtml = ofertas.length
? ofertas.map((p) => `<li>✅ ${escapeHtml(p.title || 'Oferta local')}</li>`).join('')
: '<li>Sin ofertas nuevas</li>';

box.innerHTML = `
<div class="necesidades-grid">
<div>
<p class="panel-subtitle">Necesidades</p>
<ul>${necesidadesHtml}</ul>
<button class="panel-accion-btn" onclick="prepararPublicacionComunitaria('Necesito apoyo con: ', 'service')">Publicar necesidad</button>
</div>
<div>
<p class="panel-subtitle">Ofertas</p>
<ul>${ofertasHtml}</ul>
<div class="panel-acciones-inline">
<button class="panel-accion-btn" onclick="filtrarPublicaciones('service', document.querySelector('.filtro-btn[onclick*=service]'))">Ver servicios</button>
<button class="panel-accion-btn" onclick="filtrarPublicaciones('product', document.querySelector('.filtro-btn[onclick*=product]'))">Ver productos</button>
</div>
</div>
</div>
`;
}

function renderReconocimientosComunitarios(proyectos){
const box = document.getElementById("reconocimientosSidebar");
if(!box) return;

const limite = Date.now() - (7 * 24 * 60 * 60 * 1000);
const ranking = new Map();

const sumarPuntos = (user, puntos) => {
const key = obtenerClaveUsuario(user);
if(!key) return;
const current = ranking.get(key) || { name: user.name || user.email || "Usuario", points: 0 };
current.points += puntos;
ranking.set(key, current);
};

proyectos.forEach((p) => {
if(new Date(p.createdAt || 0).getTime() >= limite) sumarPuntos(p.author, 3);
(p.likes || []).forEach((u) => sumarPuntos(u, 1));
(p.comments || []).forEach((c) => {
if(new Date(c.createdAt || p.createdAt || 0).getTime() >= limite) sumarPuntos(c.user, 2);
});
});

const top = Array.from(ranking.values()).sort((a,b) => b.points - a.points).slice(0,3);

if(top.length === 0){
box.innerHTML = '<p class="agenda-empty">Aún no hay actividad suficiente esta semana.</p>';
return;
}

box.innerHTML = top.map((u, idx) => `
<div class="reconocimiento-item">
<span class="reconocimiento-rank">${idx + 1}</span>
<div>
<p class="reconocimiento-nombre">${escapeHtml(u.name)}</p>
<p class="reconocimiento-puntos">${u.points} pts comunitarios</p>
</div>
</div>
`).join('');
}

function renderFiltrosActivosFeed(){
const contenedor = document.getElementById("filtrosActivosFeed");
if(!contenedor) return;

const chips = [];

if(tipoFiltro !== "todos"){
chips.push(`<button class="chip-filtro" onclick="removerFiltro('tipo')">Colección: ${escapeHtml(obtenerEtiquetaFiltro(tipoFiltro, tipoFiltroSolicitado))} ✕</button>`);
}

if(textoBusqueda){
chips.push(`<button class="chip-filtro" onclick="removerFiltro('busqueda')">Búsqueda: ${escapeHtml(textoBusqueda)} ✕</button>`);
}

if(usuarioActivoFiltro){
chips.push(`<button class="chip-filtro" onclick="removerFiltro('usuario')">Usuario: ${escapeHtml(usuarioActivoFiltro)} ✕</button>`);
}

if(ordenFeed !== "recientes") {
chips.push(`<button class="chip-filtro" onclick="removerFiltro('orden')">Orden: ${escapeHtml(ORDER_LABELS[ordenFeed] || ordenFeed)} ✕</button>`);
}

contenedor.innerHTML = chips.join("");
}

function removerFiltro(tipo){
if(tipo === "tipo"){
tipoFiltro = "todos";
tipoFiltroSolicitado = "";
const btnTodos = Array.from(document.querySelectorAll(".filtro-btn")).find((b) => b.textContent.includes("archivo"));
document.querySelectorAll(".filtro-btn").forEach(btn => btn.classList.remove("activo"));
if(btnTodos) btnTodos.classList.add("activo");
}
if(tipo === "busqueda"){
textoBusqueda = "";
const input = document.getElementById("busquedaFeed");
if(input) input.value = "";
}
if(tipo === "usuario"){
usuarioActivoFiltro = null;
const estado = document.getElementById("usuariosActivosEstado");
if(estado) estado.innerHTML = "";
}
if(tipo === "orden"){
ordenFeed = "recientes";
const ordenSelect = document.getElementById("ordenFeed");
if(ordenSelect) ordenSelect.value = "recientes";
}

guardarPreferenciasFeed();
renderFiltrosActivosFeed();
cargarProyectos();
}

function actualizarBusquedaFeed(valor){
textoBusqueda = String(valor || "").trim().toLowerCase();
guardarPreferenciasFeed();
renderFiltrosActivosFeed();
cargarProyectos();
}

function renderFeedLoading(feed){
feed.innerHTML = `
<div class="post skeleton-post"><div class="skeleton-line lg"></div><div class="skeleton-box"></div><div class="skeleton-line"></div><div class="skeleton-line sm"></div></div>
<div class="post skeleton-post"><div class="skeleton-line lg"></div><div class="skeleton-box"></div><div class="skeleton-line"></div><div class="skeleton-line sm"></div></div>
`;
}

function renderFeedEmpty(feed, mensaje){
feed.innerHTML = `<div class="feed-empty-state">${escapeHtml(mensaje || "No hay registros culturales para mostrar")}</div>`;
}

function escapeHtml(texto){

return String(texto || "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");

}

function construirParticipantes(proyecto){

const participantes = [];

if(proyecto.author){
participantes.push({
user: proyecto.author,
tipo: "Publicó",
fechaInteraccion: proyecto.createdAt || null
});
}

if(Array.isArray(proyecto.comments)){
proyecto.comments.forEach((comentario) => {
if(comentario.user){
participantes.push({
user: comentario.user,
tipo: "Comentó",
fechaInteraccion: comentario.createdAt || proyecto.createdAt || null
});
}
});
}

if(Array.isArray(proyecto.likes)){
proyecto.likes.forEach((likeUser) => {
if(likeUser){
participantes.push({
user: likeUser,
tipo: "Reaccionó",
fechaInteraccion: proyecto.createdAt || null
});
}
});
}

return participantes;

}

function renderUsuariosActivos(proyectos){

const contenedor = document.getElementById("usuariosActivosList");
if(!contenedor) return;

const usuariosMap = new Map();

proyectos.forEach((proyecto) => {

const participantes = construirParticipantes(proyecto);

participantes.forEach((item) => {

const user = item.user;
const id = obtenerClaveUsuario(user);
if(!id) return;

const fechaInteraccionMs = item.fechaInteraccion ? new Date(item.fechaInteraccion).getTime() : 0;
const lastLoginMs = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;

const actual = {
name: user.name || user.email || "Usuario",
userKey: id,
avatar: user.avatar || "",
lastLoginAt: user.lastLoginAt || null,
ultimaInteraccion: item.tipo,
fechaInteraccion: item.fechaInteraccion || null,
fechaInteraccionMs
};

const existente = usuariosMap.get(id);
if(!existente){
usuariosMap.set(id, actual);
return;
}

const existenteInteraccionMs = existente.fechaInteraccionMs || 0;
const existenteLoginMs = existente.lastLoginAt ? new Date(existente.lastLoginAt).getTime() : 0;

if(fechaInteraccionMs > existenteInteraccionMs || (fechaInteraccionMs === existenteInteraccionMs && lastLoginMs > existenteLoginMs)){
usuariosMap.set(id, actual);
}

});

});

const usuarios = Array.from(usuariosMap.values())
.sort((a,b) => {
const ai = a.fechaInteraccionMs || 0;
const bi = b.fechaInteraccionMs || 0;
if(bi !== ai) return bi - ai;
const al = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
const bl = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
return bl - al;
})
.slice(0,5);

if(usuarios.length===0){
contenedor.innerHTML = `
<div class="usuario-activo-empty">
Sin actividad reciente
</div>
`;
return;
}

contenedor.innerHTML = usuarios.map((u) => {
const nombre = escapeHtml(u.name);
const ultimaConexion = formatearFechaHora(u.lastLoginAt);
const relativo = tiempoRelativo(u.lastLoginAt);
const interaccion = escapeHtml(u.ultimaInteraccion || "Interactuó");
const avatar = u.avatar
? `<img class="usuario-activo-avatar-img" src="${API_BASE_URL}${u.avatar}" alt="Avatar de ${nombre}">`
: `<div class="usuario-activo-avatar-fallback">${nombre.charAt(0).toUpperCase()}</div>`;
const estado = estadoConexion(u.lastLoginAt);
const filtroUsuario = encodeURIComponent(u.userKey || "");
const nombreJs = JSON.stringify(u.name || "Usuario");

return `
<div class="usuario-activo-item" onclick="aplicarFiltroUsuarioActivo(decodeURIComponent('${filtroUsuario}'), ${nombreJs})" role="button" tabindex="0">
<div class="usuario-activo-avatar">${avatar}</div>
<div class="usuario-activo-info">
<div class="usuario-activo-top">
<p class="usuario-activo-nombre">${nombre}</p>
<span class="usuario-activo-tag">${interaccion}</span>
</div>
<p class="usuario-activo-meta">Última conexión: ${ultimaConexion}</p>
<div class="usuario-activo-status usuario-activo-status--${estado.clase}">
<span class="usuario-activo-status-dot"></span>
<span>${estado.texto}</span>
</div>
<p class="usuario-activo-relativo">${relativo}</p>
</div>
</div>
`;
}).join("");

}


/* =========================
   FILTRAR PUBLICACIONES
========================= */

function filtrarPublicaciones(tipo, boton){

tipoFiltro = tipo;
tipoFiltroSolicitado = tipo;

document.querySelectorAll(".filtro-btn").forEach(btn=>{
btn.classList.remove("activo");
});

document.querySelectorAll(".quick-action-btn").forEach(btn=>{
btn.classList.remove("activo");
});

if(boton){
boton.classList.add("activo");
}

guardarPreferenciasFeed();
renderFiltrosActivosFeed();
cargarProyectos();

}


/* =========================
   CARGAR PUBLICACIONES
========================= */

async function cargarProyectos(){

const feed = document.getElementById("feed");
if(!feed) return;

const usuarioActual = obtenerUsuarioActual();
const usuarioActualClave = obtenerClaveUsuario(usuarioActual);

renderFeedLoading(feed);

try{

const query = new URLSearchParams({
limit: "50"
});

if(tipoFiltro !== "todos"){
query.set("type", tipoFiltro);
}

const token = localStorage.getItem("token");
const headers = token ? { Authorization: `Bearer ${token}` } : {};

const res = await fetch(apiUrl(`/api/projects?${query.toString()}`), { headers });
const payload = await res.json();
const proyectos = Array.isArray(payload) ? payload : (payload.data || []);

renderUsuariosActivos(proyectos);
renderFiltrosActivosFeed();

const tipos = {

project: "📖 Registro de memoria",
food: "🍲 Tradición y gastronomía",
service: "🧵 Saber u oficio",
product: "🗂 Archivo documental",
event: "🎉 Evento cultural"

};

const proyectosFiltrados = proyectos.filter((p) => {
const coincideUsuario = (() => {
if(!usuarioActivoFiltro) return true;
const usuariosProyecto = [
p.author,
...(Array.isArray(p.comments) ? p.comments.map(c => c.user) : []),
...(Array.isArray(p.likes) ? p.likes : [])
].filter(Boolean);
return usuariosProyecto.some((user) => obtenerClaveUsuario(user) === usuarioActivoFiltro);
})();

const coincideBusqueda = (() => {
if(!textoBusqueda) return true;
const base = [p.title, p.description, p.author?.name, p.author?.email, p.location, p.territorio, p.fuente, p.portadorTradicion, p.contextoHistorico, p.valorCultural]
.filter(Boolean)
.join(" ")
.toLowerCase();
return base.includes(textoBusqueda);
})();

return coincideUsuario && coincideBusqueda;
});

const proyectosOrdenados = aplicarOrdenProyectos(proyectosFiltrados);
actualizarResumenResultados(proyectosOrdenados.length);
renderResumenFeedSidebar(proyectos, proyectosOrdenados);
renderAgendaComunitaria(proyectos);
renderMapaVereda(proyectos);
renderNecesidadesOfertas(proyectos);
renderReconocimientosComunitarios(proyectos);

if(proyectosOrdenados.length === 0){
const mensaje = usuarioActivoFiltro || textoBusqueda
? "No encontramos resultados para tus filtros actuales"
: "Aún no hay registros culturales, ¡sé la primera persona en aportar a este archivo!";
renderFeedEmpty(feed, mensaje);
return;
}

feed.innerHTML="";

proyectosOrdenados.forEach(p=>{

const tipo = p.type || "project";

const post = document.createElement("div");
post.className="post";

let media = "";

if (p.image) {
  const url = API_BASE_URL + p.image;

  if (p.image.match(/\.(jpg|jpeg|png|webp)$/i)) {
    media = `<img src="${url}" class="post-img">`;
  } 
  else if (p.image.match(/\.(mp4|webm|ogg)$/i)) {
    media = `<video controls class="post-video">
               <source src="${url}">
             </video>`;
  } 
  else {
    media = `<a href="${url}" target="_blank" class="post-file">
               📄 Ver archivo
             </a>`;
  }
}
/* =========================
   AUTOR
========================= */

const autorClave = obtenerClaveUsuario(p.author);
const autorNombre = p.author?.name || p.author?.email || "Anónimo";
const autorAvatar = p.author?.avatar || "";

let botonEliminar="";

if(usuarioActualClave && autorClave === usuarioActualClave){

botonEliminar=`
<button onclick="eliminarProyecto('${p._id}')" class="btn-eliminar">
Eliminar
</button>
`;

}

/* =========================
   AVATAR
========================= */

const avatarHTML = autorAvatar
? `<img class="avatar-img" src="${API_BASE_URL}${autorAvatar}">`
: `<div class="avatar">${autorNombre.charAt(0).toUpperCase()}</div>`;


/* =========================
   LIKES
========================= */

const totalLikes = p.likes ? p.likes.length : 0;
const totalComentarios = p.comments?.length || 0;
const likesLabel = totalLikes === 1 ? "apoyo comunitario" : "apoyos comunitarios";
const comentariosLabel = totalComentarios === 1 ? "comentario" : "comentarios";

let listaLikes="Nadie aún";

if(p.likes && p.likes.length>0){

listaLikes = p.likes
.map(user => user?.name || user?.email || "Usuario")
.join(", ");

}

/* =========================
   COMENTARIOS
========================= */

let comentariosHTML="";

if(p.comments && p.comments.length>0){

comentariosHTML = p.comments.map(c=>{

const nombre = c.user?.name || c.user?.email || "Usuario";

return `
<div class="comentario">

<div class="comentario-header">

<strong>${nombre}</strong>

<span class="comentario-fecha">

${new Date(c.createdAt || c.date).toLocaleDateString("es-ES",{
day:"numeric",
month:"short"
})}

•

${new Date(c.createdAt || c.date).toLocaleTimeString("en-US",{
hour:"numeric",
minute:"2-digit",
hour12:true
})}

</span>

</div>

<p class="comentario-texto">${c.text}</p>

</div>
`;

}).join("");

}else{

comentariosHTML = `<p class="sin-comentarios">Aún no hay aportes comentados</p>`;

}

/* =========================
   IMAGEN / VIDEO / ARCHIVO
========================= */

const imagen = p.image ? `${API_BASE_URL}${p.image}` : "";
const mediaEsVideo = Boolean(p.image && esArchivoVideo(p.image));
const mediaWrapperClass = mediaEsVideo ? "post-image post-image--video" : "post-image";

let mediaHTML = `
  <div class="post-file post-file-empty">
    Sin recurso visual adjunto en este registro cultural
  </div>
`;

if (p.image) {

  if (esArchivoVideo(p.image)) {

    mediaHTML = `<video src="${imagen}" controls preload="metadata" playsinline class="post-media"></video>`;

  } 
  else if (esArchivoImagen(p.image)) {

    mediaHTML = `<img src="${imagen}" onclick="abrirPost('${p._id}')" class="post-media" alt="Imagen del registro cultural">`;

  } 
  else {

    mediaHTML = `
      <a href="${imagen}" target="_blank" class="post-file">
        📄 Ver archivo
      </a>
    `;

  }

}

/* =========================
   PRECIO
========================= */

const valorCulturalTexto = p.valorCultural || (p.price !== null && p.price !== undefined && p.price !== "" ? `$${p.price}` : "");
const valorCulturalHTML = valorCulturalTexto
? `<p class="post-cultural-note">🌿 Valor cultural / aporte: ${escapeHtml(valorCulturalTexto)}</p>`
: "";

/* =========================
   UBICACIÓN
========================= */

const territorioHTML = p.territorio || p.location
? `<span class="post-cultural-chip">📍 Territorio: ${escapeHtml(p.territorio || p.location)}</span>`
: "";

const fuenteHTML = p.fuente
? `<span class="post-cultural-chip">🗂 Fuente: ${escapeHtml(p.fuente)}</span>`
: "";

const portadorHTML = p.portadorTradicion
? `<span class="post-cultural-chip">👤 Portador: ${escapeHtml(p.portadorTradicion)}</span>`
: "";

const fechaCulturalHTML = p.fechaCultural
? `<span class="post-cultural-chip">📅 Fecha cultural: ${escapeHtml(new Date(p.fechaCultural).toLocaleDateString("es-ES"))}</span>`
: "";

const contextoHistoricoHTML = p.contextoHistorico
? `<p class="post-contexto-historico">🏛 ${escapeHtml(p.contextoHistorico)}</p>`
: "";

/* =========================
   HTML POST
========================= */

post.innerHTML=`

<div class="post-header">

<div class="autor-info">

${avatarHTML}

<div>

<span class="autor-nombre">${autorNombre}</span>

<span class="post-fecha">

${new Date(p.updatedAt || p.createdAt || p.date).toLocaleDateString("es-ES", {
day: "numeric",
month: "short"
})}

•

${new Date(p.updatedAt || p.createdAt || p.date).toLocaleTimeString("en-US", {
hour: "numeric",
minute: "2-digit",
hour12: true
})}

</span>

<span class="tipo-post">${tipos[tipo]}</span>

</div>

</div>

${botonEliminar}

</div>

<div class="${mediaWrapperClass}">
${mediaHTML}
</div>

<div class="post-content">

<h3>${p.title}</h3>

<p>${p.description}</p>

<div class="post-cultural-grid">
${territorioHTML}
${fuenteHTML}
${portadorHTML}
${fechaCulturalHTML}
</div>

${contextoHistoricoHTML}

${valorCulturalHTML}


</div>

<div class="post-stats post-stats--secondary">

<span class="post-stat-pill post-stat-pill--likes${totalLikes > 0 ? " post-stat-pill--active post-stat-pill--pulse" : ""}">
<span class="post-stat-pill__icon">🤝</span>
<strong>${totalLikes}</strong>
<span>${likesLabel}</span>
</span>

<span class="post-stat-pill post-stat-pill--comments${totalComentarios > 0 ? " post-stat-pill--active" : ""}">
<span class="post-stat-pill__icon">💬</span>
<strong>${totalComentarios}</strong>
<span>${comentariosLabel}</span>
</span>

</div>

<div class="post-actions">

<button onclick="likeProyecto('${p._id}', this)" class="btn-like">
❤️ Me gusta
</button>

<button onclick="compartirWhatsApp('${p._id}')" class="btn-whatsapp" aria-label="Compartir registro cultural por WhatsApp">
🟢 Compartir registro
</button>

</div>

<div class="likes-list">
Valorado por: ${listaLikes}
</div>

<div class="comentarios">

<div class="lista-comentarios">
${comentariosHTML}
</div>

<textarea id="comentario-${p._id}" placeholder="Aporta un comentario para enriquecer la memoria colectiva"></textarea>

<button class="btn-comentar" onclick="comentarProyecto('${p._id}')">
Guardar comentario
</button>

</div>

`;

feed.appendChild(post);

});

abrirPostDesdeHashSiAplica();

}catch(error){

console.error("Error cargando proyectos:",error);

}

}



/* =========================
   CREAR PUBLICACIÓN
========================= */
async function crearProyecto(){

const token = localStorage.getItem("token");

if(!token){
  mostrarModalLogin();
  return;
}

const tipo = document.getElementById("tipoProyecto").value;
const titulo = document.getElementById("tituloProyecto").value;
const descripcion = document.getElementById("descripcionProyecto").value;
const valorCultural = document.getElementById("valorCulturalProyecto").value;
const territorio = document.getElementById("territorioProyecto").value;
const fuente = document.getElementById("fuenteProyecto").value;
const portadorTradicion = document.getElementById("portadorProyecto").value;
const fechaCultural = document.getElementById("fechaCulturalProyecto").value;
const contextoHistorico = [document.getElementById("contextoCortoProyecto").value, document.getElementById("contextoHistoricoProyecto").value]
.map((item) => String(item || "").trim())
.filter(Boolean)
.join(". ");
const aporteNumerico = Number(String(valorCultural || "").replace(",", "."));

const inputArchivos = document.getElementById("imagenProyecto");
const archivos = inputArchivos.files;

const aceptaDerechos = document.getElementById("aceptaDerechosProyecto");

if(aceptaDerechos && !aceptaDerechos.checked){
  alert("Debes aceptar los derechos de autor antes de publicar");
  return;
}

const formData = new FormData();

formData.append("title",titulo);
formData.append("description",descripcion);
formData.append("type",tipo);
formData.append("valorCultural",valorCultural);
formData.append("price", Number.isFinite(aporteNumerico) && aporteNumerico >= 0 ? String(aporteNumerico) : "");
formData.append("territorio",territorio);
formData.append("location",territorio);
formData.append("fuente",fuente);
formData.append("portadorTradicion",portadorTradicion);
formData.append("fechaCultural",fechaCultural);
formData.append("contextoHistorico",contextoHistorico);

// 🔥 MULTIPLES ARCHIVOS
if (archivos.length > 0) {
  for (let i = 0; i < archivos.length; i++) {
    formData.append("archivo", archivos[i]);
  }
}

const res = await fetch(apiUrl("/api/projects"),{
  method:"POST",
  headers:{
    Authorization:`Bearer ${token}`
  },
  body:formData
});

if(res.ok){

  alert("Registro cultural creado correctamente");

  document.getElementById("tituloProyecto").value="";
  document.getElementById("descripcionProyecto").value="";
  document.getElementById("valorCulturalProyecto").value="";
  document.getElementById("territorioProyecto").value="";
  document.getElementById("fuenteProyecto").value="";
  document.getElementById("portadorProyecto").value="";
  document.getElementById("fechaCulturalProyecto").value="";
  document.getElementById("contextoCortoProyecto").value="";
  document.getElementById("contextoHistoricoProyecto").value="";
  document.getElementById("imagenProyecto").value="";

  if(aceptaDerechos){
    aceptaDerechos.checked = false;
  }

  cargarProyectos();

}else{

  const error = await res.json();
  console.log("ERROR BACKEND:", error);

  alert(error.message || "Error guardando el registro cultural");

}

}



/* =========================
   LIKE
========================= */


function compartirWhatsApp(postId){
const mensajeBase = "Mira este registro cultural de Afrocrece Digital";
const enlacePublicacion = `${window.location.origin}${window.location.pathname}#post-${postId}`;
const mensaje = `${mensajeBase}
${enlacePublicacion}`;
const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
window.open(url, "_blank", "noopener,noreferrer");
}

async function likeProyecto(id, boton){

const token = localStorage.getItem("token");

if(!token){

mostrarModalLogin();
return;

}

if (boton) {
  boton.classList.add("is-animating");
  setTimeout(() => boton.classList.remove("is-animating"), 420);
}

if (!token) {
  console.log("No hay token, no se envía request");
  return;
}

await fetch(apiUrl(`/api/projects/${id}/like`), {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`
  }
});
if(boton){
boton.classList.add("is-liked");
setTimeout(() => boton.classList.remove("is-liked"), 900);
}

cargarProyectos();

}





/* =========================
   COMENTAR
========================= */

async function comentarProyecto(id){

const token = localStorage.getItem("token");

if(!token){

mostrarModalLogin();
return;

}

const textarea = document.getElementById(`comentario-${id}`);
const texto = textarea.value.trim();

if(!texto) return;

await fetch(apiUrl(`/api/projects/${id}/comment`),{

method:"POST",

headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},

body:JSON.stringify({text:texto})

});

textarea.value="";

cargarProyectos();

}



/* =========================
   ELIMINAR
========================= */

async function eliminarProyecto(id){

const token = localStorage.getItem("token");

if(!confirm("¿Eliminar este registro cultural?")) return;

await fetch(apiUrl(`/api/projects/${id}`),{

method:"DELETE",

headers:{
Authorization:`Bearer ${token}`
}

});

cargarProyectos();

}



/* =========================
   MODAL LOGIN
========================= */
document.querySelectorAll(".modal-login").forEach(m => m.remove());




/* =========================
   LOGIN / LOGOUT
========================= */

document.addEventListener("DOMContentLoaded", () => {

const logoutBtn = document.getElementById("logoutBtn");
const loginLink = document.getElementById("loginLink");

const token = localStorage.getItem("token");
const user = getStoredUser();
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const isLoginPage = currentPage === "login.html";
const isProtectedPage = false;
const header = document.querySelector(".home-header");

if(header){
const toggleHeaderState = () => {
header.classList.toggle("is-scrolled", window.scrollY > 12);
};
toggleHeaderState();
window.addEventListener("scroll", toggleHeaderState, { passive: true });
}

const clearSession = () => {
localStorage.removeItem("token");
localStorage.removeItem("usuarioEmail");
localStorage.removeItem("user");
localStorage.removeItem("recordarSesion");
};

if(token){

if(loginLink) loginLink.style.display="none";
if(logoutBtn) logoutBtn.style.display="inline-block";

const nav = loginLink?.closest(".home-nav") || document.getElementById("indexNav") || document.getElementById("homeNav");
if(nav && user?.role === "admin" && !document.getElementById("adminPanelLink")){
const adminLink = document.createElement("a");
adminLink.id = "adminPanelLink";
adminLink.href = "admin-users.html";
adminLink.textContent = "Aprobaciones";
nav.insertBefore(adminLink, logoutBtn || null);
}

if(nav && user?.role !== "admin"){
const adminLink = document.getElementById("adminPanelLink");
if(adminLink) adminLink.remove();
}

}

if(logoutBtn){

logoutBtn.addEventListener("click",()=>{

const confirmar = window.confirm("¿Cerrar sesión?");
if(!confirmar) return;

clearSession();
window.location.href = "login.html";

});

}

if(isLoginPage){
return;
}

if(!prefersReducedMotion){
const revealTargets = document.querySelectorAll(".sidebar-box, .crear-post, .feed-tools, #feed .post, .home-map-wrap, .home-map-info, .quick-action-btn, .agenda-item, .ally-profile-hero, .ally-profile-title, .ally-profile-subtitle, .ally-profile-section, .ally-profile-card, .ally-profile-gallery .ally-gallery img, .ally-profile-actions .home-btn");
if(revealTargets.length){
const revealObserver = new IntersectionObserver((entries, obs) => {
entries.forEach((entry) => {
if(!entry.isIntersecting) return;
entry.target.classList.add("is-visible");
obs.unobserve(entry.target);
});
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

revealTargets.forEach((el) => {
el.classList.add("reveal-on-scroll");
revealObserver.observe(el);
});
}
}else{
document.querySelectorAll(".sidebar-box, .crear-post, .feed-tools, #feed .post, .home-map-wrap, .home-map-info, .quick-action-btn, .agenda-item, .ally-profile-hero, .ally-profile-title, .ally-profile-subtitle, .ally-profile-section, .ally-profile-card, .ally-profile-gallery .ally-gallery img, .ally-profile-actions .home-btn").forEach((el) => el.classList.add("is-visible"));
}

cargarPreferenciasFeed();
aplicarFiltroInicialDesdeURL();

const searchInput = document.getElementById("busquedaFeed");
if(searchInput){
searchInput.value = textoBusqueda;
searchInput.addEventListener("input", (e) => {
actualizarBusquedaFeed(e.target.value);
});
}

const ordenSelect = document.getElementById("ordenFeed");
if(ordenSelect){
ordenSelect.value = ordenFeed;
ordenSelect.addEventListener("change", (e) => {
actualizarOrdenFeed(e.target.value);
});
}

if(tipoFiltro !== "todos"){
document.querySelectorAll(".filtro-btn").forEach(btn => btn.classList.remove("activo"));
const btnAct = document.querySelector(`.filtro-btn[onclick*="'${tipoFiltro}'"]`);
if(btnAct) btnAct.classList.add("activo");
}

renderFiltrosActivosFeed();
cargarProyectos();
window.addEventListener("hashchange", () => {
postHashProcesado = "";
abrirPostDesdeHashSiAplica();
});

const backToTopBtn = document.getElementById("backToTopBtn");
if(backToTopBtn){
window.addEventListener("scroll", () => {
backToTopBtn.classList.toggle("visible", window.scrollY > 500);
});
backToTopBtn.addEventListener("click", () => {
window.scrollTo({ top: 0, behavior: "smooth" });
});
}

});

/* =========================
   LOGIN FORM
========================= */

function initLoginFormAuthFlow(){

const loginForm = document.getElementById("loginForm");
if(!loginForm){
console.warn("loginForm no encontrado en esta vista");
return;
}
if(loginForm.dataset.authBound === "1") return;
loginForm.dataset.authBound = "1";

const loginStatus = document.getElementById("loginStatus");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");

if(!emailInput || !passwordInput){
console.error("inputs de login no encontrados", { hasEmail: Boolean(emailInput), hasPassword: Boolean(passwordInput) });
}
const rememberSession = document.getElementById("rememberSession");
const capsLockWarning = document.getElementById("capsLockWarning");

const setLoginStatus = (message, variant = "info") => {
if(!loginStatus) return;
loginStatus.textContent = message || "";
loginStatus.className = `login-status login-status--${variant}`;
};

const token = localStorage.getItem("token");
const storedUser = getStoredUser();
if(token){
window.location.href = storedUser?.role === "admin" ? "admin-users.html" : "index.html";
return;
}

if(togglePasswordBtn && passwordInput){
togglePasswordBtn.addEventListener("click", () => {
const oculto = passwordInput.type === "password";
passwordInput.type = oculto ? "text" : "password";
togglePasswordBtn.textContent = oculto ? "🙈" : "👁️";
togglePasswordBtn.setAttribute("aria-label", oculto ? "Ocultar contraseña" : "Mostrar contraseña");
});

const updateCapsState = (event) => {
if(!capsLockWarning) return;
capsLockWarning.style.display = event.getModifierState("CapsLock") ? "block" : "none";
};

passwordInput.addEventListener("keydown", updateCapsState);
passwordInput.addEventListener("keyup", updateCapsState);
passwordInput.addEventListener("blur", () => {
if(capsLockWarning) capsLockWarning.style.display = "none";
});
}

loginForm.addEventListener("submit", async (e) => {

e.preventDefault();
e.stopPropagation();

const email = emailInput?.value.trim();
const password = passwordInput ? passwordInput.value : "";
setLoginStatus("", "info");

if(!email || !password){
setLoginStatus("Completa correo y contraseña.", "error");
return;
}

try{
if(loginSubmitBtn){
loginSubmitBtn.disabled = true;
loginSubmitBtn.textContent = "Entrando...";
}
setLoginStatus("Validando credenciales...", "info");

const endpointLogin = apiUrl("/api/auth/login");
const res = await fetch(endpointLogin,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
email: email,
password: password
})
});

const data = await res.json();

if(res.ok){
localStorage.setItem("token", data.token);
localStorage.setItem("usuarioEmail", data.user.email);
localStorage.setItem("user", JSON.stringify(data.user));

if(rememberSession){
localStorage.setItem("recordarSesion", rememberSession.checked ? "1" : "0");
}

setLoginStatus("¡Bienvenido! Redirigiendo...", "success");
window.location.href = data.user?.role === "admin" ? "admin-users.html" : "index.html";
}else{
setLoginStatus(data.message || data.mensaje || "Error al iniciar sesión", "error");
}

}catch(error){
console.error("login error", error);
setLoginStatus("Error conectando con el servidor", "error");

}finally{
if(loginSubmitBtn){
loginSubmitBtn.disabled = false;
loginSubmitBtn.textContent = "Entrar";
}
}

});

}

if(document.readyState === "loading"){
document.addEventListener("DOMContentLoaded", initLoginFormAuthFlow);
}else{
initLoginFormAuthFlow();
}

/* =========================
   ABRIR IMAGEN GRANDE
========================= */

function abrirImagen(src){

const modal = document.createElement("div");

modal.className = "modal-imagen";

modal.innerHTML = `
<div class="modal-imagen-contenido">

<img src="${src}">

<button class="cerrar-modal" onclick="this.closest('.modal-imagen').remove()">
✖
</button>

</div>
`;

document.body.appendChild(modal);

}
/* =========================
   ABRIR PUBLICACIÓN
========================= */


async function abrirPost(id){

const token = localStorage.getItem("token");
const headers = token ? { Authorization: `Bearer ${token}` } : {};

const res = await fetch(apiUrl(`/api/projects/${id}`), { headers });
const post = await res.json();

if(!res.ok || !post?._id) return;

const imagen = post.image
? `${API_BASE_URL}${post.image}`
: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac";
const mediaEsVideo = esArchivoVideo(post.image);
const modalMediaClass = mediaEsVideo ? "modal-post-img modal-post-img--video" : "modal-post-img";
const mediaModalHTML = mediaEsVideo
? `<video src="${imagen}" controls preload="metadata" playsinline></video>`
: `<img src="${imagen}">`;

const autor = post.author?.name || "Usuario";

/* =========================
   COMENTARIOS
========================= */

let comentariosHTML = "";

if(post.comments && post.comments.length > 0){

comentariosHTML = post.comments.map(c => {

const nombre = c.user?.name || c.user?.email || "Usuario";

return `
<div class="comentario">
<strong>${nombre}</strong>
<p>${c.text}</p>
</div>
`;

}).join("");

}else{

comentariosHTML = `<p class="sin-comentarios">No hay comentarios</p>`;

}

const modal = document.createElement("div");

modal.className="modal-post";

modal.innerHTML = `

<div class="modal-post-contenido">

<button class="cerrar-modal"
onclick="this.closest('.modal-post').remove()">✖</button>

<div class="modal-post-grid">

<div class="${modalMediaClass}">
${mediaModalHTML}
</div>

<div class="modal-post-info">

<h3>${autor}</h3>

<h2>${post.title}</h2>

<p>${post.description}</p>

<p>❤️ ${post.likes?.length || 0} valoraciones</p>

<hr>

<div class="comentarios-modal">

${comentariosHTML}

</div>

</div>

</div>

</div>

`;

document.body.appendChild(modal);

}
/* =========================
   IR A PERFIL
========================= */

function irPerfil(){

const email = localStorage.getItem("usuarioEmail");

if(!email){

alert("Debes iniciar sesión");

return;

}

window.location.href = "perfil.html";

}

/* =========================
   MODAL LOGIN
========================= */


function mostrarModalLogin(){

/* evitar que se abra más de uno */
if(document.querySelector(".modal-login")) return;

const modal = document.createElement("div");
modal.className = "modal-login";

modal.innerHTML = `

<div class="modal-login-card">

<h2>Inicia sesión</h2>

<p>Inicia sesión para interactuar con el contenido</p>

<div class="modal-login-botones">

<button onclick="window.location.href='login.html'" class="btn-login">
Ir a login
</button>

<button onclick="window.location.href='registro.html'" class="btn-login">
Crear cuenta
</button>

<button class="btn-cancelar">
Cancelar
</button>

</div>

</div>

`;

document.body.appendChild(modal);


/* cerrar con botón cancelar */

modal.querySelector(".btn-cancelar").addEventListener("click", () => {

modal.remove();

});


/* cerrar si hacen click fuera */

modal.addEventListener("click", (e) => {

if(e.target === modal){
modal.remove();
}

});

}
const inputFile = document.getElementById("imagenProyecto");
const previewContainer = document.getElementById("previewContainer");

if (inputFile) {

  inputFile.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    let html = "";

    if (file.type.startsWith("image/")) {

      html = `<img src="${url}" class="preview-img">`;

    } 
    else if (file.type.startsWith("video/")) {

      html = `
        <video controls class="preview-video">
          <source src="${url}">
        </video>
      `;

    } 
    else {

      html = `
        <div class="preview-file">
          📄 ${file.name}
        </div>
      `;

    }

    previewContainer.innerHTML = html;

  });

}
