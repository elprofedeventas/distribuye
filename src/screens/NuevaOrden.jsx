import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { formatFecha, formatMonto } from '../utils/constants';
import { Trash2, Plus, Wallet, AlertTriangle } from 'lucide-react';
import LoadingButton from '../components/LoadingButton';
import { cargarCredito } from '../utils/credito';

export default function NuevaOrden() {
  const { call } = useApi();
  const { usuario } = useApp();
  const navigate = useNavigate();
  const [canales, setCanales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [matrizPrecios, setMatrizPrecios] = useState([]);
  const [canalId, setCanalId] = useState('');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState([]);
  const [credito, setCredito] = useState(null);

  useEffect(() => {
    call('getCanales').then(d => setCanales(d || []));
    call('getProductos').then(d => setProductos(d || []));
  }, []);

  useEffect(() => {
    if (!canalId) { setMatrizPrecios([]); setCredito(null); return; }
    call('getPreciosCliente', { clienteId: canalId }).then(d => setMatrizPrecios(d || []));
    cargarCredito(call, canalId).then(setCredito).catch(() => setCredito(null));
  }, [canalId]);

  const addLinea = () => setLineas(l => [...l, { productoId: '', cajas: 1 }]);
  const setLinea = (i, k, v) => setLineas(l => l.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const removeLinea = (i) => setLineas(l => l.filter((_, j) => j !== i));
  const getProducto = (id) => productos.find(p => p.id === id);

  const getPrecioFinal = (productoId, pvp) => {
    const precio = matrizPrecios.find(p => p.productoId === productoId);
    if (precio && precio.precioLista) {
      return { precioFinal: Number(precio.precioLista), descuento: 0 };
    }
    return { precioFinal: Number(pvp), descuento: 0 };
  };

  const calcularLinea = (l) => {
    const p = getProducto(l.productoId);
    if (!p) return { subtotal: 0, iva: 0, total: 0, precioFinal: 0, precioCaja: 0, unidades: 0 };
    const { precioFinal } = getPrecioFinal(p.id, p.precio);
    const unidadesCaja = Number(p.unidadesCaja || 1);
    const cajas = Number(l.cajas || 0);
    const unidades = cajas * unidadesCaja;
    const ivaRate = Number(p.ivaRate ?? 0.15);
    const subtotal = precioFinal * unidades;
    const iva = subtotal * ivaRate;
    const precioCaja = precioFinal * unidadesCaja;
    return { subtotal, iva, total: subtotal + iva, precioFinal, precioCaja, unidades, ivaRate };
  };

  const totales = lineas.reduce((acc, l) => {
    const c = calcularLinea(l);
    return { subtotal: acc.subtotal + c.subtotal, iva: acc.iva + c.iva, total: acc.total + c.total };
  }, { subtotal: 0, iva: 0, total: 0 });

  const save = async () => {
    if (!canalId || lineas.length === 0) return;
    const canal = canales.find(c => c.id === canalId);
    const detalle = lineas.map(l => {
      const p = getProducto(l.productoId);
      const { precioFinal, descuento } = getPrecioFinal(p.id, p.precio);
      const unidadesCaja = Number(p.unidadesCaja || 1);
      const cajas = Number(l.cajas || 0);
      const unidades = cajas * unidadesCaja;
      return {
        productoId: p.id, sku: p.sku, nombre: p.nombre,
        unidad: 'caja', precio: p.precio,
        precioFinal, descuento,
        ivaRate: Number(p.ivaRate ?? 0.15),
        cantPedida: cajas,        // cajas pedidas
        cantUnidades: unidades,   // unidades equivalentes
        unidadesCaja,
      };
    });
    const result = await call('createOrden', {
      orden: {
        canalId, canalNombre: canal.nombre,
        ruc: canal.ruc || '',
        fecha: formatFecha(new Date().toISOString()),
        notas, creadoPor: usuario?.nombre,
      },
      detalle,
    });
    navigate(`/ordenes/${result.ordenId}`);
  };

  return (
    <div className="page">
      <h1 className="page-title">Nueva Orden</h1>

      <div className="form-group">
        <label>Cliente *</label>
        <select value={canalId} onChange={e => setCanalId(e.target.value)}>
          <option value="">— Seleccionar cliente —</option>
          {canales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {canalId && credito && (() => {
        if (credito.esContado) {
          return (
            <div className="card" style={{ marginBottom: 16, borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={16} color="var(--text2)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                  Venta de contado
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Este cliente no tiene cupo de crédito asignado.
              </div>
            </div>
          );
        }
        const cupoTrasOrden = Number(credito.cupoDisponible) - Number(totales.total || 0);
        const excede = cupoTrasOrden < 0;
        const color = excede ? 'var(--danger)' : 'var(--success)';
        return (
          <div className="card" style={{ marginBottom: 16, borderColor: color }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wallet size={16} color={color} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>
                Cupo de crédito
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text2)' }}>Cupo total</span>
              <span>{formatMonto(credito.cupoCredito)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text2)' }}>Deuda actual</span>
              <span>{formatMonto(credito.deudaTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
              <span>Cupo disponible</span>
              <span>{formatMonto(credito.cupoDisponible)}</span>
            </div>
            {lineas.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color, marginTop: 6 }}>
                <span>Tras esta orden</span>
                <span>{formatMonto(cupoTrasOrden)}</span>
              </div>
            )}
            {excede && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, background: 'var(--danger)11', borderRadius: 6 }}>
                <AlertTriangle size={14} color="var(--danger)" />
                <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                  Esta orden excederá el cupo y no podrá confirmarse
                </span>
              </div>
            )}
          </div>
        );
      })()}

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
          const calc = calcularLinea(l);
          return (
            <div key={i} className="card">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <select value={l.productoId}
                    onChange={e => setLinea(i, 'productoId', e.target.value)}
                    style={{ marginBottom: 8 }}>
                    <option value="">— Producto —</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.sku})
                      </option>
                    ))}
                  </select>

                  {p && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                      Caja de {p.unidadesCaja} unidades ·{' '}
                      Precio lista: {formatMonto(calc.precioFinal)}/und ·{' '}
                      {formatMonto(calc.precioCaja)}/caja
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number" min={1} value={l.cajas}
                      onChange={e => setLinea(i, 'cajas', e.target.value)}
                      style={{ width: 80 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>cajas</span>
                    {p && (
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                        = {calc.unidades} unidades
                      </span>
                    )}
                  </div>

                  {p && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)' }}>
                        Subtotal: {formatMonto(calc.subtotal)} +
                        IVA {((calc.ivaRate || 0) * 100).toFixed(0)}%: {formatMonto(calc.iva)} =
                      </span>
                      <strong style={{ color: 'var(--text)', marginLeft: 4 }}>
                        {formatMonto(calc.total)}
                      </strong>
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                  onClick={() => removeLinea(i)}>
                  <Trash2 size={14} color="var(--danger)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lineas.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text2)' }}>Subtotal</span>
            <span>{formatMonto(totales.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text2)' }}>IVA</span>
            <span>{formatMonto(totales.iva)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <span>Total</span>
            <span style={{ color: 'var(--success)' }}>{formatMonto(totales.total)}</span>
          </div>
        </div>
      )}

      <LoadingButton onClick={save}
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={!canalId || lineas.length === 0}>
        Crear orden
      </LoadingButton>
    </div>
  );
}