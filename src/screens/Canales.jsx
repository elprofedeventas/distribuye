import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';
import { Plus, Pencil, Search } from 'lucide-react';

const empty = {
  codigoCliente: '', nombre: '', nombreComercial: '', ruc: '',
  tipoContribuyente: '', tipoCliente: '', pais: 'Ecuador',
  provincia: '', ciudad: '', direccion: '',
  emailFacturacion: '', diasEntrega: '', direccionEntrega: '', ciudadEntrega: '',
  contacto: '', emailComercial: '', telefono: '', whatsapp: '',
  agenteRetencion: '', contribuyenteEspecial: '', regimen: '',
  formaPago: '', diasCredito: '0', cupoCredito: '',
  listaPrecios: '', ejecutivo: '', riesgoCredito: '', zona: '',
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

export default function Canales() {
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const [canales, setCanales] = useState([]);
  const [config, setConfig] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const soloLectura = usuario?.rol === ROLES.GERENCIA;

  const load = () => {
    call('getCanales').then(d => setCanales(d || []));
    call('getConfiguracion').then(d => setConfig(d || {}));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(empty); setEditId(null); setModal(true); };

  const openEdit = (c) => {
    setForm({
      codigoCliente: str(c.codigoCliente),
      nombre: str(c.nombre),
      nombreComercial: str(c.nombreComercial),
      ruc: str(c.ruc),
      tipoContribuyente: str(c.tipoContribuyente),
      tipoCliente: str(c.tipoCliente),
      pais: str(c.pais) || 'Ecuador',
      provincia: str(c.provincia),
      ciudad: str(c.ciudad),
      direccion: str(c.direccion),
      emailFacturacion: str(c.emailFacturacion),
      diasEntrega: str(c.diasEntrega),
      direccionEntrega: str(c.direccionEntrega),
      ciudadEntrega: str(c.ciudadEntrega),
      contacto: str(c.contacto),
      emailComercial: str(c.emailComercial),
      telefono: str(c.telefono),
      whatsapp: str(c.whatsapp),
      agenteRetencion: str(c.agenteRetencion),
      contribuyenteEspecial: str(c.contribuyenteEspecial),
      regimen: str(c.regimen),
      formaPago: str(c.formaPago),
      diasCredito: str(c.diasCredito) || '0',
      cupoCredito: str(c.cupoCredito),
      listaPrecios: str(c.listaPrecios),
      ejecutivo: str(c.ejecutivo),
      riesgoCredito: str(c.riesgoCredito),
      zona: str(c.zona),
    });
    setEditId(c.id);
    setModal(true);
  };

  const save = async () => {
    if (!form.nombre) return;
    if (editId) await call('updateCanal', { ...form, id: editId });
    else await call('createCanal', { ...form, activo: true });
    setModal(false);
    load();
  };

  const tiposCliente = config.tipoCliente || [];
  const ciudades = config.ciudad || [];
  const listasPrecios = config.listaPrecios || [];
  const formasPago = config.formaPago || [];
  const regimenes = config.regimen || [];
  const tiposContribuyente = config.tipoContribuyente || [];
  const riesgosCredito = config.riesgoCredito || [];
  const ejecutivos = config.ejecutivo || [];

  const visibles = canales.filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      str(c.nombre).toLowerCase().includes(q) ||
      str(c.nombreComercial).toLowerCase().includes(q) ||
      str(c.ruc).toLowerCase().includes(q) ||
      str(c.contacto).toLowerCase().includes(q)
    );
  });

  // Colores por sección
  const C = {
    id:       '#1A56DB',
    ubicacion:'#059669',
    entrega:  '#D97706',
    contacto: '#0891B2',
    comercial:'#7C3AED',
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Clientes</h1>
        {!soloLectura && (
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo</button>
        )}
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
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{str(c.nombre)}</div>
              {c.nombreComercial && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{str(c.nombreComercial)}</div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {c.tipoCliente && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 4,
                    background: 'var(--primary)22', color: 'var(--primary)',
                    border: '1px solid var(--primary)44',
                  }}>{str(c.tipoCliente)}</span>
                )}
                {c.listaPrecios && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 4,
                    background: 'var(--success)22', color: 'var(--success)',
                    border: '1px solid var(--success)44',
                  }}>{str(c.listaPrecios)}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                {c.ruc ? `RUC: ${str(c.ruc)}` : ''}
                {c.ruc && c.ciudad ? ' · ' : ''}
                {str(c.ciudad)}
              </div>
              {c.emailFacturacion && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>📧 {str(c.emailFacturacion)}</div>
              )}
              {c.telefono && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Tel: {str(c.telefono)}</div>
              )}
              {c.diasCredito && Number(c.diasCredito) > 0 && (
                <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>
                  Crédito: {str(c.diasCredito)} días
                </div>
              )}
            </div>
            {!soloLectura && (
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(c)}>
                <Pencil size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModal(false)}>

          {/* ── IDENTIFICACIÓN ── */}
          <SectionHeader label="Identificación" color={C.id} />
          <Field label="Razón Social *" color={C.id}>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </Field>
          <Field label="Nombre Comercial" color={C.id}>
            <input value={form.nombreComercial} onChange={e => set('nombreComercial', e.target.value)} />
          </Field>
          <Field label="RUC" color={C.id}>
            <input value={form.ruc} onChange={e => set('ruc', e.target.value)} />
          </Field>
          <Field label="Código cliente" color={C.id}>
            <input value={form.codigoCliente} onChange={e => set('codigoCliente', e.target.value)} />
          </Field>
          <Field label="Tipo de cliente" color={C.id}>
            <select value={form.tipoCliente} onChange={e => set('tipoCliente', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {tiposCliente.map(t => <option key={t} value={t}>{str(t)}</option>)}
            </select>
          </Field>
          <Field label="Tipo contribuyente" color={C.id}>
            <select value={form.tipoContribuyente} onChange={e => set('tipoContribuyente', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {tiposContribuyente.map(t => <option key={t} value={t}>{str(t)}</option>)}
            </select>
          </Field>
          <Field label="Régimen" color={C.id}>
            <select value={form.regimen} onChange={e => set('regimen', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {regimenes.map(t => <option key={t} value={t}>{str(t)}</option>)}
            </select>
          </Field>
          <Field label="Agente de retención" color={C.id}>
            <select value={form.agenteRetencion} onChange={e => set('agenteRetencion', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="Contribuyente especial" color={C.id}>
            <select value={form.contribuyenteEspecial} onChange={e => set('contribuyenteEspecial', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </Field>

          {/* ── UBICACIÓN ── */}
          <SectionHeader label="Ubicación" color={C.ubicacion} />
          <Field label="País" color={C.ubicacion}>
            <input value={form.pais} onChange={e => set('pais', e.target.value)} />
          </Field>
          <Field label="Provincia" color={C.ubicacion}>
            <input value={form.provincia} onChange={e => set('provincia', e.target.value)} />
          </Field>
          <Field label="Ciudad" color={C.ubicacion}>
            <select value={form.ciudad} onChange={e => set('ciudad', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {ciudades.map(c => <option key={c} value={c}>{str(c)}</option>)}
            </select>
          </Field>
          <Field label="Dirección facturación" color={C.ubicacion}>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </Field>

          {/* ── ENTREGA ── */}
          <SectionHeader label="Entrega" color={C.entrega} />
          <Field label="Dirección entrega" color={C.entrega}>
            <input value={form.direccionEntrega} onChange={e => set('direccionEntrega', e.target.value)} />
          </Field>
          <Field label="Ciudad entrega" color={C.entrega}>
            <input value={form.ciudadEntrega} onChange={e => set('ciudadEntrega', e.target.value)} />
          </Field>
          <Field label="Días programados de entrega" color={C.entrega}>
            <input value={form.diasEntrega} onChange={e => set('diasEntrega', e.target.value)} />
          </Field>

          {/* ── CONTACTO ── */}
          <SectionHeader label="Contacto" color={C.contacto} />
          <Field label="Contacto comercial" color={C.contacto}>
            <input value={form.contacto} onChange={e => set('contacto', e.target.value)} />
          </Field>
          <Field label="Email comercial" color={C.contacto}>
            <input value={form.emailComercial} onChange={e => set('emailComercial', e.target.value)} inputMode="email" />
          </Field>
          <Field label="Email facturación" color={C.contacto}>
            <input value={form.emailFacturacion} onChange={e => set('emailFacturacion', e.target.value)} inputMode="email" />
          </Field>
          <Field label="Teléfono" color={C.contacto}>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="WhatsApp" color={C.contacto}>
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} inputMode="numeric" />
          </Field>

          {/* ── COMERCIAL ── */}
          <SectionHeader label="Comercial" color={C.comercial} />
          <Field label="Lista de precios" color={C.comercial}>
            <select value={form.listaPrecios} onChange={e => set('listaPrecios', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {listasPrecios.map(l => <option key={l} value={l}>{str(l)}</option>)}
            </select>
          </Field>
          <Field label="Forma de pago" color={C.comercial}>
            <select value={form.formaPago} onChange={e => set('formaPago', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {formasPago.map(f => <option key={f} value={f}>{str(f)}</option>)}
            </select>
          </Field>
          <Field label="Días de crédito" color={C.comercial}>
            <select value={form.diasCredito || '0'} onChange={e => set('diasCredito', e.target.value)}>
              <option value="0">Pago inmediato</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </select>
          </Field>
          <Field label="Cupo de crédito (USD)" color={C.comercial}>
            <input type="number" value={form.cupoCredito} onChange={e => set('cupoCredito', e.target.value)} />
          </Field>
          <Field label="Riesgo crediticio" color={C.comercial}>
            <select value={form.riesgoCredito} onChange={e => set('riesgoCredito', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {riesgosCredito.map(r => <option key={r} value={r}>{str(r)}</option>)}
            </select>
          </Field>
          <Field label="Ejecutivo de cuenta" color={C.comercial}>
            <select value={form.ejecutivo} onChange={e => set('ejecutivo', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {ejecutivos.map(e => <option key={e} value={e}>{str(e)}</option>)}
            </select>
          </Field>
          <Field label="Zona" color={C.comercial}>
            <input value={form.zona} onChange={e => set('zona', e.target.value)} />
          </Field>

          <LoadingButton onClick={save} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {editId ? 'Guardar cambios' : 'Crear cliente'}
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}