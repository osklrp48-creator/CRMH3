import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  MapPin,
  ChevronRight,
  ClipboardList,
  UserPlus,
  Printer,
  Trash2,
  FileSignature,
  UserCog,
  Mail,
  Phone,
} from "lucide-react";

// ---------- Conexão com a API real (backend FastAPI + Postgres) ----------
const API_BASE = "https://crm-h3pharma.onrender.com";

const mapClientFromApi = (c) => ({
  id: c.id,
  name: c.name,
  cnpj: c.cnpj,
  city: c.city || "",
  contact: c.contact || "",
  status: c.status,
});

const mapEquipmentFromApi = (e) => ({
  id: e.id,
  model: e.model,
  brand: e.brand,
  serial: e.serial,
  anvisa: e.anvisa || "",
  status: e.status,
  clientId: e.client_id,
  contractId: e.contract_id,
});

const mapContractFromApi = (k, apiEquipmentList) => ({
  id: k.id,
  clientId: k.client_id,
  equipmentIds: (apiEquipmentList || []).filter((e) => e.contract_id === k.id).map((e) => e.id),
  start: k.start_date,
  end: k.end_date,
  value: k.value,
  status: k.status,
});

const mapOrderFromApi = (o) => ({
  id: o.id,
  clientId: o.client_id,
  clientName: o.client_name,
  type: o.type,
  desc: o.description || "",
  stage: o.stage,
  value: o.value,
  date: o.order_date,
  isLead: o.is_lead,
  responsavelId: o.responsavel_id,
});

const mapCollaboratorFromApi = (u) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  email: u.email,
  phone: u.phone || "",
});

const mapProposalFromApi = (p) => ({
  id: p.id,
  number: p.number,
  city: p.city,
  date: p.proposal_date,
  clientId: p.client_id,
  clientName: p.client_name,
  clientCnpj: p.client_cnpj || "",
  sector: p.sector || "SETOR DE COMPRAS",
  validityDays: p.validity_days || "15",
  deliveryTime: p.delivery_time || "",
  paymentTerms: p.payment_terms || "",
  minFreightSalvador: p.min_freight_salvador || "",
  minFreightOther: p.min_freight_other || "",
  pickupAddress: p.pickup_address || "",
  responsibleName: p.responsible_name || "",
  items: (p.items || []).map((it) => ({
    id: genId("i"),
    desc: it.desc,
    uf: it.uf,
    qty: it.qty,
    unitValue: it.unit_value,
  })),
  total: (p.items || []).reduce((sum, it) => sum + parseFloat(it.qty || 0) * parseFloat(it.unit_value || 0), 0),
});

// ---------- Design tokens ----------
const colors = {
  navy: "#16233D",
  navyLight: "#22335A",
  teal: "#0F6E56",
  tealLight: "#E1F5EE",
  tealDark: "#085041",
  amber: "#BA7517",
  amberLight: "#FAEEDA",
  amberDark: "#633806",
  red: "#A32D2D",
  redLight: "#FCEBEB",
  redDark: "#501313",
  green: "#3B6D11",
  greenLight: "#EAF3DE",
  greenDark: "#173404",
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  ink: "#16233D",
  muted: "#6B7686",
  border: "#E2E6EC",
  h3Green: "#BCE143",
  h3Teal: "#1C5852",
  h3TealDark: "#02453E",
};

// ---------- Mock data ----------
// ---------- Colaboradores ----------
const defaultCollaborators = [
  { id: "u1", name: "Oscar Palmeira", role: "Comercial", email: "oscar.palmeira@h3pharma.com.br", phone: "(71) 99123-4567" },
  { id: "u2", name: "Marina Coutinho", role: "Financeiro", email: "marina.coutinho@h3pharma.com.br", phone: "(71) 99234-5678" },
  { id: "u3", name: "Fábio Andrade", role: "Logística", email: "fabio.andrade@h3pharma.com.br", phone: "(71) 99345-6789" },
  { id: "u4", name: "Juliana Prates", role: "Regulatório / ANVISA", email: "juliana.prates@h3pharma.com.br", phone: "(71) 99456-7890" },
];

const initials = (name) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const defaultClients = [
  { id: "c1", name: "Hospital Vida", cnpj: "12.345.678/0001-90", city: "Salvador, BA", status: "ativo", contact: "Marcia Reis · Compras" },
  { id: "c2", name: "Hospital Nova Aliança", cnpj: "23.456.789/0001-01", city: "Feira de Santana, BA", status: "ativo", contact: "Paulo Andrade · Enfermagem" },
  { id: "c3", name: "RY Atividades Veterinárias", cnpj: "34.567.890/0001-12", city: "Salvador, BA", status: "negociação", contact: "Renata Yamada · Diretoria" },
  { id: "c4", name: "Clínica São Rafael", cnpj: "45.678.901/0001-23", city: "Lauro de Freitas, BA", status: "inadimplente", contact: "João Nascimento · Financeiro" },
  { id: "c5", name: "Hospital Português", cnpj: "56.789.012/0001-34", city: "Salvador, BA", status: "ativo", contact: "Camila Souza · Compras" },
];

const defaultEquipment = [
  { id: "e1", model: "Infusomat Space", brand: "B.Braun", serial: "BB-2201", anvisa: "10345670012", status: "alocado", clientId: "c1" },
  { id: "e2", model: "Bomba de Infusão LF-1400", brand: "Lifemed", serial: "LF-0987", anvisa: "80198760031", status: "alocado", clientId: "c2" },
  { id: "e3", model: "Infusomat Space", brand: "B.Braun", serial: "BB-2202", anvisa: "10345670012", status: "manutenção", clientId: null },
  { id: "e4", model: "Bomba de Infusão LF-1400", brand: "Lifemed", serial: "LF-0988", anvisa: "80198760031", status: "estoque", clientId: null },
  { id: "e5", model: "Infusomat Space", brand: "B.Braun", serial: "BB-2203", anvisa: "10345670012", status: "alocado", clientId: "c4" },
  { id: "e6", model: "Bomba de Infusão LF-1400", brand: "Lifemed", serial: "LF-0989", anvisa: "80198760031", status: "alocado", clientId: "c5" },
];

const defaultContracts = [
  { id: "k1", clientId: "c1", equipmentIds: ["e1"], start: "2025-09-01", end: "2026-09-01", value: 3200, status: "ativo" },
  { id: "k2", clientId: "c2", equipmentIds: ["e2"], start: "2025-06-15", end: "2026-09-15", value: 2850, status: "vencendo" },
  { id: "k3", clientId: "c4", equipmentIds: ["e5"], start: "2025-01-10", end: "2026-01-10", value: 2600, status: "atrasado" },
  { id: "k4", clientId: "c5", equipmentIds: ["e6"], start: "2026-03-01", end: "2027-03-01", value: 3100, status: "ativo" },
];

// Logo H3 Pharma extraída do modelo de proposta enviado
const H3_LOGO = "data:image/png;base64,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";

