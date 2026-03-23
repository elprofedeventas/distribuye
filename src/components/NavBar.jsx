import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import {
  LayoutDashboard, Users, Package, Warehouse,
  ClipboardList, Truck, AlertTriangle, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/canales', label: 'Clientes', icon: Users, roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: '/productos', label: 'Productos', icon: Package, roles: [ROLES.ADMIN] },
  { path: '/inventario', label: 'Inventario', icon: Warehouse, roles: [ROLES.ADMIN] },
  { path: '/ordenes', label: 'Órdenes', icon: ClipboardList, roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: '/despacho', label: 'Despacho', icon: Truck, roles: [ROLES.ADMIN, ROLES.DESPACHADOR] },
  { path: '/incidencias', label: 'Incidencias', icon: AlertTriangle, roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout, alertas } = useApp();

  const visible = navItems.filter(i => !i.roles || i.roles.includes(usuario?.rol));

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        padding: '8px 4px 12px',
      }}>
        {visible.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          const isInv = path === '/inventario';
          return (
            <button key={path} onClick={() => navigate(path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, background: 'none', padding: '4px 12px',
              color: active ? 'var(--primary)' : 'var(--text2)',
              position: 'relative', flexShrink: 0,
              minWidth: 60,
            }}>
              <Icon size={20} />
              {isInv && alertas > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 8,
                  background: 'var(--danger)', color: '#fff',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>{alertas}</span>
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </button>
          );
        })}
        <button onClick={logout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, background: 'none', padding: '4px 12px',
          color: 'var(--text2)', flexShrink: 0, minWidth: 60,
        }}>
          <LogOut size={20} />
          <span style={{ fontSize: 10, whiteSpace: 'nowrap' }}>Salir</span>
        </button>
      </div>
    </nav>
  );
}
