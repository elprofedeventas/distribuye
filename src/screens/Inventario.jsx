import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { AlertTriangle, Plus, Minus, RefreshCw } from 'lucide-react';

export default function Inventario() {
  const { call, loading } = useApi();
  const { refreshInventario } = useApp();
  const [inventario, setInventario] = useState([]);
  const [modal, setModal] = useState(null); // { item, tipo }
  const [cantidad, setCantidad] = useState('');

  const load = async () => {
    const data = await call('getInventario');
    setInventario(data || []);
  };

  useEffect(() => { load(); }, []);

  const ajustar = async () => {
    if (!cantidad) return;
    await call('ajustarInventario', {
      productoId: modal.item.productoId,
      cantidad: Number(cantidad),
      tipo: modal.tipo,
    });
    setModal(null);
    setCantidad('');
    await load();
    refreshInventario();
  };

  const alertas = inventario.filter(i => i.alerta);
  const normales = inventario.filter(i => !i.alerta);

  return (
    <div className="page">
      <h1 className="page-title">Inventario</h1>

      {alertas.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
              Bajo stock mínimo
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {alertas.map(i => <ItemCard key={i.id} i={i} onAjustar={setModal} />)}
          </div>
        </>
      )}

      {normales.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
            Stock normal
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {normales.map(i => <ItemCard key={i.id} i={i} onAjustar={setModal} />)}
          </div>
        </>
      )}

      {inventario.length === 0 && !loading && (
        <p className="empty">Sin productos en inventario</p>
      )}

      {modal && (
        <Modal
          title={modal.tipo === 'entrada' ? '+ Entrada de stock' : modal.tipo === 'salida' ? '− Salida de stock' : '✎ Ajuste directo'}
          onClose={() => setModal(null)}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{modal.item.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Stock actual: {modal.item.stockActual}</div>
          </div>
          <div className="form-group">
            <label>{modal.tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}</label>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} autoFocus />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={ajustar}>
            Confirmar
          </button>
        </Modal>
      )}
    </div>
  );
}

function ItemCard({ i, onAjustar }) {
  return (
    <div className="card" style={{ borderColor: i.alerta ? 'var(--danger)' : 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {i.alerta && <AlertTriangle size={13} color="var(--danger)" />}
            {i.nombre}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {i.sku}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: i.alerta ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
            {i.stockActual}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', marginLeft: 4 }}>
              / mín {i.stockMinimo}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
            onClick={() => onAjustar({ item: i, tipo: 'entrada' })}>
            <Plus size={14} />
          </button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
            onClick={() => onAjustar({ item: i, tipo: 'salida' })}>
            <Minus size={14} />
          </button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
            onClick={() => onAjustar({ item: i, tipo: 'ajuste' })}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}