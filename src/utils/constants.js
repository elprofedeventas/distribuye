export const ROLES = {
  GERENCIA: 'gerencia',
  VENTAS: 'ventas',
  OPERACIONES: 'operaciones',
  DESPACHADOR: 'despachador',
};

export const ESTADOS_ORDEN = {
  BORRADOR: 'BORRADOR',
  CONFIRMADA: 'CONFIRMADA',
  PROGRAMADA: 'PROGRAMADA',
  DESPACHADA: 'DESPACHADA',
  ENTREGADA: 'ENTREGADA',
};

export const ESTADO_LABELS = {
  BORRADOR: 'BORRADOR',
  CONFIRMADA: 'CONFIRMADA',
  PROGRAMADA: 'POR DESPACHAR',
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
  { id: 'u1', nombre: 'Gerencia',     rol: ROLES.GERENCIA,    pin: '1111' },
  { id: 'u2', nombre: 'Ventas 1',     rol: ROLES.VENTAS,      pin: '2221' },
  { id: 'u3', nombre: 'Ventas 2',     rol: ROLES.VENTAS,      pin: '2222' },
  { id: 'u4', nombre: 'Ventas 3',     rol: ROLES.VENTAS,      pin: '2223' },
  { id: 'u5', nombre: 'Operaciones',  rol: ROLES.OPERACIONES, pin: '3333' },
  { id: 'u6', nombre: 'Despachador',  rol: ROLES.DESPACHADOR, pin: '4444' },
];

export const formatFecha = (fecha) => {
  if (!fecha) return '';
  return String(fecha).split('T')[0];
};