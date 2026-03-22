import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, ROLES, formatFecha } from '../utils/constants';
import { AlertTriangle, ClipboardList, Truck, CheckCircle, FileEdit, Package } from 'lucide-react';

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
    borradores: ordenes.filter(o => o.estado === 'BORRADOR').length,
    confirmadas: ordenes.filter(o => o.estado === 'CONFIRMADA').length,
    programadas: ordenes.filter(o => o.estado === 'PROGRAMADA').length,
    despachadas: ordenes.filter(o => o.estado === 'DESPACHADA').length,
    entregadas: ordenes.filter(o =>
      o.estado === 'ENTREGADA' && formatFecha(o.fechaEntrega) === hoy
    ).length,
  };

  const cardsDespachador = [
    { label: 'Por despachar', value: conteo.programadas, icon: ClipboardList, color: 'var(--warning)', path: '/despacho' },
    { label: 'En camino', value: conteo.despachadas, icon: Truck, color: 'var(--purple)', path: '/despacho' },
    { label: 'Entregadas hoy', value: conteo.entregadas, icon: CheckCircle, color: 'var(--success)', path: '/despacho' },
    { label: 'Incidencias', value: incidenciasAbiertas, icon: AlertTriangle, color: incidenciasAbiertas > 0 ? 'var(--warning)' : 'var(--text2)', path: '/incidencias' },
    { label: 'Alertas stock', value: alertas, icon: AlertTriangle, color: alertas > 0 ? 'var(--danger)' : 'var(--text2)', path: '/inventario' },
  ];

  const cardsAdmin = [
    { label: 'Borradores', value: conteo.borradores, icon: FileEdit, color: 'var(--text2)', path: '/ordenes' },
    { label: 'Confirmadas', value: conteo.confirmadas, icon: ClipboardList, color: 'var(--primary)', path: '/ordenes' },
    { label: 'Por despachar', value: conteo.programadas, icon: Package, color: 'var(--warning)', path: '/despacho' },
    { label: 'En camino', value: conteo.despachadas, icon: Truck, color: 'var(--purple)', path: '/despacho' },
    { label: 'Entregadas hoy', value: conteo.entregadas, icon: CheckCircle, color: 'var(--success)', path: '/ordenes' },
    { label: 'Incidencias', value: incidenciasAbiertas, icon: AlertTriangle, color: incidenciasAbiertas > 0 ? 'var(--warning)' : 'var(--text2)', path: '/incidencias' },
    { label: 'Alertas stock', value: alertas, icon: AlertTriangle, color: alertas > 0 ? 'var(--danger)' : 'var(--text2)', path: '/inventario' },
  ];

  const esDespachador = usuario?.rol === ROLES.DESPACHADOR;
  const cards = esDespachador ? cardsDespachador : cardsAdmin;

  return (
    <div className="page">
      <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 13 }}>
        Bienvenido, <strong style={{ color: 'var(--text)' }}>{usuario?.nombre}</strong>
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: esDespachador ? '1fr' : '1fr 1fr',
        gap: 12,
        marginBottom: 24,
      }}>
        {cards.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(path)}>
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

      {!esDespachador && (
        <button className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/ordenes/nueva')}>
          + Nueva Orden
        </button>
      )}
    </div>
  );
}
