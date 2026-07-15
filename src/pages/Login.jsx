import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Login failed: ${res.status}`);
      }
      const body = await res.json();
      // store access token in a non-HttpOnly cookie; refresh token is set as HttpOnly cookie by the server
      if (body.token) {
        document.cookie = 'inventory_token=' + encodeURIComponent(body.token) + '; path=/';
      }
      // navigate home
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        <h1>Login</h1>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 8 }}>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
          </div>
          {error && <div style={{ color: 'salmon', marginBottom: 8 }}>{error}</div>}
          <div>
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
