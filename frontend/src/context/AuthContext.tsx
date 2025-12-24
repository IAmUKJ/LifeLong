import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Check authentication on app load / refresh
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data;

        setUser({
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 🔑 Login (cookie is set by backend)
  const login = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    const res = await api.get('/auth/me');

    const userData = res.data;
    setUser({
      id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
  };

  // 📝 Register (cookie should ALSO be set by backend)
  const register = async (userData: any) => {
    const config = {
      headers: {
        'Content-Type':
          userData instanceof FormData
            ? 'multipart/form-data'
            : 'application/json',
      },
    };

    await api.post('/auth/register', userData, config);
    const res = await api.get('/auth/me');

    const newUser = res.data;
    setUser({
      id: newUser._id || newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  };

  // 🚪 Logout (clears cookie on backend)
  const logout = async () => {
    await api.get('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
