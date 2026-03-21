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

function ProtectedRoute({ children, roles }) {
  const { usuario } = useApp();
  if (!usuario) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { usuario } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="canales" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.VENDEDOR]}>
            <Canales />
          </ProtectedRoute>
        } />
        <Route path="productos" element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Productos />
          </ProtectedRoute>
        } />
        <Route path="inventario" element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Inventario />
          </ProtectedRoute>
        } />
        <Route path="ordenes" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.VENDEDOR]}>
            <Ordenes />
          </ProtectedRoute>
        } />
        <Route path="ordenes/nueva" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.VENDEDOR]}>
            <NuevaOrden />
          </ProtectedRoute>
        } />
        <Route path="ordenes/:id" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.VENDEDOR]}>
            <OrdenDetalle />
          </ProtectedRoute>
        } />
        <Route path="despacho" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DESPACHADOR]}>
            <ColaDespacho />
          </ProtectedRoute>
        } />
        <Route path="despacho/:id/entrega" element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DESPACHADOR]}>
            <RegistrarEntrega />
          </ProtectedRoute>
        } />
        <Route path="incidencias" element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Incidencias />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}