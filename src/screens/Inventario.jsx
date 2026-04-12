import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES, formatFecha, formatMonto } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { AlertTriangle, Plus, Minus, RefreshCw, Package } from 'lucide-react';

export default function Inventario() {
  const { call, loading } = useApi();
  const { refreshInventario, usuario } = useApp();
  const [inventario, setInventario] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalLote, setModalLote] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [lote, setLote] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [cantLote, setCantLote] = useState('');

  const soloLectura = usuario?.rol === ROLES.GERENCIA;

  const load = async () => {
    const data = await call('getInventario');
    setInventario(data || []);
  };

  useEffect(() => { load(); }, []);

  const ajustar = async () => {
    if (!cantidad) return;
    if (modal.tipo === 'salida' && !motivo) return;
    await call('ajustarInventario', {
      productoId: modal.item.productoId,
      cantidad: Number(cantidad),
      tipo: modal.tipo,
      motivo: motivo || '',
    });
    setModal(null);
    setCantidad('');
    setMotivo('');
    await load();
    refreshInventario();
  };

  const guardarLote = async () => {
    if (!lote || !fechaVenc || !cantLote) return;
    await call('createLote', {
      productoId: modalLote.productoId,
      lote,
      fechaVencimiento: fechaVenc,
      cantidad: Number(cantLote),
    });
    setModalLote(null);
    setLote('');
    setFechaVenc('');
    setCantLote('');
    load();
    refreshInventario();
  };

  const abrirModal = (item, tipo) => {
    setModal({ item, tipo });
    setCantidad('');
    setMotivo('');
  };

  const alertasVenc = inventario.filter(i => i.alertaVencimiento);
  const alertasStock = inventario.filter(i => i.alerta && !i.alertaVencimiento);
  const normales = inventario.filter(i => !i.alerta && !i.alertaVencimiento);

  return (
    <div className="page">
      <h1 className="page-title">Reposición de Inventario</h1>

      {/* Alertas de vencimiento */}
      {alertasVenc.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>
              Próximos a vencer
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {alertasVenc.map(i => (
              <ItemCard key={i.id} i={i} onAjustar={abrirModal}
                onLote={setModalLote} soloLectura={soloLectura} />
            ))}
          </div>
        </>
      )}

      {/* Alertas de stock */}
      {alertasStock.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
              Requieren reposición
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {alertasStock.map(i => (
              <ItemCard key={i.id} i={i} onAjustar={abrirModal}
                onLote={setModalLote} soloLectura={soloLectura} />
            ))}
          </div>
        </>
      )}

      {normales.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
            Stock normal
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {normales.map(i => (
              <ItemCard key={i.id} i={i} onAjustar={abrirModal}
                onLote={setModalLote} soloLectura={soloLectura} />
            ))}
          </div>
        </>
      )}

      {inventario.length === 0 && !loading && <p className="empty">Sin productos en inventario</p>}

      {/* Modal ajuste */}
      {modal && (
        <Modal
          title={modal.tipo === 'entrada' ? '+ Entrada de stock' : modal.tipo === 'salida' ? '− Salida de stock' : '✎ Ajuste directo'}
          onClose={() => setModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{modal.item.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Stock actual: {modal.item.stockActual}</div>
            {modal.item.lote && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
                Lote activo: {modal.item.lote} · Vence: {formatFecha(modal.item.fechaVencimiento)}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>{modal.tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}</label>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} autoFocus />
          </div>
          {modal.tipo === 'salida' && (
            <div className="form-group">
              <label>Motivo *</label>
              <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option value="">— Seleccionar motivo —</option>
                <option value="Despacho a cliente">Despacho a cliente</option>
                <option value="Producto vencido">Producto vencido</option>
                <option value="Producto dañado">Producto dañado</option>
                <option value="Merma">Merma</option>
                <option value="Muestra">Muestra</option>
                <option value="Devolución">Devolución</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          )}
          <LoadingButton onClick={ajustar} style={{ width: '100%', justifyContent: 'center' }}
            disabled={modal.tipo === 'salida' && !motivo}>
            Confirmar
          </LoadingButton>
        </Modal>
      )}

      {/* Modal nuevo lote */}
      {modalLote && (
        <Modal title="Registrar lote" onClose={() => setModalLote(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{modalLote.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {modalLote.sku}</div>
          </div>
          <div className="form-group">
            <label>Número de lote *</label>
            <input value={lote} onChange={e => setLote(e.target.value)} placeholder="Ej: LOT-2026-001" />
          </div>
          <div className="form-group">
            <label>Fecha de vencimiento *</label>
            <input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cantidad en este lote *</label>
            <input type="number" value={cantLote} onChange={e => setCantLote(e.target.value)} />
          </div>
          <LoadingButton onClick={guardarLote} style={{ width: '100%', justifyContent: 'center' }}
            disabled={!lote || !fechaVenc || !cantLote}>
            Registrar lote
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}

function ItemCard({ i, onAjustar, onLote, soloLectura }) {
  const borderColor = i.alertaVencimiento ? 'var(--warning)' : i.alerta ? 'var(--danger)' : 'var(--border)';
  return (
    <div className="card" style={{ borderColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {i.alerta && <AlertTriangle size={13} color="var(--danger)" />}
            {i.alertaVencimiento && !i.alerta && <AlertTriangle size={13} color="var(--warning)" />}
            {i.nombre}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {i.sku}</div>
          {i.lote && (
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ color: 'var(--text2)' }}>Lote: </span>
              <span style={{ fontWeight: 600 }}>{i.lote}</span>
              {i.fechaVencimiento && (
                <span style={{
                  marginLeft: 8,
                  color: i.diasParaVencer <= 7 ? 'var(--danger)' : i.diasParaVencer <= 30 ? 'var(--warning)' : 'var(--text2)'
                }}>
                  Vence: {formatFecha(i.fechaVencimiento)}
                  {i.diasParaVencer !== null && ` (${i.diasParaVencer}d)`}
                </span>
              )}
            </div>
          )}
          <div style={{ fontSize: 20, fontWeight: 700,
            color: i.alerta ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
            {i.stockActual}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', marginLeft: 4 }}>
              / mín {i.stockMinimo}
            </span>
          </div>
        </div>
        {!soloLectura && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
              onClick={() => onAjustar(i, 'entrada')}><Plus size={14} /></button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
              onClick={() => onAjustar(i, 'salida')}><Minus size={14} /></button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
              onClick={() => onAjustar(i, 'ajuste')}><RefreshCw size={14} /></button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
              onClick={() => onLote(i)} title="Registrar lote">
              <Package size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}