/**
 * src/routes/Standings.tsx
 * Global standings view - shows standings across all or a selected tournament.
 * Supports faction filtering and export.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronDown, Filter } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { useStandings } from '../hooks/useStandings';
import { StandingsTable } from '../components/StandingsTable';
import { ExportButton } from '../components/ExportButton';
import type { Tournament } from '../types';
import { getFactionsForSystem, getFactionName } from '../types';

export function Standings() {
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();
  const activeTournaments = tournaments.filter(t => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(activeTournaments[0]?.id ?? '');
  const [filterFaction, setFilterFaction] = useState<string>('ALL');

  const selectedTournament: Tournament | undefined = tournaments.find(t => t.id === selectedTournamentId);
  const allStandings = useStandings(selectedTournament);

  const filtered = useMemo(() => {
    if (filterFaction === 'ALL') return allStandings;
    return allStandings.filter(s => {
      const player = selectedTournament?.players.find(p => p.id === s.playerId);
      return player?.faction === filterFaction;
    });
  }, [allStandings, filterFaction, selectedTournament]);

  const factions = selectedTournament
    ? [...new Set(selectedTournament.players.map(p => p.faction))]
    : [];

  if (activeTournaments.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-4">
        <Trophy size={40} className="text-gray-600" />
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-400">Aucun tournoi actif</h3>
          <p className="text-sm text-gray-600 mt-1">Créez et démarrez un tournoi pour voir les classements</p>
        </div>
        <button
          onClick={() => navigate('/tournament/new')}
          className="text-amber-400 hover:underline text-sm"
        >
          Créer un tournoi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-14 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h1 className="text-lg font-bold text-white">Classements</h1>
          </div>
          {selectedTournament && (
            <ExportButton tournament={selectedTournament} standings={allStandings} />
          )}
        </div>

        {/* Tournament selector */}
        <div className="relative mb-3">
          <select
            value={selectedTournamentId}
            onChange={e => { setSelectedTournamentId(e.target.value); setFilterFaction('ALL'); }}
            className="w-full pl-3 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
          >
            {activeTournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.gameSystem}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* Faction filter */}
        {factions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1 text-gray-500 shrink-0">
              <Filter size={12} />
            </div>
            <button
              onClick={() => setFilterFaction('ALL')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterFaction === 'ALL' ? 'bg-amber-900 text-amber-300' : 'bg-gray-800 text-gray-400'
              }`}
            >
              Toutes
            </button>
            {factions.map(factionId => (
              <button
                key={factionId}
                onClick={() => setFilterFaction(factionId)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterFaction === factionId ? 'bg-amber-900 text-amber-300' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {selectedTournament ? getFactionName(factionId, selectedTournament.gameSystem) : factionId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Standings content */}
      <div className="px-4 py-4">
        {!selectedTournament ? (
          <div className="text-center py-12 text-gray-500">Sélectionnez un tournoi</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy size={28} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm">Pas encore de résultats</p>
          </div>
        ) : (
          <>
            {/* Podium for top 3 */}
            {filtered.length >= 3 && filterFaction === 'ALL' && (
              <div className="flex items-end justify-center gap-2 mb-6 pb-4 border-b border-gray-800">
                {[1, 0, 2].map(pos => {
                  const entry = filtered[pos];
                  if (!entry) return null;
                  const player = selectedTournament.players.find(p => p.id === entry.playerId);
                  const heights = [20, 28, 16];
                  const colors = ['bg-gray-600', 'bg-amber-600', 'bg-amber-800'];
                  const medals = ['🥈', '🥇', '🥉'];
                  return (
                    <div key={entry.playerId} className="flex flex-col items-center gap-1">
                      <span className="text-lg">{medals[pos]}</span>
                      <div className="text-center">
                        <div className="text-xs font-bold text-white">{player?.firstName}</div>
                        <div className="text-xs text-gray-500">{entry.matchPoints} pts</div>
                      </div>
                      <div className={`w-16 ${colors[pos]} rounded-t-lg flex items-end justify-center pb-1`} style={{ height: `${heights[pos] * 4}px` }}>
                        <span className="text-white font-bold text-lg">{entry.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <StandingsTable
              standings={filtered}
              tournament={selectedTournament}
              compact={false}
            />
          </>
        )}
      </div>
    </div>
  );
}
