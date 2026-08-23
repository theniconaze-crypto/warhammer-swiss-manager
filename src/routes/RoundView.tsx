/**
 * src/routes/RoundView.tsx
 * Round view with pairings list, score input, and round timer.
 * Handles both solo and team format pairings.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { PairingCard } from '../components/PairingCard';
import { Timer } from '../components/Timer';
import { usePairings, getRoundProgress } from '../hooks/usePairings';
import toast from 'react-hot-toast';

export function RoundView() {
  const { id, roundNumber } = useParams<{ id: string; roundNumber: string }>();
  const navigate = useNavigate();
  const { getTournament, startRound, completeRound, generateNextRound } = useTournamentStore();
  const tournament = getTournament(id!);
  const roundNum = parseInt(roundNumber ?? '1');
  const round = tournament?.rounds.find(r => r.roundNumber === roundNum);
  const { handleScoreUpdate, handleLock, handleUnlock, handleSportsmanship } = usePairings(id!, roundNum);
  const [showTimer, setShowTimer] = useState(false);

  if (!tournament || !round) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-gray-400">Ronde introuvable</p>
          <button onClick={() => navigate(-1)} className="text-amber-400 hover:underline text-sm mt-2">Retour</button>
        </div>
      </div>
    );
  }

  const progress = getRoundProgress(round);
  const allLocked = progress.pending === 0;
  const isCurrentRound = roundNum === tournament.currentRound;

  const handleStartRound = () => {
    startRound(tournament.id, roundNum);
    toast.success('Ronde démarrée !');
  };

  const handleCompleteRound = () => {
    if (!allLocked) {
      toast.error(`${progress.pending} résultat(s) non verrouillé(s)`);
      return;
    }
    completeRound(tournament.id, roundNum);
    const isLast = roundNum >= tournament.numberOfRounds;
    if (!isLast) {
      toast.success('Ronde terminée ! Prêt pour la suivante.');
    } else {
      toast.success('Dernière ronde terminée !');
    }
    navigate(`/tournament/${id}`);
  };

  const handleAutoComplete = () => {
    // Lock all incomplete pairings with current scores
    round.pairings.forEach(p => {
      if (!p.locked && p.player2Id !== 'BYE' && p.player1Score !== undefined && p.player2Score !== undefined) {
        handleLock(p.id);
      }
    });
    toast.success('Résultats saisis automatiquement verrouillés');
  };

  const systemAccent = tournament.gameSystem === 'W40K' ? 'bg-red-900/40 border-red-800' : 'bg-blue-900/40 border-blue-800';

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(`/tournament/${id}`)} className="text-gray-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">Ronde {round.roundNumber}</h1>
            <p className="text-xs text-gray-500">{tournament.name}</p>
          </div>
          <button
            onClick={() => setShowTimer(t => !t)}
            className={`p-2 rounded-lg transition-colors ${showTimer ? 'bg-amber-900/30 text-amber-400' : 'bg-gray-800 text-gray-400'}`}
          >
            <Clock size={16} />
          </button>
        </div>

        {/* Timer */}
        {showTimer && (
          <div className={`rounded-xl p-4 border mb-3 flex justify-center ${systemAccent}`}>
            <Timer
              durationMinutes={round.timerDuration}
              onComplete={() => toast('⏰ Temps écoulé !', { style: { background: '#1f2937', color: '#ef4444' }, duration: 6000 })}
            />
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-500"
              style={{ width: progress.total > 0 ? `${(progress.locked / progress.total) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{progress.locked}/{progress.total}</span>
        </div>

        {/* Status / Action row */}
        <div className="flex items-center gap-2">
          {round.status === 'PENDING' && (
            <button
              onClick={handleStartRound}
              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap size={14} />
              Démarrer la ronde
            </button>
          )}

          {round.status !== 'PENDING' && !allLocked && (
            <div className="flex-1 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle size={12} />
              <span>{progress.pending} résultat{progress.pending > 1 ? 's' : ''} en attente</span>
            </div>
          )}

          {allLocked && round.status !== 'COMPLETED' && isCurrentRound && (
            <button
              onClick={handleCompleteRound}
              className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={14} />
              Terminer la ronde
            </button>
          )}

          {round.status === 'COMPLETED' && (
            <div className="flex-1 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle size={12} />
              <span>Ronde terminée</span>
            </div>
          )}

          {!allLocked && round.status !== 'PENDING' && progress.locked > 0 && (
            <button
              onClick={handleAutoComplete}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-xl transition-colors"
              title="Verrouiller tous les résultats saisis"
            >
              Verrouiller saisis
            </button>
          )}
        </div>
      </div>

      {/* Pairings */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {round.pairings
          .sort((a, b) => a.table - b.table)
          .map(pairing => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              tournament={tournament}
              onScoreUpdate={handleScoreUpdate}
              onLock={handleLock}
              onUnlock={handleUnlock}
              onSportsmanship={handleSportsmanship}
              showSportsmanship={tournament.rules.useSportsmanshipScore}
            />
          ))}
      </div>
    </div>
  );
}
