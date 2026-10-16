import { createContext } from "react";
import type { Company, User } from "@shared/schema";

export interface AuthContextValue {
  user: User | null;
  company: Company | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
