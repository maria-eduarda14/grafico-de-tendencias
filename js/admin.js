let registros = [];
let graficoAdmin = null;

const modal = document.getElementById("modalRegistro");
const form = document.getElementById("registroForm");
const aviso = document.getElementById("adminAviso");
const modalAviso = document.getElementById("modalAviso");

function mostrarAviso(msg, tipo="success") {
  aviso.textContent = msg;
  aviso.className = `notice show ${tipo}`;
  setTimeout(() => aviso.className = "notice", 3500);
}

async function protegerPagina() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return location.replace("login.html");
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return location.replace("login.html");
  }

  const nomeUsuario =
    user.user_metadata?.display_name ||
    user.email;

  document.getElementById("nomeUsuario").textContent = nomeUsuario;
  
  const { data: isAdmin, error } = await supabaseClient.rpc("is_admin");
  if (error || !isAdmin) {
    await supabaseClient.auth.signOut();
    return location.replace("login.html");
  }
  await recarregar();
  try {
    await AppUtils.carregarConfiguracaoCards();
    configuracoesCards = await buscarConfiguracoesCards();
  } catch (erro) {
    console.warn(erro);
    mostrarAviso("Não foi possível carregar a configuração dos cards. Execute a migração SQL do projeto.", "error");
  }
}

async function recarregar() {
  try {
    registros = await AppUtils.carregarRegistros();
    renderTabela();
    renderPreview();
  } catch (e) {
    console.error(e);
    mostrarAviso("Erro ao carregar os dados.", "error");
  }
}

