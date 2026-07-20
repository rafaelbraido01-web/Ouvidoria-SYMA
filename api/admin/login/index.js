const {
  allowCors,
  createAdminToken,
  json,
  readJson,
  getEnv
} = require('../../_lib');

function getAllowedAdminUsers() {
  const raw = process.env.ADMIN_ALLOWED_USERS || process.env.ADMIN_USERNAME || '';
  const users = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!users.length) {
    throw new Error('Missing environment variable: ADMIN_ALLOWED_USERS or ADMIN_USERNAME');
  }

  return new Set(users);
}

module.exports = async (request, response) => {
  if (allowCors(request, response)) return;
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(request);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const allowedUsers = getAllowedAdminUsers();
    const expectedPassword = getEnv('ADMIN_PASSWORD');

    if (!allowedUsers.has(username) || password !== expectedPassword) {
      return json(response, 401, { error: 'Credenciais administrativas inválidas.' });
    }

    return json(response, 200, {
      token: createAdminToken(username),
      username
    });
  } catch (error) {
    return json(response, 500, { error: 'Não foi possível iniciar a sessão administrativa.', details: error.message });
  }
};