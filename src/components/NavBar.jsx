import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import {
  LayoutDashboard, Users, Package, Warehouse,
  ClipboardList, Truck, AlertTriangle, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/canales', label: 'Canales', icon: Users, roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: '/productos', label: 'Productos', icon: Package, roles: [ROLES.ADMIN] },
  { path: '/inventario', label: 'Inventario', icon: Warehouse, roles: [ROLES.ADMIN] },
  { path: '/ordenes', label: 'Órdenes', icon: ClipboardList, roles: [ROLES.ADMIN, ROLES.VENDEDOR] },
  { path: '/despacho', label: 'Despacho', icon: Truck, roles: [ROLES.ADMIN, ROLES.DESPACHADOR] },
  { path: '/incidencias', label: 'Incidencias', icon: AlertTriangle, roles: [ROLES.ADMIN] },
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
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 12px', zIndex: 50,
    }}>
      {visible.map(({ path, label, icon: Icon, roles }) => {
        const active = location.pathname === path;
        const isInv = path === '/inventario';
        return (
          <button key={path} onClick={() => navigate(path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', padding: '4px 8px',
            color: active ? 'var(--primary)' : 'var(--text2)',
            position: 'relative',
          }}>
            <Icon size={20} />
            {isInv && alertas > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 4,
                background: 'var(--danger)', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>{alertas}</span>
            )}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
      <button onClick={logout} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 3, background: 'none', padding: '4px 8px', color: 'var(--text2)',
      }}>
        <LogOut size={20} />
        <span style={{ fontSize: 10 }}>Salir</span>
      </button>
    </nav>
  );
}