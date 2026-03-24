import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import { Plus, Pencil } from 'lucide-react';

const empty = { sku: '', nombre: '', categoria: '', unidad: 'unid', precio: '', stockMinimo: '' };
const UNIDADES = ['unid', 'caja', 'kg', 'lt', 'par'];

export default function Productos() {
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const soloLectura = usuario?.rol === ROLES.GERENCIA;

  const load = () => call('getProductos').then(d => setProductos(d || []));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm(p); setEditId(p.id); setModal(true); };

  const save = async () => {
    if (!form.nombre || !form.sku) return;
    if (editId) {
      await call('updateProducto', { ...form, id: editId });
    } else {
      const result = await call('createProducto', { ...form, activo: true });
      await call('ajustarInventario', {
        productoId: result.id, sku: form.sku,
        nombre: form.nombre, cantidad: 0, tipo: 'ajuste',
      });
    }
    setModal(false);
    load();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Productos</h1>
        {!soloLectura && (
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo</button>
        )}
      </div>

      {productos.length === 0 && !loading && <p className="empty">Sin productos registrados</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {productos.map(p => (
          <div key={p.id} className="card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                SKU: {p.sku} · {p.categoria} · {p.unidad}
              </div>
              <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2 }}>
                ${Number(p.precio).toFixed(2)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Stock mín: {p.stockMinimo}</div>
            </div>
            {!soloLectura && (
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(p)}>
                <Pencil size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => setModal(false)}>
          <div className="form-group"><label>SKU *</label>
            <input value={form.sku} onChange={e => set('sku', e.target.value)} disabled={!!editId} /></div>
          <div className="form-group"><label>Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group"><label>Categoría</label>
            <input value={form.categoria} onChange={e => set('categoria', e.target.value)} /></div>
          <div className="form-group"><label>Unidad de medida</label>
            <select value={form.unidad} onChange={e => set('unidad', e.target.value)}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Precio de venta</label>
            <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} /></div>
          <div className="form-group"><label>Stock mínimo (alerta)</label>
            <input type="number" value={form.stockMinimo} onChange={e => set('stockMinimo', e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
            {editId ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </Modal>
      )}
    </div>
  );
}