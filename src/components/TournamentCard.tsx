/**
 * src/components/TournamentCard.tsx
 * Card component displaying a tournament summary in the library view.
 * Shows game system, format, player count, round progress, and status.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Shield, Sword, Trophy, Clock, ChevronRight, Copy, Trash2 } from 'lucide-react';
import type { Tournament } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'text-gray-400 bg-gray-800', dot: 'bg-gray-400' },
  IN_PROGRESS: { label: 'En cours', color: 'text-emerald-400 bg-emerald-900/30', dot: 'bg-emerald-400 animate-pulse' },
  COMPLETED: { label: 'Terminé', color: 'text-amber-400 bg-amber-900/30', dot: 'bg-amber-400' },
};

const SYSTEM_CONFIG = {
  W40K: { label: 'Warhammer 40,000', color: 'text-red-400', icon: Sword },
  AOS: { label: 'Age of Sigmar', color: 'text-blue-400', icon: Shield },
};

export function TournamentCard({ tournament, onDelete, onDuplicate }: TournamentCardProps) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[tournament.status];
  const system = SYSTEM_CONFIG[tournament.gameSystem];
  const SystemIcon = system.icon;
  const activePlayers = tournament.players.filter(p => !p.dropped).length;

  const formattedDate = (() => {
    try {
      return format(new Date(tournament.date), 'd MMM yyyy', { locale: fr });
    } catch {
      return tournament.date;
    }
  })();

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => navigate(`/tournament/${tournament.id}`)}
    >
      {/* Header with system color accent */}
      <div className={`h-1 ${tournament.gameSystem === 'W40K' ? 'bg-gradient-to-r from-red-700 to-red-900' : 'bg-gradient-to-r from-blue-700 to-blue-900'}`} />

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base leading-tight truncate">{tournament.name}</h3>
            <div className={`flex items-center gap-1 mt-0.5 text-xs ${system.color}`}>
              <SystemIcon size={12} />
              <span>{system.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(tournament.id); }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              title="Dupliquer"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(tournament.id); }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={12} className="shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={12} className="shrink-0" />
            <span>{activePlayers} joueur{activePlayers > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} className="shrink-0" />
            <span>Ronde {tournament.currentRound}/{tournament.numberOfRounds}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Trophy size={12} className="shrink-0" />
            <span>{tournament.pointsLimit} pts</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
            {tournament.format === 'TEAM' && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                Équipes
              </span>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
}
