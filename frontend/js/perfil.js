function escapeHtml(texto){
  return String(texto || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");
}

function formatFechaCorta(fecha){
  if(!fecha) return "—";
  const d = new Date(fecha);
  if(Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day:"2-digit", month:"short", year:"numeric" });
}

function compartirWhatsAppPerfil(postId){
  const mensajeBase = "Mira este registro cultural de Afrocrece Digital";
  const enlacePublicacion = `${window.location.origin}/index.html#post-${postId}`;
  const mensaje = `${mensajeBase}\n${enlacePublicacion}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
}

function obtenerUsuarioActual(){
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (_error) {
    return null;
  }
}

function obtenerClaveUsuario(user){
  if (!user) return "";
  return String(user._id || user.email || user.name || "").trim();
}

document.addEventListener("DOMContentLoaded", async () => {

const email = localStorage.getItem("usuarioEmail");
const token = localStorage.getItem("token");
const usuarioActual = obtenerUsuarioActual();
const usuarioClave = obtenerClaveUsuario(usuarioActual);

if(!email || !token){
window.location.href = "login.html";
return;
}

const nombre = usuarioActual?.name || email.split("@")[0];

const perfilNombre = document.getElementById("perfilNombre");
const perfilEmail = document.getElementById("perfilEmail");
const perfilAvatar = document.getElementById("perfilAvatar");
const perfilMiembroDesde = document.getElementById("perfilMiembroDesde");
const perfilUltimaActividad = document.getElementById("perfilUltimaActividad");
const perfilBadges = document.getElementById("perfilBadges");
const perfilImpactoSemanal = document.getElementById("perfilImpactoSemanal");
const contenedor = document.getElementById("misPublicaciones");
const filtroTipo = document.getElementById("perfilFiltroTipo");
const orden = document.getElementById("perfilOrden");

perfilNombre.innerText = nombre;
perfilEmail.innerText = email;
perfilAvatar.innerText = nombre.charAt(0).toUpperCase();
contenedor.innerHTML = `<div class="perfil-loading-state">Cargando registros culturales...</div>`;

try{

const res = await fetch(apiUrl("/api/projects"), {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
const payload = await res.json();
const proyectos = Array.isArray(payload) ? payload : (payload.data || []);
const propios = proyectos.filter((p)=> obtenerClaveUsuario(p.author) === usuarioClave || p.author?.email === email);

let totalPosts = propios.length;
let totalLikes = 0;
let totalComentarios = 0;

propios.forEach((p)=>{
  totalLikes += Array.isArray(p.likes) ? p.likes.length : 0;
  totalComentarios += Array.isArray(p.comments) ? p.comments.length : 0;
});

document.getElementById("totalPosts").innerText = totalPosts;
document.getElementById("totalLikes").innerText = totalLikes;
document.getElementById("totalComentarios").innerText = totalComentarios;

const fechas = propios.map((p) => new Date(p.updatedAt || p.createdAt || 0).getTime()).filter((n)=>!Number.isNaN(n) && n > 0);
const primerPost = fechas.length ? new Date(Math.min(...fechas)) : null;
const ultimoPost = fechas.length ? new Date(Math.max(...fechas)) : null;

perfilMiembroDesde.innerText = `Miembro desde: ${formatFechaCorta(primerPost)}`;
perfilUltimaActividad.innerText = `Última actividad: ${formatFechaCorta(ultimoPost)}`;

const limitesSemana = Date.now() - (7 * 24 * 60 * 60 * 1000);
const postsSemana = propios.filter((p)=> new Date(p.updatedAt || p.createdAt || 0).getTime() >= limitesSemana);
const interaccionesSemana = postsSemana.reduce((acc, p) => {
  return acc + (p.likes?.length || 0) + (p.comments?.length || 0);
}, 0);

const conteoTipos = propios.reduce((acc, p) => {
  const key = p.type || "project";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
const topTipo = Object.entries(conteoTipos).sort((a,b)=>b[1]-a[1])[0]?.[0] || "project";
const etiquetas = { project:"Memoria y danza", food:"Tradición y gastronomía", service:"Saberes y oficios", product:"Archivo documental", event:"Eventos culturales" };

perfilImpactoSemanal.innerHTML = `
  <p class="perfil-impacto-title">Impacto semanal</p>
  <p>Interacciones: <strong>${interaccionesSemana}</strong></p>
  <p>Categoría destacada: <strong>${etiquetas[topTipo] || topTipo}</strong></p>
`;

const badges = [];
if(totalPosts >= 5) badges.push("Creador constante");
if(totalLikes >= 15) badges.push("Conecta con la comunidad");
if(postsSemana.length >= 2) badges.push("Activo esta semana");
if(Object.keys(conteoTipos).length >= 3) badges.push("Multitemático");
if(badges.length === 0) badges.push("Comunidad activa");

perfilBadges.innerHTML = badges.map((b)=> `<span class="perfil-badge">${escapeHtml(b)}</span>`).join("");

function aplicarOrden(items){
  const list = [...items];

  if(orden.value === "likes"){
    list.sort((a,b)=>(b.likes?.length || 0) - (a.likes?.length || 0));
    return list;
  }

  if(orden.value === "comentarios"){
    list.sort((a,b)=>(b.comments?.length || 0) - (a.comments?.length || 0));
    return list;
  }

  list.sort((a,b)=> new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  return list;
}

function renderPosts(){
  let data = [...propios];
  if(filtroTipo.value !== "todos"){
    data = data.filter((p) => p.type === filtroTipo.value);
  }

  data = aplicarOrden(data);
  contenedor.innerHTML = "";

  if(data.length === 0){
    contenedor.innerHTML = `
    <div class="perfil-empty-state">
      <h4>Aún no tienes registros culturales en esta colección</h4>
      <p>Comparte memoria, tradición y procesos comunitarios para fortalecer el archivo cultural.</p>
      <button class="btn-volver" onclick="window.location.href='publicar.html'">Crear mi primer registro</button>
    </div>
    `;
    return;
  }

  data.forEach((p)=>{
    const imagen = p.image
    ? `${API_BASE_URL}${p.image}`
    : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac";

    const card = document.createElement("div");
    card.className = "perfil-post";

    const titulo = escapeHtml(p.title || "Registro cultural");
    const likes = p.likes?.length || 0;
    const comentarios = p.comments?.length || 0;

    card.innerHTML = `
      <img src="${imagen}" alt="${titulo}">
      <p class="perfil-post-title">${titulo}</p>
      <p class="perfil-post-meta">❤️ ${likes} · 💬 ${comentarios}</p>
      <div class="perfil-post-actions">
        <button class="perfil-post-btn" onclick="window.location.href='index.html#post-${p._id}'">Ver</button>
        <button class="perfil-post-btn" onclick="window.location.href='editar.html?id=${p._id}'">Editar</button>
        <button class="perfil-post-btn perfil-post-btn-whatsapp" onclick="compartirWhatsAppPerfil('${p._id}')">WhatsApp</button>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

filtroTipo.addEventListener("change", renderPosts);
orden.addEventListener("change", renderPosts);
renderPosts();

}catch(error){

console.error("Error cargando perfil", error);
contenedor.innerHTML = `
<div class="perfil-empty-state">
  <h4>No pudimos cargar tu perfil</h4>
  <p>Intenta recargar la página en unos segundos.</p>
</div>
`;

}

});
