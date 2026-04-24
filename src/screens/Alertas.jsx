import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatMonto, formatFecha } from '../utils/constants';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

const SEMANAS = ['Esta semana', 'Semana anterior', 'Hace 2 semanas', 'Hace 3 semanas'];

function AlertaCard({ titulo, valor, objetivo, unidad = '%', descripcion, invertir = false }) {
  const pct = objetivo > 0 ? (valor / objetivo) * 100 : 100;
  const cumple = pct >= 100;
  const critico = pct < 70;
  const color = cumple ? '#059669' : critico ? '#DC2626' : '#D97706';
  const Icon = cumple ? CheckCircle : critico ? AlertTriangle : TrendingDown;

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${color}`,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 4 }}>
            {titulo}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color }}>
              {unidad === '$' ? formatMonto(valor) : `${Number(valor).toFixed(1)}${unidad}`}
            </span>
            {objetivo > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                / obj: {unidad === '$' ? formatMonto(objetivo) : `${objetivo}${unidad}`}
              </span>
            )}
          </div>
          {descripcion && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{descripcion}</div>
          )}
          {/* Barra de progreso */}
          {objetivo > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                <span>Cumplimiento</span>
                <span style={{ fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(pct, 100)}%`,
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
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
          {critico
            ? `⚠ Situación crítica — ${(100 - pct).toFixed(1)}% por debajo del objetivo`
            : `Por debajo del objetivo en ${(100 - pct).toFixed(1)}%`
          }
        </div>
      )}
    </div>
  );
}

export default function Alertas() {
  const { call } = useApi();
  const [semana, setSemana] = useState(0);
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [semana]);

  const cargarDatos = async () => {
    setLoading(true);
    const [ordenes, incidencias, metas, carteraResumen] = await Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
      call('getMetas'),
      call('getCarteraResumen'),
    ]);

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() - semana * 7);
    inicioSemana.setHours(0, 0, 0, 0);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();

    // Órdenes entregadas en la semana seleccionada
    const ordenesEntregadasSemana = (ordenes || []).filter(o => {
      if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
      const f = new Date(o.fechaEntrega);
      return f >= inicioSemana && f <= finSemana;
    });

    // Órdenes entregadas en el mes para meta
    const ordenesEntregadasMes = (ordenes || []).filter(o => {
      if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
      const f = new Date(o.fechaEntrega);
      return f.getMonth() + 1 === mesActual && f.getFullYear() === añoActual;
    });

    // ── VENTAS vs META ────────────────────────────────────────────────────
    const ventaMes = ordenesEntregadasMes.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
    const metaB2B = (metas || []).find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2B');
    const metaB2C = (metas || []).find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2C');
    const metaTotal = (metaB2B ? Number(metaB2B.meta) : 0) + (metaB2C ? Number(metaB2C.meta) : 0);

    // ── OTIF ─────────────────────────────────────────────────────────────
    const otifTotal = ordenesEntregadasSemana.length;
    const otifOk = ordenesEntregadasSemana.filter(o => {
      const onTime = o.fechaDespacho && o.fechaEntrega &&
        formatFecha(o.fechaDespacho) === formatFecha(o.fechaEntrega);
      const inFull = !(incidencias || []).some(i => i.ordenId === o.id && i.estado === 'ABIERTA');
      return onTime && inFull;
    }).length;
    const otifPct = otifTotal > 0 ? (otifOk / otifTotal) * 100 : 100;

    // ── ORDER ACCURACY RATE ───────────────────────────────────────────────
    const totalSemana = ordenesEntregadasSemana.length;
    const conReclamos = ordenesEntregadasSemana.filter(o =>
      (incidencias || []).some(i => i.ordenId === o.id)
    ).length;
    const accuracyRate = totalSemana > 0 ? ((totalSemana - conReclamos) / totalSemana) * 100 : 100;

    // ── CARTERA VENCIDA ───────────────────────────────────────────────────
    const carteraVencida = carteraResumen?.vencido || 0;
    const carteraPendiente = carteraResumen?.pendiente || 0;
    const carteraTotal = carteraVencida + carteraPendiente;

    setDatos({
      ventaMes,
      metaTotal,
      otifPct,
      otifTotal,
      otifOk,
      accuracyRate,
      totalSemana,
      conReclamos,
      carteraVencida,
      carteraTotal,
      inicioSemana,
      finSemana,
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
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

      {/* Período */}
      {datos && (
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, textAlign: 'center' }}>
          {formatFecha(datos.inicioSemana.toISOString())} — {formatFecha(datos.finSemana.toISOString())}
        </div>
      )}

      {loading && <p className="empty">Calculando métricas...</p>}

      {!loading && datos && (
        <>
          {/* Sin alertas */}
          {alertasActivas === 0 && (
            <div className="card" style={{ borderLeft: '4px solid #059669', marginBottom: 16, textAlign: 'center' }}>
              <CheckCircle size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#059669' }}>Todo en orden</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Todas las métricas están al 100% o por encima del objetivo
              </div>
            </div>
          )}

          {/* ── VENTAS vs META ── */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8 }}>
            Financiero
          </div>
          {datos.metaTotal > 0 ? (
            <AlertaCard
              titulo="Cumplimiento de Meta de Ventas"
              valor={datos.ventaMes}
              objetivo={datos.metaTotal}
              unidad="$"
              descripcion={`Venta acumulada del mes vs meta mensual`}
            />
          ) : (
            <div className="card" style={{ marginBottom: 12, borderLeft: '4px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                ⚠ No hay meta configurada para este mes. Configúrala en la pantalla de Metas.
              </div>
            </div>
          )}

          {/* ── LOGÍSTICA ── */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8, marginTop: 16 }}>
            Logística
          </div>
          <AlertaCard
            titulo="OTIF — Entrega a tiempo y completa"
            valor={datos.otifPct}
            objetivo={100}
            unidad="%"
            descripcion={`${datos.otifOk} de ${datos.otifTotal} órdenes entregadas a tiempo y sin reclamos`}
          />

          {/* ── CALIDAD ── */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8, marginTop: 16 }}>
            Calidad
          </div>
          <AlertaCard
            titulo="Order Accuracy Rate"
            valor={datos.accuracyRate}
            objetivo={100}
            unidad="%"
            descripcion={`${datos.totalSemana - datos.conReclamos} órdenes sin reclamos de ${datos.totalSemana} totales`}
          />

          {/* ── CARTERA ── */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8, marginTop: 16 }}>
            Cartera
          </div>
          <AlertaCard
            titulo="Cartera Vencida"
            valor={datos.carteraVencida}
            objetivo={0}
            unidad="$"
            descripcion={datos.carteraVencida > 0
              ? `${formatMonto(datos.carteraVencida)} vencidos de ${formatMonto(datos.carteraTotal)} en cartera total`
              : 'Sin cartera vencida'}
          />
        </>
      )}
    </div>
  );
}