import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatMonto } from '../utils/constants';
import LoadingButton from '../components/LoadingButton';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const añoActual = new Date().getFullYear();
const mesActual = new Date().getMonth() + 1;

export default function Metas() {
  const { call, loading } = useApi();
  const [metas, setMetas] = useState([]);
  const [año, setAño] = useState(String(añoActual));
  const [mes, setMes] = useState(String(mesActual));
  const [metaB2B, setMetaB2B] = useState('');
  const [metaB2C, setMetaB2C] = useState('');
  const [guardado, setGuardado] = useState(false);

  const load = async () => {
    const data = await call('getMetas');
    setMetas(data || []);
  };

  useEffect(() => { load(); }, []);

  // Cargar valores cuando cambia mes/año
  useEffect(() => {
    const b2b = metas.find(m => String(m.año) === String(año) && String(m.mes) === String(mes) && m.canalTipo === 'B2B');
    const b2c = metas.find(m => String(m.año) === String(año) && String(m.mes) === String(mes) && m.canalTipo === 'B2C');
    setMetaB2B(b2b ? String(b2b.meta) : '');
    setMetaB2C(b2c ? String(b2c.meta) : '');
    setGuardado(false);
  }, [año, mes, metas]);

  const guardar = async () => {
    if (!metaB2B && !metaB2C) return;
    const promesas = [];
    if (metaB2B) {
      promesas.push(call('saveMeta', { año: Number(año), mes: Number(mes), canalTipo: 'B2B', meta: Number(metaB2B) }));
    }
    if (metaB2C) {
      promesas.push(call('saveMeta', { año: Number(año), mes: Number(mes), canalTipo: 'B2C', meta: Number(metaB2C) }));
    }
    await Promise.all(promesas);
    setGuardado(true);
    load();
  };

  // Resumen anual
  const resumenAnual = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const b2b = metas.find(x => String(x.año) === String(año) && String(x.mes) === String(m) && x.canalTipo === 'B2B');
    const b2c = metas.find(x => String(x.año) === String(año) && String(x.mes) === String(m) && x.canalTipo === 'B2C');
    return {
      mes: m,
      nombre: MESES[i],
      b2b: b2b ? Number(b2b.meta) : 0,
      b2c: b2c ? Number(b2c.meta) : 0,
      total: (b2b ? Number(b2b.meta) : 0) + (b2c ? Number(b2c.meta) : 0),
    };
  });

  const totalAnualB2B = resumenAnual.reduce((s, m) => s + m.b2b, 0);
  const totalAnualB2C = resumenAnual.reduce((s, m) => s + m.b2c, 0);
  const totalAnual = totalAnualB2B + totalAnualB2C;

  return (
    <div className="page">
      <h1 className="page-title">Metas de venta</h1>

      {/* Selector período */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
          Configurar meta mensual
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Año</div>
            <select value={año} onChange={e => setAño(e.target.value)}>
              {[añoActual - 1, añoActual, añoActual + 1].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Mes</div>
            <select value={mes} onChange={e => setMes(e.target.value)}>
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#1A56DB', marginBottom: 4 }}>
              Meta B2B (Grandes cadenas)
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={metaB2B}
              onChange={e => { setMetaB2B(e.target.value); setGuardado(false); }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0891B2', marginBottom: 4 }}>
              Meta B2C (E-commerce)
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={metaB2C}
              onChange={e => { setMetaB2C(e.target.value); setGuardado(false); }}
            />
          </div>
        </div>

        {(metaB2B || metaB2C) && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Total mes: <strong style={{ color: 'var(--text)' }}>
              {formatMonto((Number(metaB2B) || 0) + (Number(metaB2C) || 0))}
            </strong>
          </div>
        )}

        <LoadingButton
          onClick={guardar}
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={!metaB2B && !metaB2C}>
          {guardado ? '✓ Guardado' : 'Guardar meta'}
        </LoadingButton>
      </div>

      {/* Resumen anual */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
        Resumen {año}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {resumenAnual.map(m => (
          <div key={m.mes} className="card"
            style={{
              padding: '10px 16px',
              borderColor: String(m.mes) === String(mesActual) && String(año) === String(añoActual)
                ? 'var(--primary)' : 'var(--border)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: String(m.mes) === String(mesActual) && String(año) === String(añoActual)
                    ? 'var(--primary)' : 'var(--text2)',
                  minWidth: 80,
                }}>
                  {m.nombre}
                  {String(m.mes) === String(mesActual) && String(año) === String(añoActual) && (
                    <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>
                      actual
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center' }}>
                {m.b2b > 0 && (
                  <span style={{ color: '#1A56DB' }}>B2B: {formatMonto(m.b2b)}</span>
                )}
                {m.b2c > 0 && (
                  <span style={{ color: '#0891B2' }}>B2C: {formatMonto(m.b2c)}</span>
                )}
                {m.total > 0 ? (
                  <span style={{ fontWeight: 600, minWidth: 90, textAlign: 'right' }}>
                    {formatMonto(m.total)}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text2)', fontSize: 11, minWidth: 90, textAlign: 'right' }}>
                    Sin meta
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total anual */}
      {totalAnual > 0 && (
        <div className="card" style={{ borderColor: 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text2)' }}>Total B2B {año}</span>
            <span style={{ color: '#1A56DB', fontWeight: 600 }}>{formatMonto(totalAnualB2B)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--text2)' }}>Total B2C {año}</span>
            <span style={{ color: '#0891B2', fontWeight: 600 }}>{formatMonto(totalAnualB2C)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <span>Meta total {año}</span>
            <span style={{ color: 'var(--success)' }}>{formatMonto(totalAnual)}</span>
          </div>
        </div>
      )}
    </div>
  );
}