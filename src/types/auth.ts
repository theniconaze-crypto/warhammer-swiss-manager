/**
 * src/types/auth.ts
 * Lightweight local authentication types.
 *
 * NOTE: This is a client-side-only "soft" access control system.
 * It prevents accidental mistakes between trusted co-organizers
 * (e.g. someone without rights editing tournament settings), but it is
 * NOT real security: everything lives in this browser's localStorage,
 * so anyone with dev-tools access could bypass it. Do not use it to
 * protect sensitive data.
 */

export type Permission =
  | 'manage_tournaments' // create/edit/delete tournaments, rounds, results
  | 'manage_players'     // create/edit/delete the global player list
  | 'manage_settings'    // change app settings & default rules
  | 'manage_users';       // create/edit/delete accounts (admin only in practice)

export const ALL_PERMISSIONS: { id: Permission; label: string; description: string }[] = [
  { id: 'manage_tournaments', label: 'Gérer les tournois', description: 'Créer, modifier, saisir les résultats et clôturer des tournois' },
  { id: 'manage_players', label: 'Gérer les joueurs', description: 'Ajouter, modifier ou supprimer des joueurs dans la base globale' },
  { id: 'manage_settings', label: 'Gérer les paramètres', description: "Modifier les réglages par défaut de l'application" },
  { id: 'manage_users', label: 'Gérer les comptes', description: 'Créer et administrer les comptes utilisateurs (réservé aux admins)' },
];

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string; // sha-256 hex digest, see utils/auth.ts — NOT secure storage, see note above
  role: 'admin' | 'organizer';
  permissions: Permission[]; // ignored for admins, who always have all permissions
  createdAt: string;
  mustChangePassword?: boolean;
}