// ---------- Conversor de valor monetário por extenso (pt-BR) ----------
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function trioPorExtenso(n) {
  if (n === 0) return "";
  if (n === 100) return "cem";
  let partes = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto >= 10 && resto < 20) {
    partes.push(DEZ_A_DEZENOVE[resto - 10]);
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    if (d > 0) partes.push(DEZENAS[d]);
    if (u > 0) partes.push(UNIDADES[u]);
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n) {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1000000);
  const milhares = Math.floor((n % 1000000) / 1000);
  const centenas = n % 1000;
  let partes = [];
  if (milhoes > 0) partes.push(trioPorExtenso(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
  if (milhares > 0) partes.push(trioPorExtenso(milhares) + " mil");
  if (centenas > 0) partes.push(trioPorExtenso(centenas));
  return partes.join(centenas > 0 && (milhoes > 0 || milhares > 0) ? " e " : " ").replace(/  +/g, " ").trim();
}

function valorPorExtenso(valor) {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  const reaisTexto = inteiroPorExtenso(reais) + (reais === 1 ? " real" : " reais");
  if (centavos === 0) return reaisTexto.toUpperCase();
  const centavosTexto = inteiroPorExtenso(centavos) + (centavos === 1 ? " centavo" : " centavos");
  return (reaisTexto + " e " + centavosTexto).toUpperCase();
}

const orderStages = ["novo", "análise", "proposta", "negociação", "fechado"];

const stageLabels = {
  novo: "Novo pedido",
  análise: "Em análise",
  proposta: "Proposta enviada",
  negociação: "Negociação",
  fechado: "Fechado",
};

const defaultOrders = [
  { id: "p1", clientId: "c1", clientName: "Hospital Vida", type: "reposição", desc: "2x Infusomat Space — unidade adicional na UTI", stage: "novo", value: 6400, date: "2026-08-26", isLead: false , responsavelId: "u1" },
  { id: "p2", clientId: "c3", clientName: "RY Atividades Veterinárias", type: "novo cliente", desc: "Locação inicial — 3x bombas de infusão veterinárias", stage: "proposta", value: 8500, date: "2026-08-20", isLead: true , responsavelId: "u1" },
  { id: "p3", clientId: "c2", clientName: "Hospital Nova Aliança", type: "troca", desc: "Substituição LF-0987 por defeito recorrente", stage: "análise", value: 0, date: "2026-08-24", isLead: false , responsavelId: "u3" },
  { id: "p4", clientId: null, clientName: "Clínica Amor e Vida", type: "novo cliente", desc: "Lead via indicação — avaliando 2 fornecedores", stage: "negociação", value: 5200, date: "2026-08-15", isLead: true , responsavelId: "u1" },
  { id: "p5", clientId: "c5", clientName: "Hospital Português", type: "adicional", desc: "1x Bomba de Infusão LF-1400 — expansão da ala pediátrica", stage: "fechado", value: 2850, date: "2026-08-10", isLead: false , responsavelId: "u1" },
  { id: "p6", clientId: null, clientName: "Hospital Aliança Norte", type: "novo cliente", desc: "Lead frio — contato inicial via e-mail", stage: "novo", value: 0, date: "2026-08-27", isLead: true , responsavelId: "u1" },
  { id: "p7", clientId: "c1", clientName: "Hospital Vida", type: "adicional", desc: "1x Infusomat Space — leito extra na cardiologia", stage: "fechado", value: 3200, date: "2026-07-18", isLead: false , responsavelId: "u1" },
  { id: "p8", clientId: null, clientName: "Clínica Bem Cuidar", type: "novo cliente", desc: "Lead via feira do setor — proposta recusada", stage: "fechado", value: 0, date: "2026-07-05", isLead: true , responsavelId: "u1" },
  { id: "p9", clientId: "c4", clientName: "Clínica São Rafael", type: "troca", desc: "Substituição por vencimento de calibração", stage: "fechado", value: 0, date: "2026-07-22", isLead: false , responsavelId: "u3" },
  { id: "p10", clientId: "c2", clientName: "Hospital Nova Aliança", type: "reposição", desc: "1x Bomba LF-1400 — reforço no pronto-socorro", stage: "fechado", value: 2850, date: "2026-06-12", isLead: false , responsavelId: "u1" },
  { id: "p11", clientId: null, clientName: "Hospital Santa Clara", type: "novo cliente", desc: "Lead via licitação — perdido para concorrente", stage: "fechado", value: 0, date: "2026-06-08", isLead: true , responsavelId: "u1" },
];

const statusStyle = (status) => {
  const map = {
    ativo: { bg: colors.tealLight, fg: colors.tealDark, label: "Ativo" },
    alocado: { bg: colors.tealLight, fg: colors.tealDark, label: "Alocado" },
    vencendo: { bg: colors.amberLight, fg: colors.amberDark, label: "Vencendo" },
    manutenção: { bg: colors.amberLight, fg: colors.amberDark, label: "Manutenção" },
    negociação: { bg: colors.amberLight, fg: colors.amberDark, label: "Em negociação" },
    atrasado: { bg: colors.redLight, fg: colors.redDark, label: "Atrasado" },
    inadimplente: { bg: colors.redLight, fg: colors.redDark, label: "Inadimplente" },
    estoque: { bg: "#EFEFEF", fg: colors.muted, label: "Em estoque" },
    encerrado: { bg: "#EFEFEF", fg: colors.muted, label: "Encerrado" },
  };
  return map[status] || { bg: "#EFEFEF", fg: colors.muted, label: status };
};

const Badge = ({ status }) => {
  const s = statusStyle(status);
  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
};

const MetricCard = ({ label, value, icon: Icon, accent }) => (
  <div
    className="rounded-lg p-4 flex items-start justify-between"
    style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
  >
    <div>
      <p className="text-xs mb-1" style={{ color: colors.muted }}>{label}</p>
      <p className="text-2xl font-semibold" style={{ color: colors.ink }}>{value}</p>
    </div>
    <div
      className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
      style={{ background: accent + "20" }}
    >
      <Icon size={18} style={{ color: accent }} />
    </div>
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left"
    style={{
      background: active ? colors.navyLight : "transparent",
      color: active ? "#FFFFFF" : "#AEB8CC",
    }}
  >
    <Icon size={17} />
    <span>{label}</span>
  </button>
);

const Modal = ({ title, onClose, onSubmit, submitLabel = "Salvar", children }) => (
  <div
    className="fixed inset-0 flex items-center justify-center p-4 z-50"
    style={{ background: "rgba(22, 35, 61, 0.45)" }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-md rounded-lg p-5 max-h-[85vh] overflow-y-auto"
      style={{ background: colors.surface }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: colors.ink }}>{title}</p>
        <button onClick={onClose} style={{ color: colors.muted }}>✕</button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
      <div className="flex items-center justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-sm"
          style={{ border: `1px solid ${colors.border}`, color: colors.muted }}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="px-3 py-1.5 rounded-md text-sm text-white"
          style={{ background: colors.teal }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="text-xs block" style={{ color: colors.muted }}>
    {label}
    <div className="mt-1">{children}</div>
  </label>
);

const inputStyle = { border: `1px solid ${colors.border}`, width: "100%" };

const genId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date("2026-08-28");
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtCurrency = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthKey = (dateStr) => dateStr.slice(0, 7);

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const label = new Date(`${key}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export default function H3CRM() {
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");

  // ---------- Autenticação ----------
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ---------- Dados vindos da API ----------
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [collaborators, setCollaborators] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [proposalsHistory, setProposalsHistory] = useState([]);

  const clientById = (id) => clients.find((c) => c.id === id);
  const collaboratorById = (id) => collaborators.find((u) => u.id === id);

  const apiFetch = async (path, options = {}) => {
    const res = await fetch(API_BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      let detail = "Sessão expirada, faça login de novo.";
      try {
        const body = await res.json();
        if (body.detail) detail = body.detail;
      } catch (e) {}
      // Só desloga automaticamente em erros de sessão de verdade (endpoints de dados),
      // nunca em endpoints de /auth/*, onde um 401 pode só significar "senha errada".
      if (authToken && !path.startsWith("/auth/")) {
        setAuthToken(null);
        setCurrentUser(null);
      }
      throw new Error(detail);
    }
    if (!res.ok) {
      let detail = `Erro ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch (e) {}
      throw new Error(detail);
    }
    if (res.status === 204) return null;
    return res.json();
  };

  const handleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setAuthToken(data.access_token);
      setCurrentUser(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
    setClients([]);
    setEquipment([]);
    setContracts([]);
    setOrders([]);
    setCollaborators([]);
    setProposalsHistory([]);
    setView("dashboard");
  };

  // Carrega todos os dados da API assim que o login é feito
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setApiError("");
      try {
        const [apiClients, apiEquipment, apiContracts, apiOrders, apiCollaborators, apiProposals] = await Promise.all([
          apiFetch("/clients"),
          apiFetch("/equipment"),
          apiFetch("/contracts"),
          apiFetch("/orders"),
          apiFetch("/collaborators"),
          apiFetch("/proposals"),
        ]);
        if (cancelled) return;
        setClients(apiClients.map(mapClientFromApi));
        setEquipment(apiEquipment.map(mapEquipmentFromApi));
        setContracts(apiContracts.map((c) => mapContractFromApi(c, apiEquipment)));
        setOrders(apiOrders.map(mapOrderFromApi));
        setCollaborators(apiCollaborators.map(mapCollaboratorFromApi));
        setProposalsHistory(apiProposals.map(mapProposalFromApi));
      } catch (err) {
        if (!cancelled) setApiError(err.message || "Não foi possível carregar os dados.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const availableMonths = useMemo(() => {
    const keys = Array.from(new Set(orders.map((o) => monthKey(o.date))));
    const sorted = keys.sort().reverse();
    return sorted.length ? sorted : [monthKey(new Date().toISOString().slice(0, 10))];
  }, [orders]);

  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]);

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // ---------- Formulário: Novo cliente ----------
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", cnpj: "", city: "", contact: "", status: "ativo" });

  const submitNewClient = async () => {
    if (!newClient.name.trim()) return;
    try {
      const created = await apiFetch("/clients", { method: "POST", body: JSON.stringify(newClient) });
      setClients((cs) => [...cs, mapClientFromApi(created)]);
      setNewClient({ name: "", cnpj: "", city: "", contact: "", status: "ativo" });
      setShowClientModal(false);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // ---------- Formulário: Novo pedido ----------
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    clientId: "",
    clientName: "",
    type: "adicional",
    desc: "",
    value: "",
    responsavelId: collaborators[0]?.id || "",
  });

  const submitNewOrder = async () => {
    const clientName = newOrder.clientId ? clientById(newOrder.clientId)?.name : newOrder.clientName;
    if (!clientName || !clientName.trim()) return;
    try {
      const payload = {
        client_id: newOrder.clientId || null,
        client_name: clientName,
        type: newOrder.type,
        description: newOrder.desc,
        stage: "novo",
        value: parseNum(newOrder.value),
        order_date: new Date().toISOString().slice(0, 10),
        is_lead: !newOrder.clientId,
        responsavel_id: newOrder.responsavelId || null,
      };
      const created = await apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) });
      setOrders((os) => [...os, mapOrderFromApi(created)]);
      setNewOrder({ clientId: "", clientName: "", type: "adicional", desc: "", value: "", responsavelId: collaborators[0]?.id || "" });
      setShowOrderModal(false);
    } catch (err) {
      setApiError(err.message);
    }
  };

  const updateOrderStage = async (orderId, stage) => {
    const previous = orders;
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, stage } : o)));
    try {
      await apiFetch(`/orders/${orderId}`, { method: "PUT", body: JSON.stringify({ stage }) });
    } catch (err) {
      setOrders(previous);
      setApiError(err.message);
    }
  };

  const deleteOrder = async (orderId) => {
    const previous = orders;
    setOrders((os) => os.filter((o) => o.id !== orderId));
    try {
      await apiFetch(`/orders/${orderId}`, { method: "DELETE" });
    } catch (err) {
      setOrders(previous);
      setApiError(err.message);
    }
  };

  // ---------- Formulário: Novo colaborador ----------
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({ name: "", role: "Comercial", email: "", phone: "", password: "troque-esta-senha" });

  const submitNewCollaborator = async () => {
    if (!newCollaborator.name.trim() || !newCollaborator.email.trim() || !newCollaborator.password.trim()) return;
    try {
      const created = await apiFetch("/collaborators", { method: "POST", body: JSON.stringify(newCollaborator) });
      setCollaborators((us) => [...us, mapCollaboratorFromApi(created)]);
      setNewCollaborator({ name: "", role: "Comercial", email: "", phone: "", password: "troque-esta-senha" });
      setShowCollaboratorModal(false);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // ---------- Formulário: Novo equipamento ----------
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState({ model: "", brand: "", serial: "", anvisa: "", status: "estoque" });

  const submitNewEquipment = async () => {
    if (!newEquipment.model.trim() || !newEquipment.serial.trim()) return;
    try {
      const created = await apiFetch("/equipment", { method: "POST", body: JSON.stringify(newEquipment) });
      setEquipment((es) => [...es, mapEquipmentFromApi(created)]);
      setNewEquipment({ model: "", brand: "", serial: "", anvisa: "", status: "estoque" });
      setShowEquipmentModal(false);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // ---------- Trocar senha ----------
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const submitChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Preencha a senha atual e a nova senha.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("A confirmação não bate com a nova senha.");
      return;
    }
    try {
      await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });
      setPasswordSuccess("Senha atualizada com sucesso!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 1200);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // ---------- Exclusão de clientes, colaboradores e contratos ----------
  const deleteClient = async (id) => {
    if (!window.confirm("Excluir este cliente? Essa ação não pode ser desfeita.")) return;
    const previous = clients;
    setClients((cs) => cs.filter((c) => c.id !== id));
    try {
      await apiFetch(`/clients/${id}`, { method: "DELETE" });
    } catch (err) {
      setClients(previous);
      setApiError(err.message);
    }
  };

  const deleteCollaborator = async (id) => {
    if (!window.confirm("Excluir este colaborador? Essa ação não pode ser desfeita.")) return;
    const previous = collaborators;
    setCollaborators((us) => us.filter((u) => u.id !== id));
    try {
      await apiFetch(`/collaborators/${id}`, { method: "DELETE" });
    } catch (err) {
      setCollaborators(previous);
      setApiError(err.message);
    }
  };

  const deleteContract = async (id) => {
    if (!window.confirm("Excluir este contrato? Essa ação não pode ser desfeita.")) return;
    const previous = contracts;
    setContracts((ks) => ks.filter((k) => k.id !== id));
    try {
      await apiFetch(`/contracts/${id}`, { method: "DELETE" });
    } catch (err) {
      setContracts(previous);
      setApiError(err.message);
    }
  };

  // ---------- Formulário: Novo contrato ----------
  const [showContractModal, setShowContractModal] = useState(false);
  const [newContract, setNewContract] = useState({
    clientId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    value: "",
    status: "ativo",
    equipmentIds: [],
  });

  const toggleContractEquipment = (equipmentId) => {
    setNewContract((c) => ({
      ...c,
      equipmentIds: c.equipmentIds.includes(equipmentId)
        ? c.equipmentIds.filter((id) => id !== equipmentId)
        : [...c.equipmentIds, equipmentId],
    }));
  };

  const submitNewContract = async () => {
    if (!newContract.clientId || !newContract.endDate) return;
    try {
      const payload = {
        client_id: newContract.clientId,
        start_date: newContract.startDate,
        end_date: newContract.endDate,
        value: parseNum(newContract.value),
        status: newContract.status,
        equipment_ids: newContract.equipmentIds,
      };
      const created = await apiFetch("/contracts", { method: "POST", body: JSON.stringify(payload) });
      // Recarrega equipamentos, já que alguns podem ter mudado de status/cliente ao serem vinculados
      const freshEquipment = await apiFetch("/equipment");
      setEquipment(freshEquipment.map(mapEquipmentFromApi));
      setContracts((ks) => [...ks, mapContractFromApi(created, freshEquipment)]);
      setNewContract({ clientId: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", value: "", status: "ativo", equipmentIds: [] });
      setShowContractModal(false);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // ---------- Estado do formulário de Proposta de Preço ----------
  const [proposal, setProposal] = useState({
    number: "260OR",
    city: "Salvador",
    date: "2026-08-28",
    clientId: "",
    clientName: "",
    clientCnpj: "",
    sector: "SETOR DE COMPRAS",
    validityDays: "15",
    deliveryTime: "TEMPO DE FABRICAÇÃO DE ATÉ 25 DIAS + TEMPO DE TRANSPORTE",
    paymentTerms: "A consultar disponibilidade de crédito",
    minFreightSalvador: "1.500,00",
    minFreightOther: "2.500,00",
    pickupAddress: "Rua dos Cursilhistas, 215, GL 09, Dom Avelar - Salvador/BA. CEP: 41.315-002",
    responsibleName: "Oscar Palmeira",
  });

  const [proposalItems, setProposalItems] = useState([
    { id: "i1", desc: "", uf: "UND", qty: "1", unitValue: "" },
  ]);

  const updateProposal = (field, value) => setProposal((p) => ({ ...p, [field]: value }));

  const selectProposalClient = (clientId) => {
    if (clientId === "outro") {
      setProposal((p) => ({ ...p, clientId: "outro", clientName: "", clientCnpj: "" }));
      return;
    }
    const client = clientById(clientId);
    setProposal((p) => ({
      ...p,
      clientId,
      clientName: client ? client.name : "",
      clientCnpj: client ? client.cnpj : "",
    }));
  };

  const updateItem = (id, field, value) =>
    setProposalItems((items) => items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));

  const addProposalItem = () =>
    setProposalItems((items) => [
      ...items,
      { id: "i" + Date.now(), desc: "", uf: "UND", qty: "1", unitValue: "" },
    ]);

  const removeProposalItem = (id) =>
    setProposalItems((items) => (items.length > 1 ? items.filter((it) => it.id !== id) : items));

  const parseNum = (v) => {
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const proposalTotal = proposalItems.reduce(
    (sum, it) => sum + parseNum(it.qty) * parseNum(it.unitValue),
    0
  );

  const generateProposalFromOrder = (order) => {
    const client = order.clientId ? clientById(order.clientId) : null;
    setProposal((p) => ({
      ...p,
      clientId: order.clientId || "outro",
      clientName: order.clientName,
      clientCnpj: client ? client.cnpj : "",
      sector: client ? "SETOR DE COMPRAS" : p.sector,
    }));
    setProposalItems([
      {
        id: "i" + Date.now(),
        desc: order.desc,
        uf: "UND",
        qty: "1",
        unitValue: order.value > 0 ? order.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
      },
    ]);
    setView("propostas");
  };

  const saveProposalToHistory = async () => {
    try {
      const payload = {
        number: proposal.number,
        city: proposal.city,
        proposal_date: proposal.date,
        client_id: proposal.clientId && proposal.clientId !== "outro" ? proposal.clientId : null,
        client_name: proposal.clientName,
        client_cnpj: proposal.clientCnpj,
        sector: proposal.sector,
        items: proposalItems.map((it) => ({ desc: it.desc, uf: it.uf, qty: it.qty, unit_value: it.unitValue })),
        validity_days: proposal.validityDays,
        delivery_time: proposal.deliveryTime,
        payment_terms: proposal.paymentTerms,
        min_freight_salvador: proposal.minFreightSalvador,
        min_freight_other: proposal.minFreightOther,
        pickup_address: proposal.pickupAddress,
        responsible_name: proposal.responsibleName,
        status: "rascunho",
      };
      const created = await apiFetch("/proposals", { method: "POST", body: JSON.stringify(payload) });
      setProposalsHistory((hist) => [mapProposalFromApi(created), ...hist.filter((p) => p.number !== proposal.number)]);
    } catch (err) {
      setApiError(err.message);
    }
  };

  const loadProposalFromHistory = (record) => {
    const { id, total, items, ...rest } = record;
    setProposal((p) => ({ ...p, ...rest }));
    setProposalItems(items && items.length ? items : [{ id: "i" + Date.now(), desc: "", uf: "UND", qty: "1", unitValue: "" }]);
  };

  const printProposal = () => {
    const rowsHtml = proposalItems
      .map(
        (it, idx) => `
        <tr>
          <td style="border:1px solid #999;padding:5px 6px;text-align:center;font-size:11.5px;">${idx + 1}</td>
          <td style="border:1px solid #999;padding:5px 6px;font-size:11.5px;">${it.desc || "—"}</td>
          <td style="border:1px solid #999;padding:5px 6px;text-align:center;font-size:11.5px;">${it.uf}</td>
          <td style="border:1px solid #999;padding:5px 6px;text-align:center;font-size:11.5px;">${it.qty}</td>
          <td style="border:1px solid #999;padding:5px 6px;text-align:right;font-size:11.5px;">${fmtCurrency(parseNum(it.unitValue))}</td>
          <td style="border:1px solid #999;padding:5px 6px;text-align:right;font-size:11.5px;">${fmtCurrency(parseNum(it.qty) * parseNum(it.unitValue))}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Proposta ${proposal.number}</title>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12.5px; line-height: 1.5; margin: 0; padding: 0 6mm; }
  table { width: 100%; border-collapse: collapse; }
  th { border: 1px solid #999; padding: 5px 6px; font-size: 11px; font-weight: 700; background: #F0F0F0; }
</style>
</head>
<body>
  <img src="${H3_LOGO}" alt="H3 Pharma" style="height:60px;display:block;margin:0 auto 18px;" />
  <p style="margin-bottom:10px;">${proposal.city}, ${proposal.date ? fmtDate(proposal.date) : ""}.</p>
  <p style="font-weight:700;margin-bottom:2px;">AO</p>
  <p style="font-weight:700;margin-bottom:2px;">${proposal.clientName || "[ NOME DO CLIENTE ]"}</p>
  <p style="font-weight:700;margin-bottom:2px;">CNPJ: ${proposal.clientCnpj || "[ CNPJ ]"}</p>
  <p style="font-weight:700;margin-bottom:12px;">ATT: ${proposal.sector}</p>
  <p style="font-weight:700;margin-bottom:10px;">PROPOSTA Nº ${proposal.number}</p>
  <table>
    <thead>
      <tr>
        <th>ITEM</th><th>DESCRIÇÃO DO ITEM</th><th>UF</th><th>QNTD.</th><th>VALOR UNIT.</th><th>VALOR TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr>
        <td colspan="4" style="border:1px solid #999;padding:5px 6px;"></td>
        <td style="border:1px solid #999;padding:5px 6px;font-weight:700;text-align:right;">TOTAL</td>
        <td style="border:1px solid #999;padding:5px 6px;font-weight:700;text-align:right;">${fmtCurrency(proposalTotal)}</td>
      </tr>
    </tbody>
  </table>
  <p style="font-weight:700;margin:14px 0;font-size:11.5px;">
    VALOR TOTAL DA PROPOSTA: ${fmtCurrency(proposalTotal)} (${proposalTotal > 0 ? valorPorExtenso(proposalTotal) : "ZERO"})
  </p>
  <p style="font-weight:700;margin-bottom:4px;">Condições Gerais:</p>
  <p style="margin-bottom:2px;"><b>Validade da Proposta:</b> ${proposal.validityDays} Dias</p>
  <p style="margin-bottom:2px;"><b>Prazo de Entrega:</b> ${proposal.deliveryTime}</p>
  <p style="margin-bottom:8px;"><b>Condições de Pagamento:</b> ${proposal.paymentTerms}</p>
  <p style="margin-bottom:2px;"><b>Faturamento mínimo para frete CIF para Salvador e Região metropolitana:</b> R$ ${proposal.minFreightSalvador}</p>
  <p style="margin-bottom:2px;"><b>Para demais localidades:</b> R$ ${proposal.minFreightOther}</p>
  <p style="margin-bottom:8px;font-size:11px;">
    Para faturamento inferior, o pedido deverá ser retirado na H3 Pharma mediante autorização enviada para o endereço de e-mail: logistica@h3pharma.com.br
    com nome e RG do portador, sendo necessária a apresentação do documento de identidade no momento da retirada.
  </p>
  <p style="margin-bottom:20px;font-size:11px;"><b>Local para retirada:</b> ${proposal.pickupAddress}</p>
  <p style="margin-top:30px;">${proposal.responsibleName}</p>
  <p>H3 Pharma Comércio e Serviços Ltda.</p>
  <p style="margin-bottom:24px;">CNPJ: 26.643.172/0001-77</p>
  <p style="font-weight:700;margin-bottom:14px;">APROVAÇÃO DA PROPOSTA</p>
  <p style="margin-bottom:14px;">NOME: ________________________________________________</p>
  <p style="margin-bottom:14px;">CARGO: _______________________________________________</p>
  <p style="margin-bottom:14px;">ASSINATURA: ___________________________________________</p>
  <p style="margin-bottom:20px;">DATA: ________________________________________________</p>
  <div style="background:${colors.h3TealDark};color:#FFFFFF;border-radius:40px;padding:10px 18px;font-size:10.5px;display:flex;justify-content:space-between;gap:12px;">
    <span>H3 Pharma Comércio e Serviços Ltda · CNPJ: 26.643.172/0001-77 · IE: 136.939.199</span>
    <span>71 3043-6161 · Rua dos Cursilhistas, 215, GL 09, Dom Avelar - Salvador/BA · h3pharma@h3pharma.com.br</span>
  </div>
  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("O navegador bloqueou a abertura da aba de impressão. Permita pop-ups para este site e tente novamente.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const metrics = useMemo(() => {
    const ativos = contracts.filter((c) => c.status === "ativo").length;
    const alocados = equipment.filter((e) => e.status === "alocado").length;
    const vencendo = contracts.filter((c) => daysUntil(c.end) <= 45 && daysUntil(c.end) >= 0).length;
    const inadimplentes = clients.filter((c) => c.status === "inadimplente").length;
    return { ativos, alocados, vencendo, inadimplentes };
  }, [contracts, equipment, clients]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!authToken) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ background: colors.bg, minHeight: 600, fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}
      >
        <div className="w-full max-w-sm rounded-lg p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="text-center mb-6">
            <img src={H3_LOGO} alt="H3 Pharma" style={{ height: 48, margin: "0 auto 10px" }} />
            <p className="text-sm" style={{ color: colors.muted }}>CRM · Locação de equipamentos</p>
          </div>
          <div className="flex flex-col gap-3">
            <Field label="E-mail">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="seu.nome@h3pharma.com.br"
                className="px-2.5 py-2 rounded-md text-sm"
                style={inputStyle}
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="px-2.5 py-2 rounded-md text-sm"
                style={inputStyle}
              />
            </Field>
            {loginError && (
              <p className="text-xs" style={{ color: colors.red }}>{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="mt-1 py-2 rounded-md text-sm text-white"
              style={{ background: colors.teal, opacity: loginLoading ? 0.7 : 1 }}
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
            <p className="text-xs text-center mt-1" style={{ color: colors.muted }}>
              Primeiro acesso? Fale com quem administra o CRM pra criar seu login.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ background: colors.bg, minHeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: `3px solid ${colors.border}`, borderTopColor: colors.teal }}
          />
          <p className="text-sm" style={{ color: colors.muted }}>Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex" style={{ background: colors.bg, minHeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
      {apiError && (
        <div
          className="fixed bottom-4 right-4 px-3 py-2 rounded-md text-xs text-white z-50 max-w-xs"
          style={{ background: colors.red }}
        >
          {apiError}
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-56 shrink-0 p-4 flex flex-col gap-1" style={{ background: colors.navy }}>
        <div className="px-3 py-3 mb-2">
          <p className="text-white font-semibold text-sm tracking-wide">H3 PHARMA</p>
          <p className="text-xs" style={{ color: "#8792A8" }}>CRM · Locação de equipamentos</p>
        </div>
        <NavItem icon={LayoutDashboard} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />

        <NavItem icon={ClipboardList} label="Pedidos" active={view === "pedidos"} onClick={() => setView("pedidos")} />
        <NavItem icon={FileSignature} label="Propostas" active={view === "propostas"} onClick={() => setView("propostas")} />
        <NavItem icon={UserCog} label="Colaboradores" active={view === "colaboradores"} onClick={() => setView("colaboradores")} />
        <NavItem icon={Users} label="Clientes" active={view === "clientes"} onClick={() => setView("clientes")} />
        <NavItem icon={FileText} label="Contratos" active={view === "contratos"} onClick={() => setView("contratos")} />
        <NavItem icon={Package} label="Equipamentos" active={view === "equipamentos"} onClick={() => setView("equipamentos")} />
        <div className="flex-1" />
        <div className="px-3 py-2 mt-2" style={{ borderTop: "1px solid #2A3A5C" }}>
          <p className="text-xs text-white truncate">{currentUser?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setShowPasswordModal(true)} className="text-xs" style={{ color: "#8792A8" }}>
              Trocar senha
            </button>
            <span style={{ color: "#3A4A6C" }}>·</span>
            <button onClick={handleLogout} className="text-xs" style={{ color: "#8792A8" }}>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {view === "colaboradores" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Colaboradores</h1>
                <p className="text-sm" style={{ color: colors.muted }}>{collaborators.length} pessoas com acesso ao CRM</p>
              </div>
              <button onClick={() => setShowCollaboratorModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white" style={{ background: colors.teal }}>
                <Plus size={15} /> Adicionar colaborador
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {collaborators.map((u) => {
                const openOrders = orders.filter((o) => o.responsavelId === u.id && o.stage !== "fechado").length;
                return (
                  <div key={u.id} className="rounded-lg p-4 flex items-start gap-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: colors.tealLight, color: colors.tealDark, fontWeight: 600, fontSize: 13 }}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: colors.ink }}>{u.name}</p>
                      <p className="text-xs mb-2" style={{ color: colors.muted }}>{u.role}</p>
                      <p className="text-xs flex items-center gap-1.5" style={{ color: colors.muted }}>
                        <Mail size={12} /> {u.email}
                      </p>
                      <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: colors.muted }}>
                        <Phone size={12} /> {u.phone}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold" style={{ color: colors.ink }}>{openOrders}</p>
                      <p className="text-xs" style={{ color: colors.muted }}>pedidos em aberto</p>
                      <button
                        onClick={() => deleteCollaborator(u.id)}
                        className="mt-2 flex items-center gap-1 text-xs ml-auto"
                        style={{ color: colors.red }}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "dashboard" && (
          <div>
            <h1 className="text-lg font-semibold mb-1" style={{ color: colors.ink }}>Dashboard</h1>
            <p className="text-sm mb-5" style={{ color: colors.muted }}>Visão geral da operação — 28 de agosto de 2026</p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              <MetricCard label="Contratos ativos" value={metrics.ativos} icon={FileText} accent={colors.teal} />
              <MetricCard label="Equipamentos alocados" value={metrics.alocados} icon={Package} accent={colors.teal} />
              <MetricCard label="Vencendo em 45 dias" value={metrics.vencendo} icon={AlertTriangle} accent={colors.amber} />
              <MetricCard label="Clientes inadimplentes" value={metrics.inadimplentes} icon={Users} accent={colors.red} />
            </div>

            <div className="rounded-lg" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <p className="text-sm font-medium" style={{ color: colors.ink }}>Contratos que precisam de atenção</p>
              </div>
              <div>
                {contracts
                  .filter((c) => c.status !== "ativo")
                  .map((c) => {
                    const client = clientById(c.clientId);
                    const d = daysUntil(c.end);
                    return (
                      <div key={c.id} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.ink }}>{client.name}</p>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: colors.muted }}>
                            <Calendar size={12} /> Vigência até {fmtDate(c.end)}
                            {d >= 0 ? ` · ${d} dias restantes` : ` · ${Math.abs(d)} dias em atraso`}
                          </p>
                        </div>
                        <Badge status={c.status} />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {view === "propostas" && (
          <div>
            <div className="flex items-center justify-between mb-4 no-print">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Proposta de preço</h1>
                <p className="text-sm" style={{ color: colors.muted }}>Preencha os campos e imprima direto pelo site</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveProposalToHistory}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm"
                  style={{ border: `1px solid ${colors.border}`, color: colors.teal }}
                >
                  Salvar proposta
                </button>
                <button
                  onClick={printProposal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white"
                  style={{ background: colors.teal }}
                >
                  <Printer size={15} /> Imprimir / salvar PDF
                </button>
              </div>
            </div>

            {proposalsHistory.length > 0 && (
              <div className="no-print mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: colors.muted }}>Salvas:</span>
                {proposalsHistory.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProposalFromHistory(p)}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ border: `1px solid ${colors.border}`, color: colors.ink }}
                  >
                    {p.number} · {p.clientName || "sem cliente"}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              {/* Formulário */}
              <div className="no-print flex flex-col gap-4">
                <div className="rounded-lg p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <p className="text-sm font-medium mb-3" style={{ color: colors.ink }}>Dados da proposta</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Nº da proposta
                      <input value={proposal.number} onChange={(e) => updateProposal("number", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Cidade
                      <input value={proposal.city} onChange={(e) => updateProposal("city", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Data
                      <input type="date" value={proposal.date} onChange={(e) => updateProposal("date", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Setor / ATT
                      <input value={proposal.sector} onChange={(e) => updateProposal("sector", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                      Cliente
                      <select
                        value={proposal.clientId}
                        onChange={(e) => selectProposalClient(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm"
                        style={{ border: `1px solid ${colors.border}` }}
                      >
                        <option value="">Selecione um cliente cadastrado</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        <option value="outro">Outro cliente (não cadastrado)</option>
                      </select>
                    </label>
                    {proposal.clientId === "outro" && (
                      <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                        Cliente (razão social)
                        <input value={proposal.clientName} onChange={(e) => updateProposal("clientName", e.target.value)}
                          placeholder="Ex: Hospital Silvestre Ltda"
                          className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                      </label>
                    )}
                    <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                      CNPJ do cliente
                      <input
                        value={proposal.clientCnpj}
                        onChange={(e) => updateProposal("clientCnpj", e.target.value)}
                        placeholder="00.000.000/0001-00"
                        readOnly={proposal.clientId !== "" && proposal.clientId !== "outro"}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm"
                        style={{
                          border: `1px solid ${colors.border}`,
                          background: proposal.clientId !== "" && proposal.clientId !== "outro" ? colors.bg : colors.surface,
                          color: proposal.clientId !== "" && proposal.clientId !== "outro" ? colors.muted : colors.ink,
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium" style={{ color: colors.ink }}>Itens</p>
                    <button onClick={addProposalItem} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ border: `1px solid ${colors.border}`, color: colors.teal }}>
                      <Plus size={13} /> Adicionar item
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {proposalItems.map((it, idx) => (
                      <div key={it.id} className="grid gap-2 items-end" style={{ gridTemplateColumns: "1fr 60px 55px 90px 24px" }}>
                        <label className="text-xs" style={{ color: colors.muted }}>
                          {idx === 0 && "Descrição"}
                          <input value={it.desc} onChange={(e) => updateItem(it.id, "desc", e.target.value)}
                            placeholder="Descrição do item"
                            className="w-full mt-1 px-2 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                        </label>
                        <label className="text-xs" style={{ color: colors.muted }}>
                          {idx === 0 && "UF"}
                          <input value={it.uf} onChange={(e) => updateItem(it.id, "uf", e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                        </label>
                        <label className="text-xs" style={{ color: colors.muted }}>
                          {idx === 0 && "Qtd."}
                          <input value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                        </label>
                        <label className="text-xs" style={{ color: colors.muted }}>
                          {idx === 0 && "Valor unit."}
                          <input value={it.unitValue} onChange={(e) => updateItem(it.id, "unitValue", e.target.value)}
                            placeholder="0,00"
                            className="w-full mt-1 px-2 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                        </label>
                        <button onClick={() => removeProposalItem(it.id)} className="mb-1.5 flex items-center justify-center" style={{ color: colors.red }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <p className="text-sm font-medium mb-3" style={{ color: colors.ink }}>Condições gerais</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Validade da proposta (dias)
                      <input value={proposal.validityDays} onChange={(e) => updateProposal("validityDays", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Responsável
                      <input value={proposal.responsibleName} onChange={(e) => updateProposal("responsibleName", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                      Prazo de entrega
                      <input value={proposal.deliveryTime} onChange={(e) => updateProposal("deliveryTime", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                      Condições de pagamento
                      <input value={proposal.paymentTerms} onChange={(e) => updateProposal("paymentTerms", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Faturamento mín. Salvador/RMS (R$)
                      <input value={proposal.minFreightSalvador} onChange={(e) => updateProposal("minFreightSalvador", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs" style={{ color: colors.muted }}>
                      Faturamento mín. outras localidades (R$)
                      <input value={proposal.minFreightOther} onChange={(e) => updateProposal("minFreightOther", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                    <label className="text-xs col-span-2" style={{ color: colors.muted }}>
                      Local para retirada
                      <input value={proposal.pickupAddress} onChange={(e) => updateProposal("pickupAddress", e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md text-sm" style={{ border: `1px solid ${colors.border}` }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Pré-visualização / área de impressão */}
              <div>
                <div
                  id="proposal-print-area"
                  style={{ background: "#FFFFFF", border: `1px solid ${colors.border}`, borderRadius: 8, padding: "28px 32px", fontSize: 12.5, color: "#1a1a1a", lineHeight: 1.5 }}
                >
                  <img src={H3_LOGO} alt="H3 Pharma" style={{ height: 60, display: "block", margin: "0 auto 18px" }} />

                  <p style={{ marginBottom: 10 }}>
                    {proposal.city}, {proposal.date ? fmtDate(proposal.date) : ""}.
                  </p>

                  <p style={{ fontWeight: 700, marginBottom: 2 }}>AO</p>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{proposal.clientName || "[ NOME DO CLIENTE ]"}</p>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>CNPJ: {proposal.clientCnpj || "[ CNPJ ]"}</p>
                  <p style={{ fontWeight: 700, marginBottom: 12 }}>ATT: {proposal.sector}</p>

                  <p style={{ fontWeight: 700, marginBottom: 10 }}>PROPOSTA Nº {proposal.number}</p>

                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
                    <thead>
                      <tr>
                        {["ITEM", "DESCRIÇÃO DO ITEM", "UF", "QNTD.", "VALOR UNIT.", "VALOR TOTAL"].map((h) => (
                          <th key={h} style={{ border: "1px solid #999", padding: "5px 6px", fontSize: 11, fontWeight: 700, background: "#F0F0F0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proposalItems.map((it, idx) => (
                        <tr key={it.id}>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", textAlign: "center", fontSize: 11.5 }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", fontSize: 11.5 }}>{it.desc || "—"}</td>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", textAlign: "center", fontSize: 11.5 }}>{it.uf}</td>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", textAlign: "center", fontSize: 11.5 }}>{it.qty}</td>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", textAlign: "right", fontSize: 11.5 }}>{fmtCurrency(parseNum(it.unitValue))}</td>
                          <td style={{ border: "1px solid #999", padding: "5px 6px", textAlign: "right", fontSize: 11.5 }}>{fmtCurrency(parseNum(it.qty) * parseNum(it.unitValue))}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} style={{ border: "1px solid #999", padding: "5px 6px" }}></td>
                        <td style={{ border: "1px solid #999", padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>TOTAL</td>
                        <td style={{ border: "1px solid #999", padding: "5px 6px", fontWeight: 700, textAlign: "right" }}>{fmtCurrency(proposalTotal)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 11.5 }}>
                    VALOR TOTAL DA PROPOSTA: {fmtCurrency(proposalTotal)} ({proposalTotal > 0 ? valorPorExtenso(proposalTotal) : "ZERO"})
                  </p>

                  <p style={{ fontWeight: 700, marginBottom: 4 }}>Condições Gerais:</p>
                  <p style={{ marginBottom: 2 }}><b>Validade da Proposta:</b> {proposal.validityDays} Dias</p>
                  <p style={{ marginBottom: 2 }}><b>Prazo de Entrega:</b> {proposal.deliveryTime}</p>
                  <p style={{ marginBottom: 8 }}><b>Condições de Pagamento:</b> {proposal.paymentTerms}</p>

                  <p style={{ marginBottom: 2 }}><b>Faturamento mínimo para frete CIF para Salvador e Região metropolitana:</b> R$ {proposal.minFreightSalvador}</p>
                  <p style={{ marginBottom: 2 }}><b>Para demais localidades:</b> R$ {proposal.minFreightOther}</p>
                  <p style={{ marginBottom: 8, fontSize: 11 }}>
                    Para faturamento inferior, o pedido deverá ser retirado na H3 Pharma mediante autorização enviada para o endereço de e-mail: logistica@h3pharma.com.br
                    com nome e RG do portador, sendo necessária a apresentação do documento de identidade no momento da retirada.
                  </p>
                  <p style={{ marginBottom: 20, fontSize: 11 }}><b>Local para retirada:</b> {proposal.pickupAddress}</p>

                  <p style={{ marginTop: 30 }}>{proposal.responsibleName}</p>
                  <p>H3 Pharma Comércio e Serviços Ltda.</p>
                  <p style={{ marginBottom: 24 }}>CNPJ: 26.643.172/0001-77</p>

                  <p style={{ fontWeight: 700, marginBottom: 14 }}>APROVAÇÃO DA PROPOSTA</p>
                  <p style={{ marginBottom: 14 }}>NOME: ________________________________________________</p>
                  <p style={{ marginBottom: 14 }}>CARGO: _______________________________________________</p>
                  <p style={{ marginBottom: 14 }}>ASSINATURA: ___________________________________________</p>
                  <p style={{ marginBottom: 20 }}>DATA: ________________________________________________</p>

                  <div style={{ background: colors.h3TealDark, color: "#FFFFFF", borderRadius: 40, padding: "10px 18px", fontSize: 10.5, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>H3 Pharma Comércio e Serviços Ltda · CNPJ: 26.643.172/0001-77 · IE: 136.939.199</span>
                    <span>71 3043-6161 · Rua dos Cursilhistas, 215, GL 09, Dom Avelar - Salvador/BA · h3pharma@h3pharma.com.br</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "pedidos" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Pedidos</h1>
                <p className="text-sm" style={{ color: colors.muted }}>
                  Solicitações de clientes e novas oportunidades
                </p>
              </div>
              <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white" style={{ background: colors.teal }}>
                <Plus size={15} /> Novo pedido
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  const idx = availableMonths.indexOf(selectedMonth);
                  if (idx < availableMonths.length - 1) setSelectedMonth(availableMonths[idx + 1]);
                }}
                disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ border: `1px solid ${colors.border}`, background: colors.surface, color: colors.ink, opacity: availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1 ? 0.4 : 1 }}
              >
                <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ border: `1px solid ${colors.border}`, background: colors.surface }}>
                <Calendar size={14} style={{ color: colors.muted }} />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-sm outline-none bg-transparent"
                  style={{ color: colors.ink }}
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{monthLabel(m)}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const idx = availableMonths.indexOf(selectedMonth);
                  if (idx > 0) setSelectedMonth(availableMonths[idx - 1]);
                }}
                disabled={availableMonths.indexOf(selectedMonth) <= 0}
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ border: `1px solid ${colors.border}`, background: colors.surface, color: colors.ink, opacity: availableMonths.indexOf(selectedMonth) <= 0 ? 0.4 : 1 }}
              >
                <ChevronRight size={15} />
              </button>

              {(() => {
                const monthOrders = orders.filter((o) => monthKey(o.date) === selectedMonth);
                const monthTotal = monthOrders.reduce((sum, o) => sum + o.value, 0);
                return (
                  <p className="text-sm ml-2" style={{ color: colors.muted }}>
                    {monthOrders.length} {monthOrders.length === 1 ? "pedido" : "pedidos"}
                    {monthTotal > 0 ? ` · ${fmtCurrency(monthTotal)}` : ""}
                  </p>
                );
              })()}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {orderStages.map((stage) => {
                const stageOrders = orders.filter((o) => o.stage === stage && monthKey(o.date) === selectedMonth);
                const stageTotal = stageOrders.reduce((sum, o) => sum + o.value, 0);
                return (
                  <div key={stage} className="rounded-lg" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <p className="text-xs font-medium" style={{ color: colors.ink }}>{stageLabels[stage]}</p>
                      <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                        {stageOrders.length} {stageOrders.length === 1 ? "pedido" : "pedidos"}
                        {stageTotal > 0 ? ` · ${fmtCurrency(stageTotal)}` : ""}
                      </p>
                    </div>
                    <div className="p-2 flex flex-col gap-2">
                      {stageOrders.length === 0 && (
                        <p className="text-xs px-1 py-2" style={{ color: colors.muted }}>Sem pedidos aqui</p>
                      )}
                      {stageOrders.map((o) => (
                        <div key={o.id} className="rounded-md p-2.5" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {o.isLead && <UserPlus size={12} style={{ color: colors.teal }} />}
                            <p className="text-xs font-medium leading-tight" style={{ color: colors.ink }}>{o.clientName}</p>
                          </div>
                          <p className="text-xs leading-snug mb-2" style={{ color: colors.muted }}>{o.desc}</p>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                              style={{ background: colors.tealLight, color: colors.tealDark, fontSize: 11 }}
                            >
                              {o.type}
                            </span>
                            {o.value > 0 && (
                              <span className="text-xs font-medium" style={{ color: colors.ink, fontSize: 11 }}>
                                {fmtCurrency(o.value)}
                              </span>
                            )}
                          </div>
                          {o.responsavelId && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: colors.navy, color: "#fff", fontSize: 8, fontWeight: 600 }}
                              >
                                {initials(collaboratorById(o.responsavelId)?.name || "")}
                              </div>
                              <span style={{ color: colors.muted, fontSize: 11 }}>
                                {collaboratorById(o.responsavelId)?.name}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => generateProposalFromOrder(o)}
                            className="w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-md mb-1.5"
                            style={{ border: `1px solid ${colors.border}`, color: colors.teal, fontSize: 11 }}
                          >
                            <FileSignature size={12} /> Gerar proposta
                          </button>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={o.stage}
                              onChange={(e) => updateOrderStage(o.id, e.target.value)}
                              className="flex-1 text-xs py-1 rounded-md"
                              style={{ border: `1px solid ${colors.border}`, color: colors.muted, fontSize: 11 }}
                            >
                              {orderStages.map((s) => (
                                <option key={s} value={s}>{stageLabels[s]}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteOrder(o.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-md shrink-0"
                              style={{ border: `1px solid ${colors.border}`, color: colors.red }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "clientes" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Clientes</h1>
                <p className="text-sm" style={{ color: colors.muted }}>{clients.length} clientes cadastrados</p>
              </div>
              <button onClick={() => setShowClientModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white" style={{ background: colors.teal }}>
                <Plus size={15} /> Novo cliente
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome do cliente"
                className="w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none"
                style={{ border: `1px solid ${colors.border}`, background: colors.surface }}
              />
            </div>

            <div className="rounded-lg overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.bg }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Cliente</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>CNPJ</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Cidade</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Contato</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Status</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: colors.ink }}>{c.name}</td>
                      <td className="px-4 py-3" style={{ color: colors.muted, fontFamily: "monospace", fontSize: 13 }}>{c.cnpj}</td>
                      <td className="px-4 py-3 flex items-center gap-1" style={{ color: colors.muted }}>
                        <MapPin size={12} /> {c.city}
                      </td>
                      <td className="px-4 py-3" style={{ color: colors.muted }}>{c.contact}</td>
                      <td className="px-4 py-3"><Badge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteClient(c.id)} style={{ color: colors.red }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "contratos" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Contratos</h1>
                <p className="text-sm" style={{ color: colors.muted }}>{contracts.length} contratos de locação</p>
              </div>
              <button onClick={() => setShowContractModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white" style={{ background: colors.teal }}>
                <Plus size={15} /> Novo contrato
              </button>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.bg }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Cliente</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Equipamento</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Início</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Vigência até</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Valor mensal</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Status</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}></th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((k) => {
                    const client = clientById(k.clientId);
                    const eq = equipment.find((e) => k.equipmentIds.includes(e.id));
                    return (
                      <tr key={k.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td className="px-4 py-3 font-medium" style={{ color: colors.ink }}>{client ? client.name : "—"}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted }}>{eq ? eq.model : "—"}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted }}>{fmtDate(k.start)}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted }}>{fmtDate(k.end)}</td>
                        <td className="px-4 py-3" style={{ color: colors.ink }}>{fmtCurrency(k.value)}</td>
                        <td className="px-4 py-3"><Badge status={k.status} /></td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteContract(k.id)} style={{ color: colors.red }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "equipamentos" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: colors.ink }}>Equipamentos</h1>
                <p className="text-sm" style={{ color: colors.muted }}>{equipment.length} bombas de infusão no inventário</p>
              </div>
              <button onClick={() => setShowEquipmentModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white" style={{ background: colors.teal }}>
                <Plus size={15} /> Novo equipamento
              </button>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.bg }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Modelo</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Marca</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Nº de série</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Registro ANVISA</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Alocado em</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: colors.muted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((e) => {
                    const client = e.clientId ? clientById(e.clientId) : null;
                    return (
                      <tr key={e.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td className="px-4 py-3 font-medium" style={{ color: colors.ink }}>{e.model}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted }}>{e.brand}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted, fontFamily: "monospace", fontSize: 13 }}>{e.serial}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted, fontFamily: "monospace", fontSize: 13 }}>{e.anvisa}</td>
                        <td className="px-4 py-3" style={{ color: colors.muted }}>{client ? client.name : "—"}</td>
                        <td className="px-4 py-3"><Badge status={e.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showClientModal && (
        <Modal title="Novo cliente" onClose={() => setShowClientModal(false)} onSubmit={submitNewClient}>
          <Field label="Nome / razão social">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
          </Field>
          <Field label="CNPJ">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newClient.cnpj} onChange={(e) => setNewClient({ ...newClient, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Cidade">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} placeholder="Salvador, BA" />
          </Field>
          <Field label="Contato">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newClient.contact} onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })} placeholder="Nome · Setor" />
          </Field>
          <Field label="Status">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newClient.status} onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}>
              <option value="ativo">Ativo</option>
              <option value="negociação">Em negociação</option>
              <option value="inadimplente">Inadimplente</option>
            </select>
          </Field>
        </Modal>
      )}

      {showOrderModal && (
        <Modal title="Novo pedido" onClose={() => setShowOrderModal(false)} onSubmit={submitNewOrder}>
          <Field label="Cliente cadastrado (ou deixe em branco para um lead novo)">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newOrder.clientId} onChange={(e) => setNewOrder({ ...newOrder, clientId: e.target.value })}>
              <option value="">— Lead / cliente não cadastrado —</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          {!newOrder.clientId && (
            <Field label="Nome do lead">
              <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
                value={newOrder.clientName} onChange={(e) => setNewOrder({ ...newOrder, clientName: e.target.value })} />
            </Field>
          )}
          <Field label="Tipo">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newOrder.type} onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}>
              <option value="novo cliente">Novo cliente</option>
              <option value="adicional">Adicional</option>
              <option value="troca">Troca</option>
              <option value="reposição">Reposição</option>
            </select>
          </Field>
          <Field label="Descrição">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newOrder.desc} onChange={(e) => setNewOrder({ ...newOrder, desc: e.target.value })} placeholder="Ex: 2x Infusomat Space — UTI" />
          </Field>
          <Field label="Valor estimado (R$)">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newOrder.value} onChange={(e) => setNewOrder({ ...newOrder, value: e.target.value })} placeholder="0,00" />
          </Field>
          <Field label="Responsável">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newOrder.responsavelId} onChange={(e) => setNewOrder({ ...newOrder, responsavelId: e.target.value })}>
              {collaborators.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </Field>
        </Modal>
      )}

      {showCollaboratorModal && (
        <Modal title="Adicionar colaborador" onClose={() => setShowCollaboratorModal(false)} onSubmit={submitNewCollaborator}>
          <Field label="Nome">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newCollaborator.name} onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })} />
          </Field>
          <Field label="Cargo">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newCollaborator.role} onChange={(e) => setNewCollaborator({ ...newCollaborator, role: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newCollaborator.email} onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })} placeholder="nome@h3pharma.com.br" />
          </Field>
          <Field label="Telefone">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newCollaborator.phone} onChange={(e) => setNewCollaborator({ ...newCollaborator, phone: e.target.value })} placeholder="(71) 90000-0000" />
          </Field>
        </Modal>
      )}

      {showEquipmentModal && (
        <Modal title="Novo equipamento" onClose={() => setShowEquipmentModal(false)} onSubmit={submitNewEquipment}>
          <Field label="Modelo">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newEquipment.model} onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })} />
          </Field>
          <Field label="Marca">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newEquipment.brand} onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })} />
          </Field>
          <Field label="Nº de série">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newEquipment.serial} onChange={(e) => setNewEquipment({ ...newEquipment, serial: e.target.value })} />
          </Field>
          <Field label="Registro ANVISA">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newEquipment.anvisa} onChange={(e) => setNewEquipment({ ...newEquipment, anvisa: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newEquipment.status} onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}>
              <option value="estoque">Em estoque</option>
              <option value="alocado">Alocado</option>
              <option value="manutenção">Manutenção</option>
            </select>
          </Field>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal
          title="Trocar senha"
          onClose={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordSuccess(""); }}
          onSubmit={submitChangePassword}
          submitLabel="Salvar nova senha"
        >
          <Field label="Senha atual">
            <input type="password" className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </Field>
          <Field label="Nova senha">
            <input type="password" className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </Field>
          <Field label="Confirmar nova senha">
            <input type="password" className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          </Field>
          {passwordError && <p className="text-xs" style={{ color: colors.red }}>{passwordError}</p>}
          {passwordSuccess && <p className="text-xs" style={{ color: colors.green }}>{passwordSuccess}</p>}
        </Modal>
      )}

      {showContractModal && (
        <Modal title="Novo contrato" onClose={() => setShowContractModal(false)} onSubmit={submitNewContract}>
          <Field label="Cliente">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newContract.clientId} onChange={(e) => setNewContract({ ...newContract, clientId: e.target.value })}>
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="Início da vigência">
            <input type="date" className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newContract.startDate} onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })} />
          </Field>
          <Field label="Fim da vigência">
            <input type="date" className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newContract.endDate} onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })} />
          </Field>
          <Field label="Valor mensal (R$)">
            <input className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newContract.value} onChange={(e) => setNewContract({ ...newContract, value: e.target.value })} placeholder="0,00" />
          </Field>
          <Field label="Status">
            <select className="px-2.5 py-1.5 rounded-md text-sm" style={inputStyle}
              value={newContract.status} onChange={(e) => setNewContract({ ...newContract, status: e.target.value })}>
              <option value="ativo">Ativo</option>
              <option value="vencendo">Vencendo</option>
              <option value="atrasado">Atrasado</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </Field>
          <Field label="Equipamentos vinculados">
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {equipment.filter((e) => !e.contractId).length === 0 && (
                <p className="text-xs" style={{ color: colors.muted }}>Nenhum equipamento disponível (todos já estão em contratos)</p>
              )}
              {equipment.filter((e) => !e.contractId).map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-xs" style={{ color: colors.ink }}>
                  <input
                    type="checkbox"
                    checked={newContract.equipmentIds.includes(e.id)}
                    onChange={() => toggleContractEquipment(e.id)}
                  />
                  {e.model} — {e.serial}
                </label>
              ))}
            </div>
          </Field>
        </Modal>
      )}
    </div>
  );
}
