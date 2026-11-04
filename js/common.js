window.AppUtils = {
  calcularEvolucao(valorInicial, valorAtual) {
    if (valorInicial === 0) return valorAtual === 0 ? 0 : null;
    return ((valorInicial - valorAtual) / valorInicial) * 100;
  },

  formatarPercentual(valor) {
    return valor.toFixed(2).replace(".", ",") + "%";
  },

  formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  },

  preencherCard(valorId, detalheId, valorInicial, valorAtual) {
    const valorEl = document.getElementById(valorId);
    const detalheEl = document.getElementById(detalheId);
    if (!valorEl || !detalheEl) return;

    const percentual = this.calcularEvolucao(valorInicial, valorAtual);
    valorEl.classList.remove("melhora", "piora", "neutro");

    if (percentual === null) {
      valorEl.textContent = "Não calculável";
      valorEl.classList.add("neutro");
    } else if (percentual > 0) {
      valorEl.textContent = "↓ " + this.formatarPercentual(percentual);
      valorEl.classList.add("melhora");
    } else if (percentual < 0) {
      valorEl.textContent = "↑ " + this.formatarPercentual(Math.abs(percentual));
      valorEl.classList.add("piora");
    } else {
      valorEl.textContent = "0,0% — sem alteração";
      valorEl.classList.add("neutro");
    }

    detalheEl.textContent = `De ${valorInicial} notas para ${valorAtual} notas`;
  },

  // Estima entradas e conclusões a partir das variações líquidas entre medições.
  // Só equivale ao movimento real se não houver entradas e conclusões simultâneas
  // no mesmo intervalo. Para aferição exata, registrar entradas/conclusões separadas.
  calcularMetaConclusao(registros, meta = 85) {
    if (!registros.length) return null;
    const totais = registros.map(r => Number(r.amarela) + Number(r.vermelha) + Number(r.nd));
    const inicial = totais[0];
    let entradasEstimadas = 0;
    let conclusoesEstimadas = 0;
    for (let i = 1; i < totais.length; i++) {
      const variacao = totais[i] - totais[i - 1];
      if (variacao > 0) entradasEstimadas += variacao;
      if (variacao < 0) conclusoesEstimadas += -variacao;
    }
    const totalAcumulado = inicial + entradasEstimadas;
    const percentualConcluido = totalAcumulado > 0 ? conclusoesEstimadas / totalAcumulado * 100 : null;
    return {
      inicial, atual: totais.at(-1), entradasEstimadas, conclusoesEstimadas,
      totalAcumulado, percentualConcluido, meta,
      faltam: percentualConcluido === null ? null : Math.max(0, meta - percentualConcluido)
    };
  },

  preencherCardMeta(registros) {
    const valorEl = document.getElementById("evolucaoValor");
    const detalheEl = document.getElementById("evolucaoDetalhe");
    if (!valorEl || !detalheEl) return;
    const dados = this.calcularMetaConclusao(registros);
    valorEl.classList.remove("melhora", "piora", "neutro");
    if (!dados || dados.faltam === null) {
      valorEl.textContent = "Não calculável";
      valorEl.classList.add("neutro");
      detalheEl.textContent = "Sem total acumulado para calcular a meta.";
      return;
    }
    valorEl.textContent = this.formatarPercentual(dados.faltam);
    valorEl.classList.add(dados.faltam === 0 ? "melhora" : "neutro");
    detalheEl.textContent = "";
  },

  configuracaoPadraoCards: {
    geral: { titulo: "Meta", complemento: "para atingir a meta de 85%" },
    amarela: { titulo: "Redução Notas Amarelas", complemento: "" },
    vermelha: { titulo: "Redução Notas Vermelhas", complemento: "" },
    nd: { titulo: "Redução Notas ND", complemento: "" }
  },

  configurarCards(configuracoes = {}) {
    for (const [chave, padrao] of Object.entries(this.configuracaoPadraoCards)) {
      const card = document.querySelector(`.evolucao-card.${chave}`);
      if (!card) continue;
      const dados = configuracoes[chave] || padrao;
      card.querySelector(".evolucao-titulo").textContent = dados.titulo;
      const complementoEl = card.querySelector(".evolucao-complemento");
      if (complementoEl) {
        complementoEl.textContent = dados.complemento || "";
        complementoEl.hidden = !dados.complemento;
      }
    }
  },

  async carregarConfiguracaoCards() {
    const { data, error } = await window.supabaseClient
      .from("dashboard_card_config")
      .select("card_key,titulo,complemento");
    if (error) throw error;
    const configuracoes = {};
    for (const item of data || []) {
      if (!this.configuracaoPadraoCards[item.card_key]) continue;
      configuracoes[item.card_key] = {
        titulo: item.titulo,
        complemento: item.complemento
      };
    }
    this.configurarCards(configuracoes);
    return configuracoes;
  },

  async carregarRegistros() {
    const { data, error } = await window.supabaseClient
      .from("tendencia_notas")
      .select("id,data,amarela,vermelha,nd")
      .order("data", { ascending: true });
    if (error) throw error;
    return data || [];
  }
};
