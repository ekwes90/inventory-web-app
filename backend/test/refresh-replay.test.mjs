import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';

// Test refresh token rotation and replay detection
test('refresh rotation: old refresh token cannot be reused', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Login
    let res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    if (res.status !== 200) throw new Error('login failed');
    const setCookie = res.headers.get('set-cookie') || '';
    const cookies = setCookie ? setCookie.split(/,(?=\s*[^=]+=)/).map(p => p.split(';')[0]).join('; ') : '';

    // extract refresh cookie value
    const refreshMatch = setCookie.match(/refreshToken=([^;\s]+)/);
    const refreshVal = refreshMatch ? refreshMatch[1] : null;
    if (!refreshVal) throw new Error('no refresh cookie returned');

    // Call refresh once: should succeed
    res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: cookies } });
    if (res.status !== 200) throw new Error('first refresh failed');

    // Attempt to reuse the old refresh cookie value - simulate by sending old refresh cookie
    const fakeCookie = `refreshToken=${refreshVal}`;
    res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: fakeCookie } });
    if (res.status === 200) throw new Error('replay of old refresh token should not succeed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
