import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: any | null;
    token: string | null;
    setAuth: (user: any, token: string) => void;
    updateUser: (user: any) => void;
    clearAuth: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => set({ user, token }),
            updateUser: (user) => set({ user }),
            clearAuth: () => set({ user: null, token: null }),
            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('auth-storage');
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
