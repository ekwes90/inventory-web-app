import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';
import jwt from 'jsonwebtoken';

// Ensure revocation is device-scoped
test('device-scoped refresh revocation', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Login from device A
    let res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    assert.equal(res.status, 200);
    const setCookieA = res.headers.get('set-cookie') || '';
    const deviceIdA = (setCookieA.match(/deviceId=([^;\s]+)/) || [])[1];
    const refreshA = (setCookieA.match(/refreshToken=([^;\s]+)/) || [])[1];

    // Login from device B
    res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    assert.equal(res.status, 200);
    const setCookieB = res.headers.get('set-cookie') || '';
    const deviceIdB = (setCookieB.match(/deviceId=([^;\s]+)/) || [])[1];
    const refreshB = (setCookieB.match(/refreshToken=([^;\s]+)/) || [])[1];

    // Use refresh A to rotate (valid)
    res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refreshA}; deviceId=${deviceIdA}` } });
    assert.equal(res.status, 200);

    // Attempt to reuse old refreshA (replay) - should fail and revoke tokens for device A only
    res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refreshA}; deviceId=${deviceIdA}` } });
    assert.equal(res.status, 401);

    // Now refreshB (device B) should still succeed
    res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refreshB}; deviceId=${deviceIdB}` } });
    assert.equal(res.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
