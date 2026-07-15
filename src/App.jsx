import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function App() {
  const [status, setStatus] = useState('Checking backend...');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((body) => {
        if (body.status === 'ok') {
          setStatus('Backend is running. Ready to build inventory workflows.');
        } else {
          setStatus('Backend responded but returned an unexpected status.');
        }
      })
      .catch(() => {
        setStatus('Backend is unavailable. Start the backend with npm run dev:backend.');
      });

    // Ask server who the current user is. Server will read HttpOnly access cookie.
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((b) => { if (b.user) setUser(b.user); })
      .catch(() => { /* ignore */ });
  }, []);

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Inventory MVP scaffold</p>
        <h1>Inventory Web App</h1>
        <p>{status}</p>
        <div className="button-row">
          {user ? (
            <button type="button" onClick={() => { fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => { setUser(null); setStatus('Logged out'); }); }}>
              Logout
            </button>
          ) : (
            <Link to="/login"><button type="button">Login</button></Link>
          )}
          <button type="button">View items</button>
        </div>
      </section>
    </main>
  );
}

export default App;
