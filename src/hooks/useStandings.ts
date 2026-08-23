/**
 * src/hooks/useStandings.ts
 * Hook for computing live standings from tournament data.
 * Memoized for performance with large player counts.
 */

import { useMemo } from 'react';
import type { Tournament, StandingEntry } from '../types';
import { calculateStandings } from '../engine/standings';
import { calculateTeamStandings } from '../engine/teamSwiss';

export function useStandings(tournament: Tournament | undefined): StandingEntry[] {
  return useMemo(() => {
    if (!tournament) return [];
    return calculateStandings(tournament);
  }, [tournament, tournament?.rounds]);
}

export function useTeamStandings(tournament: Tournament | undefined) {
  return useMemo(() => {
    if (!tournament || tournament.format !== 'TEAM' || !tournament.teams?.length) return [];
    return calculateTeamStandings(tournament.teams, tournament.rounds);
  }, [tournament, tournament?.rounds]);
}

export function usePlayerStanding(tournament: Tournament | undefined, playerId: string): StandingEntry | undefined {
  const standings = useStandings(tournament);
  return standings.find(s => s.playerId === playerId);
}
