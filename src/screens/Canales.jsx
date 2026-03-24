import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import { Plus, Pencil, Search } from 'lucide-react';

const empty = {
  nombre: '', ruc: '', direccion: '', telefono: '',
  contacto: '', whatsapp: '', zona: '', ciudad: '', tipoCliente: ''
};

const str = (v) => (v === undefined || v === null) ? '' : String(v);

export default function Canales() {
  const { call, loading } = useApi();
  const [canales, setCanales] = useState([]);
  const [config, setConfig] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const load = () => {
    call('getCanales').then(d => setCanales(d || []));
    call('getConfiguracion').then(d => setConfig(d || {}));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditId(c.id); setModal(true); };

  const save = async () => {
    if (!form.nombre) return;
    if (editId) await call('updateCanal', { ...form, id: editId });
    else await call('createCanal', { ...form, activo: true });
    setModal(false);
    load();
  };

  const tiposCliente = config.tipoCliente || [];
  const ciudades = config.ciudades || [];

  const visibles = canales.filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      str(c.nombre).toLowerCase().includes(q) ||
      str(c.ruc).toLowerCase().includes(q) ||
      str(c.contacto).toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Clientes</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo</button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text2)',
        }} />
        <input
          placeholder="Buscar por nombre, RUC o contacto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {visibles.length === 0 && !loading && (
        <p className="empty">
          {busqueda ? 'Sin resultados para esa búsqueda' : 'Sin clientes registrados'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(c => (
          <div key={c.id} className="card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{str(c.nombre)}</div>
              {c.tipoCliente && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 4,
                  background: 'var(--primary)22', color: 'var(--primary)',
                  border: '1px solid var(--primary)44', marginTop: 4, display: 'inline-block',
                }}>
                  {str(c.tipoCliente)}
                </span>
              )}
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                {c.ruc ? `RUC: ${str(c.ruc)}` : ''}
                {c.ruc && c.ciudad ? ' · ' : ''}
                {str(c.ciudad)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{str(c.direccion)}</div>
              {c.telefono && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Tel: {str(c.telefono)}</div>}
              {c.whatsapp && <div style={{ fontSize: 12, color: 'var(--success)' }}>📱 {str(c.whatsapp)}</div>}
            </div>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(c)}>
              <Pencil size={14} />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModal(false)}>
          <div className="form-group">
            <label>Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </div>
          <div className="form-group">
            <label>RUC</label>
            <input value={form.ruc} onChange={e => set('ruc', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tipo de cliente</label>
            <select value={form.tipoCliente} onChange={e => set('tipoCliente', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {tiposCliente.map(t => <option key={t} value={t}>{str(t)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <select value={form.ciudad} onChange={e => set('ciudad', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {ciudades.map(c => <option key={c} value={c}>{str(c)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label>Contacto</label>
            <input value={form.contacto} onChange={e => set('contacto', e.target.value)} />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label>Zona</label>
            <input value={form.zona} onChange={e => set('zona', e.target.value)} />
          </div>
          <button className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
            {editId ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </Modal>
      )}
    </div>
  );
}