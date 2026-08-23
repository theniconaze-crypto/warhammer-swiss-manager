/**
 * src/components/StandingsTable.tsx
 * Live standings table with podium highlighting.
 * Displays rank, player info, match record, VP stats, and tiebreakers.
 */

import { Trophy, Medal } from 'lucide-react';
import type { StandingEntry, Tournament } from '../types';
import { getFactionName } from '../types';

interface StandingsTableProps {
  standings: StandingEntry[];
  tournament: Tournament;
  highlightPlayerId?: string;
  compact?: boolean;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy size={14} className="text-amber-400" />;
  if (rank === 2) return <Medal size={14} className="text-gray-300" />;
  if (rank === 3) return <Medal size={14} className="text-amber-700" />;
  return null;
}

function getRankBg(rank: number, dropped: boolean): string {
  if (dropped) return 'opacity-40';
  if (rank === 1) return 'bg-amber-900/20 border-amber-800/50';
  if (rank === 2) return 'bg-gray-700/30 border-gray-600/30';
  if (rank === 3) return 'bg-amber-900/10 border-amber-900/30';
  return 'border-transparent';
}

export function StandingsTable({ standings, tournament, highlightPlayerId, compact = false }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      {compact ? (
        // Compact mobile view
        <div className="space-y-1.5">
          {standings.map((entry) => {
            const player = tournament.players.find(p => p.id === entry.playerId);
            if (!player) return null;
            const isHighlighted = entry.playerId === highlightPlayerId;
            const rankIcon = getRankIcon(entry.rank);

            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${getRankBg(entry.rank, entry.dropped)} ${
                  isHighlighted ? 'ring-1 ring-amber-500' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  {rankIcon ?? <span className="text-xs text-gray-500 font-bold">{entry.rank}</span>}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">
                      {player.firstName} {player.lastName}
                    </span>
                    {entry.dropped && (
                      <span className="text-[10px] text-red-400 bg-red-900/30 px-1.5 rounded">DROP</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getFactionName(player.faction, tournament.gameSystem)}
                  </div>
                </div>

                {/* Record */}
                <div className="text-center shrink-0">
                  <div className="text-sm font-bold text-white">
                    {entry.wins}<span className="text-gray-500">-</span>{entry.draws}<span className="text-gray-500">-</span>{entry.losses}
                  </div>
                  <div className="text-xs text-amber-400 font-medium">{entry.matchPoints} pts</div>
                </div>

                {/* VP */}
                <div className="text-center text-xs text-gray-400 shrink-0 w-12">
                  <div className={entry.vpDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {entry.vpDiff > 0 ? '+' : ''}{entry.vpDiff}
                  </div>
                  <div className="text-gray-600 text-[10px]">VP diff</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Full table view
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-2 font-medium">#</th>
              <th className="text-left py-2 px-2 font-medium">Joueur</th>
              <th className="text-left py-2 px-2 font-medium hidden sm:table-cell">Faction</th>
              <th className="text-center py-2 px-2 font-medium">V-N-D</th>
              <th className="text-center py-2 px-2 font-medium">Pts</th>
              <th className="text-center py-2 px-2 font-medium">VP+</th>
              <th className="text-center py-2 px-2 font-medium">VP-</th>
              <th className="text-center py-2 px-2 font-medium hidden sm:table-cell">Diff</th>
              <th className="text-center py-2 px-2 font-medium hidden md:table-cell">Buchholz</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {standings.map((entry) => {
              const player = tournament.players.find(p => p.id === entry.playerId);
              if (!player) return null;
              const isHighlighted = entry.playerId === highlightPlayerId;
              const rankIcon = getRankIcon(entry.rank);

              return (
                <tr
                  key={entry.playerId}
                  className={`transition-colors ${entry.rank <= 3 ? 'bg-amber-900/10' : ''} ${isHighlighted ? 'bg-amber-900/20' : 'hover:bg-gray-800/30'} ${entry.dropped ? 'opacity-40' : ''}`}
                >
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1">
                      {rankIcon ?? <span className="text-gray-500 font-bold">{entry.rank}</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-white">
                      {player.firstName} {player.lastName}
                      {player.nickname && <span className="text-gray-500 ml-1">"{player.nickname}"</span>}
                    </div>
                    {entry.dropped && (
                      <span className="text-[10px] text-red-400">ABANDON</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 hidden sm:table-cell">
                    {getFactionName(player.faction, tournament.gameSystem)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">
                    <span className="text-emerald-400">{entry.wins}</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-amber-400">{entry.draws}</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-red-400">{entry.losses}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-bold text-amber-400">{entry.matchPoints}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-emerald-400">{entry.vpScored}</td>
                  <td className="py-2.5 px-2 text-center text-red-400">{entry.vpConceded}</td>
                  <td className={`py-2.5 px-2 text-center font-medium hidden sm:table-cell ${entry.vpDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.vpDiff > 0 ? '+' : ''}{entry.vpDiff}
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-500 hidden md:table-cell">
                    {entry.buchholz.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