function renderTabela() {
  const tbody = document.getElementById("tabelaRegistros");
  const vazio = document.getElementById("tabelaVazia");
  tbody.innerHTML = "";
  vazio.style.display = registros.length ? "none" : "block";

  registros.forEach(r => {
    const tr = document.createElement("tr");
    const total = Number(r.amarela) + Number(r.vermelha) + Number(r.nd);
    tr.innerHTML = `
      <td>${AppUtils.formatarDataBR(r.data)}</td>
      <td>${r.amarela}</td>
      <td>${r.vermelha}</td>
      <td>${r.nd}</td>
      <td><strong>${total}</strong></td>
      <td class="actions-cell">
        <button class="icon-btn" title="Editar" data-edit="${r.id}">✏️</button>
        <button class="icon-btn" title="Excluir" data-delete="${r.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => abrirEdicao(btn.dataset.edit)));
  tbody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => excluirRegistro(btn.dataset.delete)));
}

function renderPreview() {
  if (!registros.length) {
    if (graficoAdmin) { graficoAdmin.destroy(); graficoAdmin = null; }
    [
      ["evolucaoValor","evolucaoDetalhe"], ["evolucaoAmarelaValor","evolucaoAmarelaDetalhe"],
      ["evolucaoVermelhaValor","evolucaoVermelhaDetalhe"], ["evolucaoNdValor","evolucaoNdDetalhe"]
    ].forEach(([v,d]) => { document.getElementById(v).textContent="--"; document.getElementById(d).textContent="Sem dados"; });
    return;
  }

  const datas = registros.map(r => AppUtils.formatarDataBR(r.data));
  const amarelas = registros.map(r => Number(r.amarela));
  const vermelhas = registros.map(r => Number(r.vermelha));
  const nd = registros.map(r => Number(r.nd));
  const totais = registros.map(r => Number(r.amarela)+Number(r.vermelha)+Number(r.nd));

  AppUtils.preencherCardMeta(registros);
  AppUtils.preencherCard("evolucaoAmarelaValor","evolucaoAmarelaDetalhe",amarelas[0],amarelas.at(-1));
  AppUtils.preencherCard("evolucaoVermelhaValor","evolucaoVermelhaDetalhe",vermelhas[0],vermelhas.at(-1));
  AppUtils.preencherCard("evolucaoNdValor","evolucaoNdDetalhe",nd[0],nd.at(-1));

  if (graficoAdmin) graficoAdmin.destroy();
  graficoAdmin = new Chart(document.getElementById("graficoTendencia"), {
    type:"bar",
    data:{ labels:datas, datasets:[
      { type:"line", label:"Linha de Tendência", data:totais, borderColor:"#e10000", backgroundColor:"#e10000", borderWidth:3, borderDash:[8,6], pointRadius:4, tension:.15, fill:false, order:0,
        datalabels:{display:true,align:"top",anchor:"end",offset:3,color:"#1f2937",font:{size:13,weight:"bold"}} },
      barra("Amarela",amarelas,"#f4c20d"), barra("Vermelha",vermelhas,"#f0352b"), barra("ND",nd,"#879295")
    ]},
    options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"top"},tooltip:{callbacks:{footer(items){return "Total: "+totais[items[0].dataIndex];}}}},
      scales:{ x:{title:{display:true,text:"Data"}}, y:{beginAtZero:true,min:0,max:500,ticks:{stepSize:100},title:{display:true,text:"Quantidade de notas"}} }
    }
  });
}

function barra(label,data,cor) {
  return { label,data,backgroundColor:cor,borderColor:cor,borderWidth:1,borderRadius:2,categoryPercentage:.72,barPercentage:.88,order:1,
    datalabels:{display:true,anchor:"end",align:"top",color:"#1f2937",font:{size:12,weight:"bold"}} };
}

function abrirNovo() {
  document.getElementById("modalTitulo").textContent = "Nova medição";
  document.getElementById("registroId").value = "";
  form.reset();
  modalAviso.className = "notice";
  modal.classList.add("open");
}

function abrirEdicao(id, focoCampo) {
  const r = registros.find(x => String(x.id) === String(id));
  if (!r) return;
  document.getElementById("modalTitulo").textContent = "Editar medição";
  document.getElementById("registroId").value = r.id;
  document.getElementById("data").value = r.data;
  document.getElementById("amarela").value = r.amarela;
  document.getElementById("vermelha").value = r.vermelha;
  document.getElementById("nd").value = r.nd;
  modalAviso.className = "notice";
  modal.classList.add("open");
  if (focoCampo) setTimeout(() => document.getElementById(focoCampo)?.focus(), 50);
}

function fecharModal() { modal.classList.remove("open"); }

form.addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("registroId").value;
  const payload = {
    data: document.getElementById("data").value,
    amarela: Number(document.getElementById("amarela").value),
    vermelha: Number(document.getElementById("vermelha").value),
    nd: Number(document.getElementById("nd").value)
  };

  const query = id
    ? supabaseClient.from("tendencia_notas").update(payload).eq("id", id)
    : supabaseClient.from("tendencia_notas").insert(payload);
  const { error } = await query;

  if (error) {
    modalAviso.textContent = error.code === "23505" ? "Já existe uma medição cadastrada para essa data." : "Erro ao salvar: " + error.message;
    modalAviso.className = "notice show error";
    return;
  }

  fecharModal();
  mostrarAviso(id ? "Medição atualizada." : "Medição adicionada.");
  await recarregar();
});

async function excluirRegistro(id) {
  const r = registros.find(x => String(x.id) === String(id));
  if (!r) return;
  if (!confirm(`Excluir a medição de ${AppUtils.formatarDataBR(r.data)}?\n\nIsso alterará o gráfico e os percentuais de evolução.`)) return;
  const { error } = await supabaseClient.from("tendencia_notas").delete().eq("id", id);
  if (error) return mostrarAviso("Erro ao excluir: " + error.message, "error");
  mostrarAviso("Medição excluída.");
  await recarregar();
}

document.getElementById("btnAdicionar").addEventListener("click", abrirNovo);
document.getElementById("btnAdicionarTabela").addEventListener("click", abrirNovo);
document.getElementById("fecharModal").addEventListener("click", fecharModal);
document.getElementById("cancelarModal").addEventListener("click", fecharModal);
modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
document.getElementById("btnSair").addEventListener("click", async () => { await supabaseClient.auth.signOut(); location.href="login.html"; });

// Edição do conteúdo textual dos cards, separada do modal de medições.
let configuracoesCards = {};
const modalCard = document.getElementById("modalCard");
const cardForm = document.getElementById("cardForm");
const cardAviso = document.getElementById("cardAviso");

async function buscarConfiguracoesCards() {
  const { data, error } = await supabaseClient
    .from("dashboard_card_config")
    .select("card_key,titulo,complemento");
  if (error) throw error;
  const resultado = {};
  for (const item of data || []) {
    if (AppUtils.configuracaoPadraoCards[item.card_key]) {
      resultado[item.card_key] = { titulo: item.titulo, complemento: item.complemento };
    }
  }
  return resultado;
}

function abrirEdicaoCard(chave) {
  const padrao = AppUtils.configuracaoPadraoCards[chave];
  if (!padrao) return;
  const valores = configuracoesCards[chave] || padrao;
  document.getElementById("modalCardTitulo").textContent = `Editar card: ${valores.titulo}`;
  document.getElementById("cardChave").value = chave;
  document.getElementById("cardTituloTexto").value = valores.titulo;
  document.getElementById("cardComplementoTexto").value = valores.complemento || "";
  cardAviso.className = "notice";
  modalCard.classList.add("open");
  document.getElementById("cardTituloTexto").focus();
}

function fecharEdicaoCard() { modalCard.classList.remove("open"); }

document.querySelectorAll(".edit-card-btn").forEach(btn => {
  btn.addEventListener("click", () => abrirEdicaoCard(btn.dataset.card));
});
document.getElementById("fecharModalCard").addEventListener("click", fecharEdicaoCard);
document.getElementById("cancelarModalCard").addEventListener("click", fecharEdicaoCard);
modalCard.addEventListener("click", e => { if (e.target === modalCard) fecharEdicaoCard(); });

cardForm.addEventListener("submit", async e => {
  e.preventDefault();
  const chave = document.getElementById("cardChave").value;
  const titulo = document.getElementById("cardTituloTexto").value.trim();
  const complemento = document.getElementById("cardComplementoTexto").value.trim();
  if (!AppUtils.configuracaoPadraoCards[chave] || !titulo) return;
  const salvar = document.getElementById("salvarCard");
  salvar.disabled = true;
  try {
    const { error } = await supabaseClient.from("dashboard_card_config").upsert(
      { card_key: chave, titulo, complemento }, { onConflict: "card_key" }
    );
    if (error) throw error;
    configuracoesCards[chave] = { titulo, complemento };
    AppUtils.configurarCards(configuracoesCards);
    fecharEdicaoCard();
    mostrarAviso("Texto do card atualizado. Os cálculos continuam automáticos.");
  } catch (erro) {
    cardAviso.textContent = "Não foi possível salvar: " + erro.message + ". Confira a migração SQL e as permissões do Supabase.";
    cardAviso.className = "notice show error";
  } finally {
    salvar.disabled = false;
  }
});

protegerPagina();
