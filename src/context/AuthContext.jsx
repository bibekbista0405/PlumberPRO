import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plumbpro_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('plumbpro_token');
    if (!token) { setLoading(false); return; }
    getMe().then(({ user: current }) => setUser(current)).catch(() => {
      localStorage.removeItem('plumbpro_token');
      localStorage.removeItem('plumbpro_user');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((data) => {
    localStorage.setItem('plumbpro_token', data.token);
    localStorage.setItem('plumbpro_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);
  const login = useCallback(async payload => { const data = await loginUser(payload); saveSession(data); return data.user; }, [saveSession]);
  const register = useCallback(async payload => { const data = await registerUser(payload); saveSession(data); return data.user; }, [saveSession]);
  const logout = useCallback(() => { localStorage.removeItem('plumbpro_token'); localStorage.removeItem('plumbpro_user'); setUser(null); }, []);

  const value = useMemo(() => ({ user, loading, isAuthenticated: !!user, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
