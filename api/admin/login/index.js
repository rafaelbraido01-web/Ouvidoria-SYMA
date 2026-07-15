const {
  allowCors,
  createAdminToken,
  json,
  readJson
} = require('../../_lib');

module.exports = async (request, response) => {
  if (allowCors(request, response)) return;
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(request);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'syma.local';

    if (username !== expectedUser || password !== expectedPassword) {
      return json(response, 401, { error: 'Credenciais de demonstração inválidas.' });
    }

    return json(response, 200, {
      token: createAdminToken(username),
      username
    });
  } catch (error) {
    return json(response, 500, { error: 'Não foi possível iniciar a sessão administrativa.', details: error.message });
  }
};