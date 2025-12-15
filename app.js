const state = { tasks: [], filters: { q: "", status: "todas", entrada: "todos", tipo: "" }, settings: { pbUrl: "" } }
const formatBRL = v => (v === null || v === undefined || v === "") ? "" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const todayStr = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function saveLocal() { localStorage.setItem("fl_tasks", JSON.stringify(state.tasks)) }
function loadLocal() { const s = localStorage.getItem("fl_tasks"); state.tasks = s ? JSON.parse(s) : [] }
function saveSettings() { localStorage.setItem("fl_settings", JSON.stringify(state.settings)) }
function loadSettings() { const s = localStorage.getItem("fl_settings"); if (s) { try { state.settings = { ...state.settings, ...JSON.parse(s) } } catch {} } }
const isRemote = () => !!state.settings.pbUrl

async function pbList() {
  const url = `${state.settings.pbUrl}/api/collections/tasks/records?perPage=200`
  const r = await fetch(url)
  const j = await r.json()
  const items = j.items || j || []
  state.tasks = items.map(mapPbToTask)
}

function mapPbToTask(r) {
  return {
    id: r.id || uid(),
    pbId: r.id || null,
    cliente: r.cliente || "",
    detalhes: r.detalhes || "",
    tipoProduto: r.tipoProduto || "",
    valor: r.valor ?? null,
    deuEntrada: !!r.deuEntrada,
    concluida: !!r.concluida,
    dataPrevista: r.dataPrevista || "",
    dataExecucao: r.dataExecucao || "",
    dataCriacao: r.dataCriacao || todayStr(),
  }
}

async function pbCreate(t) {
  const url = `${state.settings.pbUrl}/api/collections/tasks/records`
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente: t.cliente, detalhes: t.detalhes, tipoProduto: t.tipoProduto, valor: t.valor ?? null, deuEntrada: !!t.deuEntrada, concluida: !!t.concluida, dataPrevista: t.dataPrevista || "", dataExecucao: t.dataExecucao || "", dataCriacao: t.dataCriacao || todayStr() }) })
  const j = await r.json()
  return mapPbToTask(j)
}

async function pbUpdate(t) {
  if (!t.pbId) return
  const url = `${state.settings.pbUrl}/api/collections/tasks/records/${t.pbId}`
  await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente: t.cliente, detalhes: t.detalhes, tipoProduto: t.tipoProduto, valor: t.valor ?? null, deuEntrada: !!t.deuEntrada, concluida: !!t.concluida, dataPrevista: t.dataPrevista || "", dataExecucao: t.dataExecucao || "", dataCriacao: t.dataCriacao || todayStr() }) })
}

async function pbDelete(t) {
  if (!t.pbId) return
  const url = `${state.settings.pbUrl}/api/collections/tasks/records/${t.pbId}`
  await fetch(url, { method: "DELETE" })
}

function seedIfEmpty() {
  if (localStorage.getItem("fl_tasks_initialized")) return
  if (state.tasks.length) return
  const now = todayStr()
  const seeds = [
    { cliente: "X3", detalhes: "30 cardápios", tipoProduto: "Cardápios" },
    { cliente: "7 Ondas", detalhes: "50 cardápios e 17 números grandes", tipoProduto: "Cardápios, Números grandes" },
    { cliente: "Marcelo Onda", detalhes: "14 números", tipoProduto: "Números" },
    { cliente: "Michelle Tropicalia", detalhes: "40 cardápios", tipoProduto: "Cardápios", valor: 100, deuEntrada: true },
    { cliente: "Lourdes Millenium", detalhes: "25 cardápios", tipoProduto: "Cardápios" },
    { cliente: "Tropical", detalhes: "Números 1 ao 20 grande", tipoProduto: "Números grandes" },
    { cliente: "Verde Mar", detalhes: "50 cardápios e 50 números grandes", tipoProduto: "Cardápios, Números grandes" },
    { cliente: "Suzana", detalhes: "50 cardápios e 50 nº grande", tipoProduto: "Cardápios, Números grandes" },
    { cliente: "Sol de Verão (Garotos)", detalhes: "30 cardápios", tipoProduto: "Cardápios" },
    { cliente: "Guarujas", detalhes: "20 cardápios", tipoProduto: "Cardápios" },
    { cliente: "Agua na Boca", detalhes: "10 cardápios", tipoProduto: "Cardápios" },
    { cliente: "Simone Pitangueiras", detalhes: "22 cardápios e 20 números pequenos", tipoProduto: "Cardápios, Números pequenos" }
  ].map(t => ({ id: uid(), cliente: t.cliente, detalhes: t.detalhes, tipoProduto: t.tipoProduto || "", valor: t.valor || null, deuEntrada: !!t.deuEntrada, concluida: false, dataPrevista: "", dataExecucao: "", dataCriacao: now }))
  state.tasks = seeds
  saveLocal()
  localStorage.setItem("fl_tasks_initialized", "1")
}

