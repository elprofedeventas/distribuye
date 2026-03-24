import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES, ESTADOS_ORDEN, ESTADO_COLORS, ESTADO_LABELS, formatFecha, formatMonto } from '../utils/constants';
import Badge from '../components/Badge';
import { Plus, AlertTriangle } from 'lucide-react';

const FILTROS = ['TODAS', ...Object.keys(ESTADOS_ORDEN)];

export default function Ordenes() {
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [ordenes, setOrdenes] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [filtro, setFiltro] = useState(location.state?.filtro || 'TODAS');

  const soloLectura = usuario?.rol === ROLES.GERENCIA;

  useEffect(() => {
    Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
    ]).then(([ords, incs]) => {
      setOrdenes(ords || []);
      setIncidencias(incs || []);
    });
  }, []);

  const visibles = filtro === 'TODAS' ? ordenes : ordenes.filter(o => o.estado === filtro);
  const getIncidenciasOrden = (ordenId) =>
    incidencias.filter(i => i.ordenId === ordenId && i.estado === 'ABIERTA');

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Órdenes</h1>
        {!soloLectura && (
          <button className="btn btn-primary" onClick={() => navigate('/ordenes/nueva')}>
            <Plus size={16} /> Nueva
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            whiteSpace: 'nowrap', border: '1px solid',
            background: filtro === f ? 'var(--primary)' : 'transparent',
            borderColor: filtro === f ? 'var(--primary)' : 'var(--border)',
            color: filtro === f ? '#fff' : 'var(--text2)',
          }}>
            {f === 'TODAS' ? 'TODAS' : ESTADO_LABELS[f]}
          </button>
        ))}
      </div>

      {visibles.length === 0 && !loading && <p className="empty">Sin órdenes</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(o => {
          const incsOrden = getIncidenciasOrden(o.id);
          const tieneIncidencia = incsOrden.length > 0;
          return (
            <div key={o.id} className="card"
              style={{ cursor: 'pointer', borderColor: tieneIncidencia ? 'var(--danger)' : 'var(--border)' }}
              onClick={() => navigate(`/ordenes/${o.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {o.numeroOrden && (
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
                      {o.numeroOrden}
                    </div>
                  )}
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {tieneIncidencia && <AlertTriangle size={14} color="var(--danger)" />}
                    {o.canalNombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {formatFecha(o.fecha)}
                    {o.fechaDespacho ? ` · Despacho: ${formatFecha(o.fechaDespacho)}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                    {formatMonto(o.total)}
                  </div>
                  {tieneIncidencia && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                      {incsOrden.length} incidencia{incsOrden.length > 1 ? 's' : ''} abierta{incsOrden.length > 1 ? 's' : ''} ·{' '}
                      {incsOrden[0].tipo === 'DESPACHO' ? 'Incidencia en despacho' :
                       incsOrden[0].tipo === 'RECHAZO' ? 'Pedido rechazado' : 'Incidencia en entrega'}
                    </div>
                  )}
                </div>
                <Badge label={ESTADO_LABELS[o.estado] || o.estado} color={ESTADO_COLORS[o.estado] || '#94a3b8'} />
              </div>
              {o.notas && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  {o.notas}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}