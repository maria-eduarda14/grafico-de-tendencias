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

  async carregarRegistros() {
    const { data, error } = await window.supabaseClient
      .from("tendencia_notas")
      .select("id,data,amarela,vermelha,nd")
      .order("data", { ascending: true });
    if (error) throw error;
    return data || [];
  }
};
