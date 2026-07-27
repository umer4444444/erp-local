import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeCompany, setActiveCompany] = useState(() => {
    const saved = localStorage.getItem('activeCompany');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (!activeCompany && user.companyId) {
          setActiveCompany({ id: user.companyId, name: 'Main Company' }); // Will be hydrated with actual data later
        }
      }
      if (activeCompany) localStorage.setItem('activeCompany', JSON.stringify(activeCompany));
      setLoading(false);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeCompany');
      setLoading(false);
    }
  }, [token, user, activeCompany]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, activeCompany, setActiveCompany, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
