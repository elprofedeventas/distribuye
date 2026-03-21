import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { usuario } = useApp();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
          DISTRIBUYE
        </span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          {usuario?.nombre} · <span style={{ color: 'var(--primary)' }}>{usuario?.rol}</span>
        </span>
      </header>
      <main>
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}