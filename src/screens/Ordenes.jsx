import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ESTADOS_ORDEN, ESTADO_COLORS, formatFecha } from '../utils/constants';
import Badge from '../components/Badge';
import { Plus } from 'lucide-react';

const FILTROS = ['TODAS', ...Object.keys(ESTADOS_ORDEN)];

export default function Ordenes() {
  const { call, loading } = useApi();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');

  useEffect(() => { call('getOrdenes').then(d => setOrdenes(d || [])); }, []);

  const visibles = filtro === 'TODAS' ? ordenes : ordenes.filter(o => o.estado === filtro);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Órdenes</h1>
        <button className="btn btn-primary" onClick={() => navigate('/ordenes/nueva')}>
          <Plus size={16} /> Nueva
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            whiteSpace: 'nowrap', border: '1px solid',
            background: filtro === f ? 'var(--primary)' : 'transparent',
            borderColor: filtro === f ? 'var(--primary)' : 'var(--border)',
            color: filtro === f ? '#fff' : 'var(--text2)',
          }}>{f}</button>
        ))}
      </div>

      {visibles.length === 0 && !loading && <p className="empty">Sin órdenes</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(o => (
          <div key={o.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/ordenes/${o.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {o.numeroOrden && (
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
                    {o.numeroOrden}
                  </div>
                )}
                <div style={{ fontWeight: 600 }}>{o.canalNombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {formatFecha(o.fecha)}
                  {o.fechaDespacho ? ` · Despacho: ${formatFecha(o.fechaDespacho)}` : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                  ${Number(o.total || 0).toFixed(2)}
                </div>
              </div>
              <Badge label={o.estado} color={ESTADO_COLORS[o.estado] || '#94a3b8'} />
            </div>
            {o.notas && (
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {o.notas}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
