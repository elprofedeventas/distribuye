import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, formatFecha } from '../utils/constants';
import Badge from '../components/Badge';
import { Truck, PackageCheck } from 'lucide-react';

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
          <div style={{ fontWeight: 600 }}>{despachando.canalNombre}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Despacho: {formatFecha(despachando.fechaDespacho)}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
          Ingresa la cantidad real a despachar
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {detalle.map(d => (
            <div key={d.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{d.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    Pedido: <strong>{d.cantPedida}</strong> {d.unidad}
                  </div>
                </div>
                <input type="number" min={0} max={d.cantPedida}
                  value={cantidades[d.id] ?? d.cantPedida}
                  onChange={e => setCantidades(c => ({ ...c, [d.id]: e.target.value }))}
                  style={{ width: 80, textAlign: 'center' }} />
              </div>
            </div>
          ))}
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
              <div key={o.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.canalNombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      Despacho: {formatFecha(o.fechaDespacho)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2 }}>
                      ${Number(o.total || 0).toFixed(2)}
                    </div>
                  </div>
                  <Badge label={o.estado} color={ESTADO_COLORS[o.estado]} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => abrirDespacho(o)}>
                  <Truck size={14} /> Despachar
                </button>
              </div>
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
              <div key={o.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.canalNombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      Despacho: {formatFecha(o.fechaDespacho)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2 }}>
                      ${Number(o.total || 0).toFixed(2)}
                    </div>
                  </div>
                  <Badge label={o.estado} color={ESTADO_COLORS[o.estado]} />
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(`/despacho/${o.id}/entrega`)}>
                  <PackageCheck size={14} /> Registrar entrega
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
