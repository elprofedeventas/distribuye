import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, ROLES } from '../utils/constants';
import { AlertTriangle, ClipboardList, Truck, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { usuario, inventario, alertas } = useApp();
  const { call } = useApi();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    call('getOrdenes').then(data => {
      setOrdenes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const conteo = {
    confirmadas: ordenes.filter(o => o.estado === 'CONFIRMADA').length,
    programadas: ordenes.filter(o => o.estado === 'PROGRAMADA').length,
    despachadas: ordenes.filter(o => o.estado === 'DESPACHADA').length,
    entregadas: ordenes.filter(o => o.estado === 'ENTREGADA').length,
  };

  const cards = [
    { label: 'Por despachar', value: conteo.confirmadas + conteo.programadas, icon: ClipboardList, color: 'var(--warning)', path: '/ordenes' },
    { label: 'En camino', value: conteo.despachadas, icon: Truck, color: 'var(--purple)', path: '/despacho' },
    { label: 'Entregadas hoy', value: conteo.entregadas, icon: CheckCircle, color: 'var(--success)', path: '/ordenes' },
    { label: 'Alertas stock', value: alertas, icon: AlertTriangle, color: alertas > 0 ? 'var(--danger)' : 'var(--text2)', path: '/inventario' },
  ];

  return (
    <div className="page">
      <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 13 }}>
        Bienvenido, <strong style={{ color: 'var(--text)' }}>{usuario?.nombre}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {cards.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(path)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{loading ? '—' : value}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
              </div>
              <Icon size={20} color={color} />
            </div>
          </div>
        ))}
      </div>

      {alertas > 0 && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16, cursor: 'pointer' }}
          onClick={() => navigate('/inventario')}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {alertas} producto{alertas > 1 ? 's' : ''} bajo stock mínimo
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Toca para ver inventario</div>
            </div>
          </div>
        </div>
      )}

      {usuario?.rol !== ROLES.DESPACHADOR && (
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/ordenes/nueva')}>
          + Nueva Orden
        </button>
      )}
    </div>
  );
}