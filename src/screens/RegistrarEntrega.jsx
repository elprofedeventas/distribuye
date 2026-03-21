import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function RegistrarEntrega() {
  const { id } = useParams();
  const { call } = useApi();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [incidencias, setIncidencias] = useState(0);

  useEffect(() => {
    const load = async () => {
      const ordenes = await call('getOrdenes');
      const o = (ordenes || []).find(x => x.id === id);
      setOrden(o);
      const det = await call('getOrdenDetalle', { ordenId: id });
      setDetalle(det || []);
      const init = {};
      (det || []).forEach(d => {
        init[d.id] = d.cantDespachada > 0 ? d.cantDespachada : d.cantPedida;
      });
      setCantidades(init);
    };
    load();
  }, [id]);

  const diferenciaLinea = (d) => Number(d.cantPedida) - Number(cantidades[d.id] || 0);

  const totalDiferencias = detalle.filter(d => diferenciaLinea(d) !== 0).length;

  const confirmar = async () => {
    setSaving(true);
    try {
      const detalleEntrega = detalle.map(d => ({
        id: d.id,
        productoId: d.productoId,
        sku: d.sku,
        nombre: d.nombre,
        cantPedida: Number(d.cantPedida),
        cantEntregada: Number(cantidades[d.id] || 0),
      }));
      const result = await call('registrarEntrega', {
        ordenId: id,
        canalNombre: orden.canalNombre,
        notas,
        detalle: detalleEntrega,
      });
      setIncidencias(result.incidenciasCreadas || 0);
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
        <CheckCircle size={56} color="var(--success)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Entrega registrada</h2>
        {incidencias > 0 ? (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--warning)' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600 }}>{incidencias} incidencia{incidencias > 1 ? 's' : ''} generada{incidencias > 1 ? 's' : ''}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              Las diferencias quedaron documentadas automáticamente
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Sin diferencias. Entrega perfecta ✓</p>
        )}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => navigate('/despacho')}>
            Volver
          </button>
          {incidencias > 0 && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => navigate('/incidencias')}>
              Ver incidencias
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!orden) return <div className="page"><p className="empty">Cargando...</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
          onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title" style={{ margin: 0 }}>Registrar entrega</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>{orden.canalNombre}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{orden.fecha}</div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
        Confirma lo que recibió el canal
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {detalle.map(d => {
          const dif = diferenciaLinea(d);
          return (
            <div key={d.id} className="card"
              style={{ borderColor: dif !== 0 ? 'var(--warning)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{d.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    Pedido: <strong>{d.cantPedida}</strong>
                    {Number(d.cantDespachada) > 0 && ` · Despachado: ${d.cantDespachada}`}
                  </div>
                  {dif !== 0 && (
                    <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 2 }}>
                      Diferencia: {dif > 0 ? `-${dif}` : `+${Math.abs(dif)}`}
                    </div>
                  )}
                </div>
                <input
                  type="number" min={0}
                  value={cantidades[d.id] ?? d.cantPedida}
                  onChange={e => setCantidades(c => ({ ...c, [d.id]: e.target.value }))}
                  style={{ width: 80, textAlign: 'center',
                    borderColor: dif !== 0 ? 'var(--warning)' : 'var(--border)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalDiferencias > 0 && (
        <div className="card" style={{ borderColor: 'var(--warning)', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span style={{ fontSize: 13 }}>
              {totalDiferencias} producto{totalDiferencias > 1 ? 's' : ''} con diferencia — se creará una incidencia automáticamente
            </span>
          </div>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label>Notas de entrega</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          placeholder="Motivo de diferencia, observaciones..." />
      </div>

      <button className="btn btn-success"
        style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}
        onClick={confirmar} disabled={saving}>
        <CheckCircle size={16} /> {saving ? 'Guardando...' : 'Confirmar entrega'}
      </button>
    </div>
  );
}