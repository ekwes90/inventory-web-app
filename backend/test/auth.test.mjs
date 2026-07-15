import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';

// Simple integration tests for auth and protected endpoints
test('login returns access token and protected routes require it', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Login
    let res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      // include credentials to receive refresh cookie
      credentials: 'include'
    });
    if (res.status !== 200) throw new Error('login failed with status ' + res.status);
    const body = await res.json();
    if (!body.token) throw new Error('no access token returned');

    // Protected route without token
    res = await fetch(`${base}/api/items`);
    if (res.status !== 401) throw new Error('expected 401 for unauthenticated items');

    // Protected route with token
    res = await fetch(`${base}/api/items`, {
      headers: { Authorization: 'Bearer ' + body.token }
    });
    if (res.status !== 200) throw new Error('expected 200 for authenticated items');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
