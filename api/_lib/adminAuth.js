const crypto = require('crypto');

const COOKIE_NAME = 'jagal_admin';

function b64(v) {
  return Buffer.from(v).toString('base64url');
}

function unb64(v) {
  return Buffer.from(v, 'base64url').toString();
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || 'change-me';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createToken(email) {
  const exp = Date.now() + 1000 * 60 * 60 * 12;
  const payload = JSON.stringify({ email, exp });
  const encoded = b64(payload);
  return encoded + '.' + sign(encoded);
}

function verifyToken(token) {
  if (!token) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = sign(encoded);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const payload = JSON.parse(unb64(encoded));
  if (!payload?.email || !payload?.exp || payload.exp < Date.now()) return null;
  return payload;
}

function parseCookies(header) {
  return Object.fromEntries((header || '').split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const i=x.indexOf('=');
    return i<0 ? [x,''] : [x.slice(0,i), decodeURIComponent(x.slice(i+1))];
  }));
}

function getAdminUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifyToken(cookies[COOKIE_NAME]);
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

module.exports = { createToken, getAdminUser, setAuthCookie, clearAuthCookie };
