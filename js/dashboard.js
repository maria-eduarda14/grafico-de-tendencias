let graficoTendencia = null;

async function iniciarDashboard() {
  try {
    const registros = await AppUtils.carregarRegistros();
    renderizarDashboard(registros);
  } catch (err) {
    console.error(err);
    const alvo = document.getElementById("dashboardErro");
    if (alvo) {
      alvo.textContent = "Não foi possível carregar os dados. Verifique a configuração do Supabase e as políticas do banco.";
      alvo.classList.add("show", "error");
    }
  }
}

function renderizarDashboard(registros) {
  if (!registros.length) {
    const vazio = document.getElementById("semDados");
    if (vazio) vazio.style.display = "block";
    preencherCardsVazios();
    return;
  }

  const vazio = document.getElementById("semDados");
  if (vazio) vazio.style.display = "none";

  const datas = registros.map(r => AppUtils.formatarDataBR(r.data));
  const amarelas = registros.map(r => Number(r.amarela));
  const vermelhas = registros.map(r => Number(r.vermelha));
  const nd = registros.map(r => Number(r.nd));
  const totais = registros.map(r => Number(r.amarela) + Number(r.vermelha) + Number(r.nd));

  AppUtils.preencherCard("evolucaoValor", "evolucaoDetalhe", totais[0], totais.at(-1));
  AppUtils.preencherCard("evolucaoAmarelaValor", "evolucaoAmarelaDetalhe", amarelas[0], amarelas.at(-1));
  AppUtils.preencherCard("evolucaoVermelhaValor", "evolucaoVermelhaDetalhe", vermelhas[0], vermelhas.at(-1));
  AppUtils.preencherCard("evolucaoNdValor", "evolucaoNdDetalhe", nd[0], nd.at(-1));

  const ctx = document.getElementById("graficoTendencia");
  if (!ctx) return;
  if (graficoTendencia) graficoTendencia.destroy();

  graficoTendencia = new Chart(ctx, {
    type: "bar",
    data: {
      labels: datas,
      datasets: [
        {
          type: "line",
          label: "Linha de Tendência",
          data: totais,
          borderColor: "#e10000",
          backgroundColor: "#e10000",
          borderWidth: 3,
          borderDash: [8, 6],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#e10000",
          pointBorderColor: "#e10000",
          tension: 0.15,
          fill: false,
          order: 0,
          datalabels: {
            display: true, align: "top", anchor: "end", offset: 3,
            color: "#1f2937", font: { size: 13, weight: "bold" },
            formatter: value => value
          }
        },
        criarDatasetBarra("Amarela", amarelas, "#f4c20d"),
        criarDatasetBarra("Vermelha", vermelhas, "#f0352b"),
        criarDatasetBarra("ND", nd, "#879295")
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 20, right: 10, left: 0, bottom: 0 } },
      plugins: {
        legend: {
          position: "top", align: "center",
          labels: { boxWidth: 36, boxHeight: 14, padding: 18, font: { size: 14 }, color: "#4b5563" }
        },
        tooltip: {
          callbacks: {
            footer(items) { return "Total: " + totais[items[0].dataIndex]; }
          }
        }
      },
      scales: {
        x: {
          grid: { display: true, color: "rgba(90,100,110,.16)" },
          ticks: { color: "#4b5563", font: { size: 12 }, maxRotation: 0, minRotation: 0 },
          title: { display: true, text: "Data", color: "#374151", font: { size: 15 } },
          border: { color: "#aeb5bd" }
        },
        y: {
          beginAtZero: true, min: 0, max: 500,
          ticks: { stepSize: 100, color: "#4b5563", font: { size: 12 } },
          grid: { color: "rgba(90,100,110,.16)" },
          title: { display: true, text: "Quantidade de notas", color: "#374151", font: { size: 15 } },
          border: { color: "#aeb5bd" }
        }
      }
    }
  });
}

function criarDatasetBarra(label, data, cor) {
  return {
    label, data,
    backgroundColor: cor,
    borderColor: cor,
    borderWidth: 1,
    borderRadius: 2,
    categoryPercentage: 0.72,
    barPercentage: 0.88,
    order: 1,
    datalabels: {
      display: true, anchor: "end", align: "top",
      color: "#1f2937", font: { size: 12, weight: "bold" },
      formatter: value => value
    }
  };
}

function preencherCardsVazios() {
  [
    ["evolucaoValor", "evolucaoDetalhe"],
    ["evolucaoAmarelaValor", "evolucaoAmarelaDetalhe"],
    ["evolucaoVermelhaValor", "evolucaoVermelhaDetalhe"],
    ["evolucaoNdValor", "evolucaoNdDetalhe"]
  ].forEach(([v,d]) => {
    const ve = document.getElementById(v); const de = document.getElementById(d);
    if (ve) { ve.textContent = "--"; ve.className = "evolucao-valor neutro"; }
    if (de) de.textContent = "Sem dados cadastrados";
  });
}

document.addEventListener("DOMContentLoaded", iniciarDashboard);
