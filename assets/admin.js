const reportsKey = 'syma-ouvidoria-local-reports';
const adminSessionKey = 'syma-ouvidoria-local-admin-session';
const loginView = document.querySelector('#login-view');
const adminApp = document.querySelector('#admin-app');
const reportList = document.querySelector('#report-list');
const reportDetail = document.querySelector('#report-detail');
const statusFilter = document.querySelector('#status-filter');
let selectedProtocol = null;

function getReports() {
  try { return JSON.parse(localStorage.getItem(reportsKey) || '[]'); } catch { return []; }
}

function saveReports(reports) {
  localStorage.setItem(reportsKey, JSON.stringify(reports));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

function statusClass(status) {
  return `status-${status.replaceAll(' ', '-')}`;
}

function sortReports(reports) {
  return [...reports].sort((first, second) => new Date(second.createdAtIso || 0) - new Date(first.createdAtIso || 0));
}

function getSelectedReport() {
  return getReports().find((report) => report.protocol === selectedProtocol);
}

function renderStats(reports) {
  document.querySelector('#stat-received').textContent = reports.filter((item) => item.status === 'Recebido').length;
  document.querySelector('#stat-review').textContent = reports.filter((item) => item.status === 'Em análise').length;
  document.querySelector('#stat-forwarded').textContent = reports.filter((item) => item.status === 'Encaminhado').length;
  document.querySelector('#stat-closed').textContent = reports.filter((item) => item.status === 'Concluído').length;
}

function renderList() {
  const reports = sortReports(getReports());
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
      <small>${escapeHtml(report.createdAt || 'Data não disponível')} · ${report.anonymous ? 'Anônimo' : 'Identificado'}</small>
    </button>`).join('');
}

function renderDetail() {
  const report = getSelectedReport();
  if (!report) {
    reportDetail.innerHTML = '<div class="empty-state"><h2>Selecione um relato</h2><p>A fila mostra os registros feitos neste navegador.</p></div>';
    return;
  }
  const history = report.history?.length ? report.history : [{ at: report.createdAt || 'Data não disponível', type: 'status', text: 'Relato recebido pelo canal.', status: 'Recebido' }];
  const identity = report.anonymous ? 'Relato anônimo' : (report.name || 'Identidade não informada');
  const contact = report.anonymous ? 'Não aplicável' : (report.contact || 'Não informado');
  reportDetail.innerHTML = `
    <div class="detail-top"><div><p class="eyebrow">RELATO ${escapeHtml(report.protocol)}</p><h2>${escapeHtml(report.category || 'Sem categoria')}</h2></div><span class="status-tag ${statusClass(report.status)}">${escapeHtml(report.status)}</span></div>
    <div class="detail-grid">
      <div><span>Recebido em</span><strong>${escapeHtml(report.createdAt || 'Não disponível')}</strong></div>
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
    <section class="history"><h3>Histórico de tratamento</h3><ol class="history-list">${history.slice().reverse().map((event) => `<li>${escapeHtml(event.text)}${event.status ? ` <strong>(${escapeHtml(event.status)})</strong>` : ''}<small>${escapeHtml(event.at)}</small></li>`).join('')}</ol></section>`;
  document.querySelector('#treatment-form').addEventListener('submit', saveTreatment);
}

function saveTreatment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const note = new FormData(form).get('note').trim();
  const error = document.querySelector('#treatment-error');
  if (note.length < 8) { error.textContent = 'Registre uma nota interna com pelo menos 8 caracteres.'; return; }
  const reports = getReports();
  const report = reports.find((item) => item.protocol === selectedProtocol);
  if (!report) return;
  const status = new FormData(form).get('status');
  report.status = status;
  report.history = report.history || [{ at: report.createdAt || 'Data não disponível', type: 'status', text: 'Relato recebido pelo canal.', status: 'Recebido' }];
  report.history.push({ at: new Date().toLocaleString('pt-BR'), type: 'treatment', text: note, status });
  saveReports(reports);
  renderList();
  renderDetail();
}

function refresh() { renderList(); renderDetail(); }

function showAdmin() {
  const session = sessionStorage.getItem(adminSessionKey);
  loginView.classList.toggle('is-hidden', Boolean(session));
  adminApp.classList.toggle('is-hidden', !session);
  if (session) { document.querySelector('#operator-name').textContent = 'Operador: ' + session; refresh(); }
}

document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = document.querySelector('#login-user').value.trim();
  const password = document.querySelector('#login-password').value;
  const error = document.querySelector('#login-error');
  if (user !== 'admin' || password !== 'syma.local') { error.textContent = 'Credenciais de demonstração inválidas.'; return; }
  sessionStorage.setItem(adminSessionKey, 'admin');
  showAdmin();
});

document.querySelector('#logout').addEventListener('click', () => { sessionStorage.removeItem(adminSessionKey); selectedProtocol = null; showAdmin(); });
reportList.addEventListener('click', (event) => { const button = event.target.closest('[data-protocol]'); if (!button) return; selectedProtocol = button.dataset.protocol; renderList(); renderDetail(); });
statusFilter.addEventListener('change', () => { selectedProtocol = null; renderList(); renderDetail(); });
document.querySelector('#refresh-reports').addEventListener('click', refresh);
showAdmin();
