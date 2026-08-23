/**
 * src/components/RequirePermission.tsx
 * Wraps a route and shows a blocked message if the current user
 * lacks the required permission. Purely client-side gating.
 */

import type { ReactNode } from 'react';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { Permission } from '../types/auth';

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission(permission));

  if (!hasPermission) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <ShieldOff className="h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-500">
          Votre compte n'a pas accès à cette section. Contactez un administrateur si besoin.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
