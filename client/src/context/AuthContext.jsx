import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cc_token') || null);
  const [activeRole, setActiveRole] = useState(localStorage.getItem('cc_role') || null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Set role if not set or invalid
          if (!activeRole || !data.user.roles.includes(activeRole)) {
            setActiveRole(data.user.role);
            localStorage.setItem('cc_role', data.user.role);
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    setActiveRole(data.user.role);
    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_role', data.user.role);
    return data.user;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    setActiveRole('member');
    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_role', 'member');
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole(null);
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_role');
  };

  const switchRole = (newRole) => {
    if (user && (user.roles.includes(newRole) || user.role === 'admin')) {
      setActiveRole(newRole);
      localStorage.setItem('cc_role', newRole);
    }
  };

  const getDashboardRoute = (roleToUse = activeRole) => {
    switch (roleToUse) {
      case 'admin': return '/admin';
      case 'frontdesk': return '/frontdesk';
      case 'coach': return '/coach';
      case 'shop': return '/shop';
      case 'bar': return '/bar';
      case 'finance': return '/finance';
      case 'hr': return '/hr';
      case 'member': return '/member';
      default: return '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeRole,
      loading,
      login,
      register,
      logout,
      switchRole,
      getDashboardRoute
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
