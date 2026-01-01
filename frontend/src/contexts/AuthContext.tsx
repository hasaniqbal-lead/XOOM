import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "@/services/api";
import socketService from "@/services/socket";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface User {
  id: number;
  name: string;
  phone: string;
  role: "rider" | "driver" | "admin";
  secondary_role?: "rider" | "driver" | "admin" | null;
  active_role?: "rider" | "driver" | "admin";
  available_roles?: string[];
  is_verified: boolean;
  is_driver_verified?: boolean;
  average_rating: number;
}

interface ErrorResponse {
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  isAuthenticated: boolean;
  hasDualRoles: boolean;
  activeRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      socketService.connect(storedToken);
    }

    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const response = await authAPI.login({ phone, password });
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Connect to Socket.IO
      socketService.connect(newToken);

      toast.success(`Welcome back, ${newUser.name}!`);
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.error || "Login failed");
      throw error;
    }
  };

  const signup = async (name: string, phone: string, password: string, role: string) => {
    try {
      const response = await authAPI.signup({ name, phone, password, role });
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Connect to Socket.IO
      socketService.connect(newToken);

      toast.success(`Welcome to XOOM, ${newUser.name}!`);
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.error || "Signup failed");
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Disconnect Socket.IO
    socketService.disconnect();

    toast.success("Logged out successfully");
  };

  const switchRole = async (role: string) => {
    try {
      const response = await authAPI.switchRole(role);
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Reconnect Socket.IO with new token
      socketService.disconnect();
      socketService.connect(newToken);

      toast.success(`Switched to ${role} mode`);
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.error || "Failed to switch role");
      throw error;
    }
  };

  // Check if user has multiple roles
  const hasDualRoles = !!(user?.available_roles && user.available_roles.length > 1);
  const activeRole = user?.active_role || user?.role || null;

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    switchRole,
    isAuthenticated: !!token && !!user,
    hasDualRoles,
    activeRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
