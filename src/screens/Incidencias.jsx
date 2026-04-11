import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';

const CATEGORIAS = ['Logística', 'Calidad', 'Facturación'];

export default function Incidencias() {
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const [incidencias, setIncidencias] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('ABIERTA');
  const [modalAbrir, setModalAbrir] = useState(null);
  const [modalCerrar, setModalCerrar] = useState(null);
  const [categoria, setCategoria] = useState('');
  const [notas, setNotas] = useState('');

  const soloLectura = [ROLES.GERENCIA, ROLES.DESPACHADOR].includes(usuario?.rol);

  const load = () => Promise.all([
    call('getIncidencias'),
    call('getOrdenes'),
  ]).then(([incs, ords]) => {
    let incsFiltradas = incs || [];
    if (usuario?.rol === ROLES.DESPACHADOR) {
      incsFiltradas = incsFiltradas.filter(i => i.tipo === 'DESPACHO' || i.tipo === 'ENTREGA');
    }
    setIncidencias(incsFiltradas);
    setOrdenes(ords || []);
  });

  useEffect(() => { load(); }, []);

  const getNumeroOrden = (ordenId) => {
    const o = ordenes.find(o => o.id === ordenId);
    return o?.numeroOrden || '';
  };

  const visibles = incidencias.filter(i => filtro === 'TODAS' || i.estado === filtro);
  const abiertas = incidencias.filter(i => i.estado === 'ABIERTA').length;

  const abrirConCategoria = async () => {
    if (!categoria) return;
    await call('updateIncidencia', {
      id: modalAbrir.id,
      categoria,
    });
    setModalAbrir(null);
    setCategoria('');
    load();
  };

  const cerrar = async () => {
    if (!categoria) return;
    await call('updateIncidencia', {
      id: modalCerrar.id,
      estado: 'CERRADA',
      categoria,
      notas: notas || modalCerrar.notas,
      cierreEn: new Date().toISOString(),
    });
    setModalCerrar(null);
    setCategoria('');
    setNotas('');
    load();
  };

  const handleClick = (i) => {
    if (soloLectura || i.estado !== 'ABIERTA') return;
    if (!i.categoria) {
      setCategoria('');
      setModalAbrir(i);
    } else {
      setCategoria(i.categoria);
      setNotas(i.notas || '');
      setModalCerrar(i);
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Reclamos</h1>
        {abiertas > 0 && (
          <span style={{
            background: 'var(--danger)', color: '#fff',
            borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
          }}>{abiertas} abiertos</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['ABIERTA', 'CERRADA', 'TODAS'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: '1px solid',
            background: filtro === f ? 'var(--primary)' : 'transparent',
            borderColor: filtro === f ? 'var(--primary)' : 'var(--border)',
            color: filtro === f ? '#fff' : 'var(--text2)',
          }}>
            {f === 'ABIERTA' ? 'ABIERTOS' : f === 'CERRADA' ? 'CERRADOS' : 'TODOS'}
          </button>
        ))}
      </div>

      {visibles.length === 0 && !loading && (
        <p className="empty">
          {filtro === 'ABIERTA' ? '✓ Sin reclamos abiertos' : 'Sin reclamos'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(i => {
          const numeroOrden = getNumeroOrden(i.ordenId);
          const puedeGestionar = !soloLectura && i.estado === 'ABIERTA';
          const necesitaCategoria = puedeGestionar && !i.categoria;
          return (
            <div key={i.id} className="card"
              style={{
                borderColor: i.estado === 'ABIERTA' ? 'var(--danger)' : 'var(--border)',
                cursor: puedeGestionar ? 'pointer' : 'default',
              }}
              onClick={() => handleClick(i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {numeroOrden && (
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                      {numeroOrden}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {i.estado === 'ABIERTA'
                      ? <AlertTriangle size={14} color="var(--danger)" />
                      : <CheckCircle size={14} color="var(--success)" />}
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{i.canalNombre}</span>
                    {i.tipo && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: i.tipo === 'DESPACHO' ? '#8B5CF622' :
                                    i.tipo === 'RECHAZO'  ? '#DC262622' : '#D9770622',
                        color: i.tipo === 'DESPACHO' ? '#7C3AED' :
                               i.tipo === 'RECHAZO'  ? '#DC2626'  : '#D97706',
                        border: `1px solid ${i.tipo === 'DESPACHO' ? '#7C3AED' : i.tipo === 'RECHAZO' ? '#DC2626' : '#D97706'}44`,
                      }}>
                        {i.tipo === 'DESPACHO' ? 'Preparación' : i.tipo === 'RECHAZO' ? 'Rechazo' : 'Entrega'}
                      </span>
                    )}
                    {i.categoria && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: '#0891B222', color: '#0891B2',
                        border: '1px solid #0891B244',
                      }}>
                        {i.categoria}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13 }}>{i.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    Pedido: {i.cantPedida} ·{' '}
                    {i.tipo === 'DESPACHO'
                      ? <span>Despachado: {i.cantEntregada}</span>
                      : <span>Entregado: {i.cantEntregada}</span>
                    } ·{' '}
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Dif: {i.diferencia}</span>
                  </div>
                  {i.notas && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{i.notas}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                    {new Date(i.creadoEn).toLocaleDateString()}
                    {i.cierreEn && ` · Cerrado: ${new Date(i.cierreEn).toLocaleDateString()}`}
                  </div>
                </div>
                {puedeGestionar && (
                  <span style={{ fontSize: 11, color: necesitaCategoria ? 'var(--warning)' : 'var(--primary)', marginLeft: 8 }}>
                    {necesitaCategoria ? 'Clasificar →' : 'Cerrar →'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal clasificar (sin categoría aún) */}
      {modalAbrir && (
        <Modal title="Clasificar reclamo" onClose={() => setModalAbrir(null)}>
          <div style={{ marginBottom: 16 }}>
            {getNumeroOrden(modalAbrir.ordenId) && (
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                {getNumeroOrden(modalAbrir.ordenId)}
              </div>
            )}
            <div style={{ fontWeight: 600 }}>{modalAbrir.canalNombre} · {modalAbrir.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Diferencia: {modalAbrir.diferencia} unidades
            </div>
          </div>
          <div className="form-group">
            <label>Categoría del reclamo *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <LoadingButton
            onClick={abrirConCategoria}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!categoria}>
            Guardar clasificación
          </LoadingButton>
        </Modal>
      )}

      {/* Modal cerrar */}
      {modalCerrar && (
        <Modal title="Cerrar reclamo" onClose={() => setModalCerrar(null)}>
          <div style={{ marginBottom: 16 }}>
            {getNumeroOrden(modalCerrar.ordenId) && (
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                {getNumeroOrden(modalCerrar.ordenId)}
              </div>
            )}
            <div style={{ fontWeight: 600 }}>{modalCerrar.canalNombre} · {modalCerrar.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Pedido: {modalCerrar.cantPedida} ·{' '}
              {modalCerrar.tipo === 'DESPACHO' ? 'Despachado' : 'Entregado'}: {modalCerrar.cantEntregada} ·{' '}
              Diferencia: {modalCerrar.diferencia}
            </div>
          </div>
          <div className="form-group">
            <label>Categoría *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Notas de cierre</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Resolución, acuerdo, motivo..." />
          </div>
          <LoadingButton
            onClick={cerrar}
            className="btn btn-success"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!categoria}>
            <CheckCircle size={16} style={{ marginRight: 6 }} /> Marcar como cerrado
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}