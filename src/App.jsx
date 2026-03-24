import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { ROLES } from './utils/constants';
import Layout from './components/Layout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Canales from './screens/Canales';
import Productos from './screens/Productos';
import Inventario from './screens/Inventario';
import NuevaOrden from './screens/NuevaOrden';
import Ordenes from './screens/Ordenes';
import OrdenDetalle from './screens/OrdenDetalle';
import ColaDespacho from './screens/ColaDespacho';
import RegistrarEntrega from './screens/RegistrarEntrega';
import Incidencias from './screens/Incidencias';

const { GERENCIA, VENTAS, OPERACIONES, DESPACHADOR } = ROLES;
const TODOS = [GERENCIA, VENTAS, OPERACIONES, DESPACHADOR];
const PUEDE_EDITAR = [VENTAS, OPERACIONES];
const CON_DESPACHO = [GERENCIA, DESPACHADOR];
const SIN_DESPACHO = [GERENCIA, VENTAS, OPERACIONES];

function ProtectedRoute({ children, roles }) {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />

        {/* Clientes */}
        <Route path="canales" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Canales />
          </ProtectedRoute>
        } />

        {/* Productos */}
        <Route path="productos" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Productos />
          </ProtectedRoute>
        } />

        {/* Inventario */}
        <Route path="inventario" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Inventario />
          </ProtectedRoute>
        } />

        {/* Órdenes */}
        <Route path="ordenes" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Ordenes />
          </ProtectedRoute>
        } />
        <Route path="ordenes/nueva" element={
          <ProtectedRoute roles={PUEDE_EDITAR}>
            <NuevaOrden />
          </ProtectedRoute>
        } />
        <Route path="ordenes/:id" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <OrdenDetalle />
          </ProtectedRoute>
        } />

        {/* Despacho */}
        <Route path="despacho" element={
          <ProtectedRoute roles={CON_DESPACHO}>
            <ColaDespacho />
          </ProtectedRoute>
        } />
        <Route path="despacho/:id/entrega" element={
          <ProtectedRoute roles={[DESPACHADOR]}>
            <RegistrarEntrega />
          </ProtectedRoute>
        } />

        {/* Incidencias */}
        <Route path="incidencias" element={
          <ProtectedRoute roles={TODOS}>
            <Incidencias />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}