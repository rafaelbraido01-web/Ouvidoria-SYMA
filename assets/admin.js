const adminSessionKey = 'syma-ouvidoria-admin-token';
const loginView = document.querySelector('#login-view');
const adminApp = document.querySelector('#admin-app');
const reportList = document.querySelector('#report-list');
const reportDetail = document.querySelector('#report-detail');
const statusFilter = document.querySelector('#status-filter');
let selectedProtocol = null;
let loadedReports = [];

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

function statusClass(status) {
  return `status-${status.replaceAll(' ', '-')}`;
}

function formatDate(value) {
  if (!value) return 'Data não disponível';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function sortReports(reports) {
  return [...reports].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
}

function getSelectedReport() {
  return loadedReports.find((report) => report.protocol === selectedProtocol);
}

function getToken() {
  return sessionStorage.getItem(adminSessionKey) || '';
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha na comunicação com o servidor.');
  return data;
}

function renderStats(reports) {
  document.querySelector('#stat-received').textContent = reports.filter((item) => item.status === 'Recebido').length;
  document.querySelector('#stat-review').textContent = reports.filter((item) => item.status === 'Em análise').length;
  document.querySelector('#stat-forwarded').textContent = reports.filter((item) => item.status === 'Encaminhado').length;
  document.querySelector('#stat-closed').textContent = reports.filter((item) => item.status === 'Concluído').length;
}

function renderList() {
  const reports = sortReports(loadedReports);
  const filtered = statusFilter.value === 'Todos' ? reports : reports.filter((report) => report.status === statusFilter.value);
  renderStats(reports);
  if (!filtered.length) {
    reportList.innerHTML = '<div class="empty-state"><h2>Nenhum relato</h2><p>Não há registros para este filtro.</p></div>';
    return;
  }
  reportList.innerHTML = filtered.map((report) => `
    <button class="report-item ${report.protocol === selectedProtocol ? 'active' : ''}" type="button" data-protocol="${escapeHtml(report.protocol)}">
      <span class="report-item-header"><strong>${escapeHtml(report.protocol)}</strong><span class="status-tag ${statusClass(report.status)}">${escapeHtml(report.status)}</span></span>
      <p>${escapeHtml(report.category || 'Sem categoria')}</p>
      <small>${escapeHtml(formatDate(report.createdAt))} · ${report.anonymous ? 'Anônimo' : 'Identificado'}</small>
    </button>`).join('');
}

function renderDetail() {
  const report = getSelectedReport();
  if (!report) {
    reportDetail.innerHTML = '<div class="empty-state"><h2>Selecione um relato</h2><p>A fila mostra os registros gravados no banco do projeto.</p></div>';
    return;
  }
  const history = report.history?.length ? report.history : [{ at: report.createdAt || 'Data não disponível', text: 'Relato recebido pelo canal.', status: 'Recebido' }];
  const identity = report.anonymous ? 'Relato anônimo' : (report.name || 'Identidade não informada');
  const contact = report.anonymous ? 'Não aplicável' : (report.contact || 'Não informado');
  reportDetail.innerHTML = `
    <div class="detail-top"><div><p class="eyebrow">RELATO ${escapeHtml(report.protocol)}</p><h2>${escapeHtml(report.category || 'Sem categoria')}</h2></div><span class="status-tag ${statusClass(report.status)}">${escapeHtml(report.status)}</span></div>
    <div class="detail-grid">
      <div><span>Recebido em</span><strong>${escapeHtml(formatDate(report.createdAt))}</strong></div>
      <div><span>Área/local</span><strong>${escapeHtml(report.area || 'Não informado')}</strong></div>
      <div><span>Identificação</span><strong>${escapeHtml(identity)}</strong></div>
      <div><span>Contato</span><strong>${escapeHtml(contact)}</strong></div>
      <div><span>Risco em continuidade</span><strong>${report.ongoing ? 'Sim — avaliar prioridade' : 'Não informado'}</strong></div>
      <div><span>Chave de acesso</span><strong>Protegida — não exibida ao operador</strong></div>
    </div>
    <section class="description-box"><h3>Descrição do relato</h3><p>${escapeHtml(report.description)}</p></section>
    <form id="treatment-form" class="treatment-form">
      <h3>Registrar tratamento</h3>
      <label>Atualizar situação<select name="status"><option ${report.status === 'Recebido' ? 'selected' : ''}>Recebido</option><option ${report.status === 'Em análise' ? 'selected' : ''}>Em análise</option><option ${report.status === 'Encaminhado' ? 'selected' : ''}>Encaminhado</option><option ${report.status === 'Concluído' ? 'selected' : ''}>Concluído</option></select></label>
      <label>Nota interna obrigatória<textarea name="note" minlength="8" maxlength="2000" required placeholder="Registre a decisão, encaminhamento ou próxima ação. Não inclua dados desnecessários."></textarea></label>
      <p id="treatment-error" class="form-error" role="alert"></p>
      <button class="button button-primary" type="submit">Salvar atualização no histórico</button>
    </form>
    <section class="history"><h3>Histórico de tratamento</h3><ol class="history-list">${history.slice().reverse().map((event) => `<li>${escapeHtml(event.text)}${event.status ? ` <strong>(${escapeHtml(event.status)})</strong>` : ''}<small>${escapeHtml(formatDate(event.at))}</small></li>`).join('')}</ol></section>`;
  document.querySelector('#treatment-form').addEventListener('submit', saveTreatment);
}

async function refresh() {
  try {
    const data = await apiRequest('/api/admin/reports');
    loadedReports = data.reports || [];
    renderList();
    renderDetail();
  } catch (error) {
    if (/Sessão administrativa inválida/.test(error.message)) {
      sessionStorage.removeItem(adminSessionKey);
      selectedProtocol = null;
      showAdmin();
      return;
    }
    reportList.innerHTML = `<div class="empty-state"><h2>Falha ao carregar</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function showAdmin() {
  const session = getToken();
  loginView.classList.toggle('is-hidden', Boolean(session));
  adminApp.classList.toggle('is-hidden', !session);
  if (session) {
    document.querySelector('#operator-name').textContent = 'Operador autenticado';
    refresh();
  }
}

async function saveTreatment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const note = new FormData(form).get('note').trim();
  const status = new FormData(form).get('status');
  const error = document.querySelector('#treatment-error');
  error.textContent = '';
  const report = getSelectedReport();
  if (!report) return;
  if (note.length < 8) { error.textContent = 'Registre uma nota interna com pelo menos 8 caracteres.'; return; }

  try {
    const data = await apiRequest('/api/admin/reports', {
      method: 'POST',
      body: JSON.stringify({ reportId: report.id, status, note })
    });
    loadedReports = loadedReports.map((item) => item.id === data.report.id ? data.report : item);
    renderList();
    renderDetail();
  } catch (requestError) {
    error.textContent = requestError.message;
  }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.querySelector('#login-user').value.trim();
  const password = document.querySelector('#login-password').value;
  const error = document.querySelector('#login-error');
  error.textContent = '';

  try {
    const data = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    sessionStorage.setItem(adminSessionKey, data.token);
    showAdmin();
  } catch (requestError) {
    error.textContent = requestError.message;
  }
});

document.querySelector('#logout').addEventListener('click', () => {
  sessionStorage.removeItem(adminSessionKey);
  selectedProtocol = null;
  loadedReports = [];
  showAdmin();
});
reportList.addEventListener('click', (event) => { const button = event.target.closest('[data-protocol]'); if (!button) return; selectedProtocol = button.dataset.protocol; renderList(); renderDetail(); });
statusFilter.addEventListener('change', () => { selectedProtocol = null; renderList(); renderDetail(); });
document.querySelector('#refresh-reports').addEventListener('click', refresh);
showAdmin();