/**
 * src/routes/Login.tsx
 * Local login screen. Shown when no session is active.
 */

import { useState, useEffect } from 'react';
import { Shield, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export function Login() {
  const { login, ensureSeedAdmin, hydrated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) ensureSeedAdmin();
  }, [hydrated, ensureSeedAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Erreur de connexion');
      toast.error(result.error ?? 'Erreur de connexion');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <Shield className="h-7 w-7 text-amber-400" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-100">Connexion</h1>
            <p className="mt-1 text-sm text-gray-500">Accédez à l'outil de gestion de tournois</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Identifiant</label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-10 pr-3 text-sm text-gray-100 outline-none transition-colors focus:border-amber-500/50"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Mot de passe</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-10 pr-10 text-sm text-gray-100 outline-none transition-colors focus:border-amber-500/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Compte par défaut : <span className="text-gray-500">admin / admin</span> — à changer après la première connexion.
        </p>
      </div>
    </div>
  );
}
