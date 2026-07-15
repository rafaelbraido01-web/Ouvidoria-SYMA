const {
  allowCors,
  hashAccessKey,
  json,
  normalizeReport,
  readJson,
  supabaseFetch
} = require('../../_lib');

module.exports = async (request, response) => {
  if (allowCors(request, response)) return;
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(request);
    const protocol = String(body.protocol || '').trim().toUpperCase();
    const accessKey = String(body.accessKey || '').trim().toUpperCase();

    if (!protocol || !accessKey) {
      return json(response, 400, { error: 'Informe o protocolo e a chave de acesso.' });
    }

    const rows = await supabaseFetch(`/reports?select=*,report_history(*)&protocol=eq.${encodeURIComponent(protocol)}`);
    const report = rows[0];

    if (!report || report.access_key_hash !== hashAccessKey(accessKey)) {
      return json(response, 404, { error: 'Não localizamos um relato com essas informações.' });
    }

    return json(response, 200, { report: normalizeReport(report) });
  } catch (error) {
    return json(response, 500, { error: 'Não foi possível localizar o relato agora.', details: error.message });
  }
};