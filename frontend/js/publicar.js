/* =========================
   PUBLICAR PROYECTO
========================= */

const form = document.getElementById("projectForm");

if(form){

form.addEventListener("submit", async (e)=>{

e.preventDefault();

const token = localStorage.getItem("token");

if(!token){

alert("Debes iniciar sesión para publicar un proyecto");
window.location.href="login.html";
return;

}

const title = document.getElementById("title").value;
const description = document.getElementById("description").value;
const category = document.getElementById("category").value;
const image = document.getElementById("image").files[0];
const aceptaDerechos = document.getElementById("aceptaDerechosPublicacion");

if(aceptaDerechos && !aceptaDerechos.checked){
alert("Debes aceptar los derechos de autor antes de publicar");
return;
}

const formData = new FormData();

formData.append("title", title);
formData.append("description", description);
formData.append("category", category);

if(image){
formData.append("archivo", image);
}

try{

const res = await fetch(apiUrl("/api/projects"),{

method:"POST",

headers:{
Authorization:`Bearer ${token}`
},

body:formData

});

const data = await res.json();

if(res.ok){

alert("Proyecto publicado correctamente");

window.location.href="index.html";

}else{

console.log(data);

alert(data.message || "Error al crear proyecto");

}

}catch(error){

console.error("Error:",error);

alert("Error conectando con el servidor");

}

});

}