function applyFilters(tasks) {
  const f = state.filters
  return tasks.filter(t => {
    const q = f.q.trim().toLowerCase()
    const okQ = !q || (t.cliente + " " + t.detalhes + " " + (t.tipoProduto || "")).toLowerCase().includes(q)
    const okStatus = f.status === "todas" ? true : f.status === "afazer" ? !t.concluida : t.concluida
    const okEntrada = f.entrada === "todos" ? true : f.entrada === "sim" ? t.deuEntrada : !t.deuEntrada
    const okTipo = !f.tipo.trim() || (t.tipoProduto || "").toLowerCase().includes(f.tipo.trim().toLowerCase())
    return okQ && okStatus && okEntrada && okTipo
  })
}

function stats() {
  const total = state.tasks.length
  const concluidas = state.tasks.filter(t => t.concluida).length
  const afazer = total - concluidas
  const entrada = state.tasks.filter(t => t.deuEntrada).length
  return { total, concluidas, afazer, entrada }
}

function renderStats() {
  const s = stats()
  document.getElementById("statsTotal").textContent = `Total: ${s.total}`
  document.getElementById("statsAfazer").textContent = `A fazer: ${s.afazer}`
  document.getElementById("statsConcluidas").textContent = `Concluídas: ${s.concluidas}`
  document.getElementById("statsEntrada").textContent = `Entrada: ${s.entrada}`
}

