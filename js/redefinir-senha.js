const aviso = document.getElementById("redefinirAviso");
const formulario = document.getElementById("redefinirForm");
let linkValidado = false;

function mostrarAviso(texto, tipo = "error") {
  aviso.textContent = texto;
  aviso.className = `notice show ${tipo}`;
}

document.querySelectorAll(".password-toggle").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = document.getElementById(botao.dataset.target);
    const visivel = campo.type === "password";
    campo.type = visivel ? "text" : "password";
    botao.setAttribute("aria-label", visivel ? "Ocultar senha" : "Mostrar senha");
    botao.setAttribute("aria-pressed", String(visivel));
  });
});

// O Supabase cria uma sessão de recuperação ao abrir o link recebido por e-mail.
supabaseClient.auth.onAuthStateChange((evento) => {
  if (evento === "PASSWORD_RECOVERY") {
    linkValidado = true;
    formulario.hidden = false;
    aviso.className = "notice";
  }
});

(async () => {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(location.search);
  if (params.has("error") || query.has("error")) {
    mostrarAviso("O link expirou ou é inválido. Solicite outro na tela de login.");
    return;
  }
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    // Sessões de recuperação legadas podem chegar com type=recovery no hash.
    if (session && (params.get("type") === "recovery" || query.get("type") === "recovery")) {
      linkValidado = true;
      formulario.hidden = false;
    }
    if (!linkValidado) mostrarAviso("Abra esta página pelo link de recuperação enviado ao seu e-mail.");
  } catch (err) {
    console.error(err);
    mostrarAviso("Não foi possível verificar o link. Solicite uma nova recuperação.");
  }
})();

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!linkValidado) return mostrarAviso("Abra o link recebido por e-mail antes de alterar a senha.");
  const nova = document.getElementById("novaSenha").value;
  const confirmacao = document.getElementById("confirmarNovaSenha").value;
  if (nova !== confirmacao) return mostrarAviso("As senhas não são iguais.");
  if (nova.length < 8) return mostrarAviso("A senha precisa ter pelo menos 8 caracteres.");
  const botao = formulario.querySelector('button[type="submit"]');
  botao.disabled = true;
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: nova });
    if (error) return mostrarAviso("Não foi possível atualizar a senha: " + error.message);
    await supabaseClient.auth.signOut();
    formulario.hidden = true;
    mostrarAviso("Senha atualizada! Volte ao login para entrar com a nova senha.", "success");
  } catch (err) {
    console.error(err);
    mostrarAviso("Não foi possível atualizar a senha. Tente novamente.");
  } finally { botao.disabled = false; }
});
