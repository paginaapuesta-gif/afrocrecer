const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");
const token = localStorage.getItem("token");

const typeMap = {
  project: "project",
  event: "event",
  service: "service",
  product: "product",
  food: "food"
};

function setStatus(message, variant = "info") {
  const status = document.getElementById("editStatus");
  if (!status) return;

  status.textContent = message || "";
  status.className = `editar-status editar-status--${variant}`;
}

function setLoading(isLoading) {
  const btn = document.getElementById("btnGuardarEdicion");
  if (!btn) return;

  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Actualizando..." : "Actualizar registro cultural";
}

function seleccionarTipo(project) {
  const fromType = project.type;
  const fromCategory = (project.category || "").toLowerCase();
  if (typeMap[fromType]) return typeMap[fromType];

  if (fromCategory.includes("evento")) return "event";
  if (fromCategory.includes("servicio")) return "service";
  if (fromCategory.includes("producto")) return "product";
  if (fromCategory.includes("comida")) return "food";

  return "project";
}

if (!projectId) {
  setStatus("Registro cultural inválido.", "error");
  window.location.href = "index.html";
}

async function cargarProyecto() {
  try {
    setStatus("Cargando registro cultural...", "info");
    const res = await fetch(apiUrl(`/api/projects/${projectId}`));
    const project = await res.json();

    if (!res.ok) {
      throw new Error(project.message || "No se pudo cargar el proyecto");
    }

    document.getElementById("title").value = project.title || "";
    document.getElementById("description").value = project.description || "";
    document.getElementById("type").value = seleccionarTipo(project);
    document.getElementById("territorio").value = project.territorio || project.location || "";
    document.getElementById("valorCultural").value = project.valorCultural || (Number.isFinite(Number(project.price)) ? Number(project.price) : "");
    document.getElementById("fuente").value = project.fuente || "";
    document.getElementById("portadorTradicion").value = project.portadorTradicion || "";
    document.getElementById("fechaCultural").value = project.fechaCultural ? new Date(project.fechaCultural).toISOString().slice(0, 10) : "";
    document.getElementById("contextoHistorico").value = project.contextoHistorico || "";

    const preview = document.getElementById("editImagePreview");
    preview.src = project.image ? `${API_BASE_URL}${project.image}` : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac";

    setStatus("Registro cultural cargado. Puedes editar y guardar cambios.", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Error cargando registro cultural", "error");
  }
}

document.getElementById("image").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const preview = document.getElementById("editImagePreview");
  preview.src = URL.createObjectURL(file);
});

cargarProyecto();

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!token) {
    setStatus("Debes iniciar sesión para editar.", "error");
    window.location.href = "login.html";
    return;
  }

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (title.length < 3) {
    setStatus("El título debe tener al menos 3 caracteres.", "error");
    return;
  }

  if (description.length < 10) {
    setStatus("La descripción debe tener al menos 10 caracteres.", "error");
    return;
  }

  const valorCultural = document.getElementById("valorCultural").value.trim();
  const aporteNumerico = Number(valorCultural.replace(",", "."));

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("type", document.getElementById("type").value);
  formData.append("territorio", document.getElementById("territorio").value.trim());
  formData.append("location", document.getElementById("territorio").value.trim());
  formData.append("valorCultural", valorCultural);
  formData.append("price", Number.isFinite(aporteNumerico) && aporteNumerico >= 0 ? String(aporteNumerico) : "");
  formData.append("fuente", document.getElementById("fuente").value.trim());
  formData.append("portadorTradicion", document.getElementById("portadorTradicion").value.trim());
  formData.append("fechaCultural", document.getElementById("fechaCultural").value);
  formData.append("contextoHistorico", document.getElementById("contextoHistorico").value.trim());

  const image = document.getElementById("image").files[0];
  if (image) {
    formData.append("image", image);
  }

  try {
    setLoading(true);
    setStatus("Guardando cambios...", "info");

    const res = await fetch(apiUrl(`/api/projects/${projectId}`), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar");
    }

    setStatus("Registro cultural actualizado correctamente ✅", "success");
    setTimeout(() => {
      window.location.href = "perfil.html";
    }, 900);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Error actualizando proyecto", "error");
  } finally {
    setLoading(false);
  }
});
