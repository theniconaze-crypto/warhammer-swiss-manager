/**
 * src/components/Layout.tsx
 * Main application shell with iOS-style bottom navigation bar.
 * Handles safe area insets for iPhone notch and home indicator.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Trophy, Users, Settings, Home, LogOut, UserCog } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Tournois', exact: true },
  { to: '/standings', icon: Trophy, label: 'Classements' },
  { to: '/players', icon: Users, label: 'Joueurs' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const me = currentUser();

  // Hide bottom nav on certain sub-pages for immersive feel
  const hideNav = location.pathname.includes('/presentation');

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      {/* Top bar: current user + admin/logout actions */}
      {me && (
        <div className="flex items-center justify-between border-b border-gray-900 px-4 py-2.5 text-xs text-gray-500">
          <span>
            Connecté : <span className="text-gray-300">{me.username}</span>
            {me.role === 'admin' && <span className="ml-1.5 text-amber-400">(admin)</span>}
          </span>
          <div className="flex items-center gap-3">
            {me.role === 'admin' && (
              <NavLink to="/users" className="flex items-center gap-1 hover:text-gray-300">
                <UserCog className="h-3.5 w-3.5" />
                Comptes
              </NavLink>
            )}
            <button onClick={logout} className="flex items-center gap-1 hover:text-gray-300">
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 overflow-y-auto ${hideNav ? '' : 'pb-20'}`}
        style={{ paddingBottom: hideNav ? 0 : 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      {/* Bottom navigation - iOS style */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around px-2 h-16">
            {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => {
              const isActive = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/';
              const isHome = to === '/' && location.pathname === '/';

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-all duration-200 ${
                    isActive || isHome
                      ? 'text-amber-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon
                    size={22}
                    className={`transition-transform duration-200 ${(isActive || isHome) ? 'scale-110' : ''}`}
                    strokeWidth={isActive || isHome ? 2.5 : 1.5}
                  />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
