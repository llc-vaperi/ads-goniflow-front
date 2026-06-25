import { create } from "zustand";
import { apiFetch } from "../utils/api";

interface User {
    id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string, redirectTo: string) => Promise<void>;
    resetPassword: (newPassword: string) => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,

    clearError: () => set({ error: null }),

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        // Dev bypass for testing
        if (email === "test@example.com" && password === "Test1234!") {
            if (typeof window !== "undefined") {
                localStorage.setItem("dev-session", "true");
            }
            set({
                user: { id: "dev-test-user-id", email: "test@example.com" },
                isAuthenticated: true,
                isLoading: false,
            });
            return;
        }
        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            set({
                user: res.data.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (err: any) {
            set({ error: err.message, isLoading: false, isAuthenticated: false });
            throw err;
        }
    },

    register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await apiFetch("/auth/signup", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            set({ isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        if (typeof window !== "undefined" && localStorage.getItem("dev-session") === "true") {
            localStorage.removeItem("dev-session");
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
        }
        try {
            await apiFetch("/auth/logout", {
                method: "POST",
            });
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    forgotPassword: async (email, redirectTo) => {
        set({ isLoading: true, error: null });
        try {
            await apiFetch("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email, redirectTo }),
            });
            set({ isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    resetPassword: async (newPassword) => {
        set({ isLoading: true, error: null });
        try {
            await apiFetch("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ newPassword }),
            });
            set({ isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    checkAuth: async () => {
        set({ isLoading: true, error: null });
        if (typeof window !== "undefined" && localStorage.getItem("dev-session") === "true") {
            set({
                user: { id: "dev-test-user-id", email: "test@example.com" },
                isAuthenticated: true,
                isLoading: false,
            });
            return;
        }
        try {
            const res = await apiFetch("/auth/me");
            set({
                user: res.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (err: any) {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },
}));

