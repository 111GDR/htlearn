import { create } from "zustand";
import { api } from "@/lib/api";

export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  grade?: string;
  mustChangePassword?: boolean;
  avatar?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  loading: false,

  init: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ user: null });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user });
      return data.user;
    } finally {
      set({ loading: false });
    }
  },

  setUser: (u) => {
    localStorage.setItem("user", JSON.stringify(u));
    set({ user: u });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null });
  },
}));
