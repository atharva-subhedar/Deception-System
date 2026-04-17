import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [currentView, setCurrentView] = useState('LOGIN');
  const [password, setPassword] = useState('');
  const [tokens, setTokens] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tokenType, setTokenType] = useState('AWS_KEY');
  const [loading, setLoading] = useState(false);
  const [hackerInput, setHackerInput] = useState('');
  const [breachStatus, setBreachStatus] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') setCurrentView('ADMIN');
    else alert("Unauthorized Access.");
  };

  const fetchData = async () => {
    try {
      const tokenRes = await axios.get('http://localhost:5000/api/honeytokens');
      setTokens(tokenRes.data);
      const alertRes = await axios.get('http://localhost:5000/api/honeytokens/alerts');
      setAlerts(alertRes.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (currentView === 'ADMIN') {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  const generateToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/honeytokens/generate', { tokenType });
      fetchData(); 
    } catch (error) { alert("Generation failed."); }
    setLoading(false);
  };

  const simulateHack = async (e) => {
    e.preventDefault();
    setBreachStatus('AUTHENTICATING...');
    try {
      await axios.post('http://localhost:5000/api/honeytokens/breach', { stolenData: hackerInput });
    } catch (error) {
      setTimeout(() => setBreachStatus('CRITICAL ERROR: ACCESS DENIED. LOGGED.'), 1200);
    }
  };

  // --- STYLES ---
  const colors = {
    bg: '#0f172a',
    card: '#1e293b',
    accent: '#38bdf8',
    danger: '#ef4444',
    success: '#22c55e',
    text: '#f8fafc'
  };

  // --- LOGIN VIEW ---
  if (currentView === 'LOGIN') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: colors.bg, fontFamily: 'sans-serif' }}>
        <div style={{ background: colors.card, padding: '50px', borderRadius: '16px', border: `1px solid ${colors.accent}`, textAlign: 'center', boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}>
          <h1 style={{ color: colors.text, marginBottom: '10px' }}>🛡️ Sentinel-X</h1>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Deception Technology Core</p>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="System Key" value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', width: '250px', marginBottom: '20px', textAlign: 'center' }}
            /> <br/>
            <button style={{ padding: '12px 30px', background: colors.accent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ACCESS CONTROL</button>
          </form>
          <button onClick={() => setCurrentView('HONEYPOT')} style={{ marginTop: '20px', background: 'transparent', color: colors.accent, border: 'none', fontSize: '12px', cursor: 'pointer' }}>Enter Public Portal Mode</button>
        </div>
      </div>
    );
  }

  // --- HONEYPOT VIEW ---
  if (currentView === 'HONEYPOT') {
    return (
      <div style={{ height: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', padding: '15px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🌐 GlobalCorp Intranet</h3>
          <button onClick={() => setCurrentView('LOGIN')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Exit to Admin</button>
        </div>
        <div style={{ maxWidth: '600px', margin: '80px auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Cloud Resource Gateway</h2>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>Enter your assigned AWS Keys or Database strings to authorize your session.</p>
          <form onSubmit={simulateHack}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ACCESS CREDENTIALS</label>
            <input type="text" value={hackerInput} onChange={(e) => setHackerInput(e.target.value)} placeholder="e.g. AKIA..."
              style={{ width: '100%', padding: '15px', marginTop: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
            <button style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>AUTHORIZE ACCESS</button>
          </form>
          {breachStatus && (
            <div style={{ marginTop: '25px', padding: '15px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 'bold', textAlign: 'center' }}>{breachStatus}</div>
          )}
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Sentinel-X Command Center</h1>
          <p style={{ color: colors.accent, margin: 0, fontSize: '14px', letterSpacing: '1px' }}>ACTIVE DECEPTION LAYER</p>
        </div>
        <button onClick={() => setCurrentView('LOGIN')} style={{ padding: '10px 20px', borderRadius: '8px', background: colors.card, border: '1px solid #334155', color: colors.text, cursor: 'pointer' }}>Logout</button>
      </header>

      <div style={{ background: colors.card, padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid #334155' }}>
        <h3 style={{ marginTop: 0 }}>➕ Deploy New Asset</h3>
        <form onSubmit={generateToken} style={{ display: 'flex', gap: '15px' }}>
          <select value={tokenType} onChange={(e) => setTokenType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: colors.bg, border: '1px solid #334155', color: 'white', flex: 1 }}>
            <option value="AWS_KEY">AWS IAM Access Key</option>
            <option value="DB_CREDS">PostgreSQL Connection String</option>
            <option value="PDF_PIXEL">Tracking Beacon PDF</option>
          </select>
          <button style={{ background: colors.accent, color: colors.bg, border: 'none', padding: '0 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>DEPLOY TRAP</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* TRAPS COLUMN */}
        <section>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>🛰️ Deployed Traps</h2>
          {tokens.map(token => (
            <div key={token.tokenId} style={{ background: colors.card, borderRadius: '12px', padding: '20px', marginBottom: '15px', borderLeft: `4px solid ${token.status === 'ACTIVE' ? colors.success : colors.danger}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold' }}>{token.tokenType}</span>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: token.status === 'ACTIVE' ? '#064e3b' : '#7f1d1d', color: token.status === 'ACTIVE' ? '#4ade80' : '#f87171' }}>{token.status}</span>
              </div>
              <pre style={{ background: colors.bg, padding: '15px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid #1e293b', overflowX: 'auto' }}>
                {JSON.stringify(token.tokenData, null, 2)}
              </pre>
              <div style={{ marginTop: '15px' }}>
                {token.tokenType === 'PDF_PIXEL' ? (
                  <a href={`http://localhost:5000/api/honeytokens/download/${token.tokenId}`} style={{ textDecoration: 'none', padding: '8px 15px', background: colors.accent, color: colors.bg, borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Download PDF</a>
                ) : (
                  <button onClick={() => { navigator.clipboard.writeText(token.tokenType === 'AWS_KEY' ? token.tokenData.AccessKeyId : token.tokenData.ConnectionString); alert("Stolen data copied!"); }}
                    style={{ background: '#475569', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Copy Key</button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ALERTS COLUMN */}
        <section>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>⚠️ Intrusion Logs</h2>
          <div style={{ background: colors.card, borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
            {alerts.length === 0 ? (
              <p style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>System Secure. No threats.</p>
            ) : alerts.map(alert => (
              <div key={alert._id} style={{ padding: '15px', borderBottom: '1px solid #334155', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ color: colors.danger, fontWeight: 'bold', fontSize: '14px' }}>BREACH DETECTED</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>IP: {alert.attackerIp}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{new Date(alert.triggerTime).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;