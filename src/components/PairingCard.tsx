/**
 * src/components/PairingCard.tsx
 * Individual pairing card for round view.
 * Displays player names, factions, score inputs, and lock controls.
 */

import { useState, useEffect } from 'react';
import { Lock, Unlock, Shield, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { Pairing, Player, Tournament } from '../types';
import { getFactionName } from '../types';
import { determineResult } from '../engine/swiss';

interface PairingCardProps {
  pairing: Pairing;
  tournament: Tournament;
  onScoreUpdate: (pairingId: string, p1Score: number, p2Score: number) => void;
  onLock: (pairingId: string) => void;
  onUnlock: (pairingId: string) => void;
  onSportsmanship?: (pairingId: string, p1Sport: number, p2Sport: number) => void;
  showSportsmanship?: boolean;
  isTeamFormat?: boolean;
}

function getResultColor(result: string | undefined, isBye: boolean): string {
  if (isBye) return 'text-gray-400';
  if (result === 'PLAYER1_WIN') return 'text-emerald-400';
  if (result === 'PLAYER2_WIN') return 'text-red-400';
  if (result === 'DRAW') return 'text-amber-400';
  return 'text-gray-500';
}

function getResultLabel(result: string | undefined, isPlayer1: boolean, isBye: boolean): string {
  if (isBye) return 'BYE';
  if (!result) return '—';
  if (result === 'DRAW') return 'Égalité';
  if (isPlayer1 && result === 'PLAYER1_WIN') return 'Victoire';
  if (isPlayer1 && result === 'PLAYER2_WIN') return 'Défaite';
  if (!isPlayer1 && result === 'PLAYER2_WIN') return 'Victoire';
  if (!isPlayer1 && result === 'PLAYER1_WIN') return 'Défaite';
  return '—';
}

export function PairingCard({
  pairing,
  tournament,
  onScoreUpdate,
  onLock,
  onUnlock,
  onSportsmanship,
  showSportsmanship = false,
}: PairingCardProps) {
  const isBye = pairing.player2Id === 'BYE';
  const [p1Score, setP1Score] = useState(pairing.player1Score?.toString() ?? '');
  const [p2Score, setP2Score] = useState(pairing.player2Score?.toString() ?? '');
  const [p1Sport, setP1Sport] = useState(pairing.player1Sportsmanship?.toString() ?? '');
  const [p2Sport, setP2Sport] = useState(pairing.player2Sportsmanship?.toString() ?? '');
  const [showSport, setShowSport] = useState(false);

  useEffect(() => {
    setP1Score(pairing.player1Score?.toString() ?? '');
    setP2Score(pairing.player2Score?.toString() ?? '');
  }, [pairing.player1Score, pairing.player2Score]);

  const player1 = tournament.players.find(p => p.id === pairing.player1Id);
  const player2 = !isBye ? tournament.players.find(p => p.id === pairing.player2Id) : null;

  const handleScoreChange = (p1: string, p2: string) => {
    const s1 = parseInt(p1) || 0;
    const s2 = parseInt(p2) || 0;
    if (p1 !== '' && p2 !== '') {
      onScoreUpdate(pairing.id, s1, s2);
    }
  };

  const handleSportChange = (s1: string, s2: string) => {
    const sp1 = parseInt(s1) || 0;
    const sp2 = parseInt(s2) || 0;
    onSportsmanship?.(pairing.id, sp1, sp2);
  };

  const previewResult = p1Score !== '' && p2Score !== ''
    ? determineResult(parseInt(p1Score) || 0, parseInt(p2Score) || 0).result
    : pairing.result;

  function PlayerCell({ player, score, setScore, isP1, otherScore }: {
    player: Player | null | undefined;
    score: string;
    setScore: (v: string) => void;
    isP1: boolean;
    otherScore: string;
  }) {
    const resultColor = getResultColor(previewResult, isBye);
    const resultLabel = getResultLabel(previewResult, isP1, isBye && !isP1);

    return (
      <div className={`flex-1 flex flex-col items-center gap-2 ${isBye && !isP1 ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
            <User size={12} className="text-gray-400" />
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-white leading-tight">
              {player ? `${player.firstName} ${player.lastName}` : isBye && !isP1 ? 'BYE' : '?'}
            </div>
            {player && (
              <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <Shield size={8} />
                {getFactionName(player.faction, tournament.gameSystem)}
              </div>
            )}
          </div>
        </div>

        {/* Score input */}
        {!isBye || isP1 ? (
          <input
            type="number"
            min={0}
            max={tournament.rules.maxVP}
            value={score}
            disabled={pairing.locked}
            onChange={(e) => {
              const val = e.target.value;
              setScore(val);
              const other = isP1 ? otherScore : score;
              const mine = val;
              if (isP1) handleScoreChange(mine, other);
              else handleScoreChange(other, mine);
            }}
            className={`w-16 text-center text-xl font-bold rounded-lg py-2 border transition-colors ${
              pairing.locked
                ? 'bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:outline-none'
            }`}
            placeholder="0"
          />
        ) : (
          <div className="w-16 text-center text-xl font-bold text-gray-600">—</div>
        )}

        <span className={`text-xs font-medium ${resultColor}`}>{resultLabel}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden ${pairing.locked ? 'border-emerald-800/50' : 'border-gray-800'}`}>
      {/* Table number */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-medium">
          {pairing.table > 0 ? `Table ${pairing.table}` : 'BYE'}
        </span>
        {pairing.locked ? (
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <Lock size={11} />
            <span>Verrouillé</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Unlock size={11} />
            <span>En attente</span>
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Scores row */}
        <div className="flex items-center gap-2">
          <PlayerCell
            player={player1}
            score={p1Score}
            setScore={setP1Score}
            isP1={true}
            otherScore={p2Score}
          />
          <div className="text-gray-600 font-bold text-sm px-1">VS</div>
          <PlayerCell
            player={player2}
            score={p2Score}
            setScore={setP2Score}
            isP1={false}
            otherScore={p1Score}
          />
        </div>

        {/* Sportsmanship toggle */}
        {showSportsmanship && !isBye && (
          <div className="mt-2">
            <button
              onClick={() => setShowSport(s => !s)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showSport ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Fair-play
            </button>
            {showSport && (
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">J1 →</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={p1Sport}
                    disabled={pairing.locked}
                    onChange={(e) => { setP1Sport(e.target.value); handleSportChange(e.target.value, p2Sport); }}
                    className="w-12 text-center text-sm rounded-lg py-1 bg-gray-800 border border-gray-600 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">J2 →</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={p2Sport}
                    disabled={pairing.locked}
                    onChange={(e) => { setP2Sport(e.target.value); handleSportChange(p1Sport, e.target.value); }}
                    className="w-12 text-center text-sm rounded-lg py-1 bg-gray-800 border border-gray-600 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lock/Unlock button */}
        {!isBye && (
          <div className="mt-3 flex justify-end">
            {pairing.locked ? (
              <button
                onClick={() => onUnlock(pairing.id)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 bg-gray-800 hover:bg-amber-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Unlock size={12} />
                Modifier
              </button>
            ) : (
              <button
                onClick={() => {
                  if (p1Score !== '' && p2Score !== '') {
                    onLock(pairing.id);
                  }
                }}
                disabled={p1Score === '' || p2Score === ''}
                className="flex items-center gap-1.5 text-xs text-white bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 px-3 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Lock size={12} />
                Verrouiller
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
