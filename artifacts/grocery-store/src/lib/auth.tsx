import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest as request } from "./api-client";

export interface UserType {
  id: number;
  phone: string;
  name: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ channel: string; smsSent?: boolean }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAddresses: () => Promise<any[]>;
  addAddress: (data: any) => Promise<any>;
  updateAddress: (id: number, data: any) => Promise<any>;
  deleteAddress: (id: number) => Promise<void>;
  getOrders: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sendOtp: async () => ({ channel: "sms" }),
  verifyOtp: async () => ({ isNewUser: false }),
  updateProfile: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  getAddresses: async () => [],
  addAddress: async () => ({}),
  updateAddress: async () => ({}),
  deleteAddress: async () => {},
  getOrders: async () => [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await request("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const sendOtp = async (phone: string) => {
    return request("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone }) });
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const data = await request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) });
    setUser(data.user);
    return data;
  };

  const updateProfile = async (name: string) => {
    await request("/auth/update-profile", { method: "POST", body: JSON.stringify({ name }) });
    setUser(prev => prev ? { ...prev, name } : null);
  };

  const logout = async () => {
    await request("/auth/logout", { method: "POST" });
    setUser(null);
  };

  const getAddresses = () => request("/auth/addresses");
  const addAddress = (data: any) => request("/auth/addresses", { method: "POST", body: JSON.stringify(data) });
  const updateAddress = (id: number, data: any) => request(`/auth/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) });
  const deleteAddress = (id: number) => request(`/auth/addresses/${id}`, { method: "DELETE" });
  const getOrders = () => request("/auth/orders");

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, updateProfile, logout, refreshUser, getAddresses, addAddress, updateAddress, deleteAddress, getOrders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
