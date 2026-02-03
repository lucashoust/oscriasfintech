let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

/* =======================
   GRÁFICO
======================= */
const ctx = document.getElementById("grafico");
const grafico = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Investido", "Recebido"],
    datasets: [{
      data: [0, 0],
      backgroundColor: ["#7a3cff", "#2ecc71"]
    }]
  }
});

/* =======================
   SALVAR CLIENTE
======================= */
function salvarCliente() {
  const nome = nomeInput().trim();
  const valor = parseFloat(valorInput());
  const juros = parseFloat(jurosInput());
  const tipo = tipoInput();
  const parcelasQtd = tipo === "fixo" ? 1 : parseInt(parcelasInput());

  if (!nome || isNaN(valor) || isNaN(juros) || isNaN(parcelasQtd) || parcelasQtd <= 0) {
    alert("Preencha corretamente.");
    return;
  }

  if (clientes.find(c => c.nome === nome)) {
    alert("Cliente já existe.");
    return;
  }

  const total = valor * (1 + juros / 100);
  const valorParcela = total / parcelasQtd;

  let parcelas = [];
  let hoje = new Date();

  for (let i = 1; i <= parcelasQtd; i++) {
    let venc = new Date(hoje);
    tipo === "semanal"
      ? venc.setDate(venc.getDate() + 7 * i)
      : venc.setMonth(venc.getMonth() + i);

    parcelas.push({
      valor: valorParcela,
      vencimento: venc,
      paga: false
    });
  }

  clientes.push({ nome, valor, total, parcelas });
  salvar();
  limpar();
}

/* =======================
   STATUS
======================= */
function status(cliente) {
  const hoje = new Date();

  if (cliente.parcelas.every(p => p.paga)) return "quitado";
  if (cliente.parcelas.some(p => !p.paga && new Date(p.vencimento) < hoje)) return "atrasado";
  return "emdia";
}

/* =======================
   RENDER (AQUI MOSTRA PARCELAS PENDENTES)
======================= */
function render() {
  let investido = 0;
  let recebido = 0;
  clientesDiv().innerHTML = "";

  clientes.forEach(c => {
    investido += c.valor;
    c.parcelas.forEach(p => p.paga && (recebido += p.valor));

    const s = status(c);

    // parcelas pendentes
    const pendentes = c.parcelas
      .map((p, i) => ({ ...p, num: i + 1 }))
      .filter(p => !p.paga);

    let htmlPendentes = "";

    if (pendentes.length > 0) {
      htmlPendentes = `
        <p><strong>📌 Parcelas Pendentes:</strong></p>
        ${pendentes.map(p => `
          <p style="font-size:13px;opacity:.85">
            • Parcela ${p.num} – R$ ${p.valor.toFixed(2)} – vence em ${new Date(p.vencimento).toLocaleDateString()}
          </p>
        `).join("")}
      `;
    } else {
      htmlPendentes = `<p style="color:#7a3cff;font-weight:bold">✔ Dívida quitada</p>`;
    }

    const div = document.createElement("div");
    div.className = `card ${s}`;

    div.innerHTML = `
      <h3>${c.nome}</h3>

      <p>Status: ${
        s === "quitado" ? "🟣 Quitado" :
        s === "atrasado" ? "🔴 Atrasado" : "🟢 Em dia"
      }</p>

      <p>Emprestado: R$ ${c.valor.toFixed(2)}</p>
      <p>Total da Dívida: R$ ${c.total.toFixed(2)}</p>

      ${htmlPendentes}

      ${
        s !== "quitado"
          ? `<button onclick="pagar('${c.nome}')">Pagar próxima parcela</button>`
          : ""
      }

      <button onclick="pdf('${c.nome}')">📄 PDF</button>
      <button class="secundario" onclick="excluir('${c.nome}')">Excluir</button>
    `;

    clientesDiv().appendChild(div);
  });

  totalInvestido().innerText = `R$ ${investido.toFixed(2)}`;
  totalRecebido().innerText = `R$ ${recebido.toFixed(2)}`;
  lucro().innerText = `R$ ${(recebido - investido).toFixed(2)}`;

  grafico.data.datasets[0].data = [investido, recebido];
  grafico.update();
}

/* =======================
   PAGAR PARCELA (COM TRAVA)
======================= */
function pagar(nome) {
  const cliente = clientes.find(c => c.nome === nome);
  if (!cliente) return;

  const parcela = cliente.parcelas.find(p => !p.paga);
  if (!parcela) {
    alert("Dívida já quitada.");
    return;
  }

  parcela.paga = true;
  salvar();
}

/* =======================
   PDF
======================= */
function pdf(nome) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const c = clientes.find(c => c.nome === nome);
  let y = 15;

  doc.text("Fintech dos Crias", 10, y);
  y += 10;
  doc.text(`Cliente: ${c.nome}`, 10, y);
  y += 10;

  c.parcelas.forEach((p, i) => {
    doc.text(
      `${i + 1} - R$ ${p.valor.toFixed(2)} - ${p.paga ? "Paga" : "Pendente"}`,
      10,
      y
    );
    y += 7;
  });

  doc.save(`cliente_${c.nome}.pdf`);
}

/* =======================
   EXCLUIR
======================= */
function excluir(nome) {
  clientes = clientes.filter(c => c.nome !== nome);
  salvar();
}

/* =======================
   SALVAR / LIMPAR
======================= */
function salvar() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
  render();
}

function limpar() {
  nomeInput("");
  valorInput("");
  jurosInput("");
  parcelasInput("");
}

/* =======================
   HELPERS
======================= */
const nomeInput = v => v !== undefined ? document.getElementById("nome").value = v : document.getElementById("nome").value;
const valorInput = v => v !== undefined ? document.getElementById("valor").value = v : document.getElementById("valor").value;
const jurosInput = v => v !== undefined ? document.getElementById("juros").value = v : document.getElementById("juros").value;
const parcelasInput = v => v !== undefined ? document.getElementById("parcelas").value = v : document.getElementById("parcelas").value;

const tipoInput = () => document.getElementById("tipo").value;
const clientesDiv = () => document.getElementById("clientes");
const totalInvestido = () => document.getElementById("totalInvestido");
const totalRecebido = () => document.getElementById("totalRecebido");
const lucro = () => document.getElementById("lucroLiquido");

/* =======================
   INIT
======================= */
render();
