import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import("@shared/schema").User | null>(null);
  const [company, setCompany] = useState<import("@shared/schema").Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("ots_user");
    const storedCompany = localStorage.getItem("ots_company");
    const storedToken = localStorage.getItem("ots_token");

    if (storedUser && storedCompany && storedToken) {
      setUser(JSON.parse(storedUser));
      setCompany(JSON.parse(storedCompany));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      setCompany(response.company);
      localStorage.setItem("ots_user", JSON.stringify(response.user));
      localStorage.setItem("ots_company", JSON.stringify(response.company));
      localStorage.setItem("ots_token", response.token);
      toast({
        title: "Bienvenido",
        description: `Has iniciado sesión como ${response.user.name}`,
      });
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem("ots_user");
    localStorage.removeItem("ots_company");
    localStorage.removeItem("ots_token");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  return (
    <AuthContext.Provider value={{ user, company, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
