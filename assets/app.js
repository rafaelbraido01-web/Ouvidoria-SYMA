const reportForm = document.querySelector('#report-form');
const anonymous = document.querySelector('#anonymous');
const contactFields = document.querySelector('#contact-fields');
const dialog = document.querySelector('#success-dialog');
const formError = document.querySelector('#form-error');
const reportsKey = 'syma-ouvidoria-local-reports';
const trackingPanel = document.querySelector('#tracking-panel');

function getReports() {
  try { return JSON.parse(localStorage.getItem(reportsKey) || '[]'); } catch { return []; }
}

function toggleContactFields() {
  contactFields.classList.toggle('is-hidden', anonymous.checked);
  contactFields.querySelectorAll('input').forEach((input) => input.disabled = anonymous.checked);
}

function generateProtocol() {
  return `SYM-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function generateKey() {
  return crypto.getRandomValues(new Uint32Array(2)).join('').slice(0, 10);
}

anonymous.addEventListener('change', toggleContactFields);
toggleContactFields();

reportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';
  const data = new FormData(reportForm);
  const description = data.get('description').trim();

  if (!data.get('category') || description.length < 20 || !data.get('consent')) {
    formError.textContent = 'Revise os campos obrigatórios e descreva o ocorrido com pelo menos 20 caracteres.';
    return;
  }

  const protocol = generateProtocol();
  const accessKey = generateKey();
  const report = {
    protocol,
    accessKey,
    status: 'Recebido',
    createdAt: new Date().toLocaleString('pt-BR'),
    createdAtIso: new Date().toISOString(),
    category: data.get('category'),
    area: data.get('area').trim(),
    description,
    ongoing: data.get('ongoing') === 'on',
    anonymous: data.get('anonymous') === 'on',
    name: data.get('anonymous') === 'on' ? '' : data.get('name').trim(),
    contact: data.get('anonymous') === 'on' ? '' : data.get('contact').trim(),
    history: [{ at: new Date().toLocaleString('pt-BR'), type: 'status', text: 'Relato recebido pelo canal.', status: 'Recebido' }]
  };

  localStorage.setItem(reportsKey, JSON.stringify([...getReports(), report]));
  document.querySelector('#new-protocol').textContent = protocol;
  document.querySelector('#new-key').textContent = accessKey;
  dialog.showModal();
  reportForm.reset();
  anonymous.checked = true;
  toggleContactFields();
});

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
}

function trackingStatusHelp(status) {
  if (status === 'Recebido') return 'Seu relato foi registrado e aguarda triagem inicial da equipe responsável.';
  if (status === 'Em análise') return 'O caso está em avaliação e pode gerar encaminhamentos internos conforme a necessidade.';
  if (status === 'Encaminhado') return 'O relato já foi direcionado para tratamento com a área responsável.';
  if (status === 'Concluído') return 'A etapa de tratamento registrada neste canal foi encerrada.';
  return 'Há uma atualização registrada para o seu relato.';
}

function ensureHistory(report) {
  return report.history?.length
    ? report.history
    : [{ at: report.createdAt || 'Data não disponível', type: 'status', text: 'Relato recebido pelo canal.', status: 'Recebido' }];
}

function renderTrackingHistory(history) {
  return history.slice().reverse().map((event) => {
    const statusText = event.status ? `<strong>${escapeHtml(event.status)}</strong>` : '<strong>Atualização</strong>';
    return `<li><div><span>${statusText}</span><p>${escapeHtml(event.text)}</p></div><small>${escapeHtml(event.at || 'Data não disponível')}</small></li>`;
  }).join('');
}

function fillTrackingPanel(report) {
  const history = ensureHistory(report);
  document.querySelector('#tracking-panel-title').textContent = `Protocolo ${report.protocol}`;
  const statusTag = document.querySelector('#tracking-status-tag');
  statusTag.textContent = report.status || 'Recebido';
  statusTag.className = `status-pill ${`status-${(report.status || 'Recebido').replaceAll(' ', '-')}`}`;
  document.querySelector('#tracking-created-at').textContent = report.createdAt || 'Não disponível';
  document.querySelector('#tracking-category').textContent = report.category || 'Não informado';
  document.querySelector('#tracking-area').textContent = report.area || 'Não informado';
  document.querySelector('#tracking-identity').textContent = report.anonymous ? 'Relato anônimo' : 'Relato identificado';
  document.querySelector('#tracking-status-text').textContent = report.status || 'Recebido';
  document.querySelector('#tracking-status-help').textContent = trackingStatusHelp(report.status || 'Recebido');
  document.querySelector('#tracking-ongoing-title').textContent = report.ongoing ? 'Situação ainda pode estar ocorrendo' : 'Sem indicação de continuidade';
  document.querySelector('#tracking-ongoing-text').textContent = report.ongoing
    ? 'O relato foi marcado com possibilidade de continuidade. A equipe deve priorizar a avaliação do risco informado.'
    : 'No envio deste relato não foi sinalizado risco de continuidade na situação descrita.';
  document.querySelector('#tracking-history').innerHTML = renderTrackingHistory(history);
  trackingPanel.classList.remove('is-hidden');
}

document.querySelector('#tracking-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const protocol = document.querySelector('#tracking-protocol').value.trim().toUpperCase();
  const accessKey = document.querySelector('#tracking-key').value.trim();
  const report = getReports().find((item) => item.protocol === protocol && item.accessKey === accessKey);
  const result = document.querySelector('#tracking-result');
  if (!report) {
    result.textContent = 'Não localizamos um relato com essas informações neste navegador.';
    result.classList.remove('found');
    trackingPanel.classList.add('is-hidden');
    document.querySelector('#tracking-history').innerHTML = '';
    return;
  }
  result.textContent = `Relato localizado. Veja abaixo a situação atual e o histórico do protocolo ${report.protocol}.`;
  result.classList.add('found');
  fillTrackingPanel(report);
});

function closeDialog() { dialog.close(); }
document.querySelector('#close-dialog').addEventListener('click', closeDialog);
document.querySelector('#done-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });