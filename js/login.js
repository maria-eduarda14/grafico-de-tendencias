const form = document.getElementById("loginForm");
const aviso = document.getElementById("loginAviso");

function mostrarAviso(msg, tipo="error") {
  aviso.textContent = msg;
  aviso.className = `notice show ${tipo}`;
}

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data: isAdmin } = await supabaseClient.rpc("is_admin");
    if (isAdmin) location.href = "admin.html";
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("senha").value;
  form.classList.add("loading");
  aviso.className = "notice";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    form.classList.remove("loading");
    return mostrarAviso("E-mail ou senha inválidos.");
  }

  const { data: isAdmin, error: adminError } = await supabaseClient.rpc("is_admin");
  if (adminError || !isAdmin) {
    await supabaseClient.auth.signOut();
    form.classList.remove("loading");
    return mostrarAviso("Este usuário não possui permissão de administrador.");
  }

  location.href = "admin.html";
});