function render() {
  const list = document.getElementById("taskList")
  list.innerHTML = ""
  const items = applyFilters([...state.tasks].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao)))
  items.forEach(t => {
    const el = document.createElement("div")
    el.className = "task"

    const left = document.createElement("div")
    left.className = "task-left"
    const entradaToggle = document.createElement("label")
    entradaToggle.className = "toggle"
    const entradaCb = document.createElement("input")
    entradaCb.type = "checkbox"
    entradaCb.checked = !!t.deuEntrada
    entradaCb.addEventListener("change", async () => { t.deuEntrada = entradaCb.checked; if (isRemote()) { await pbUpdate(t) } else { saveLocal() } renderStats() })
    entradaToggle.appendChild(entradaCb)
    const entradaText = document.createElement("span")
    entradaText.textContent = "Entrada"
    entradaToggle.appendChild(entradaText)

    const feitaToggle = document.createElement("label")
    feitaToggle.className = "toggle"
    const feitaCb = document.createElement("input")
    feitaCb.type = "checkbox"
    feitaCb.checked = !!t.concluida
    feitaCb.addEventListener("change", async () => { t.concluida = feitaCb.checked; if (t.concluida && !t.dataExecucao) t.dataExecucao = todayStr(); if (isRemote()) { await pbUpdate(t) } else { saveLocal() } renderStats(); render() })
    feitaToggle.appendChild(feitaCb)
    const feitaText = document.createElement("span")
    feitaText.textContent = "Feita"
    feitaToggle.appendChild(feitaText)

    left.appendChild(entradaToggle)
    left.appendChild(feitaToggle)

    const middle = document.createElement("div")
    middle.className = "task-middle"
    const title = document.createElement("div")
    title.className = "task-title"
    title.textContent = t.cliente
    const details = document.createElement("div")
    details.className = "task-details"
    details.textContent = t.detalhes
    const chips = document.createElement("div")
    chips.className = "chips"
    ;(t.tipoProduto || "").split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
      const chip = document.createElement("span")
      chip.className = "chip"
      chip.textContent = s
      chips.appendChild(chip)
    })
    if (t.valor !== null && t.valor !== undefined && t.valor !== "") {
      const chip = document.createElement("span")
      chip.className = "chip"
      chip.textContent = formatBRL(t.valor)
      chips.appendChild(chip)
    }
    middle.appendChild(title)
    middle.appendChild(details)
    middle.appendChild(chips)

    const right = document.createElement("div")
    right.className = "task-right"
    const clienteInput = document.createElement("input")
    clienteInput.value = t.cliente
    clienteInput.placeholder = "Cliente"
    clienteInput.addEventListener("change", async () => { t.cliente = clienteInput.value.trim(); if (isRemote()) { await pbUpdate(t) } else { saveLocal() } render() })

    const detalhesInput = document.createElement("input")
    detalhesInput.value = t.detalhes
    detalhesInput.placeholder = "Detalhes"
    detalhesInput.addEventListener("change", async () => { t.detalhes = detalhesInput.value.trim(); if (isRemote()) { await pbUpdate(t) } else { saveLocal() } render() })

    const tipoInput = document.createElement("input")
    tipoInput.value = t.tipoProduto || ""
    tipoInput.placeholder = "Tipo"
    tipoInput.addEventListener("change", async () => { t.tipoProduto = tipoInput.value.trim(); if (isRemote()) { await pbUpdate(t) } else { saveLocal() } render() })

    const valorInput = document.createElement("input")
    valorInput.type = "number"
    valorInput.step = "0.01"
    valorInput.min = "0"
    valorInput.placeholder = "Valor"
    valorInput.value = t.valor ?? ""
    valorInput.addEventListener("change", async () => { const v = valorInput.value === "" ? null : Number(valorInput.value); t.valor = isNaN(v) ? null : v; if (isRemote()) { await pbUpdate(t) } else { saveLocal() } render() })

    const previstaInput = document.createElement("input")
    previstaInput.type = "date"
    previstaInput.placeholder = "Prevista"
    previstaInput.value = t.dataPrevista || ""
    previstaInput.addEventListener("change", async () => { t.dataPrevista = previstaInput.value; if (isRemote()) { await pbUpdate(t) } else { saveLocal() } })

    const execucaoInput = document.createElement("input")
    execucaoInput.type = "date"
    execucaoInput.placeholder = "Execução"
    execucaoInput.value = t.dataExecucao || ""
    execucaoInput.addEventListener("change", async () => { t.dataExecucao = execucaoInput.value; if (isRemote()) { await pbUpdate(t) } else { saveLocal() } })

    right.appendChild(clienteInput)
    right.appendChild(detalhesInput)
    right.appendChild(tipoInput)
    right.appendChild(valorInput)
    right.appendChild(previstaInput)
    right.appendChild(execucaoInput)

    const actions = document.createElement("div")
    actions.className = "task-actions"
    const delBtn = document.createElement("button")
    delBtn.textContent = "Excluir"
    delBtn.addEventListener("click", async () => { const old = t; state.tasks = state.tasks.filter(x => x.id !== t.id); if (isRemote()) { await pbDelete(old) } else { saveLocal() } renderStats(); render() })
    actions.appendChild(delBtn)

    el.appendChild(left)
    el.appendChild(middle)
    el.appendChild(right)
    el.appendChild(actions)
    list.appendChild(el)
  })
  renderStats()
}

