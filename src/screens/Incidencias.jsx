import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { ROLES } from '../utils/constants';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingButton from '../components/LoadingButton';

export default function Incidencias() {
  const { call, loading } = useApi();
  const { usuario } = useApp();
  const [incidencias, setIncidencias] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState('ABIERTA');
  const [modal, setModal] = useState(null);
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

  const cerrar = async () => {
    await call('updateIncidencia', {
      id: modal.id,
      estado: 'CERRADA',
      notas: notas || modal.notas,
      cierreEn: new Date().toISOString(),
    });
    setModal(null);
    setNotas('');
    load();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Incidencias</h1>
        {abiertas > 0 && (
          <span style={{
            background: 'var(--danger)', color: '#fff',
            borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
          }}>{abiertas} abiertas</span>
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
          }}>{f}</button>
        ))}
      </div>

      {visibles.length === 0 && !loading && (
        <p className="empty">
          {filtro === 'ABIERTA' ? '✓ Sin incidencias abiertas' : 'Sin incidencias'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(i => {
          const numeroOrden = getNumeroOrden(i.ordenId);
          const puedesCerrar = !soloLectura && i.estado === 'ABIERTA';
          return (
            <div key={i.id} className="card"
              style={{
                borderColor: i.estado === 'ABIERTA' ? 'var(--danger)' : 'var(--border)',
                cursor: puedesCerrar ? 'pointer' : 'default',
              }}
              onClick={() => puedesCerrar && (setModal(i), setNotas(i.notas || ''))}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {numeroOrden && (
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                      {numeroOrden}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {i.estado === 'ABIERTA'
                      ? <AlertTriangle size={14} color="var(--danger)" />
                      : <CheckCircle size={14} color="var(--success)" />}
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{i.canalNombre}</span>
                  {i.tipo && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                      background: i.tipo === 'DESPACHO' ? 'var(--purple)22' :
                                  i.tipo === 'RECHAZO'  ? 'var(--danger)22' : 'var(--warning)22',
                      color: i.tipo === 'DESPACHO' ? 'var(--purple)' :
                            i.tipo === 'RECHAZO'  ? 'var(--danger)'  : 'var(--warning)',
                      border: `1px solid ${
                        i.tipo === 'DESPACHO' ? 'var(--purple)' :
                        i.tipo === 'RECHAZO'  ? 'var(--danger)'  : 'var(--warning)'
                      }44`,
                    }}>
                      {i.tipo === 'DESPACHO' ? 'Despacho' : i.tipo === 'RECHAZO' ? 'Rechazo' : 'Entrega'}
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
                    {i.cierreEn && ` · Cerrada: ${new Date(i.cierreEn).toLocaleDateString()}`}
                  </div>
                </div>
                {puedesCerrar && (
                  <span style={{ fontSize: 11, color: 'var(--primary)' }}>Cerrar →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="Cerrar incidencia" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 16 }}>
            {getNumeroOrden(modal.ordenId) && (
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                {getNumeroOrden(modal.ordenId)}
              </div>
            )}
            <div style={{ fontWeight: 600 }}>{modal.canalNombre} · {modal.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Pedido: {modal.cantPedida} ·{' '}
              {modal.tipo === 'DESPACHO' ? 'Despachado' : 'Entregado'}: {modal.cantEntregada} ·{' '}
              Diferencia: {modal.diferencia}
            </div>
          </div>
          <div className="form-group">
            <label>Notas de cierre</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Resolución, acuerdo, motivo..." />
          </div>
          <LoadingButton
            onClick={cerrar}
            className="btn btn-success"
            style={{ width: '100%', justifyContent: 'center' }}>
            <CheckCircle size={16} style={{ marginRight: 6 }} /> Marcar como cerrada
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}