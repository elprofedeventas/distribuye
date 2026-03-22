export const ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
  DESPACHADOR: 'despachador',
};

export const ESTADOS_ORDEN = {
  BORRADOR: 'BORRADOR',
  CONFIRMADA: 'CONFIRMADA',
  PROGRAMADA: 'PROGRAMADA',
  DESPACHADA: 'DESPACHADA',
  ENTREGADA: 'ENTREGADA',
};

export const ESTADO_COLORS = {
  BORRADOR: '#94a3b8',
  CONFIRMADA: '#3b82f6',
  PROGRAMADA: '#f59e0b',
  DESPACHADA: '#8b5cf6',
  ENTREGADA: '#22c55e',
};

export const DIAS_SEMANA = [
  'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'
];

export const USUARIOS = [
  { id: 'u1', nombre: 'Admin', rol: ROLES.ADMIN, pin: '1111' },
  { id: 'u2', nombre: 'Vendedor', rol: ROLES.VENDEDOR, pin: '2222' },
  { id: 'u3', nombre: 'Despachador', rol: ROLES.DESPACHADOR, pin: '3333' },
];

export const formatFecha = (fecha) => {
  if (!fecha) return '';
  return String(fecha).split('T')[0];
};