function bindUI() {
  const form = document.getElementById("quickForm")
  form.addEventListener("submit", e => {
    e.preventDefault()
    const cliente = document.getElementById("clienteInput").value.trim()
    const detalhes = document.getElementById("detalhesInput").value.trim()
    const tipoProduto = document.getElementById("tipoInput").value.trim()
    const valorRaw = document.getElementById("valorInput").value
    const dataPrevista = document.getElementById("previstaInput").value
    const deuEntrada = document.getElementById("entradaInput").checked
    if (!cliente || !detalhes) return
    const t = { id: uid(), cliente, detalhes, tipoProduto, valor: valorRaw === "" ? null : Number(valorRaw), deuEntrada, concluida: false, dataPrevista, dataExecucao: "", dataCriacao: todayStr() }
    if (isRemote()) {
      pbCreate(t).then(newT => { state.tasks.unshift(newT); render() })
    } else {
      state.tasks.unshift(t)
      saveLocal()
      render()
    }
    render()
    form.reset()
  })
  document.getElementById("clearFormBtn").addEventListener("click", () => document.getElementById("quickForm").reset())

  const search = document.getElementById("searchInput")
  search.addEventListener("input", () => { state.filters.q = search.value; render() })
  const statusFilter = document.getElementById("statusFilter")
  statusFilter.addEventListener("change", () => { state.filters.status = statusFilter.value; render() })
  const entradaFilter = document.getElementById("entradaFilter")
  entradaFilter.addEventListener("change", () => { state.filters.entrada = entradaFilter.value; render() })
  const tipoFilter = document.getElementById("tipoFilter")
  tipoFilter.addEventListener("input", () => { state.filters.tipo = tipoFilter.value; render() })
  document.getElementById("clearFiltersBtn").addEventListener("click", () => { state.filters = { q: "", status: "todas", entrada: "todos", tipo: "" }; document.getElementById("searchInput").value = ""; document.getElementById("statusFilter").value = "todas"; document.getElementById("entradaFilter").value = "todos"; document.getElementById("tipoFilter").value = ""; render() })

  const exportBtn = document.getElementById("exportBtn")
  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tarefas-fl-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  const importBtn = document.getElementById("importBtn")
  const importFile = document.getElementById("importFile")
  importBtn.addEventListener("click", () => importFile.click())
  importFile.addEventListener("change", () => {
    const file = importFile.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data)) return
        const imported = data.map(d => ({ id: d.id || uid(), cliente: d.cliente || "", detalhes: d.detalhes || "", tipoProduto: d.tipoProduto || "", valor: d.valor ?? null, deuEntrada: !!d.deuEntrada, concluida: !!d.concluida, dataPrevista: d.dataPrevista || "", dataExecucao: d.dataExecucao || "", dataCriacao: d.dataCriacao || todayStr() }))
        if (isRemote()) {
          Promise.all(imported.map(pbCreate)).then(created => { state.tasks = created; render() })
        } else {
          state.tasks = imported
          saveLocal()
          render()
        }
      } catch {}
    }
    reader.readAsText(file)
    importFile.value = ""
  })

  const connectPBBtn = document.getElementById("connectPBBtn")
  const useLocalBtn = document.getElementById("useLocalBtn")
  const pbUrlInput = document.getElementById("pbUrlInput")
  pbUrlInput.value = state.settings.pbUrl || ""
  connectPBBtn.addEventListener("click", async () => {
    const url = pbUrlInput.value.trim()
    if (!url) return
    state.settings.pbUrl = url
    saveSettings()
    await pbList().catch(() => {})
    render()
  })
  useLocalBtn.addEventListener("click", () => {
    state.settings.pbUrl = ""
    saveSettings()
    loadLocal()
    render()
  })
}

function init() {
  loadSettings()
  if (isRemote()) {
    pbList().then(() => render()).catch(() => { loadLocal(); seedIfEmpty(); render() })
  } else {
    loadLocal()
    seedIfEmpty()
  }
  bindUI()
}

document.addEventListener("DOMContentLoaded", init)
