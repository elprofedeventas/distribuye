import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { ROLES, formatFecha, formatMonto } from '../utils/constants';
import { AlertTriangle, ClipboardList, Truck, CheckCircle, FileEdit, Package, Warehouse } from 'lucide-react';

export default function Dashboard() {
  const { usuario, alertas } = useApp();
  const { call } = useApi();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [incidenciasAbiertas, setIncidenciasAbiertas] = useState(0);
  const [loading, setLoading] = useState(true);

  const hoy = formatFecha(new Date().toISOString());

  useEffect(() => {
    Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
    ]).then(([ords, incs]) => {
      setOrdenes(ords || []);
      setIncidenciasAbiertas((incs || []).filter(i => i.estado === 'ABIERTA').length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const conteo = {
    pendientes:    ordenes.filter(o => o.estado === 'BORRADOR').length,
    confirmados:   ordenes.filter(o => o.estado === 'CONFIRMADA').length,
    preparacion:   ordenes.filter(o => o.estado === 'PROGRAMADA').length,
    transito:      ordenes.filter(o => o.estado === 'DESPACHADA').length,
    entregados:    ordenes.filter(o => o.estado === 'ENTREGADA' && formatFecha(o.fechaEntrega) === hoy).length,
  };

  const ventaHoy = ordenes
    .filter(o => o.estado === 'ENTREGADA' && formatFecha(o.fechaEntrega) === hoy)
    .reduce((sum, o) => sum + (isNaN(Number(o.total)) ? 0 : Number(o.total)), 0);

  // Semáforo: Azul = info, Naranja = en movimiento, Verde = completado
  const cardsDespachador = [
    { label: 'En preparación', value: conteo.preparacion, icon: Package,       color: '#D97706', path: '/despacho' },
    { label: 'En tránsito',    value: conteo.transito,    icon: Truck,          color: '#D97706', path: '/despacho' },
    { label: 'Entregados hoy', value: conteo.entregados,  icon: CheckCircle,    color: '#059669', path: '/despacho', state: { filtro: 'ENTREGADA' } },
    { label: 'Reclamos',       value: incidenciasAbiertas, icon: AlertTriangle, color: incidenciasAbiertas > 0 ? '#DC2626' : '#94a3b8', path: '/incidencias' },
    { label: 'Reposición',     value: alertas,             icon: Warehouse,     color: alertas > 0 ? '#DC2626' : '#94a3b8', path: '/inventario' },
  ];

  const cardsAdmin = [
    { label: 'Pendientes',     value: conteo.pendientes,   icon: FileEdit,      color: '#94a3b8', path: '/ordenes', state: { filtro: 'BORRADOR' } },
    { label: 'Confirmados',    value: conteo.confirmados,  icon: ClipboardList, color: '#1A56DB', path: '/ordenes', state: { filtro: 'CONFIRMADA' } },
    { label: 'En preparación', value: conteo.preparacion,  icon: Package,       color: '#D97706', path: '/despacho' },
    { label: 'En tránsito',    value: conteo.transito,     icon: Truck,         color: '#D97706', path: '/despacho' },
    { label: 'Entregados hoy', value: conteo.entregados,   icon: CheckCircle,   color: '#059669', path: '/ordenes', state: { filtro: 'ENTREGADA' } },
    { label: 'Reclamos',       value: incidenciasAbiertas, icon: AlertTriangle, color: incidenciasAbiertas > 0 ? '#DC2626' : '#94a3b8', path: '/incidencias' },
    { label: 'Reposición',     value: alertas,             icon: Warehouse,     color: alertas > 0 ? '#DC2626' : '#94a3b8', path: '/inventario' },
  ];

  const esDespachador = usuario?.rol === ROLES.DESPACHADOR;
  const cards = esDespachador ? cardsDespachador : cardsAdmin;

  return (
    <div className="page">
      <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 13 }}>
        Bienvenido, <strong style={{ color: 'var(--text)' }}>{usuario?.nombre}</strong>
      </p>

      {!esDespachador && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Venta entregada hoy</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
            {loading ? '—' : formatMonto(ventaHoy)}
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: esDespachador ? '1fr' : '1fr 1fr',
        gap: 12,
        marginBottom: 24,
      }}>
        {cards.map(({ label, value, icon: Icon, color, path, state }) => (
          <div key={label} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(path, { state })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: esDespachador ? 32 : 28, fontWeight: 700, color }}>
                  {loading ? '—' : value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
              </div>
              <Icon size={esDespachador ? 28 : 22} color={color} />
            </div>
          </div>
        ))}
      </div>

      {!esDespachador && usuario?.rol !== ROLES.GERENCIA && (
        <button className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/ordenes/nueva')}>
          + Nueva Orden
        </button>
      )}
    </div>
  );
}