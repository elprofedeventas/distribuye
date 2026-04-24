import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatMonto, formatFecha } from '../utils/constants';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORES = ['#1A56DB','#059669','#D97706','#DC2626','#7C3AED','#0891B2'];

const SectionTitle = ({ label }) => (
  <div style={{
    fontSize: 13, fontWeight: 700, color: 'var(--text)',
    marginBottom: 12, marginTop: 24,
    paddingBottom: 8, borderBottom: '2px solid var(--border)',
  }}>
    {label}
  </div>
);

const CustomTooltipMonto = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {formatMonto(p.value)}
        </div>
      ))}
    </div>
  );
};

const CustomTooltipPct = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}%
        </div>
      ))}
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Graficos() {
  const { call } = useApi();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);

  const añoActual = new Date().getFullYear();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const [ordenes, incidencias, carteraResumen] = await Promise.all([
      call('getOrdenes'),
      call('getIncidencias'),
      call('getCarteraResumen'),
    ]);

    const str = (v) => (v === undefined || v === null) ? '' : String(v);

    // ── 1. VENTAS POR MES ─────────────────────────────────────────────────
    const ventasPorMes = MESES.map((nombre, i) => {
      const mes = i + 1;
      const ordenesDelMes = (ordenes || []).filter(o => {
        if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
        const f = new Date(o.fechaEntrega);
        return f.getMonth() + 1 === mes && f.getFullYear() === añoActual;
      });
      return {
        mes: nombre,
        venta: Math.round(ordenesDelMes.reduce((s, o) => s + (Number(o.subtotal) || 0), 0) * 100) / 100,
      };
    });

    // ── 2. VENTAS POR VENDEDOR ────────────────────────────────────────────
    const vendedores = ['Ventas 1', 'Ventas 2', 'Ventas 3'];
    const ventasPorVendedor = vendedores.map(v => {
      const ords = (ordenes || []).filter(o =>
        o.estado === 'ENTREGADA' &&
        str(o.creadoPor).toLowerCase() === v.toLowerCase() &&
        o.fechaEntrega && new Date(o.fechaEntrega).getFullYear() === añoActual
      );
      return {
        vendedor: v,
        venta: Math.round(ords.reduce((s, o) => s + (Number(o.subtotal) || 0), 0) * 100) / 100,
        ordenes: ords.length,
      };
    });

    // ── 3. ESTADOS DE ÓRDENES ─────────────────────────────────────────────
    const estadosMap = {
      BORRADOR: 'Pendiente',
      CONFIRMADA: 'Confirmado',
      PROGRAMADA: 'En Preparación',
      DESPACHADA: 'Tránsito',
      ENTREGADA: 'Entregado',
    };
    const estadosData = Object.entries(estadosMap).map(([key, nombre]) => ({
      nombre,
      cantidad: (ordenes || []).filter(o => o.estado === key).length,
    })).filter(e => e.cantidad > 0);

    // ── 4. OTIF POR SEMANA ────────────────────────────────────────────────
    const otifPorSemana = Array.from({ length: 6 }, (_, i) => {
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() - i * 7);
      inicioSemana.setHours(0, 0, 0, 0);
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      const ordenesS = (ordenes || []).filter(o => {
        if (o.estado !== 'ENTREGADA' || !o.fechaEntrega) return false;
        const f = new Date(o.fechaEntrega);
        return f >= inicioSemana && f <= finSemana;
      });

      const otifOk = ordenesS.filter(o => {
        const onTime = o.fechaDespacho && o.fechaEntrega &&
          formatFecha(o.fechaDespacho) === formatFecha(o.fechaEntrega);
        const inFull = !(incidencias || []).some(i => i.ordenId === o.id && i.estado === 'ABIERTA');
        return onTime && inFull;
      }).length;

      const pct = ordenesS.length > 0 ? Math.round((otifOk / ordenesS.length) * 100) : null;
      const label = i === 0 ? 'Esta sem.' : `S-${i}`;

      return { semana: label, otif: pct, total: ordenesS.length };
    }).reverse().filter(s => s.total > 0);

    // ── 5. RECLAMOS POR TIPO ──────────────────────────────────────────────
    const categorias = ['Logística', 'Calidad', 'Facturación'];
    const reclamosPorTipo = categorias.map((cat, i) => ({
      nombre: cat,
      cantidad: (incidencias || []).filter(inc => str(inc.categoria) === cat).length,
      color: COLORES[i],
    })).filter(r => r.cantidad > 0);

    if (reclamosPorTipo.length === 0) {
      reclamosPorTipo.push({ nombre: 'Sin reclamos', cantidad: 1, color: '#059669' });
    }

    // ── 6. CARTERA ────────────────────────────────────────────────────────
    const carteraData = [
      { nombre: 'Pendiente', valor: carteraResumen?.pendiente || 0, color: '#D97706' },
      { nombre: 'Vencido', valor: carteraResumen?.vencido || 0, color: '#DC2626' },
      { nombre: 'Cobrado', valor: carteraResumen?.cobrado || 0, color: '#059669' },
    ].filter(c => c.valor > 0);

    if (carteraData.length === 0) {
      carteraData.push({ nombre: 'Sin cartera', valor: 1, color: '#94a3b8' });
    }

    setDatos({ ventasPorMes, ventasPorVendedor, estadosData, otifPorSemana, reclamosPorTipo, carteraData, carteraResumen });
    setLoading(false);
  };

  if (loading) return <div className="page"><p className="empty">Cargando gráficos...</p></div>;

  return (
    <div className="page">
      <h1 className="page-title">Gráficos</h1>

      {/* ── 1. VENTAS POR MES ── */}
      <SectionTitle label={`Ventas por Mes — ${añoActual}`} />
      <div className="card" style={{ marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos.ventasPorMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltipMonto />} />
            <Bar dataKey="venta" name="Venta" fill="#1A56DB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 4 }}>
        {datos.ventasPorMes.filter(m => m.venta > 0).slice(-3).map(m => (
          <div key={m.mes} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>{m.mes}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A56DB' }}>{formatMonto(m.venta)}</div>
          </div>
        ))}
      </div>

      {/* ── 2. VENTAS POR VENDEDOR ── */}
      <SectionTitle label={`Ventas por Vendedor — ${añoActual}`} />
      <div className="card" style={{ marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datos.ventasPorVendedor} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="vendedor" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltipMonto />} />
            <Bar dataKey="venta" name="Venta" radius={[4, 4, 0, 0]}>
              {datos.ventasPorVendedor.map((_, i) => (
                <Cell key={i} fill={COLORES[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
        {datos.ventasPorVendedor.map((v, i) => (
          <div key={v.vendedor} className="card" style={{ textAlign: 'center', padding: 10, borderLeft: `3px solid ${COLORES[i]}` }}>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>{v.vendedor}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORES[i] }}>{formatMonto(v.venta)}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>{v.ordenes} órdenes</div>
          </div>
        ))}
      </div>

      {/* ── 3. ESTADOS DE ÓRDENES ── */}
      <SectionTitle label="Estados de Órdenes" />
      <div className="card" style={{ marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={datos.estadosData}
              dataKey="cantidad"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
              label={CustomLabel}
            >
              {datos.estadosData.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── 4. OTIF POR SEMANA ── */}
      <SectionTitle label="OTIF por Semana" />
      {datos.otifPorSemana.length === 0 ? (
        <div className="card" style={{ marginBottom: 8, textAlign: 'center' }}>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Sin datos suficientes por semana</p>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datos.otifPorSemana} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltipPct />} />
              <Line
                type="monotone"
                dataKey="otif"
                name="OTIF"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={{ r: 5, fill: '#1A56DB' }}
                activeDot={{ r: 7 }}
              />
              {/* Línea de objetivo al 100% */}
              <Line
                type="monotone"
                dataKey={() => 100}
                name="Objetivo"
                stroke="#05966966"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 5. RECLAMOS POR TIPO ── */}
      <SectionTitle label="Reclamos por Tipo" />
      <div className="card" style={{ marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={datos.reclamosPorTipo}
              dataKey="cantidad"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
              label={CustomLabel}
            >
              {datos.reclamosPorTipo.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── 6. CARTERA ── */}
      <SectionTitle label="Cartera B2B" />
      <div className="card" style={{ marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={datos.carteraData}
              dataKey="valor"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
              label={CustomLabel}
            >
              {datos.carteraData.map((c, i) => (
                <Cell key={i} fill={c.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [formatMonto(v)]} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Pendiente', valor: datos.carteraResumen?.pendiente || 0, color: '#D97706' },
          { label: 'Vencido', valor: datos.carteraResumen?.vencido || 0, color: '#DC2626' },
          { label: 'Cobrado', valor: datos.carteraResumen?.cobrado || 0, color: '#059669' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center', padding: 10, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>{c.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{formatMonto(c.valor)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}