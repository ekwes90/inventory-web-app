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

    const getCookie = (name) => {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    };

    const token = getCookie('inventory_token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
        .then((r) => r.json())
        .then((b) => { if (b.user) setUser(b.user); })
        .catch(() => { /* ignore */ });
    }
  }, []);

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Inventory MVP scaffold</p>
        <h1>Inventory Web App</h1>
        <p>{status}</p>
        <div className="button-row">
          {user ? (
            <button type="button" onClick={() => { fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => { document.cookie = 'inventory_token=; path=/; Max-Age=0'; setUser(null); setStatus('Logged out'); }); }}>
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
