import { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { call, loading } = useApi();
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('distribuye_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [inventario, setInventario] = useState([]);
  const [alertas, setAlertas] = useState(0);

  const login = (user) => {
    setUsuario(user);
    localStorage.setItem('distribuye_user', JSON.stringify(user));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('distribuye_user');
  };

  const refreshInventario = async () => {
    try {
      const data = await call('getInventario');
      setInventario(data || []);
      setAlertas((data || []).filter(i => i.alerta).length);
    } catch {}
  };

  useEffect(() => {
    if (usuario) refreshInventario();
  }, [usuario]);

  return (
    <AppContext.Provider value={{
      usuario, login, logout,
      inventario, alertas, refreshInventario,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);