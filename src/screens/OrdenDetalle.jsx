import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ESTADO_COLORS, ESTADO_LABELS, ROLES, formatFecha, formatMonto } from '../utils/constants';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { ArrowLeft, Truck, CalendarCheck, AlertTriangle, Plus, Trash2, FileCheck } from 'lucide-react';

export default function OrdenDetalle() {
  const { id } = useParams();
  const { call } = useApi();
  const { usuario } = useApp();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [fechaDespacho, setFechaDespacho] = useState('');
  const [errorFecha, setErrorFecha] = useState('');
  const [editando, setEditando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [modalStock, setModalStock] = useState(null);

  const hoy = formatFecha(new Date().toISOString());
  const soloLectura = usuario?.rol === ROLES.GERENCIA;
  const puedeFacturar = [ROLES.VENTAS, ROLES.OPERACIONES].includes(usuario?.rol);

  const load = async () => {
    const [ordenes, det, incs] = await Promise.all([
      call('getOrdenes'),
      call('getOrdenDetalle', { ordenId: id }),
      call('getIncidencias'),
    ]);
    const o = (ordenes || []).find(x => x.id === id);
    setOrden(o);
    if (o?.fechaDespacho) setFechaDespacho(formatFecha(o.fechaDespacho));
    setDetalle(det || []);
    setIncidencias((incs || []).filter(i => i.ordenId === id));
  };

  useEffect(() => { load(); }, [id]);

  const abrirEdicion = async () => {
    const prods = await call('getProductos');
    setProductos(prods || []);
    setLineas(detalle.map(d => ({
      id: d.id, productoId: d.productoId, sku: d.sku,
      nombre: d.nombre, unidad: d.unidad, precio: d.precio,
      precioFinal: d.precioFinal || d.precio,
      descuento: d.descuento || 0,
      ivaRate: d.ivaRate ?? 0.15,
      cantPedida: d.cantPedida,
    })));
    setEditando(true);
  };

  const getProducto = (pid) => productos.find(p => p.id === pid);
  const setLinea = (i, k, v) => setLineas(l => l.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const addLinea = () => setLineas(l => [...l, { productoId: '', cantPedida: 1 }]);
  const removeLinea = (i) => setLineas(l => l.filter((_, j) => j !== i));

  const guardarEdicion = async () => {
    if (lineas.length === 0) return;
    for (const linea of lineas) {
      const p = linea.productoId ? getProducto(linea.productoId) : null;
      if (linea.id) {
        await call('updateOrdenDetalle', { id: linea.id, cantPedida: Number(linea.cantPedida) });
      } else if (p) {
        await call('createOrdenDetalle', {
          ordenId: id, productoId: p.id, sku: p.sku, nombre: p.nombre,
          unidad: p.unidad, precio: p.precio,
          precioFinal: p.precio, descuento: 0,
          ivaRate: Number(p.ivaRate ?? 0.15),
          cantPedida: Number(linea.cantPedida),
          cantDespachada: 0, cantEntregada: 0, diferencia: 0,
        });
      }
    }
    const nuevoSubtotal = lineas.reduce((sum, l) => {
      const p = l.id ? detalle.find(d => d.id === l.id) : getProducto(l.productoId);
      const precio = Number(l.precioFinal || p?.precio || 0);
      return sum + precio * Number(l.cantPedida);
    }, 0);
    const nuevoIva = lineas.reduce((sum, l) => {
      const p = l.id ? detalle.find(d => d.id === l.id) : getProducto(l.productoId);
      const precio = Number(l.precioFinal || p?.precio || 0);
      const ivaRate = Number(l.ivaRate ?? p?.ivaRate ?? 0.15);
      return sum + precio * Number(l.cantPedida) * ivaRate;
    }, 0);
    await call('updateOrdenEstado', {
      id, estado: 'BORRADOR',
      subtotal: Math.round(nuevoSubtotal * 100) / 100,
      iva: Math.round(nuevoIva * 100) / 100,
      total: Math.round((nuevoSubtotal + nuevoIva) * 100) / 100,
    });
    setEditando(false);
    load();
  };

  const intentarConfirmar = async () => {
    const inventario = await call('getInventario');
    const problemas = [];
    detalle.forEach(d => {
      const inv = (inventario || []).find(i => i.productoId === d.productoId);
      const stockActual = inv ? Number(inv.stockActual) : 0;
      if (stockActual < Number(d.cantPedida)) {
        problemas.push({
          nombre: d.nombre, sku: d.sku,
          cantPedida: d.cantPedida, stockActual,
          diferencia: Number(d.cantPedida) - stockActual,
        });
      }
    });
    if (problemas.length > 0) setModalStock(problemas);
    else await confirmar();
  };

  const confirmar = async () => {
    setModalStock(null);
    await call('updateOrdenEstado', { id, estado: 'CONFIRMADA' });
    load();
  };

  const programar = async () => {
    if (!fechaDespacho) { setErrorFecha('Ingresa una fecha de despacho'); return; }
    if (fechaDespacho < hoy) { setErrorFecha('La fecha no puede ser anterior a hoy'); return; }
    setErrorFecha('');
    await call('updateOrdenEstado', { id, estado: 'PROGRAMADA', fechaDespacho });
    load();
  };

  const marcarFacturada = async () => {
    await call('marcarFacturada', { id });
    load();
  };

  if (!orden) return <div className="page"><p className="empty">Cargando...</p></div>;

  const puedeConfirmar = !soloLectura && orden.estado === 'BORRADOR' && usuario?.rol !== ROLES.DESPACHADOR;
  const puedeProgramar = !soloLectura && orden.estado === 'CONFIRMADA' && usuario?.rol !== ROLES.DESPACHADOR;
  const puedeEditar = !soloLectura && orden.estado === 'BORRADOR' && usuario?.rol !== ROLES.DESPACHADOR;
  const incidenciasAbiertas = incidencias.filter(i => i.estado === 'ABIERTA');

  if (editando) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
            onClick={() => setEditando(false)}>←</button>
          <h1 className="page-title" style={{ margin: 0 }}>Editar orden</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Productos</span>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={addLinea}>
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {lineas.map((l, i) => {
            const p = l.id ? detalle.find(d => d.id === l.id) : getProducto(l.productoId);
            return (
              <div key={i} className="card">
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {l.id ? (
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>
                        {l.nombre}
                        <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>({l.sku})</span>
                      </div>
                    ) : (
                      <select value={l.productoId}
                        onChange={e => {
                          const prod = getProducto(e.target.value);
                          setLineas(ls => ls.map((x, j) => j === i ? {
                            ...x, productoId: e.target.value,
                            sku: prod?.sku || '', nombre: prod?.nombre || '',
                            unidad: prod?.unidad || '', precio: prod?.precio || 0,
                            precioFinal: prod?.precio || 0, descuento: 0,
                            ivaRate: Number(prod?.ivaRate ?? 0.15),
                          } : x));
                        }}
                        style={{ marginBottom: 8 }}>
                        <option value="">— Producto —</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                        ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="number" min={1} value={l.cantPedida}
                        onChange={e => setLinea(i, 'cantPedida', e.target.value)}
                        style={{ width: 80 }} />
                      {p && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.unidad || l.unidad}</span>}
                      {p && <span style={{ fontSize: 13, color: 'var(--success)', marginLeft: 'auto' }}>
                        {formatMonto(Number(l.precioFinal || p.precio) * Number(l.cantPedida))}
                      </span>}
                    </div>
                  </div>
                  {!l.id && (
                    <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => removeLinea(i)}>
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <LoadingButton onClick={guardarEdicion} style={{ width: '100%', justifyContent: 'center' }}>
          Guardar cambios
        </LoadingButton>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title" style={{ margin: 0, flex: 1 }}>
          {orden.numeroOrden && (
            <span style={{ fontSize: 12, color: 'var(--primary)', display: 'block', fontWeight: 600 }}>
              {orden.numeroOrden}
            </span>
          )}
          {orden.canalNombre}
        </h1>
        <Badge label={ESTADO_LABELS[orden.estado] || orden.estado} color={ESTADO_COLORS[orden.estado] || '#94a3b8'} />
      </div>

      {incidenciasAbiertas.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
              {incidenciasAbiertas.length} reclamo{incidenciasAbiertas.length > 1 ? 's' : ''} abierto{incidenciasAbiertas.length > 1 ? 's' : ''}
            </span>
          </div>
          {incidenciasAbiertas.map(i => (
            <div key={i.id} style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, paddingLeft: 24 }}>
              {i.nombre} · {i.tipo === 'DESPACHO' ? 'Preparación' : 'Entrega'}: {i.cantEntregada} / Pedido: {i.cantPedida} · Dif: {i.diferencia}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--text2)' }}>Fecha orden</span>
          <span>{formatFecha(orden.fecha)}</span>
        </div>
        {orden.fechaDespacho && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
            <span style={{ color: 'var(--text2)' }}>Fecha despacho</span>
            <span>{formatFecha(orden.fechaDespacho)}</span>
          </div>
        )}
        {orden.fechaEntrega && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
            <span style={{ color: 'var(--text2)' }}>Fecha entrega</span>
            <span>{formatFecha(orden.fechaEntrega)}</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)' }}>Subtotal</span>
            <span>{formatMonto(orden.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)' }}>IVA (15%)</span>
            <span>{formatMonto(orden.iva)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--success)' }}>{formatMonto(orden.total)}</span>
          </div>
        </div>
        {orden.notas && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {orden.notas}
          </div>
        )}

        {/* Estado de facturación */}
        {orden.estado === 'ENTREGADA' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={16} color={orden.facturada ? 'var(--success)' : 'var(--text2)'} />
              <span style={{ fontSize: 13, color: orden.facturada ? 'var(--success)' : 'var(--text2)', fontWeight: orden.facturada ? 600 : 400 }}>
                {orden.facturada ? 'Facturada' : 'Pendiente de facturación'}
              </span>
            </div>
            {!orden.facturada && puedeFacturar && (
              <LoadingButton onClick={marcarFacturada} className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                Marcar facturada
              </LoadingButton>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
          Productos ({detalle.length})
        </span>
        {puedeEditar && (
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={abrirEdicion}>✎ Editar</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {detalle.map(d => {
          const incDet = incidencias.find(i => i.productoId === d.productoId && i.estado === 'ABIERTA');
          const precioFinal = Number(d.precioFinal || d.precio);
          const ivaRate = Number(d.ivaRate ?? 0.15);
          const cantUnidades = Number(d.cantUnidades || d.cantPedida);
          const subtotalLinea = precioFinal * cantUnidades;
          const ivaLinea = subtotalLinea * ivaRate;
          return (
            <div key={d.id} className="card" style={{ borderColor: incDet ? 'var(--danger)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {incDet && <AlertTriangle size={13} color="var(--danger)" />}
                    {d.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {d.sku} · {d.unidad}</div>
                  {Number(d.descuento) > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--success)' }}>
                      {d.descuento}% desc. · PVP: {formatMonto(d.precio)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>
                    {d.cantPedida} caja{Number(d.cantPedida) > 1 ? 's' : ''}
                    {d.cantUnidades && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', marginLeft: 6 }}>
                        ({d.cantUnidades} und.)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {formatMonto(precioFinal * Number(d.unidadesCaja || 1))} c/caja
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    +IVA {(ivaRate * 100).toFixed(0)}%: {formatMonto(ivaLinea)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                    {formatMonto(subtotalLinea + ivaLinea)}
                  </div>
                </div>
              </div>
              {(Number(d.cantDespachada) > 0 || Number(d.cantEntregada) > 0) && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 12 }}>
                  {Number(d.cantDespachada) > 0 && <span style={{ color: 'var(--purple)' }}>Despachado: {d.cantDespachada}</span>}
                  {Number(d.cantEntregada) > 0 && <span style={{ color: 'var(--success)' }}>Entregado: {d.cantEntregada}</span>}
                  {Number(d.diferencia) !== 0 && <span style={{ color: 'var(--danger)' }}>Dif: {d.diferencia}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {puedeConfirmar && (
        <LoadingButton onClick={intentarConfirmar}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
          <CalendarCheck size={16} style={{ marginRight: 6 }} /> Confirmar orden
        </LoadingButton>
      )}

      {puedeProgramar && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <input type="date" value={fechaDespacho} min={hoy}
              onChange={e => { setFechaDespacho(e.target.value); setErrorFecha(''); }}
              style={{ flex: 1 }} />
            <LoadingButton onClick={programar}>
              <Truck size={16} style={{ marginRight: 6 }} /> En preparación
            </LoadingButton>
          </div>
          {errorFecha && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{errorFecha}</p>}
        </div>
      )}

      {modalStock && (
        <Modal title="⚠️ Stock insuficiente" onClose={() => setModalStock(null)}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Los siguientes productos no tienen stock suficiente. Puedes confirmar igual y reponer antes del despacho.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {modalStock.map((p, i) => (
              <div key={i} className="card" style={{ borderColor: 'var(--warning)' }}>
                <div style={{ fontWeight: 500 }}>{p.nombre}
                  <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>({p.sku})</span>
                </div>
                <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 16 }}>
                  <span style={{ color: 'var(--text2)' }}>Pedido: <strong>{p.cantPedida}</strong></span>
                  <span style={{ color: p.stockActual === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                    Stock: <strong>{p.stockActual}</strong>
                  </span>
                  <span style={{ color: 'var(--danger)' }}>Faltan: <strong>{p.diferencia}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setModalStock(null)}>Cancelar</button>
            <LoadingButton onClick={confirmar} style={{ flex: 1, justifyContent: 'center' }}>
              <CalendarCheck size={16} style={{ marginRight: 6 }} /> Confirmar igual
            </LoadingButton>
          </div>
        </Modal>
      )}
    </div>
  );
}