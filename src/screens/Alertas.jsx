import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatMonto, formatFecha } from '../utils/constants';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

const SEMANAS = ['Esta semana', 'Semana anterior', 'Hace 2 semanas', 'Hace 3 semanas'];
const VENDEDORES = ['Ventas 1', 'Ventas 2', 'Ventas 3'];
const str = (v) => (v === undefined || v === null) ? '' : String(v);

function AlertaCard({ titulo, valor, objetivo, unidad = '%', descripcion }) {
  const esMoneda = unidad === '$';
  const esCartera = objetivo === 0;

  let pct, cumple, critico, color;
  if (esCartera) {
    cumple = valor === 0;
    critico = valor > 0;
    color = cumple ? '#059669' : '#DC2626';
    pct = null;
  } else {
    pct = objetivo > 0 ? (valor / objetivo) * 100 : 100;
    cumple = pct >= 100;
    critico = pct < 70;
    color = cumple ? '#059669' : critico ? '#DC2626' : '#D97706';
  }

  const Icon = cumple ? CheckCircle : AlertTriangle;

  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}`, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 4 }}>
            {titulo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color }}>
              {esMoneda ? formatMonto(valor) : `${Number(valor).toFixed(1)}${unidad}`}
            </span>
            {objetivo > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                / obj: {esMoneda ? formatMonto(objetivo) : `${objetivo}${unidad}`}
              </span>
            )}
          </div>
          {descripcion && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{descripcion}</div>
          )}
          {pct !== null && objetivo > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                <span>Cumplimiento</span>
                <span style={{ fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  background: color, borderRadius: 4, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
        </div>
        <Icon size={22} color={color} style={{ marginLeft: 12, flexShrink: 0 }} />
      </div>
      {!cumple && (
        <div style={{
          marginTop: 10, padding: '6px 10px', borderRadius: 6,
          background: `${color}11`, fontSize: 12, color,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <TrendingDown size={13} />
          {esCartera
            ? `Cartera vencida: ${formatMonto(valor)}`
            : critico
            ? `⚠ Situación crítica — ${(100 - pct).toFixed(1)}% por debajo del objetivo`
            : `Por debajo del objetivo en ${(100 - pct).toFixed(1)}%`
          }
        </div>
      )}
    </div>
  );
}

function SeccionLabel({ label }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      textTransform: 'uppercase', color: 'var(--text2)',
      marginBottom: 8, marginTop: 16,
    }}>
      {label}
    </div>
  );
}

export default function Alertas() {
  const { call } = useApi();
  const [semana, setSemana] = useState(0);
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);
  const [rawData, setRawData] = useState(null);

  useEffect(() => { cargarDatos(); }, [semana]);

  const cargarDatos = async () => {
    setLoading(true);
    const [ordenes, incidencias, metas, carteraResumen] = await Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
      call('getMetas'),
      call('getCarteraResumen'),
    ]);

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() - semana * 7);
    inicioSemana.setHours(0, 0, 0, 0);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const ordenesEntregadasMes = (ordenes || []).filter(o => {
      if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
      const f = new Date(o.fechaEntrega);
      return f.getMonth() + 1 === mesActual && f.getFullYear() === añoActual;
    });

    const ordenesEntregadasSemana = (ordenes || []).filter(o => {
      if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
      const f = new Date(o.fechaEntrega);
      return f >= inicioSemana && f <= finSemana;
    });

    // Ventas vs meta
    const ventaMes = ordenesEntregadasMes.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
    const metaB2B = (metas || []).find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2B');
    const metaB2C = (metas || []).find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2C');
    const metaTotal = (metaB2B ? Number(metaB2B.meta) : 0) + (metaB2C ? Number(metaB2C.meta) : 0);

    // OTIF
    const otifTotal = ordenesEntregadasSemana.length;
    const otifOk = ordenesEntregadasSemana.filter(o => {
      const onTime = o.fechaDespacho && o.fechaEntrega &&
        formatFecha(o.fechaDespacho) === formatFecha(o.fechaEntrega);
      const inFull = !(incidencias || []).some(i => i.ordenId === o.id && i.estado === 'ABIERTA');
      return onTime && inFull;
    }).length;
    const otifPct = otifTotal > 0 ? (otifOk / otifTotal) * 100 : 100;

    // Accuracy
    const totalSemana = ordenesEntregadasSemana.length;
    const conReclamos = ordenesEntregadasSemana.filter(o =>
      (incidencias || []).some(i => i.ordenId === o.id)
    ).length;
    const accuracyRate = totalSemana > 0 ? ((totalSemana - conReclamos) / totalSemana) * 100 : 100;

    // Cartera
    const carteraVencida = carteraResumen?.vencido || 0;
    const carteraTotal = (carteraResumen?.vencido || 0) + (carteraResumen?.pendiente || 0);

    // Desglose por vendedor
    const desglose = VENDEDORES.map(vendedor => {
      const ordV = ordenesEntregadasMes.filter(o =>
        str(o.creadoPor).toLowerCase() === vendedor.toLowerCase()
      );
      const ordVSemana = ordenesEntregadasSemana.filter(o =>
        str(o.creadoPor).toLowerCase() === vendedor.toLowerCase()
      );
      const venta = ordV.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
      const pctMeta = metaTotal > 0 ? (venta / metaTotal) * 100 : 0;
      const pctContrib = ventaMes > 0 ? (venta / ventaMes) * 100 : 0;

      const otifTotalV = ordVSemana.length;
      const otifOkV = ordVSemana.filter(o => {
        const onTime = o.fechaDespacho && o.fechaEntrega &&
          formatFecha(o.fechaDespacho) === formatFecha(o.fechaEntrega);
        const inFull = !(incidencias || []).some(i => i.ordenId === o.id && i.estado === 'ABIERTA');
        return onTime && inFull;
      }).length;
      const otifPctV = otifTotalV > 0 ? (otifOkV / otifTotalV) * 100 : 100;

      const conReclamosV = ordVSemana.filter(o =>
        (incidencias || []).some(i => i.ordenId === o.id)
      ).length;
      const accuracyV = otifTotalV > 0 ? ((otifTotalV - conReclamosV) / otifTotalV) * 100 : 100;

      return { vendedor, venta, pctMeta, pctContrib, otifPctV, otifOkV, otifTotalV, conReclamosV, accuracyV, ordenes: ordV.length };
    });

    setDatos({
      ventaMes, metaTotal, otifPct, otifTotal, otifOk,
      accuracyRate, totalSemana, conReclamos,
      carteraVencida, carteraTotal,
      inicioSemana, finSemana, desglose,
    });
    setLoading(false);
  };

  const alertasActivas = datos ? [
    datos.metaTotal > 0 && (datos.ventaMes / datos.metaTotal) * 100 < 100,
    datos.otifPct < 100,
    datos.accuracyRate < 100,
    datos.carteraVencida > 0,
  ].filter(Boolean).length : 0;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Alertas de Tendencias</h1>
        {!loading && alertasActivas > 0 && (
          <span style={{
            background: '#DC2626', color: '#fff',
            borderRadius: 20, padding: '2px 10px',
            fontSize: 12, fontWeight: 700,
          }}>
            {alertasActivas} alerta{alertasActivas > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Selector de semana */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SEMANAS.map((s, i) => (
          <button key={i} onClick={() => setSemana(i)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer',
            background: semana === i ? 'var(--primary)' : 'transparent',
            borderColor: semana === i ? 'var(--primary)' : 'var(--border)',
            color: semana === i ? '#fff' : 'var(--text2)',
          }}>{s}</button>
        ))}
      </div>

      {datos && (
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, textAlign: 'center' }}>
          {formatFecha(datos.inicioSemana.toISOString())} — {formatFecha(datos.finSemana.toISOString())}
        </div>
      )}

      {loading && <p className="empty">Calculando métricas...</p>}

      {!loading && datos && (
        <>
          {alertasActivas === 0 && (
            <div className="card" style={{ borderLeft: '4px solid #059669', marginBottom: 16, textAlign: 'center' }}>
              <CheckCircle size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#059669' }}>Todo en orden</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Todas las métricas están al 100% o por encima del objetivo
              </div>
            </div>
          )}

          {/* ── RESUMEN GENERAL ── */}
          <SeccionLabel label="Financiero" />
          {datos.metaTotal > 0 ? (
            <AlertaCard
              titulo="Cumplimiento de Meta de Ventas"
              valor={datos.ventaMes}
              objetivo={datos.metaTotal}
              unidad="$"
              descripcion="Venta acumulada del mes vs meta mensual"
            />
          ) : (
            <div className="card" style={{ marginBottom: 12, borderLeft: '4px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                ⚠ No hay meta configurada para este mes. Configúrala en la pantalla de Metas.
              </div>
            </div>
          )}

          <SeccionLabel label="Logística" />
          <AlertaCard
            titulo="OTIF — Entrega a tiempo y completa"
            valor={datos.otifPct}
            objetivo={100}
            unidad="%"
            descripcion={`${datos.otifOk} de ${datos.otifTotal} órdenes entregadas a tiempo y sin reclamos`}
          />

          <SeccionLabel label="Calidad" />
          <AlertaCard
            titulo="Order Accuracy Rate"
            valor={datos.accuracyRate}
            objetivo={100}
            unidad="%"
            descripcion={`${datos.totalSemana - datos.conReclamos} órdenes sin reclamos de ${datos.totalSemana} totales`}
          />

          <SeccionLabel label="Cartera" />
          <AlertaCard
            titulo="Cartera Vencida"
            valor={datos.carteraVencida}
            objetivo={0}
            unidad="$"
            descripcion={datos.carteraVencida > 0
              ? `${formatMonto(datos.carteraVencida)} vencidos de ${formatMonto(datos.carteraTotal)} en cartera total`
              : 'Sin cartera vencida'}
          />

          {/* ── DESGLOSE POR VENDEDOR ── */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', color: 'var(--text2)',
            marginBottom: 12, marginTop: 24,
            paddingTop: 16, borderTop: '2px solid var(--border)',
          }}>
            Desglose por Vendedor — {semana === 0 ? 'Esta semana' : `Semana ${semana} anterior`}
          </div>

          {datos.desglose.map(v => {
            const colorMeta = v.pctMeta >= 33 ? '#059669' : v.pctMeta >= 20 ? '#D97706' : '#DC2626';
            const colorOtif = v.otifPctV >= 90 ? '#059669' : v.otifPctV >= 70 ? '#D97706' : '#DC2626';
            const colorAcc = v.accuracyV >= 90 ? '#059669' : v.accuracyV >= 70 ? '#D97706' : '#DC2626';

            return (
              <div key={v.vendedor} className="card" style={{ marginBottom: 16 }}>
                {/* Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{v.vendedor}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                    background: `${colorMeta}22`, color: colorMeta,
                    border: `1px solid ${colorMeta}44`,
                  }}>
                    {v.pctContrib.toFixed(1)}% del total
                  </span>
                </div>

                {/* Venta del mes */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>
                    VENTA DEL MES
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: colorMeta }}>
                    {formatMonto(v.venta)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                    {v.pctMeta.toFixed(1)}% de la meta total · {v.ordenes} orden{v.ordenes !== 1 ? 'es' : ''}
                  </div>
                  <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(v.pctContrib * (100 / Math.max(...datos.desglose.map(d => d.pctContrib), 1)), 100)}%`,
                      background: colorMeta, borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {/* OTIF y Accuracy */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{
                    background: 'var(--surface2)', borderRadius: 8, padding: 10,
                    borderLeft: `3px solid ${colorOtif}`,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>OTIF</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colorOtif }}>
                      {v.otifPctV.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>
                      {v.otifOkV}/{v.otifTotalV} órdenes
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--surface2)', borderRadius: 8, padding: 10,
                    borderLeft: `3px solid ${colorAcc}`,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>PRECISIÓN</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colorAcc }}>
                      {v.accuracyV.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>
                      {v.conReclamosV} reclamo{v.conReclamosV !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}