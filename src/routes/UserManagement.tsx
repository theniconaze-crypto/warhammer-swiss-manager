/**
 * src/routes/UserManagement.tsx
 * Admin-only page: create/edit/delete accounts, set roles & permissions,
 * reset passwords.
 */

import { useState } from 'react';
import { UserPlus, Trash2, KeyRound, Shield, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ALL_PERMISSIONS, type Permission } from '../types/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export function UserManagement() {
  const { users, currentUser, createUser, updateUser, deleteUser, setPassword } = useAuthStore();
  const me = currentUser();

  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // create form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'organizer'>('organizer');
  const [newPermissions, setNewPermissions] = useState<Permission[]>([]);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [creating, setCreating] = useState(false);

  const togglePermission = (p: Permission) => {
    setNewPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createUser({
      username: newUsername,
      password: newPassword,
      role: newRole,
      permissions: newPermissions,
    });
    setCreating(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Erreur');
      return;
    }
    toast.success('Compte créé');
    setShowCreate(false);
    setNewUsername('');
    setNewPassword('');
    setNewRole('organizer');
    setNewPermissions([]);
  };

  const handleTogglePermissionExisting = (userId: string, p: Permission, current: Permission[]) => {
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    const result = updateUser(userId, { permissions: next });
    if (!result.ok) toast.error(result.error ?? 'Erreur');
  };

  const handleRoleChange = (userId: string, role: 'admin' | 'organizer') => {
    const result = updateUser(userId, { role });
    if (!result.ok) toast.error(result.error ?? 'Erreur');
    else toast.success('Rôle mis à jour');
  };

  const handleResetPassword = async () => {
    if (!resetTarget || resetPasswordValue.length < 4) {
      toast.error('Mot de passe : 4 caractères minimum');
      return;
    }
    await setPassword(resetTarget, resetPasswordValue);
    toast.success('Mot de passe réinitialisé');
    setResetTarget(null);
    setResetPasswordValue('');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const result = deleteUser(deleteTarget);
    if (!result.ok) toast.error(result.error ?? 'Erreur');
    else toast.success('Compte supprimé');
    setDeleteTarget(null);
  };

  if (!me || me.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Gestion des comptes</h1>
          <p className="text-sm text-gray-500">Créer des accès et définir leurs restrictions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-gray-950 hover:bg-amber-400"
        >
          <UserPlus className="h-4 w-4" />
          Nouveau
        </button>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {u.role === 'admin' ? (
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                ) : (
                  <Shield className="h-4 w-4 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    {u.username}
                    {u.id === me.id && <span className="ml-2 text-xs text-gray-500">(vous)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {u.role === 'admin' ? 'Administrateur (accès total)' : 'Organisateur'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setResetTarget(u.id)}
                  title="Réinitialiser le mot de passe"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                {u.id !== me.id && (
                  <button
                    onClick={() => setDeleteTarget(u.id)}
                    title="Supprimer"
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* role toggle */}
            {u.id !== me.id && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleRoleChange(u.id, 'organizer')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    u.role === 'organizer'
                      ? 'bg-gray-700 text-gray-100'
                      : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Organisateur
                </button>
                <button
                  onClick={() => handleRoleChange(u.id, 'admin')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    u.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* permissions, only relevant for organizers */}
            {u.role === 'organizer' && (
              <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-gray-800 pt-3 sm:grid-cols-2">
                {ALL_PERMISSIONS.filter((p) => p.id !== 'manage_users').map((perm) => (
                  <label
                    key={perm.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={u.permissions.includes(perm.id)}
                      onChange={() => handleTogglePermissionExisting(u.id, perm.id, u.permissions)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-700 bg-gray-800 text-amber-500"
                    />
                    <span className="text-xs text-gray-400">{perm.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-gray-800 bg-gray-900 p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-100">Nouveau compte</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Identifiant</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Mot de passe</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Rôle</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewRole('organizer')}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      newRole === 'organizer' ? 'bg-gray-700 text-gray-100' : 'bg-gray-800/50 text-gray-500'
                    }`}
                  >
                    Organisateur
                  </button>
                  <button
                    onClick={() => setNewRole('admin')}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      newRole === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800/50 text-gray-500'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {newRole === 'organizer' && (
                <div>
                  <label className="mb-1.5 block text-xs text-gray-400">Restrictions (accès autorisés)</label>
                  <div className="space-y-1">
                    {ALL_PERMISSIONS.filter((p) => p.id !== 'manage_users').map((perm) => (
                      <label key={perm.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-800/50">
                        <input
                          type="checkbox"
                          checked={newPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-700 bg-gray-800 text-amber-500"
                        />
                        <span className="text-xs text-gray-400">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !newUsername || newPassword.length < 4}
              className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-gray-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl border border-gray-800 bg-gray-900 p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-100">Réinitialiser le mot de passe</h2>
              <button onClick={() => setResetTarget(null)} className="text-gray-500 hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              placeholder="Nouveau mot de passe"
              autoFocus
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleResetPassword}
              className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-gray-950 hover:bg-amber-400"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer ce compte ?"
        message="Cette action est définitive."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
