import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USUARIOS } from '../utils/constants';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const user = USUARIOS.find(u => u.pin === pin);
    if (!user) { setError('PIN incorrecto'); return; }
    login(user);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>DISTRIBUYE</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Control de distribución</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 320 }}>
        <div className="form-group">
          <label>PIN de acceso</label>
          <input
            type="password"
            inputMode="numeric"
            placeholder="····"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ fontSize: 24, textAlign: 'center', letterSpacing: 8 }}
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin}>
          Ingresar
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
          Admin: 1111 · Vendedor: 2222 · Despachador: 3333
        </div>
      </div>
    </div>
  );
}