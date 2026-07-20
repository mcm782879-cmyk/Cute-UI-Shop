import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, setAuthTokenGetter, User, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("rin_token"));
  const [, setLocation] = useLocation();

  // Handle Discord OAuth2 callback — pick up ?discord_token= from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordToken = params.get("discord_token");
    if (discordToken) {
      localStorage.setItem("rin_token", discordToken);
      setToken(discordToken);
      // Clean URL then redirect to orders
      window.history.replaceState({}, "", window.location.pathname);
      setLocation("/my-orders");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("rin_token"));
  }, []);

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token, refetch]);

  const login = (newToken: string) => {
    localStorage.setItem("rin_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("rin_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
