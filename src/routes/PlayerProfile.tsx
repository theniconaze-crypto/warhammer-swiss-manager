/**
 * src/routes/PlayerProfile.tsx
 * Detailed player profile with match history, stats, and actions.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, TrendingUp, Shield, AlertCircle, UserX, UserCheck } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { usePlayerStanding } from '../hooks/useStandings';
import { getFactionName } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function PlayerProfile() {
  const { tournamentId, playerId } = useParams<{ tournamentId: string; playerId: string }>();
  const navigate = useNavigate();
  const { getTournament, dropPlayer, undropPlayer, updatePlayer } = useTournamentStore();
  const tournament = getTournament(tournamentId!);
  const standing = usePlayerStanding(tournament, playerId!);
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Tournoi introuvable</p>
      </div>
    );
  }

  const player = tournament.players.find(p => p.id === playerId);
  if (!player) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Joueur introuvable</p>
      </div>
    );
  }

  // Build match history from rounds
  const matchHistory = tournament.rounds.flatMap(round => {
    const pairing = round.pairings.find(
      p => p.player1Id === playerId || (p.player2Id !== 'BYE' && p.player2Id === playerId)
    );
    if (!pairing) return [];
    const isP1 = pairing.player1Id === playerId;
    const opponentId = isP1 ? pairing.player2Id : pairing.player1Id;
    const opponent = opponentId !== 'BYE' ? tournament.players.find(p => p.id === opponentId) : null;
    const myScore = isP1 ? pairing.player1Score : pairing.player2Score;
    const oppScore = isP1 ? pairing.player2Score : pairing.player1Score;
    const myBP = isP1 ? pairing.player1BattlePoints : pairing.player2BattlePoints;
    let result: 'WIN' | 'LOSS' | 'DRAW' | 'BYE' = 'DRAW';
    if (pairing.result === 'BYE') result = 'BYE';
    else if (isP1 && pairing.result === 'PLAYER1_WIN') result = 'WIN';
    else if (!isP1 && pairing.result === 'PLAYER2_WIN') result = 'WIN';
    else if (pairing.result === 'DRAW') result = 'DRAW';
    else if (pairing.result) result = 'LOSS';

    return [{
      round: round.roundNumber,
      opponent,
      opponentId: opponentId !== 'BYE' ? opponentId : null,
      myScore: myScore ?? 0,
      oppScore: oppScore ?? 0,
      battlePoints: myBP ?? 0,
      result,
      locked: pairing.locked,
    }];
  });

  const resultColors = {
    WIN: 'text-emerald-400 bg-emerald-900/30',
    LOSS: 'text-red-400 bg-red-900/30',
    DRAW: 'text-amber-400 bg-amber-900/30',
    BYE: 'text-gray-400 bg-gray-800',
  };

  const winRate = standing ? Math.round(standing.winRate * 100) : 0;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white flex-1">Fiche Joueur</h1>
          {tournament.rules.allowDrops && (
            <button
              onClick={() => player.dropped ? undropPlayer(tournament.id, player.id) : setShowDropConfirm(true)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                player.dropped
                  ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                  : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
              }`}
            >
              {player.dropped ? <><UserCheck size={12} /> Réintégrer</> : <><UserX size={12} /> Abandon</>}
            </button>
          )}
        </div>

        {/* Player info card */}
        <div className={`rounded-xl p-4 ${player.dropped ? 'bg-red-900/10 border border-red-900/30' : 'bg-gray-800/50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
              {player.firstName[0]}{player.lastName[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {player.firstName} {player.lastName}
                {player.dropped && <span className="ml-2 text-xs text-red-400">ABANDON</span>}
              </h2>
              {player.nickname && <p className="text-xs text-gray-400">"{player.nickname}"</p>}
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={11} className="text-gray-500" />
                <span className="text-xs text-gray-400">
                  {getFactionName(player.faction, tournament.gameSystem)}
                  {player.subfaction && ` — ${player.subfaction}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats grid */}
        {standing && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={14} className="text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">{standing.matchPoints}</div>
              <div className="text-xs text-gray-500">pts match</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400">{winRate}%</div>
              <div className="text-xs text-gray-500">victoires</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">#{standing.rank}</div>
              <div className="text-xs text-gray-500">classement</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{standing.wins}</div>
              <div className="text-xs text-gray-500">victoires</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{standing.draws}</div>
              <div className="text-xs text-gray-500">égalités</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-red-400">{standing.losses}</div>
              <div className="text-xs text-gray-500">défaites</div>
            </div>
          </div>
        )}

        {/* VP stats */}
        {standing && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-3">Points de Victoire</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Marqués : </span>
                <span className="text-emerald-400 font-bold">{standing.vpScored}</span>
              </div>
              <div>
                <span className="text-gray-500">Concédés : </span>
                <span className="text-red-400 font-bold">{standing.vpConceded}</span>
              </div>
              <div>
                <span className="text-gray-500">Diff : </span>
                <span className={`font-bold ${standing.vpDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {standing.vpDiff > 0 ? '+' : ''}{standing.vpDiff}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Buchholz: {standing.buchholz.toFixed(1)} | SOS: {(standing.sos * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* Match history */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Historique des rondes</h3>
          {matchHistory.length === 0 ? (
            <div className="text-center py-6 text-gray-600">
              <AlertCircle size={20} className="mx-auto mb-1" />
              <p className="text-xs">Aucune ronde jouée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchHistory.map(match => (
                <div key={match.round} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="text-center shrink-0 w-12">
                    <div className="text-xs text-gray-500">Ronde</div>
                    <div className="text-lg font-bold text-white">{match.round}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {match.opponent
                        ? `${match.opponent.firstName} ${match.opponent.lastName}`
                        : 'BYE'}
                    </div>
                    {match.opponent && (
                      <div className="text-xs text-gray-500">
                        {getFactionName(match.opponent.faction, tournament.gameSystem)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono text-white">
                      {match.myScore} – {match.oppScore}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resultColors[match.result]}`}>
                      {match.result === 'WIN' ? 'V' : match.result === 'LOSS' ? 'D' : match.result === 'DRAW' ? 'N' : 'BYE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Notes</h3>
            <button onClick={() => { setNotes(player.notes ?? ''); setEditingNotes(true); }} className="text-xs text-amber-400">
              Modifier
            </button>
          </div>
          {editingNotes ? (
            <div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditingNotes(false)} className="flex-1 py-2 bg-gray-800 text-gray-300 text-sm rounded-xl">Annuler</button>
                <button
                  onClick={() => {
                    updatePlayer(tournament.id, player.id, { notes });
                    setEditingNotes(false);
                    toast.success('Notes enregistrées');
                  }}
                  className="flex-1 py-2 bg-amber-700 text-white text-sm rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-900 border border-gray-800 rounded-xl p-3">
              {player.notes || 'Aucune note'}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDropConfirm}
        onClose={() => setShowDropConfirm(false)}
        onConfirm={() => { dropPlayer(tournament.id, player.id); toast.success('Joueur en abandon'); }}
        title="Confirmer l'abandon"
        message={`${player.firstName} ${player.lastName} sera retiré des futurs appariements.`}
        confirmLabel="Confirmer l'abandon"
        variant="warning"
      />
    </div>
  );
}
