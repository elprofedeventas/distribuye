import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatFecha, formatMonto } from '../utils/constants';
import LoadingButton from '../components/LoadingButton';
import Modal from '../components/Modal';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function Cartera() {
  const { call, loading } = useApi();
  const [resumen, setResumen] = useState({ pendiente: 0, vencido: 0, cobrado: 0, items: [] });
  const [filtro, setFiltro] = useState('PENDIENTE');
  const [modal, setModal] = useState(null);
  const [notas, setNotas] = useState('');

  const load = async () => {
    const data = await call('getCarteraResumen');
    setResumen(data || { pendiente: 0, vencido: 0, cobrado: 0, items: [] });
  };

  useEffect(() => { load(); }, []);

  const marcarCobrado = async () => {
    await call('updateCartera', {
      id: modal.id,
      estado: 'COBRADO',
      notas,
      cobradoEn: new Date().toISOString(),
    });
    setModal(null);
    setNotas('');
    load();
  };

  const hoy = new Date();
  const visibles = (resumen.items || []).filter(i => filtro === 'TODAS' || i.estado === filtro);

  const getDiasVencimiento = (fechaVenc) => {
    if (!fechaVenc) return null;
    const diff = Math.ceil((new Date(fechaVenc) - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="page">
      <h1 className="page-title">Cartera B2B</h1>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--warning)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>PENDIENTE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706' }}>{formatMonto(resumen.pendiente)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--danger)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>VENCIDO</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{formatMonto(resumen.vencido)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--success)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>COBRADO</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{formatMonto(resumen.cobrado)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['PENDIENTE','VENCIDO','COBRADO','TODAS'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
            border: '1px solid', whiteSpace: 'nowrap',
            background: filtro === f ? 'var(--primary)' : 'transparent',
            borderColor: filtro === f ? 'var(--primary)' : 'var(--border)',
            color: filtro === f ? '#fff' : 'var(--text2)',
          }}>{f}</button>
        ))}
      </div>

      {visibles.length === 0 && !loading && (
        <p className="empty">Sin registros en cartera</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(item => {
          const dias = getDiasVencimiento(item.fechaVencimiento);
          const vencido = item.estado === 'VENCIDO';
          const proximoVencer = item.estado === 'PENDIENTE' && dias !== null && dias <= 7;
          return (
            <div key={item.id} className="card"
              style={{
                borderColor: vencido ? 'var(--danger)' : proximoVencer ? 'var(--warning)' : 'var(--border)',
                cursor: item.estado !== 'COBRADO' ? 'pointer' : 'default',
              }}
              onClick={() => item.estado !== 'COBRADO' && (setModal(item), setNotas(item.notas || ''))}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
                    {item.numeroOrden}
                  </div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {vencido && <AlertTriangle size={14} color="var(--danger)" />}
                    {proximoVencer && <Clock size={14} color="var(--warning)" />}
                    {item.clienteNombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    RUC: {item.ruc || '—'} · Entrega: {formatFecha(item.fechaOrden)}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: vencido ? 'var(--danger)' : 'var(--text)' }}>
                      {formatMonto(item.monto)}
                    </span>
                    <span style={{ color: vencido ? 'var(--danger)' : proximoVencer ? 'var(--warning)' : 'var(--text2)' }}>
                      Vence: {formatFecha(item.fechaVencimiento)}
                      {dias !== null && item.estado === 'PENDIENTE' && (
                        <span style={{ marginLeft: 4 }}>
                          ({dias > 0 ? `en ${dias}d` : dias === 0 ? 'hoy' : `hace ${Math.abs(dias)}d`})
                        </span>
                      )}
                    </span>
                  </div>
                  {item.notas && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{item.notas}</div>
                  )}
                  {item.cobradoEn && (
                    <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
                      Cobrado: {formatFecha(item.cobradoEn)}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 8 }}>
                  {item.estado === 'COBRADO'
                    ? <CheckCircle size={18} color="var(--success)" />
                    : item.estado === 'VENCIDO'
                    ? <AlertTriangle size={18} color="var(--danger)" />
                    : <Clock size={18} color="var(--warning)" />
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="Registrar cobro" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
              {modal.numeroOrden}
            </div>
            <div style={{ fontWeight: 600 }}>{modal.clienteNombre}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', marginTop: 6 }}>
              {formatMonto(modal.monto)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              Vencimiento: {formatFecha(modal.fechaVencimiento)}
            </div>
          </div>
          <div className="form-group">
            <label>Notas de cobro</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Forma de pago, referencia transferencia..." />
          </div>
          <LoadingButton onClick={marcarCobrado} className="btn btn-success"
            style={{ width: '100%', justifyContent: 'center' }}>
            <CheckCircle size={16} style={{ marginRight: 6 }} /> Marcar como cobrado
          </LoadingButton>
        </Modal>
      )}
    </div>
  );
}