import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { formatMonto } from '../utils/constants';

const LISTAS = [
  'P01 Supermercados A',
  'P02 Supermercados B',
  'P03 Farmacias A',
  'P04 Farmacias B',
  'P05 C-stores A',
  'P06 Otros C-Stores',
  'P07 Wellness',
  'P08 Gyms',
  'P09 Web',
  'P10 Eventos',
];

export default function MatrizPrecios() {
  const { call, loading } = useApi();
  const [precios, setPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroLista, setFiltroLista] = useState('');
  const [form, setForm] = useState({
    listaPrecios: '', productoId: '', sku: '',
    nombreProducto: '', precioLista: '',
  });

  const load = () => {
    Promise.all([
      call('getMatrizPrecios'),
      call('getProductos'),
    ]).then(([p, pr]) => {
      setPrecios(p || []);
      setProductos(pr || []);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProductoChange = (productoId) => {
    const p = productos.find(p => p.id === productoId);
    if (!p) return;
    setForm(f => ({
      ...f,
      productoId: p.id,
      sku: p.sku,
      nombreProducto: p.nombre,
    }));
  };

  const openNew = () => {
    setForm({ listaPrecios: '', productoId: '', sku: '', nombreProducto: '', precioLista: '' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (p) => {
    setForm({
      listaPrecios: p.listaPrecios,
      productoId: p.productoId,
      sku: p.sku,
      nombreProducto: p.nombreProducto,
      precioLista: p.precioLista,
    });
    setEditId(p.id);
    setModal(true);
  };

  const save = async () => {
    if (!form.listaPrecios || !form.productoId || !form.precioLista) return;
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

  const visibles = filtroLista
    ? precios.filter(p => p.listaPrecios === filtroLista)
    : precios;

  // Agrupar por lista de precios
  const porLista = visibles.reduce((acc, p) => {
    if (!acc[p.listaPrecios]) acc[p.listaPrecios] = [];
    acc[p.listaPrecios].push(p);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Precios B2B</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Filtro por lista */}
      <div style={{ marginBottom: 16 }}>
        <select value={filtroLista} onChange={e => setFiltroLista(e.target.value)}>
          <option value="">— Todas las listas —</option>
          {LISTAS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {Object.keys(porLista).length === 0 && !loading && (
        <p className="empty">Sin precios configurados</p>
      )}

      {LISTAS.filter(l => porLista[l]).map(lista => (
        <div key={lista} style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text2)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8
          }}>
            {lista}
            <span style={{
              fontSize: 11, background: 'var(--surface2)',
              padding: '2px 8px', borderRadius: 10
            }}>
              {porLista[lista].length} producto{porLista[lista].length > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {porLista[lista].map(p => {
              const prod = productos.find(pr => pr.id === p.productoId);
              return (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.nombreProducto}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        SKU: {p.sku}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                        {prod && (
                          <span style={{ color: 'var(--text2)' }}>
                            PVP: {formatMonto(prod.precio)}
                          </span>
                        )}
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                          Lista: {formatMonto(p.precioLista)}
                        </span>
                        {prod && (
                          <span style={{ color: 'var(--warning)', fontSize: 11 }}>
                            {(((Number(prod.precio) - Number(p.precioLista)) / Number(prod.precio)) * 100).toFixed(1)}% dto.
                          </span>
                        )}
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
        <Modal
          title={editId ? 'Editar precio' : 'Nuevo precio'}
          onClose={() => setModal(false)}>

          <div className="form-group">
            <label>Lista de precios *</label>
            <select value={form.listaPrecios} onChange={e => set('listaPrecios', e.target.value)}>
              <option value="">— Seleccionar lista —</option>
              {LISTAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Producto *</label>
            <select value={form.productoId} onChange={e => handleProductoChange(e.target.value)}>
              <option value="">— Seleccionar producto —</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.sku}) — PVP: {formatMonto(p.precio)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Precio de lista *</label>
            <input
              type="number"
              value={form.precioLista}
              onChange={e => set('precioLista', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {form.precioLista && form.productoId && (() => {
            const prod = productos.find(p => p.id === form.productoId);
            if (!prod) return null;
            const dto = ((Number(prod.precio) - Number(form.precioLista)) / Number(prod.precio) * 100).toFixed(1);
            return (
              <div className="card" style={{ marginBottom: 14, borderColor: 'var(--success)' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  PVP: {formatMonto(prod.precio)}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
                  {formatMonto(form.precioLista)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                  Descuento: {dto}% sobre PVP
                </div>
              </div>
            );
          })()}

          <LoadingButton
            onClick={save}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!form.listaPrecios || !form.productoId || !form.precioLista}>
            {editId ? 'Guardar cambios' : 'Crear precio'}
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}
