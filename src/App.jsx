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
import MatrizPrecios from './screens/MatrizPrecios';
import Metas from './screens/Metas';
import Cartera from './screens/Cartera';

const { GERENCIA, VENTAS, OPERACIONES, DESPACHADOR } = ROLES;
const TODOS = [GERENCIA, VENTAS, OPERACIONES, DESPACHADOR];
const PUEDE_EDITAR = [VENTAS, OPERACIONES];
const CON_DESPACHO = [GERENCIA, DESPACHADOR];

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

        <Route path="canales" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Canales />
          </ProtectedRoute>
        } />

        <Route path="productos" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Productos />
          </ProtectedRoute>
        } />

        <Route path="inventario" element={
          <ProtectedRoute roles={[...PUEDE_EDITAR, GERENCIA]}>
            <Inventario />
          </ProtectedRoute>
        } />

        <Route path="precios" element={
          <ProtectedRoute roles={[GERENCIA, VENTAS, OPERACIONES]}>
            <MatrizPrecios />
          </ProtectedRoute>
        } />

        <Route path="metas" element={
          <ProtectedRoute roles={[GERENCIA]}>
            <Metas />
          </ProtectedRoute>
        } />

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

        <Route path="incidencias" element={
          <ProtectedRoute roles={TODOS}>
            <Incidencias />
          </ProtectedRoute>
        } />

        <Route path="cartera" element={
          <ProtectedRoute roles={[GERENCIA, VENTAS, OPERACIONES]}>
            <Cartera />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}