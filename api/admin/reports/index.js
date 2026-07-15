const {
  allowCors,
  getBearerToken,
  json,
  normalizeReport,
  readJson,
  supabaseFetch,
  verifyAdminToken
} = require('../../_lib');

module.exports = async (request, response) => {
  if (allowCors(request, response)) return;

  try {
    if (request.method === 'GET') {
      const token = getBearerToken(request);
      const session = verifyAdminToken(token);
      if (!session) return json(response, 401, { error: 'Sessão administrativa inválida.' });

      const rows = await supabaseFetch('/reports?select=*,report_history(*)&order=created_at.desc');
      return json(response, 200, { reports: rows.map(normalizeReport) });
    }

    if (request.method === 'POST') {
      const token = getBearerToken(request);
      const session = verifyAdminToken(token);
      if (!session) return json(response, 401, { error: 'Sessão administrativa inválida.' });

      const body = await readJson(request);
      const reportId = String(body.reportId || '').trim();
      const status = String(body.status || '').trim();
      const note = String(body.note || '').trim();

      if (!reportId || !status || note.length < 8) {
        return json(response, 400, { error: 'Informe o relato, o status e uma nota com pelo menos 8 caracteres.' });
      }

      await supabaseFetch(`/reports?id=eq.${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status })
      });

      await supabaseFetch('/report_history', {
        method: 'POST',
        body: JSON.stringify({
          report_id: reportId,
          status,
          note,
          created_by: session.username
        })
      });

      const rows = await supabaseFetch(`/reports?select=*,report_history(*)&id=eq.${encodeURIComponent(reportId)}`);
      return json(response, 200, { report: normalizeReport(rows[0]) });
    }

    return json(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(response, 500, { error: 'Não foi possível processar a solicitação administrativa.', details: error.message });
  }
};