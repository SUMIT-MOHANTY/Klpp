import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Minimal App.tsx inline for bootstrapping
import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('loading');

  useEffect(() => {
    fetch('/health')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(json => setStatus(json.status))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{ padding: 48 }}>
      <h1>Fin Insurance Sandbox</h1>
      <p>Backend status: <strong>{status}</strong></p>
    </div>
  );
};
export default App;
