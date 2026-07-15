import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Checking backend...');

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
  }, []);

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Inventory MVP scaffold</p>
        <h1>Inventory Web App</h1>
        <p>{status}</p>
        <div className="button-row">
          <button type="button">Login</button>
          <button type="button">View items</button>
        </div>
      </section>
    </main>
  );
}

export default App;
