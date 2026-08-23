/**
 * src/hooks/usePairings.ts
 * Hook for managing pairings within a round.
 * Provides helper functions for score updates, locking, and result computation.
 */

import { useCallback } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import type { Tournament, Round, Pairing } from '../types';

export function usePairings(tournamentId: string, roundNumber: number) {
  const { updatePairingScore, lockPairing, unlockPairing, updateSportsmanship } = useTournamentStore();

  const handleScoreUpdate = useCallback((pairingId: string, p1Score: number, p2Score: number) => {
    updatePairingScore(tournamentId, roundNumber, pairingId, p1Score, p2Score);
  }, [tournamentId, roundNumber, updatePairingScore]);

  const handleLock = useCallback((pairingId: string) => {
    lockPairing(tournamentId, roundNumber, pairingId);
  }, [tournamentId, roundNumber, lockPairing]);

  const handleUnlock = useCallback((pairingId: string) => {
    unlockPairing(tournamentId, roundNumber, pairingId);
  }, [tournamentId, roundNumber, unlockPairing]);

  const handleSportsmanship = useCallback((pairingId: string, p1Sport: number, p2Sport: number) => {
    updateSportsmanship(tournamentId, roundNumber, pairingId, p1Sport, p2Sport);
  }, [tournamentId, roundNumber, updateSportsmanship]);

  return { handleScoreUpdate, handleLock, handleUnlock, handleSportsmanship };
}

export function getRoundProgress(round: Round): { total: number; locked: number; pending: number } {
  const activePairings = round.pairings.filter(p => p.player2Id !== 'BYE');
  const locked = activePairings.filter(p => p.locked).length;
  return {
    total: activePairings.length,
    locked,
    pending: activePairings.length - locked,
  };
}

export function getPairingResult(pairing: Pairing, isPlayer1: boolean): 'win' | 'loss' | 'draw' | 'bye' | null {
  if (pairing.player2Id === 'BYE') return 'bye';
  if (!pairing.result) return null;
  if (pairing.result === 'DRAW') return 'draw';
  if (isPlayer1 && pairing.result === 'PLAYER1_WIN') return 'win';
  if (!isPlayer1 && pairing.result === 'PLAYER2_WIN') return 'win';
  return 'loss';
}

export function getAllRoundsComplete(tournament: Tournament): boolean {
  const lastRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
  if (!lastRound) return false;
  return lastRound.pairings.every(p => p.locked || p.player2Id === 'BYE');
}

export function canGenerateNextRound(tournament: Tournament): boolean {
  if (tournament.currentRound >= tournament.numberOfRounds) return false;
  if (tournament.currentRound === 0) return tournament.players.filter(p => !p.dropped).length >= 2;
  return getAllRoundsComplete(tournament);
}
