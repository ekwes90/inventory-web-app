import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';

// Simple integration tests for auth and protected endpoints
test('login returns cookies and protected routes require authentication and roles', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Login as admin
    let res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    if (res.status !== 200) throw new Error('login failed with status ' + res.status);
    const body = await res.json();
    if (!body.user || body.user.username !== 'admin') throw new Error('unexpected login response');

    // extract Set-Cookie header(s) and build Cookie header for subsequent requests
    const setCookie = res.headers.get('set-cookie') || '';
    const parts = setCookie ? setCookie.split(/,(?=\s*[^=]+=)/) : [];
    const cookies = parts.map((p) => p.split(';')[0]).join('; ');

    // Protected route without cookie should be 401
    res = await fetch(`${base}/api/items`);
    if (res.status !== 401) throw new Error('expected 401 for unauthenticated items');

    // Protected route with cookie should be 200
    res = await fetch(`${base}/api/items`, { headers: { Cookie: cookies } });
    if (res.status !== 200) throw new Error('expected 200 for authenticated items');

    // Role-based tests
    // Create an item as admin (should succeed)
    res = await fetch(`${base}/api/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookies }, body: JSON.stringify({ name: 'x', sku: 'x' }) });
    if (res.status !== 201) throw new Error('admin should be able to create items');
    const created = await res.json();

    // Login as staff
    res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'staff123' }),
      credentials: 'include'
    });
    if (res.status !== 200) throw new Error('staff login failed');
    const staffBody = await res.json();
    const staffSetCookie = res.headers.get('set-cookie') || '';
    const staffParts = staffSetCookie ? staffSetCookie.split(/,(?=\s*[^=]+=)/) : [];
    const staffCookies = staffParts.map((p) => p.split(';')[0]).join('; ');

    // Staff attempting to delete should be forbidden (403)
    res = await fetch(`${base}/api/items/${created.id}`, { method: 'DELETE', headers: { Cookie: staffCookies } });
    if (res.status !== 403) throw new Error('staff should not be allowed to delete items');

    // Admin can delete
    res = await fetch(`${base}/api/items/${created.id}`, { method: 'DELETE', headers: { Cookie: cookies } });
    if (res.status !== 204) throw new Error('admin should be able to delete items');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
