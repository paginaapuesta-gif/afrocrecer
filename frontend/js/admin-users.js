(function initAdminUsersPanel() {
  const statusEl = document.getElementById("adminUsersStatus");
  const tableBody = document.getElementById("pendingUsersBody");
  const counterEl = document.getElementById("pendingCounter");
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const setStatus = (message, variant = "info") => {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.className = `admin-users-status admin-users-status--${variant}`;
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioEmail");
    localStorage.removeItem("user");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  };

  let pendingUsers = [];

  const renderRows = () => {
    if (!tableBody) return;

    counterEl.textContent = `${pendingUsers.length} pendientes`;

    if (!pendingUsers.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="admin-users-empty">No hay usuarios pendientes por aprobar.</td></tr>';
      return;
    }

    tableBody.innerHTML = pendingUsers.map((user) => `
      <tr data-user-id="${user._id}">
        <td>${user.name || "Sin nombre"}</td>
        <td>${user.email || "Sin correo"}</td>
        <td>${formatDate(user.createdAt)}</td>
        <td><span class="admin-status-chip admin-status-chip--pending">${user.status || "pending"}</span></td>
        <td>
          <div class="admin-actions">
            <button type="button" class="admin-action-btn admin-action-btn--approve" data-action="approve" data-id="${user._id}">Aprobar</button>
            <button type="button" class="admin-action-btn admin-action-btn--reject" data-action="reject" data-id="${user._id}">Rechazar</button>
          </div>
        </td>
      </tr>
    `).join("");
  };

  const fetchPendingUsers = async () => {
    try {
      setStatus("Cargando usuarios pendientes...", "info");

      const response = await fetch(apiUrl("/api/admin/users/pending"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar la lista de usuarios pendientes");
      }

      pendingUsers = Array.isArray(data.users) ? data.users : [];
      renderRows();
      setStatus("Listado actualizado", "success");
    } catch (error) {
      setStatus(error.message || "Error cargando usuarios", "error");
      tableBody.innerHTML = '<tr><td colspan="5" class="admin-users-empty">No se pudieron cargar usuarios pendientes.</td></tr>';
    }
  };

  const updateUserStatus = async (userId, action, button) => {
    const endpoint = action === "approve"
      ? `/api/admin/users/${userId}/approve`
      : `/api/admin/users/${userId}/reject`;

    const originalLabel = button.textContent;

    try {
      button.disabled = true;
      button.textContent = action === "approve" ? "Aprobando..." : "Rechazando...";
      setStatus("Procesando solicitud...", "info");

      const response = await fetch(apiUrl(endpoint), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el estado del usuario");
      }

      pendingUsers = pendingUsers.filter((user) => user._id !== userId);
      renderRows();
      setStatus(data.message || "Estado actualizado correctamente", "success");
    } catch (error) {
      setStatus(error.message || "Error actualizando usuario", "error");
      button.disabled = false;
      button.textContent = originalLabel;
    }
  };

  if (!token) {
    setStatus("Debes iniciar sesión para acceder al panel.", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
    return;
  }

  if (!storedUser || storedUser.role !== "admin") {
    setStatus("Acceso restringido: solo administradores.", "error");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
    return;
  }

  logoutBtn?.addEventListener("click", () => {
    const confirmar = window.confirm("¿Cerrar sesión?");
    if (!confirmar) return;

    clearSession();
    window.location.href = "login.html";
  });

  tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const userId = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    if (!userId || !["approve", "reject"].includes(action)) return;

    updateUserStatus(userId, action, button);
  });

  fetchPendingUsers();
})();
