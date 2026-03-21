import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, ESTADOS_ORDEN, ROLES } from '../utils/constants';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import { ArrowLeft, Truck, CalendarCheck } from 'lucide-react';

export default function OrdenDetalle() {
  const { id } = useParams();
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [fechaDespacho, setFechaDespacho] = useState('');

  const load = async () => {
    const ordenes = await call('getOrdenes');
    const o = (ordenes || []).find(x => x.id === id);
    setOrden(o);
    if (o?.fechaDespacho) setFechaDespacho(o.fechaDespacho);
    const det = await call('getOrdenDetalle', { ordenId: id });
    setDetalle(det || []);
  };

  useEffect(() => { load(); }, [id]);

  const confirmar = async () => {
    await call('updateOrdenEstado', { id, estado: 'CONFIRMADA' });
    load();
  };

  const programar = async () => {
    if (!fechaDespacho) return;
    await call('updateOrdenEstado', { id, estado: 'PROGRAMADA', fechaDespacho });
    load();
  };

  if (!orden) return <div className="page"><p className="empty">Cargando...</p></div>;

  const puedeProgramar = orden.estado === 'CONFIRMADA' && usuario?.rol !== ROLES.DESPACHADOR;
  const puedeConfirmar = orden.estado === 'BORRADOR' && usuario?.rol !== ROLES.DESPACHADOR;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>{orden.canalNombre}</h1>
        <Badge label={orden.estado} color={ESTADO_COLORS[orden.estado] || '#94a3b8'} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--text2)' }}>Fecha orden</span>
          <span>{orden.fecha}</span>
        </div>
        {orden.fechaDespacho && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
            <span style={{ color: 'var(--text2)' }}>Fecha despacho</span>
            <span>{orden.fechaDespacho}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
          <span style={{ color: 'var(--text2)' }}>Total</span>
          <span style={{ fontWeight: 600, color: 'var(--success)' }}>${Number(orden.total || 0).toFixed(2)}</span>
        </div>
        {orden.notas && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {orden.notas}
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
        Productos ({detalle.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {detalle.map(d => (
          <div key={d.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{d.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {d.sku} · {d.unidad}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>×{d.cantPedida}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>${Number(d.precio).toFixed(2)}</div>
              </div>
            </div>
            {(Number(d.cantEntregada) > 0 || Number(d.cantDespachada) > 0) && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--purple)' }}>Despachado: {d.cantDespachada}</span>
                <span style={{ color: 'var(--success)' }}>Entregado: {d.cantEntregada}</span>
                {Number(d.diferencia) !== 0 && (
                  <span style={{ color: 'var(--danger)' }}>Dif: {d.diferencia}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {puedeConfirmar && (
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
          onClick={confirmar}>
          <CalendarCheck size={16} /> Confirmar orden
        </button>
      )}

      {puedeProgramar && (
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="date" value={fechaDespacho} onChange={e => setFechaDespacho(e.target.value)}
            style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={programar}>
            <Truck size={16} /> Programar
          </button>
        </div>
      )}
    </div>
  );
}