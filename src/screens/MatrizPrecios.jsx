import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { Plus, Trash2, Pencil } from 'lucide-react';

export default function MatrizPrecios() {
  const { call, loading } = useApi();
  const [precios, setPrecios] = useState([]);
  const [canales, setCanales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [form, setForm] = useState({
    clienteId: '', clienteNombre: '',
    productoId: '', sku: '', nombreProducto: '',
    descuento: '', precioB2B: '',
  });

  const load = () => {
    Promise.all([
      call('getMatrizPrecios'),
      call('getCanales'),
      call('getProductos'),
    ]).then(([p, c, pr]) => {
      setPrecios(p || []);
      setCanales(c || []);
      setProductos(pr || []);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcularPrecioB2B = (pvp, descuento) => {
    if (!pvp || !descuento) return '';
    return (Number(pvp) * (1 - Number(descuento) / 100)).toFixed(2);
  };

  const handleProductoChange = (productoId) => {
    const p = productos.find(p => p.id === productoId);
    if (!p) return;
    const precioB2B = calcularPrecioB2B(p.precio, form.descuento);
    setForm(f => ({
      ...f,
      productoId: p.id,
      sku: p.sku,
      nombreProducto: p.nombre,
      precioB2B,
    }));
  };

  const handleDescuentoChange = (descuento) => {
    const p = productos.find(p => p.id === form.productoId);
    const precioB2B = p ? calcularPrecioB2B(p.precio, descuento) : '';
    setForm(f => ({ ...f, descuento, precioB2B }));
  };

  const openNew = () => {
    setForm({ clienteId: '', clienteNombre: '', productoId: '', sku: '', nombreProducto: '', descuento: '', precioB2B: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (p) => {
    setForm({
      clienteId: p.clienteId, clienteNombre: p.clienteNombre,
      productoId: p.productoId, sku: p.sku, nombreProducto: p.nombreProducto,
      descuento: p.descuento, precioB2B: p.precioB2B,
    });
    setEditId(p.id);
    setModal(true);
  };

  const save = async () => {
    if (!form.clienteId || !form.productoId || !form.descuento) return;
    if (editId) {
      await call('updatePrecio', { ...form, id: editId, activo: true });
    } else {
      await call('createPrecio', { ...form, activo: true });
    }
    setModal(false);
    load();
  };

  const eliminar = async (id) => {
    await call('deletePrecio', { id });
    load();
  };

  const clientes = [...new Set(precios.map(p => p.clienteNombre))];
  const visibles = filtroCliente
    ? precios.filter(p => p.clienteId === filtroCliente)
    : precios;

  // Agrupar por cliente
  const porCliente = visibles.reduce((acc, p) => {
    if (!acc[p.clienteNombre]) acc[p.clienteNombre] = [];
    acc[p.clienteNombre].push(p);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Precios B2B</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo</button>
      </div>

      {canales.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
            <option value="">— Todos los clientes —</option>
            {canales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      {Object.keys(porCliente).length === 0 && !loading && (
        <p className="empty">Sin precios B2B configurados</p>
      )}

      {Object.entries(porCliente).map(([clienteNombre, items]) => (
        <div key={clienteNombre} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            {clienteNombre}
            <span style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 10 }}>
              {items.length} producto{items.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(p => {
              const prod = productos.find(pr => pr.id === p.productoId);
              return (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.nombreProducto}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {p.sku}</div>
                      <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                        {prod && (
                          <span style={{ color: 'var(--text2)' }}>
                            PVP: ${Number(prod.precio).toFixed(2)}
                          </span>
                        )}
                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                          {p.descuento}% desc.
                        </span>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                          B2B: ${Number(p.precioB2B).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => openEdit(p)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                        onClick={() => eliminar(p.id)}>
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={editId ? 'Editar precio B2B' : 'Nuevo precio B2B'} onClose={() => setModal(false)}>
          <div className="form-group">
            <label>Cliente *</label>
            <select value={form.clienteId} onChange={e => {
              const c = canales.find(c => c.id === e.target.value);
              setForm(f => ({ ...f, clienteId: e.target.value, clienteNombre: c?.nombre || '' }));
            }}>
              <option value="">— Seleccionar cliente —</option>
              {canales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Producto *</label>
            <select value={form.productoId} onChange={e => handleProductoChange(e.target.value)}>
              <option value="">— Seleccionar producto —</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku}) — PVP: ${Number(p.precio).toFixed(2)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Descuento % *</label>
            <input type="number" min={0} max={100} value={form.descuento}
              onChange={e => handleDescuentoChange(e.target.value)}
              placeholder="Ej: 15" />
          </div>
          {form.precioB2B && (
            <div className="card" style={{ marginBottom: 14, borderColor: 'var(--success)' }}>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Precio B2B calculado</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
                ${Number(form.precioB2B).toFixed(2)}
              </div>
            </div>
          )}
          <LoadingButton onClick={save} style={{ width: '100%', justifyContent: 'center' }}
            disabled={!form.clienteId || !form.productoId || !form.descuento}>
            {editId ? 'Guardar cambios' : 'Crear precio'}
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}