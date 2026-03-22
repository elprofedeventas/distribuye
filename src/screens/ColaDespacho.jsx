import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, formatFecha } from '../utils/constants';
import Badge from '../components/Badge';
import { Truck, PackageCheck, AlertTriangle } from 'lucide-react';

export default function ColaDespacho() {
  const { call, loading } = useApi();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [despachando, setDespachando] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [cantidades, setCantidades] = useState({});

  const load = async () => {
    const data = await call('getOrdenes');
    setOrdenes((data || []).filter(o =>
      ['PROGRAMADA', 'DESPACHADA'].includes(o.estado)
    ));
  };

  useEffect(() => { load(); }, []);

  const abrirDespacho = async (orden) => {
    const det = await call('getOrdenDetalle', { ordenId: orden.id });
    setDetalle(det || []);
    const init = {};
    (det || []).forEach(d => { init[d.id] = d.cantPedida; });
    setCantidades(init);
    setDespachando(orden);
  };

  const confirmarDespacho = async () => {
    const detalleDespacho = detalle.map(d => ({
      id: d.id,
      cantDespachada: Number(cantidades[d.id] || 0),
    }));
    await call('registrarDespacho', {
      ordenId: despachando.id,
      canalNombre: despachando.canalNombre,
      detalle: detalleDespacho,
    });
    setDespachando(null);
    load();
  };

  const porDespachar = ordenes.filter(o => o.estado === 'PROGRAMADA');
  const despachadas = ordenes.filter(o => o.estado === 'DESPACHADA');

  if (despachando) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
            onClick={() => setDespachando(null)}>←</button>
          <h1 className="page-title" style={{ margin: 0 }}>Preparar despacho</h1>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          {despachando.numeroOrden && (
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
              {despachando.numeroOrden}
            </div>
          )}
          <div style={{ fontWeight: 600 }}>{despachando.canalNombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Despacho: {formatFecha(despachando.fechaDespacho)}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
          Ingresa la cantidad real a despachar
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {detalle.map(d => {
            const cantIngresada = Number(cantidades[d.id] ?? d.cantPedida);
            const tieneIncidencia = cantIngresada < Number(d.cantPedida);
            return (
              <div key={d.id} className="card"
                style={{ borderColor: tieneIncidencia ? 'var(--danger)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      SKU: {d.sku} · {d.unidad}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      Pedido: <strong>{d.cantPedida}</strong>
                    </div>
                    {tieneIncidencia && (
                      <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} />
                        Diferencia: {Number(d.cantPedida) - cantIngresada}
                      </div>
                    )}
                  </div>
                  <input
                    type="number" min={0} max={d.cantPedida}
                    value={cantidades[d.id] ?? d.cantPedida}
                    onChange={e => setCantidades(c => ({ ...c, [d.id]: e.target.value }))}
                    style={{ width: 80, textAlign: 'center',
                      borderColor: tieneIncidencia ? 'var(--danger)' : 'var(--border)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={confirmarDespacho}>
          <Truck size={16} /> Confirmar despacho
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Despacho</h1>

      {ordenes.length === 0 && !loading && (
        <p className="empty">Sin órdenes pendientes</p>
      )}

      {porDespachar.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 10 }}>
            Por despachar ({porDespachar.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {porDespachar.map(o => (
              <OrdenCard key={o.id} o={o} onDespachar={() => abrirDespacho(o)} onEntrega={null} call={call} navigate={navigate} />
            ))}
          </div>
        </>
      )}

      {despachadas.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 10 }}>
            En camino — registrar entrega ({despachadas.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {despachadas.map(o => (
              <OrdenCard key={o.id} o={o} onDespachar={null} onEntrega={() => navigate(`/despacho/${o.id}/entrega`)} call={call} navigate={navigate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrdenCard({ o, onDespachar, onEntrega, call, navigate }) {
  const [detalle, setDetalle] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [incidencias, setIncidencias] = useState([]);

  const cargarDetalle = async () => {
    if (expanded) { setExpanded(false); return; }
    const [det, incs] = await Promise.all([
      call('getOrdenDetalle', { ordenId: o.id }),
      call('getIncidencias'),
    ]);
    setDetalle(det || []);
    setIncidencias((incs || []).filter(i => i.ordenId === o.id && i.estado === 'ABIERTA'));
    setExpanded(true);
  };

  return (
    <div className="card" style={{ borderColor: incidencias.length > 0 ? 'var(--danger)' : 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, cursor: 'pointer' }}
        onClick={cargarDetalle}>
        <div style={{ flex: 1 }}>
          {o.numeroOrden && (
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
              {o.numeroOrden}
            </div>
          )}
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {incidencias.length > 0 && <AlertTriangle size={14} color="var(--danger)" />}
            {o.canalNombre}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
            Despacho: {formatFecha(o.fechaDespacho)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2 }}>
            ${Number(o.total || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>
            {expanded ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
          </div>
        </div>
        <Badge label={o.estado} color={ESTADO_COLORS[o.estado]} />
      </div>

      {expanded && detalle.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10 }}>
          {detalle.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 500 }}>{d.nombre}</span>
                <span style={{ color: 'var(--text2)', marginLeft: 6 }}>SKU: {d.sku}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--text2)' }}>Pedido: {d.cantPedida}</span>
                {Number(d.cantDespachada) > 0 && (
                  <span style={{ color: 'var(--purple)', marginLeft: 8 }}>
                    Desp: {d.cantDespachada}
                  </span>
                )}
                {Number(d.cantEntregada) > 0 && (
                  <span style={{ color: 'var(--success)', marginLeft: 8 }}>
                    Ent: {d.cantEntregada}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {onDespachar && (
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
            onClick={onDespachar}>
            <Truck size={14} /> Despachar
          </button>
        )}
        {onEntrega && (
          <button style={{
            flex: 1, justifyContent: 'center',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: 'var(--warning)', color: '#fff', cursor: 'pointer', border: 'none',
          }}
            onClick={onEntrega}>
            <PackageCheck size={14} /> Registrar entrega
          </button>
        )}
      </div>
    </div>
  );
}
