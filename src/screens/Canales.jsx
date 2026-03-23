import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { DIAS_SEMANA } from '../utils/constants';
import Modal from '../components/Modal';
import { Plus, Pencil } from 'lucide-react';

const empty = { nombre: '', ruc: '', direccion: '', contacto: '', whatsapp: '', zona: '', diaSemana: '' };

export default function Canales() {
  const { call, loading } = useApi();
  const [canales, setCanales] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = () => call('getCanales').then(d => setCanales(d || []));
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

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Clientes</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo</button>
      </div>

      {canales.length === 0 && !loading && <p className="empty">Sin clientes registrados</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canales.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.zona} · {c.diaSemana}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.direccion}</div>
              {c.whatsapp && <div style={{ fontSize: 12, color: 'var(--success)' }}>📱 {c.whatsapp}</div>}
            </div>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(c)}>
              <Pencil size={14} />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModal(false)}>
          <div className="form-group"><label>Nombre / Tienda *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group"><label>RUC / Código</label>
            <input value={form.ruc} onChange={e => set('ruc', e.target.value)} /></div>
          <div className="form-group"><label>Dirección de entrega</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} /></div>
          <div className="form-group"><label>Contacto</label>
            <input value={form.contacto} onChange={e => set('contacto', e.target.value)} /></div>
          <div className="form-group"><label>WhatsApp</label>
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} inputMode="numeric" /></div>
          <div className="form-group"><label>Zona</label>
            <input value={form.zona} onChange={e => set('zona', e.target.value)} /></div>
          <div className="form-group"><label>Día de visita</label>
            <select value={form.diaSemana} onChange={e => set('diaSemana', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
            {editId ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </Modal>
      )}
    </div>
  );
}
