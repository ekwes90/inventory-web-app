import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';

test('refresh rate limiting', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Login to get refresh token and deviceId
    let res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie') || '';
    const deviceId = (setCookie.match(/deviceId=([^;\s]+)/) || [])[1];
    const refresh = (setCookie.match(/refreshToken=([^;\s]+)/) || [])[1];

    // perform many refresh attempts quickly to exceed limit
    let lastStatus;
    for (let i = 0; i < 15; i++) {
      res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refresh}; deviceId=${deviceId}` } });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    assert.equal(lastStatus, 429, 'expected to hit rate limit and receive 429');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
