import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USUARIOS } from '../utils/constants';

const ROLE_LABELS = {
  gerencia: 'Gerencia',
  ventas: 'Ventas',
  operaciones: 'Operaciones',
  despachador: 'Despachador',
};

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

      <div className="card" style={{ width: '100%', maxWidth: 360 }}>
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
        <button className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          onClick={handleLogin}>
          Ingresar
        </button>

        {/* Tabla de usuarios */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Usuarios
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {USUARIOS.map(u => (
              <div key={u.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 8,
                  background: 'var(--surface2)', cursor: 'pointer',
                }}
                onClick={() => { setPin(u.pin); setError(''); }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{ROLE_LABELS[u.rol] || u.rol}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: 'var(--primary)' }}>
                  {u.pin}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}