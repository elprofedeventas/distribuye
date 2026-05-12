export async function cargarCredito(call, clienteId, excludeOrdenId) {
  if (!clienteId) return null;
  const params = { clienteId };
  if (excludeOrdenId) params.excludeOrdenId = excludeOrdenId;
  return await call('getCreditoCliente', params);
}

export function puedeConfirmar(credito, montoOrden) {
  if (!credito || credito.esContado) return { ok: true, excedente: 0 };
  const monto = Number(montoOrden || 0);
  const disponible = Number(credito.cupoDisponible || 0);
  if (monto <= disponible) return { ok: true, excedente: 0 };
  return { ok: false, excedente: monto - disponible };
}
