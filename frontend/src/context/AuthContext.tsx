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

  // 🔐 AUTH
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;

  // 💳 PLAN
  plan: string | null;
  planExpiresAt: Date | null;
  hasActivePlan: boolean;
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 💳 Plan state
  const [plan, setPlan] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<Date | null>(null);

  /* =======================
     FETCH PLAN DETAILS
  ======================= */
  const refreshPlan = async () => {
    if (!user?.id || user.role !== 'patient') {
      setPlan(null);
      setPlanExpiresAt(null);
      return;
    }

    try {
      const res = await api.get(`/payments/plan/${user.id}`);

      if (res.data?.success && res.data.plan) {
        setPlan(res.data.plan);
        setPlanExpiresAt(new Date(res.data.expiresAt));
      } else {
        setPlan(null);
        setPlanExpiresAt(null);
      }
    } catch (err) {
      console.error('Failed to fetch plan', err);
      setPlan(null);
      setPlanExpiresAt(null);
    }
  };

  /* =======================
     CHECK AUTH ON LOAD
  ======================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data;

        const loggedInUser = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };

        setUser(loggedInUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  /* =======================
     FETCH PLAN WHEN USER CHANGES
  ======================= */
  useEffect(() => {
    if (user) {
      refreshPlan();
    }
  }, [user]);

  /* =======================
     LOGIN
  ======================= */
  const login = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });

    const res = await api.get('/auth/me');
    const userData = res.data;

    const loggedInUser = {
      id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };

    setUser(loggedInUser);
  };

  /* =======================
     REGISTER
  ======================= */
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

  /* =======================
     LOGOUT
  ======================= */
  const logout = async () => {
    await api.get('/auth/logout');
    setUser(null);
    setPlan(null);
    setPlanExpiresAt(null);
  };

  const hasActivePlan =
    !!plan &&
    !!planExpiresAt &&
    planExpiresAt.getTime() > Date.now();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,

        plan,
        planExpiresAt,
        hasActivePlan,
        refreshPlan,
      }}
    >
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
