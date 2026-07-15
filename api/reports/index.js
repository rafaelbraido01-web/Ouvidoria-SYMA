const {
  allowCors,
  generateAccessKey,
  generateProtocol,
  hashAccessKey,
  json,
  readJson,
  supabaseFetch
} = require('../_lib');

module.exports = async (request, response) => {
  if (allowCors(request, response)) return;
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(request);
    const description = String(body.description || '').trim();
    const category = String(body.category || '').trim();

    if (!category || description.length < 20) {
      return json(response, 400, { error: 'Revise os campos obrigatórios e descreva o ocorrido com pelo menos 20 caracteres.' });
    }

    const protocol = generateProtocol();
    const accessKey = generateAccessKey();
    const accessKeyHash = hashAccessKey(accessKey);

    const inserted = await supabaseFetch('/reports', {
      method: 'POST',
      body: JSON.stringify({
        protocol,
        access_key_hash: accessKeyHash,
        status: 'Recebido',
        category,
        area: String(body.area || '').trim(),
        description,
        ongoing: Boolean(body.ongoing),
        anonymous: Boolean(body.anonymous),
        name: body.anonymous ? '' : String(body.name || '').trim(),
        contact: body.anonymous ? '' : String(body.contact || '').trim()
      })
    });

    const report = inserted[0];

    await supabaseFetch('/report_history', {
      method: 'POST',
      body: JSON.stringify({
        report_id: report.id,
        status: 'Recebido',
        note: 'Relato recebido pelo canal.',
        created_by: 'system'
      })
    });

    return json(response, 201, { protocol, accessKey });
  } catch (error) {
    return json(response, 500, { error: 'Não foi possível registrar o relato agora.', details: error.message });
  }
};