const crypto = require('crypto');

function json(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function allowCors(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return true;
  }
  return false;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getSupabaseConfig() {
  return {
    url: getEnv('SUPABASE_URL'),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY')
  };
}

async function supabaseFetch(path, options = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST error ${response.status}: ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function generateProtocol() {
  return `SYM-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function generateAccessKey() {
  return crypto.randomBytes(8).toString('hex').slice(0, 10).toUpperCase();
}

function hashAccessKey(accessKey) {
  return crypto.createHash('sha256').update(String(accessKey)).digest('hex');
}

function createAdminToken(username) {
  const secret = process.env.ADMIN_SESSION_SECRET || getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const payload = JSON.stringify({ username, exp: Date.now() + 1000 * 60 * 60 * 8 });
  const base64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64).digest('base64url');
  return `${base64}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) return null;
  const [base64, signature] = token.split('.');
  const secret = process.env.ADMIN_SESSION_SECRET || getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const expected = crypto.createHmac('sha256', secret).update(base64).digest('base64url');
  if (signature !== expected) return null;
  const payload = JSON.parse(Buffer.from(base64, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function getBearerToken(request) {
  const header = request.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function normalizeReport(record) {
  return {
    id: record.id,
    protocol: record.protocol,
    status: record.status,
    createdAt: record.created_at,
    category: record.category,
    area: record.area || '',
    ongoing: Boolean(record.ongoing),
    anonymous: Boolean(record.anonymous),
    name: record.anonymous ? '' : (record.name || ''),
    contact: record.anonymous ? '' : (record.contact || ''),
    description: record.description,
    history: Array.isArray(record.report_history)
      ? record.report_history
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((item) => ({
            at: item.created_at,
            text: item.note,
            status: item.status || record.status,
            createdBy: item.created_by || null
          }))
      : []
  };
}

module.exports = {
  allowCors,
  createAdminToken,
  generateAccessKey,
  generateProtocol,
  getBearerToken,
  hashAccessKey,
  json,
  normalizeReport,
  readJson,
  supabaseFetch,
  verifyAdminToken
};