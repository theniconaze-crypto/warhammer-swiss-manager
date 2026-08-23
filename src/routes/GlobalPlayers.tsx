/**
 * src/routes/GlobalPlayers.tsx
 * Global player database view showing cross-tournament statistics.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Trophy } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { getFactionName } from '../types';

interface AggregatedPlayer {
  key: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  faction: string;
  gameSystem: 'W40K' | 'AOS';
  tournaments: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  winRate: number;
  tournamentIds: string[];
  playerId: string;
  tournamentId: string;
}

export function GlobalPlayers() {
  const navigate = useNavigate();
  const { tournaments } = useTournamentStore();

  const aggregated = useMemo<AggregatedPlayer[]>(() => {
    const playerMap = new Map<string, AggregatedPlayer>();

    for (const tournament of tournaments) {
      for (const player of tournament.players) {
        const key = `${player.firstName.toLowerCase()}_${player.lastName.toLowerCase()}`;

        if (!playerMap.has(key)) {
          playerMap.set(key, {
            key,
            firstName: player.firstName,
            lastName: player.lastName,
            nickname: player.nickname,
            faction: player.faction,
            gameSystem: tournament.gameSystem,
            tournaments: 0,
            totalWins: 0,
            totalDraws: 0,
            totalLosses: 0,
            winRate: 0,
            tournamentIds: [],
            playerId: player.id,
            tournamentId: tournament.id,
          });
        }

        const entry = playerMap.get(key)!;
        entry.tournaments++;
        entry.tournamentIds.push(tournament.id);

        // Count results
        for (const round of tournament.rounds) {
          for (const pairing of round.pairings) {
            if (!pairing.locked) continue;
            const isP1 = pairing.player1Id === player.id;
            const isP2 = pairing.player2Id === player.id;
            if (!isP1 && !isP2) continue;

            if (pairing.result === 'BYE') { entry.totalWins++; continue; }
            if (isP1) {
              if (pairing.result === 'PLAYER1_WIN') entry.totalWins++;
              else if (pairing.result === 'DRAW') entry.totalDraws++;
              else entry.totalLosses++;
            } else {
              if (pairing.result === 'PLAYER2_WIN') entry.totalWins++;
              else if (pairing.result === 'DRAW') entry.totalDraws++;
              else entry.totalLosses++;
            }
          }
        }
      }
    }

    // Calculate win rates
    for (const entry of playerMap.values()) {
      const total = entry.totalWins + entry.totalDraws + entry.totalLosses;
      entry.winRate = total > 0 ? Math.round((entry.totalWins / total) * 100) : 0;
    }

    return Array.from(playerMap.values()).sort((a, b) => b.winRate - a.winRate);
  }, [tournaments]);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-amber-400" />
          <h1 className="text-lg font-bold text-white">Joueurs</h1>
          <span className="ml-auto text-xs text-gray-500">{aggregated.length} joueurs</span>
        </div>
      </div>

      <div className="px-4 py-4">
        {aggregated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={32} className="text-gray-600" />
            <p className="text-gray-500 text-sm">Aucun joueur enregistré</p>
            <p className="text-gray-600 text-xs text-center">
              Les joueurs apparaissent ici après avoir participé à un tournoi
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {aggregated.map((player) => (
              <button
                key={player.key}
                onClick={() => navigate(`/tournament/${player.tournamentId}/player/${player.playerId}`)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-gray-400">
                    {player.firstName[0]}{player.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">
                      {player.firstName} {player.lastName}
                    </span>
                    {player.nickname && (
                      <span className="text-xs text-gray-500">"{player.nickname}"</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getFactionName(player.faction, player.gameSystem)} • {player.tournaments} tournoi{player.tournaments > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp size={11} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{player.winRate}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.totalWins}V-{player.totalDraws}N-{player.totalLosses}D
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
