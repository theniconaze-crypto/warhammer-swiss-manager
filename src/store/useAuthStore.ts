/**
 * src/store/useAuthStore.ts
 * Local accounts & session store, persisted to localStorage.
 * Seeds a default admin account (admin / admin) on first run.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppUser, Permission } from '../types/auth';
import { hashPassword, verifyPassword } from '../utils/auth';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin';

interface AuthStore {
  users: AppUser[];
  currentUserId: string | null;
  hydrated: boolean;

  // session
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  currentUser: () => AppUser | null;
  hasPermission: (permission: Permission) => boolean;

  // admin user management
  createUser: (data: {
    username: string;
    password: string;
    role: 'admin' | 'organizer';
    permissions: Permission[];
  }) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (id: string, data: Partial<Pick<AppUser, 'username' | 'role' | 'permissions'>>) => { ok: boolean; error?: string };
  setPassword: (id: string, newPassword: string) => Promise<void>;
  deleteUser: (id: string) => { ok: boolean; error?: string };
  ensureSeedAdmin: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      hydrated: false,

      ensureSeedAdmin: async () => {
        const { users } = get();
        if (users.length === 0) {
          const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
          const admin: AppUser = {
            id: uuidv4(),
            username: DEFAULT_ADMIN_USERNAME,
            passwordHash,
            role: 'admin',
            permissions: [],
            createdAt: new Date().toISOString(),
            mustChangePassword: true,
          };
          set({ users: [admin], hydrated: true });
        } else {
          set({ hydrated: true });
        }
      },

      login: async (username, password) => {
        const user = get().users.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (!user) return { ok: false, error: 'Identifiants incorrects' };
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return { ok: false, error: 'Identifiants incorrects' };
        set({ currentUserId: user.id });
        return { ok: true };
      },

      logout: () => set({ currentUserId: null }),

      currentUser: () => {
        const { users, currentUserId } = get();
        return users.find((u) => u.id === currentUserId) ?? null;
      },

      hasPermission: (permission) => {
        const user = get().currentUser();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions.includes(permission);
      },

      createUser: async ({ username, password, role, permissions }) => {
        const { users } = get();
        if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
          return { ok: false, error: 'Ce nom d\'utilisateur existe déjà' };
        }
        if (!username.trim() || password.length < 4) {
          return { ok: false, error: 'Nom d\'utilisateur requis, mot de passe (4 caractères min.)' };
        }
        const passwordHash = await hashPassword(password);
        const newUser: AppUser = {
          id: uuidv4(),
          username: username.trim(),
          passwordHash,
          role,
          permissions: role === 'admin' ? [] : permissions,
          createdAt: new Date().toISOString(),
        };
        set({ users: [...users, newUser] });
        return { ok: true };
      },

      updateUser: (id, data) => {
        const { users } = get();
        const target = users.find((u) => u.id === id);
        if (!target) return { ok: false, error: 'Utilisateur introuvable' };
        if (
          data.username &&
          users.some(
            (u) => u.id !== id && u.username.toLowerCase() === data.username!.trim().toLowerCase()
          )
        ) {
          return { ok: false, error: 'Ce nom d\'utilisateur existe déjà' };
        }
        // Prevent removing the last admin
        if (data.role === 'organizer' && target.role === 'admin') {
          const otherAdmins = users.filter((u) => u.role === 'admin' && u.id !== id);
          if (otherAdmins.length === 0) {
            return { ok: false, error: 'Impossible de rétrograder le dernier compte admin' };
          }
        }
        set({
          users: users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        });
        return { ok: true };
      },

      setPassword: async (id, newPassword) => {
        const passwordHash = await hashPassword(newPassword);
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, passwordHash, mustChangePassword: false } : u
          ),
        });
      },

      deleteUser: (id) => {
        const { users } = get();
        const target = users.find((u) => u.id === id);
        if (!target) return { ok: false, error: 'Utilisateur introuvable' };
        if (target.role === 'admin') {
          const otherAdmins = users.filter((u) => u.role === 'admin' && u.id !== id);
          if (otherAdmins.length === 0) {
            return { ok: false, error: 'Impossible de supprimer le dernier compte admin' };
          }
        }
        set({
          users: users.filter((u) => u.id !== id),
          currentUserId: get().currentUserId === id ? null : get().currentUserId,
        });
        return { ok: true };
      },
    }),
    {
      name: 'warhammer-auth-storage',
      partialize: (state) => ({ users: state.users, currentUserId: state.currentUserId }),
    }
  )
);
