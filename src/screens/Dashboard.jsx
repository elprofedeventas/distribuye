import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { ROLES, formatFecha, formatMonto } from '../utils/constants';
import {
  AlertTriangle, ClipboardList, Truck, CheckCircle,
  FileEdit, Package, Warehouse, TrendingUp, DollarSign,
  BarChart2, ShieldAlert, Target
} from 'lucide-react';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon, onClick, alerta }) {
  return (
    <div className="card" style={{ cursor: onClick ? 'pointer' : 'default', borderColor: alerta ? 'var(--danger)' : 'var(--border)' }}
      onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
        </div>
        {Icon && <Icon size={20} color={color} style={{ flexShrink: 0 }} />}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { usuario, alertas } = useApp();
  const { call } = useApi();
  const navigate = useNavigate();

  const [ordenes, setOrdenes] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  const hoy = new Date();
  const hoyStr = formatFecha(hoy.toISOString());
  const mesActual = hoy.getMonth() + 1;
  const añoActual = hoy.getFullYear();

  useEffect(() => {
    Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
      call('getInventario'),
      call('getMetas'),
    ]).then(([ords, incs, inv, met]) => {
      setOrdenes(ords || []);
      setIncidencias(incs || []);
      setInventario(inv || []);
      setMetas(met || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── FILTRO DE PERIODO ────────────────────────────────────────────────────
  const filtrarPorPeriodo = (ords) => {
    return ords.filter(o => {
      if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
      const f = new Date(o.fechaEntrega);
      if (periodo === 'hoy') return formatFecha(o.fechaEntrega) === hoyStr;
      if (periodo === 'semana') {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        return f >= inicioSemana;
      }
      if (periodo === 'mes') return f.getMonth() + 1 === mesActual && f.getFullYear() === añoActual;
      if (periodo === 'año') return f.getFullYear() === añoActual;
      return true;
    });
  };

  const ordenesEntregadas = filtrarPorPeriodo(ordenes);

  // ── KPIs FINANCIEROS ─────────────────────────────────────────────────────
  const ventaB2B = ordenesEntregadas.reduce((s, o) => s + (isNaN(Number(o.subtotal)) ? 0 : Number(o.subtotal)), 0);
  const ventaB2C = 0; // Canal digital fase 2
  const ventaTotal = ventaB2B + ventaB2C;
  const ivaTotal = ordenesEntregadas.reduce((s, o) => s + (isNaN(Number(o.iva)) ? 0 : Number(o.iva)), 0);

  const ticketPromedio = ordenesEntregadas.length > 0
    ? ventaTotal / ordenesEntregadas.length : 0;

  // Meta del mes actual
  const metaB2B = metas.find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2B');
  const metaB2C = metas.find(m => String(m.año) === String(añoActual) && String(m.mes) === String(mesActual) && m.canalTipo === 'B2C');
  const metaTotalMes = (metaB2B ? Number(metaB2B.meta) : 0) + (metaB2C ? Number(metaB2C.meta) : 0);

  // Venta del mes actual siempre (para run rate)
  const ventaMesActual = ordenes
    .filter(o => o.estado === 'ENTREGADA' && o.fechaEntrega)
    .filter(o => {
      const f = new Date(o.fechaEntrega);
      return f.getMonth() + 1 === mesActual && f.getFullYear() === añoActual;
    })
    .reduce((s, o) => s + (isNaN(Number(o.subtotal)) ? 0 : Number(o.subtotal)), 0);

  const pctMeta = metaTotalMes > 0 ? (ventaMesActual / metaTotalMes) * 100 : 0;

  // Run rate — proyección de cierre del mes
  const diasDelMes = new Date(añoActual, mesActual, 0).getDate();
  const diaActual = hoy.getDate();
  const runRate = diaActual > 0 ? (ventaMesActual / diaActual) * diasDelMes : 0;

  // ── KPIs OPERATIVOS ──────────────────────────────────────────────────────
  const ordenesEntregadasMes = ordenes.filter(o =>
    o.estado === 'ENTREGADA' && o.fechaEntrega &&
    new Date(o.fechaEntrega).getMonth() + 1 === mesActual &&
    new Date(o.fechaEntrega).getFullYear() === añoActual
  );

  // OTIF
  const otifTotal = ordenesEntregadasMes.length;
  const otifOk = ordenesEntregadasMes.filter(o => {
    const onTime = o.fechaDespacho && o.fechaEntrega &&
      formatFecha(o.fechaDespacho) === formatFecha(o.fechaEntrega);
    const inFull = !incidencias.some(i => i.ordenId === o.id && i.estado === 'ABIERTA');
    return onTime && inFull;
  }).length;
  const otifPct = otifTotal > 0 ? Math.round((otifOk / otifTotal) * 100) : 100;

  // DOH — días de inventario
  const salidaDiaria = ordenes
    .filter(o => o.estado === 'ENTREGADA' && o.fechaEntrega)
    .filter(o => {
      const f = new Date(o.fechaEntrega);
      return f.getFullYear() === añoActual;
    }).length / Math.max(diaActual, 1);

  const dohPromedio = salidaDiaria > 0
    ? Math.round(inventario.reduce((s, i) => s + Number(i.stockActual || 0), 0) /
        inventario.length / salidaDiaria)
    : 0;

  // Órdenes del día
  const ordenesDia = ordenes.filter(o => formatFecha(o.creadoEn) === hoyStr).length;

  // ── KPIs CALIDAD ─────────────────────────────────────────────────────────
  // Order Accuracy Rate
  const totalMes = ordenesEntregadasMes.length;
  const conReclamos = ordenesEntregadasMes.filter(o =>
    incidencias.some(i => i.ordenId === o.id)
  ).length;
  const accuracyRate = totalMes > 0
    ? Math.round(((totalMes - conReclamos) / totalMes) * 100) : 100;

  // Reclamos abiertos
  const reclamosAbiertos = incidencias.filter(i => i.estado === 'ABIERTA').length;
  const pctReclamos = totalMes > 0 ? ((conReclamos / totalMes) * 100).toFixed(1) : '0';

  // ── CONTEO ESTADOS (para despachador y cards operativas) ─────────────────
  const conteo = {
    pendientes:  ordenes.filter(o => o.estado === 'BORRADOR').length,
    confirmados: ordenes.filter(o => o.estado === 'CONFIRMADA').length,
    preparacion: ordenes.filter(o => o.estado === 'PROGRAMADA').length,
    transito:    ordenes.filter(o => o.estado === 'DESPACHADA').length,
    entregadosHoy: ordenes.filter(o => o.estado === 'ENTREGADA' && formatFecha(o.fechaEntrega) === hoyStr).length,
  };

  // ── DASHBOARD DESPACHADOR ─────────────────────────────────────────────────
  const esDespachador = usuario?.rol === ROLES.DESPACHADOR;

  if (esDespachador) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 13 }}>
          Bienvenido, <strong style={{ color: 'var(--text)' }}>{usuario?.nombre}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <KpiCard label="EN PREPARACIÓN" value={conteo.preparacion} color="#D97706" icon={Package} onClick={() => navigate('/despacho')} />
          <KpiCard label="EN TRÁNSITO" value={conteo.transito} color="#D97706" icon={Truck} onClick={() => navigate('/despacho')} />
          <KpiCard label="ENTREGADOS HOY" value={conteo.entregadosHoy} color="#059669" icon={CheckCircle} onClick={() => navigate('/despacho', { state: { filtro: 'ENTREGADA' } })} />
          <KpiCard label="RECLAMOS ABIERTOS" value={reclamosAbiertos} color={reclamosAbiertos > 0 ? '#DC2626' : '#94a3b8'} icon={AlertTriangle} alerta={reclamosAbiertos > 0} onClick={() => navigate('/incidencias')} />
          <KpiCard label="REPOSICIÓN" value={alertas} color={alertas > 0 ? '#DC2626' : '#94a3b8'} icon={Warehouse} alerta={alertas > 0} onClick={() => navigate('/inventario')} />
        </div>
      </div>
    );
  }

  // ── DASHBOARD ADMIN / VENTAS / OPERACIONES ────────────────────────────────
  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>
          Bienvenido, <strong style={{ color: 'var(--text)' }}>{usuario?.nombre}</strong>
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {['hoy','semana','mes','año'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
              border: '1px solid', cursor: 'pointer',
              background: periodo === p ? 'var(--primary)' : 'transparent',
              borderColor: periodo === p ? 'var(--primary)' : 'var(--border)',
              color: periodo === p ? '#fff' : 'var(--text2)',
            }}>
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Sem' : p === 'mes' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* ── A. DIMENSIÓN FINANCIERA ── */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#1A56DB', marginBottom: 8, textTransform: 'uppercase' }}>
        A · Financiero
      </div>

      {/* Venta vs Meta */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>
              VENTA {periodo === 'hoy' ? 'HOY' : periodo === 'semana' ? 'ESTA SEMANA' : periodo === 'mes' ? 'ESTE MES' : 'ESTE AÑO'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#059669', marginTop: 2 }}>
              {loading ? '—' : formatMonto(ventaTotal)}
            </div>
          </div>
          <DollarSign size={22} color="#059669" />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: '#1A56DB' }}>B2B: {formatMonto(ventaB2B)}</span>
          <span style={{ color: '#0891B2' }}>B2C: {formatMonto(ventaB2C)}</span>
        </div>
        {metaTotalMes > 0 && periodo === 'mes' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>
              <span>Meta: {formatMonto(metaTotalMes)}</span>
              <span style={{ fontWeight: 700, color: pctMeta >= 100 ? '#059669' : pctMeta >= 70 ? '#D97706' : '#DC2626' }}>
                {pctMeta.toFixed(1)}%
              </span>
            </div>
            <MiniBar value={ventaMesActual} max={metaTotalMes} color={pctMeta >= 100 ? '#059669' : pctMeta >= 70 ? '#D97706' : '#DC2626'} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <KpiCard
          label="PROYECCIÓN MES"
          value={formatMonto(runRate)}
          sub={`${diasDelMes - diaActual} días restantes`}
          color="#7C3AED"
          icon={TrendingUp}
        />
        <KpiCard
          label="IVA ACUMULADO"
          value={formatMonto(ivaTotal)}
          sub="15% sobre subtotal"
          color="#D97706"
          icon={BarChart2}
        />
        <KpiCard
          label="TICKET PROMEDIO"
          value={formatMonto(ticketPromedio)}
          sub={`${ordenesEntregadas.length} órdenes`}
          color="#1A56DB"
          icon={DollarSign}
        />
        <KpiCard
          label="ÓRDENES HOY"
          value={ordenesDia}
          sub="creadas hoy"
          color="#0891B2"
          icon={ClipboardList}
          onClick={() => navigate('/ordenes')}
        />
      </div>

      {/* ── B. DIMENSIÓN OPERATIVA ── */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#D97706', marginBottom: 8, textTransform: 'uppercase' }}>
        B · Logística
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>OTIF</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: otifPct >= 90 ? '#059669' : otifPct >= 70 ? '#D97706' : '#DC2626' }}>
            {loading ? '—' : `${otifPct}%`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
            {otifOk} de {otifTotal} órdenes
          </div>
          <MiniBar value={otifOk} max={otifTotal} color={otifPct >= 90 ? '#059669' : otifPct >= 70 ? '#D97706' : '#DC2626'} />
        </div>

        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>DOH</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: dohPromedio > 15 ? '#059669' : dohPromedio > 7 ? '#D97706' : '#DC2626' }}>
            {loading ? '—' : `${dohPromedio}d`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>días de inventario</div>
          <MiniBar value={Math.min(dohPromedio, 30)} max={30} color={dohPromedio > 15 ? '#059669' : dohPromedio > 7 ? '#D97706' : '#DC2626'} />
        </div>

        <KpiCard
          label="EN PREPARACIÓN"
          value={conteo.preparacion}
          color="#D97706"
          icon={Package}
          onClick={() => navigate('/despacho')}
        />
        <KpiCard
          label="EN TRÁNSITO"
          value={conteo.transito}
          color="#D97706"
          icon={Truck}
          onClick={() => navigate('/despacho')}
        />
      </div>

      {/* ── C. DIMENSIÓN CALIDAD ── */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#DC2626', marginBottom: 8, textTransform: 'uppercase' }}>
        C · Calidad
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ borderColor: accuracyRate < 95 ? 'var(--danger)' : 'var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>PRECISIÓN</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: accuracyRate >= 95 ? '#059669' : accuracyRate >= 80 ? '#D97706' : '#DC2626' }}>
            {loading ? '—' : `${accuracyRate}%`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>órdenes sin reclamos</div>
          <MiniBar value={accuracyRate} max={100} color={accuracyRate >= 95 ? '#059669' : accuracyRate >= 80 ? '#D97706' : '#DC2626'} />
        </div>

        <KpiCard
          label="RECLAMOS ABIERTOS"
          value={reclamosAbiertos}
          sub={`${pctReclamos}% del mes`}
          color={reclamosAbiertos > 0 ? '#DC2626' : '#94a3b8'}
          icon={ShieldAlert}
          alerta={reclamosAbiertos > 0}
          onClick={() => navigate('/incidencias')}
        />

        <KpiCard
          label="REPOSICIÓN"
          value={alertas}
          sub="productos bajo mínimo"
          color={alertas > 0 ? '#DC2626' : '#94a3b8'}
          icon={Warehouse}
          alerta={alertas > 0}
          onClick={() => navigate('/inventario')}
        />

        <KpiCard
          label="PENDIENTES"
          value={conteo.pendientes}
          color="#94a3b8"
          icon={FileEdit}
          onClick={() => navigate('/ordenes', { state: { filtro: 'BORRADOR' } })}
        />
      </div>

      {usuario?.rol !== ROLES.GERENCIA && (
        <button className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/ordenes/nueva')}>
          + Nueva Orden
        </button>
      )}
    </div>
  );
}