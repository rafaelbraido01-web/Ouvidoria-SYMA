const reportForm = document.querySelector('#report-form');
const anonymous = document.querySelector('#anonymous');
const contactFields = document.querySelector('#contact-fields');
const dialog = document.querySelector('#success-dialog');
const formError = document.querySelector('#form-error');
const trackingPanel = document.querySelector('#tracking-panel');

function toggleContactFields() {
  contactFields.classList.toggle('is-hidden', anonymous.checked);
  contactFields.querySelectorAll('input').forEach((input) => input.disabled = anonymous.checked);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
}

function trackingStatusHelp(status) {
  if (status === 'Recebido') return 'Seu relato foi registrado e aguarda triagem inicial da equipe respons\u00E1vel.';
  if (status === 'Em an\u00E1lise') return 'O caso est\u00E1 em avalia\u00E7\u00E3o e pode gerar encaminhamentos internos conforme a necessidade.';
  if (status === 'Encaminhado') return 'O relato j\u00E1 foi direcionado para tratamento com a \u00E1rea respons\u00E1vel.';
  if (status === 'Conclu\u00EDdo') return 'A etapa de tratamento registrada neste canal foi encerrada.';
  return 'H\u00E1 uma atualiza\u00E7\u00E3o registrada para o seu relato.';
}

function formatDate(value) {
  if (!value) return 'N\u00E3o dispon\u00EDvel';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function renderTrackingHistory(history) {
  return history.slice().reverse().map((event) => {
    const statusText = event.status ? `<strong>${escapeHtml(event.status)}</strong>` : '<strong>Atualiza\u00E7\u00E3o</strong>';
    return `<li><div><span>${statusText}</span><p>${escapeHtml(event.text)}</p></div><small>${escapeHtml(formatDate(event.at))}</small></li>`;
  }).join('');
}

function fillTrackingPanel(report) {
  document.querySelector('#tracking-panel-title').textContent = `Protocolo ${report.protocol}`;
  const statusTag = document.querySelector('#tracking-status-tag');
  statusTag.textContent = report.status || 'Recebido';
  statusTag.className = `status-pill ${`status-${(report.status || 'Recebido').replaceAll(' ', '-')}`}`;
  document.querySelector('#tracking-created-at').textContent = formatDate(report.createdAt);
  document.querySelector('#tracking-category').textContent = report.category || 'N\u00E3o informado';
  document.querySelector('#tracking-area').textContent = report.area || 'N\u00E3o informado';
  document.querySelector('#tracking-identity').textContent = report.anonymous ? 'Relato an\u00F4nimo' : 'Relato identificado';
  document.querySelector('#tracking-status-text').textContent = report.status || 'Recebido';
  document.querySelector('#tracking-status-help').textContent = trackingStatusHelp(report.status || 'Recebido');
  document.querySelector('#tracking-ongoing-title').textContent = report.ongoing ? 'Situa\u00E7\u00E3o ainda pode estar ocorrendo' : 'Sem indica\u00E7\u00E3o de continuidade';
  document.querySelector('#tracking-ongoing-text').textContent = report.ongoing
    ? 'O relato foi marcado com possibilidade de continuidade. A equipe deve priorizar a avalia\u00E7\u00E3o do risco informado.'
    : 'No envio deste relato n\u00E3o foi sinalizado risco de continuidade na situa\u00E7\u00E3o descrita.';
  document.querySelector('#tracking-history').innerHTML = renderTrackingHistory(report.history || []);
  trackingPanel.classList.remove('is-hidden');
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = data.details ? ` Detalhes: ${data.details}` : '';
    throw new Error((data.error || 'Falha na comunica\u00E7\u00E3o com o servidor.') + details);
  }
  return data;
}

anonymous.addEventListener('change', toggleContactFields);
toggleContactFields();

reportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  const submitButton = reportForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const data = new FormData(reportForm);
    const description = data.get('description').trim();

    if (!data.get('category') || description.length < 20 || !data.get('consent')) {
      throw new Error('Revise os campos obrigat\u00F3rios e descreva o ocorrido com pelo menos 20 caracteres.');
    }

    const result = await postJson('/api/reports', {
      category: data.get('category'),
      area: data.get('area').trim(),
      description,
      ongoing: data.get('ongoing') === 'on',
      anonymous: data.get('anonymous') === 'on',
      name: data.get('anonymous') === 'on' ? '' : data.get('name').trim(),
      contact: data.get('anonymous') === 'on' ? '' : data.get('contact').trim()
    });

    document.querySelector('#new-protocol').textContent = result.protocol;
    document.querySelector('#new-key').textContent = result.accessKey;
    dialog.showModal();
    reportForm.reset();
    anonymous.checked = true;
    toggleContactFields();
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#tracking-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const protocol = document.querySelector('#tracking-protocol').value.trim().toUpperCase();
  const accessKey = document.querySelector('#tracking-key').value.trim().toUpperCase();
  const result = document.querySelector('#tracking-result');

  try {
    const data = await postJson('/api/reports/track', { protocol, accessKey });
    result.textContent = `Relato localizado. Veja abaixo a situa\u00E7\u00E3o atual e o hist\u00F3rico do protocolo ${data.report.protocol}.`;
    result.classList.add('found');
    fillTrackingPanel(data.report);
  } catch (error) {
    result.textContent = error.message;
    result.classList.remove('found');
    trackingPanel.classList.add('is-hidden');
    document.querySelector('#tracking-history').innerHTML = '';
  }
});

function closeDialog() { dialog.close(); }
document.querySelector('#close-dialog').addEventListener('click', closeDialog);
document.querySelector('#done-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });