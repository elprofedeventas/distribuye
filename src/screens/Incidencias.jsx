import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';

export default function Incidencias() {
  const { call, loading } = useApi();
  const [incidencias, setIncidencias] = useState([]);
  const [filtro, setFiltro] = useState('ABIERTA');
  const [modal, setModal] = useState(null);
  const [notas, setNotas] = useState('');

  const load = () => call('getIncidencias').then(d => setIncidencias(d || []));
  useEffect(() => { load(); }, []);

  const visibles = incidencias.filter(i => filtro === 'TODAS' || i.estado === filtro);

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

  const abiertas = incidencias.filter(i => i.estado === 'ABIERTA').length;

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
        {visibles.map(i => (
          <div key={i.id} className="card"
            style={{ borderColor: i.estado === 'ABIERTA' ? 'var(--danger)' : 'var(--border)', cursor: i.estado === 'ABIERTA' ? 'pointer' : 'default' }}
            onClick={() => i.estado === 'ABIERTA' && (setModal(i), setNotas(i.notas || ''))}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {i.estado === 'ABIERTA'
                    ? <AlertTriangle size={14} color="var(--danger)" />
                    : <CheckCircle size={14} color="var(--success)" />}
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{i.canalNombre}</span>
                </div>
                <div style={{ fontSize: 13 }}>{i.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  Pedido: {i.cantPedida} · Entregado: {i.cantEntregada} ·{' '}
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Dif: {i.diferencia}</span>
                </div>
                {i.notas && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    {i.notas}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                  {new Date(i.creadoEn).toLocaleDateString()}
                  {i.cierreEn && ` · Cerrada: ${new Date(i.cierreEn).toLocaleDateString()}`}
                </div>
              </div>
              {i.estado === 'ABIERTA' && (
                <span style={{ fontSize: 11, color: 'var(--primary)' }}>Cerrar →</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Cerrar incidencia" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{modal.canalNombre} · {modal.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Pedido: {modal.cantPedida} · Entregado: {modal.cantEntregada} · Diferencia: {modal.diferencia}
            </div>
          </div>
          <div className="form-group">
            <label>Notas de cierre</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Resolución, acuerdo, motivo..." />
          </div>
          <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}
            onClick={cerrar}>
            <CheckCircle size={16} /> Marcar como cerrada
          </button>
        </Modal>
      )}
    </div>
  );
}