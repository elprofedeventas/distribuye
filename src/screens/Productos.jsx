import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { Plus, Pencil } from 'lucide-react';

const empty = {
  sku: '', nombre: '', categoria: '', unidad: 'caja', precio: '', stockMinimo: '',
  ivaRate: '0.15', ean13: '', ean14: '', registroSanitario: '',
  sabor: '', gramos: '', unidadesCaja: '', presentacion: '',
  dimensionesUnidad: '', dimensionesCaja: '', pesoCajaGramos: '', cajasPorPallet: '',
  descripcion: '',
};

const str = (v) => (v === undefined || v === null) ? '' : String(v);

const SectionHeader = ({ label, color }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 16, padding: '6px 10px', borderRadius: 6,
    background: `${color}22`, color, borderLeft: `3px solid ${color}`,
  }}>
    {label}
  </div>
);

const Field = ({ label, color, children }) => (
  <div className="form-group" style={{
    borderLeft: `3px solid ${color}33`,
    paddingLeft: 10,
    marginLeft: -10,
  }}>
    <label style={{ color: `${color}CC` }}>{label}</label>
    {children}
  </div>
);

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

  const openEdit = (p) => {
    setForm({
      sku: str(p.sku), nombre: str(p.nombre), categoria: str(p.categoria),
      unidad: str(p.unidad) || 'caja', precio: str(p.precio),
      stockMinimo: str(p.stockMinimo), ivaRate: str(p.ivaRate) || '0.15',
      ean13: str(p.ean13), ean14: str(p.ean14),
      registroSanitario: str(p.registroSanitario),
      sabor: str(p.sabor), gramos: str(p.gramos),
      unidadesCaja: str(p.unidadesCaja), presentacion: str(p.presentacion),
      dimensionesUnidad: str(p.dimensionesUnidad),
      dimensionesCaja: str(p.dimensionesCaja),
      pesoCajaGramos: str(p.pesoCajaGramos),
      cajasPorPallet: str(p.cajasPorPallet),
      descripcion: str(p.descripcion),
    });
    setEditId(p.id);
    setModal(true);
  };

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

  const C = {
    general:   '#1A56DB',
    comercial: '#7C3AED',
    tecnico:   '#0891B2',
    logistica: '#D97706',
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
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.nombre}</div>
              {p.sabor && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{p.sabor} · {p.gramos}g</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                SKU: {p.sku}
                {p.categoria ? ` · ${p.categoria}` : ''}
                {p.unidad ? ` · ${p.unidad}` : ''}
              </div>
              {p.unidadesCaja && (
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  Caja de {p.unidadesCaja} unidades
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 2, fontWeight: 600 }}>
                ${Number(p.precio).toFixed(2)}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', marginLeft: 6 }}>
                  PVP/unidad
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Stock mín: {p.stockMinimo} cajas</div>
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

          {/* ── GENERAL ── */}
          <SectionHeader label="General" color={C.general} />
          <Field label="SKU *" color={C.general}>
            <input value={form.sku} onChange={e => set('sku', e.target.value)} disabled={!!editId} />
          </Field>
          <Field label="Nombre *" color={C.general}>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </Field>
          <Field label="Descripción" color={C.general}>
            <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </Field>
          <Field label="Categoría" color={C.general}>
            <input value={form.categoria} onChange={e => set('categoria', e.target.value)} />
          </Field>
          <Field label="Sabor" color={C.general}>
            <input value={form.sabor} onChange={e => set('sabor', e.target.value)} />
          </Field>
          <Field label="Gramos" color={C.general}>
            <input type="number" value={form.gramos} onChange={e => set('gramos', e.target.value)} />
          </Field>
          <Field label="Presentación" color={C.general}>
            <input value={form.presentacion} onChange={e => set('presentacion', e.target.value)} />
          </Field>

          {/* ── COMERCIAL ── */}
          <SectionHeader label="Comercial" color={C.comercial} />
          <Field label="Precio PVP (por unidad)" color={C.comercial}>
            <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} />
          </Field>
          <Field label="IVA" color={C.comercial}>
            <select value={form.ivaRate} onChange={e => set('ivaRate', e.target.value)}>
              <option value="0.15">15%</option>
              <option value="0">0% (exento)</option>
            </select>
          </Field>
          <Field label="Unidad de venta" color={C.comercial}>
            <select value={form.unidad} onChange={e => set('unidad', e.target.value)}>
              <option value="caja">caja</option>
              <option value="unid">unidad</option>
              <option value="kg">kg</option>
              <option value="lt">lt</option>
            </select>
          </Field>
          <Field label="Unidades por caja" color={C.comercial}>
            <input type="number" value={form.unidadesCaja} onChange={e => set('unidadesCaja', e.target.value)} />
          </Field>
          <Field label="Stock mínimo (cajas)" color={C.comercial}>
            <input type="number" value={form.stockMinimo} onChange={e => set('stockMinimo', e.target.value)} />
          </Field>

          {/* ── TÉCNICO ── */}
          <SectionHeader label="Técnico / Regulatorio" color={C.tecnico} />
          <Field label="EAN13" color={C.tecnico}>
            <input value={form.ean13} onChange={e => set('ean13', e.target.value)} />
          </Field>
          <Field label="EAN14" color={C.tecnico}>
            <input value={form.ean14} onChange={e => set('ean14', e.target.value)} />
          </Field>
          <Field label="Registro sanitario" color={C.tecnico}>
            <input value={form.registroSanitario} onChange={e => set('registroSanitario', e.target.value)} />
          </Field>

          {/* ── LOGÍSTICA ── */}
          <SectionHeader label="Logística" color={C.logistica} />
          <Field label="Dimensiones unidad" color={C.logistica}>
            <input value={form.dimensionesUnidad} onChange={e => set('dimensionesUnidad', e.target.value)} placeholder="Ej: 20x10x5 cm" />
          </Field>
          <Field label="Dimensiones caja" color={C.logistica}>
            <input value={form.dimensionesCaja} onChange={e => set('dimensionesCaja', e.target.value)} placeholder="Ej: 40x30x25 cm" />
          </Field>
          <Field label="Peso caja (gramos)" color={C.logistica}>
            <input type="number" value={form.pesoCajaGramos} onChange={e => set('pesoCajaGramos', e.target.value)} />
          </Field>
          <Field label="Cajas por pallet" color={C.logistica}>
            <input type="number" value={form.cajasPorPallet} onChange={e => set('cajasPorPallet', e.target.value)} />
          </Field>

          <LoadingButton onClick={save} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {editId ? 'Guardar cambios' : 'Crear producto'}
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}