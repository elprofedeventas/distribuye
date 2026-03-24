import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { formatFecha, formatMonto } from '../utils/constants';
import { Trash2, Plus } from 'lucide-react';
import LoadingButton from '../components/LoadingButton';

export default function NuevaOrden() {
  const { call } = useApi();
  const { usuario } = useApp();
  const navigate = useNavigate();
  const [canales, setCanales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [canalId, setCanalId] = useState('');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    call('getCanales').then(d => setCanales(d || []));
    call('getProductos').then(d => setProductos(d || []));
  }, []);

  const addLinea = () => setLineas(l => [...l, { productoId: '', cantidad: 1 }]);
  const setLinea = (i, k, v) => setLineas(l => l.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const removeLinea = (i) => setLineas(l => l.filter((_, j) => j !== i));
  const getProducto = (id) => productos.find(p => p.id === id);

  const total = lineas.reduce((sum, l) => {
    const p = getProducto(l.productoId);
    return sum + (p ? Number(p.precio) * Number(l.cantidad) : 0);
  }, 0);

  const save = async () => {
    if (!canalId || lineas.length === 0) return;
    const canal = canales.find(c => c.id === canalId);
    const detalle = lineas.map(l => {
      const p = getProducto(l.productoId);
      return {
        productoId: p.id, sku: p.sku, nombre: p.nombre,
        unidad: p.unidad, precio: p.precio, cantPedida: Number(l.cantidad),
      };
    });
    await call('createOrden', {
      orden: {
        canalId, canalNombre: canal.nombre,
        fecha: formatFecha(new Date().toISOString()),
        notas, creadoPor: usuario?.nombre,
      },
      detalle,
    });
    navigate('/ordenes');
  };

  return (
    <div className="page">
      <h1 className="page-title">Nueva Orden</h1>

      <div className="form-group">
        <label>Cliente *</label>
        <select value={canalId} onChange={e => setCanalId(e.target.value)}>
          <option value="">— Seleccionar cliente —</option>
          {canales.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.diaSemana ? `(${c.diaSemana})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Notas</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Productos</span>
        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={addLinea}>
          <Plus size={14} /> Agregar
        </button>
      </div>

      {lineas.length === 0 && (
        <p style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          Agrega al menos un producto
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {lineas.map((l, i) => {
          const p = getProducto(l.productoId);
          return (
            <div key={i} className="card">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <select value={l.productoId} onChange={e => setLinea(i, 'productoId', e.target.value)}
                    style={{ marginBottom: 8 }}>
                    <option value="">— Producto —</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min={1} value={l.cantidad}
                      onChange={e => setLinea(i, 'cantidad', e.target.value)}
                      style={{ width: 80 }} />
                    {p && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.unidad}</span>}
                    {p && <span style={{ fontSize: 13, color: 'var(--success)', marginLeft: 'auto' }}>
                      {formatMonto(Number(p.precio) * Number(l.cantidad))}
                    </span>}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => removeLinea(i)}>
                  <Trash2 size={14} color="var(--danger)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lineas.length > 0 && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>
            {formatMonto(total)}
          </span>
        </div>
      )}

      <LoadingButton
        onClick={save}
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={!canalId || lineas.length === 0}>
        Crear orden
      </LoadingButton>
    </div>
  );
}