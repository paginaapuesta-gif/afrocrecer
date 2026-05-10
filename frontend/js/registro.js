const form = document.getElementById("registroForm");

if (!form) {
  console.warn("No se encontró #registroForm en esta página.");
} else {
  const statusEl = document.getElementById("registroStatus");
  const submitBtn = form.querySelector(".btn-auth");
  const togglePasswordBtn = document.getElementById("toggleRegistroPassword");
  const passwordInput = document.getElementById("password");

  function setStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.className = `registro-status registro-status--${type}`;
    statusEl.textContent = message;
  }

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      togglePasswordBtn.textContent = isHidden ? "🙈" : "👁️";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatus("Completa todos los campos.", "error");
      return;
    }

    if (password.length < 8) {
      setStatus("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";
    setStatus("Estamos creando tu cuenta...", "info");

    try {
      const response = await fetch(apiUrl("/api/auth/registro"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("Cuenta creada correctamente. Redirigiendo al login...", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        setStatus(data.message || "Error al registrarse", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("No se pudo conectar con el servidor", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Crear cuenta";
    }
  });
}
