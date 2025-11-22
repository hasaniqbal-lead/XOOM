import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Connect socket
      socketService.connect(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    try {
      const response = await authAPI.login({ phone, password });
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Connect socket
      socketService.connect(newToken);

      toast.success(`Welcome back, ${newUser.name}!`);
      return newUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const signup = async (name, phone, password, role) => {
    try {
      const response = await authAPI.signup({ name, phone, password, role });
      toast.success('Account created! Please login.');
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token,
    isRider: user?.role === 'rider',
    isDriver: user?.role === 'driver',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
