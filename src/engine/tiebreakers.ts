/**
 * src/engine/tiebreakers.ts
 * Tiebreaker calculations for Swiss tournament standings.
 * Implements Buchholz, SOS, VP differential, and head-to-head.
 */

import type { Round, StandingEntry, TiebreakerType } from '../types';

export interface TiebreakerContext {
  playerId: string;
  opponents: string[];
  completedRounds: Round[];
  allEntries: Map<string, StandingEntry>;
}

/**
 * Calculate Buchholz score: sum of all opponents' match points.
 */
export function calculateBuchholz(ctx: TiebreakerContext): number {
  let total = 0;
  for (const oppId of ctx.opponents) {
    const oppEntry = ctx.allEntries.get(oppId);
    if (oppEntry) {
      total += oppEntry.matchPoints;
    }
  }
  return total;
}

/**
 * Calculate SOS (Strength of Schedule): average win-rate of opponents.
 */
export function calculateSOS(ctx: TiebreakerContext): number {
  if (ctx.opponents.length === 0) return 0;
  let total = 0;
  let count = 0;
  for (const oppId of ctx.opponents) {
    const oppEntry = ctx.allEntries.get(oppId);
    if (oppEntry) {
      total += oppEntry.winRate;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

/**
 * Get head-to-head result between two players.
 * Returns 1 if p1 beat p2, -1 if p2 beat p1, 0 if draw or not played.
 */
export function getHeadToHead(
  p1Id: string,
  p2Id: string,
  completedRounds: Round[]
): number {
  for (const round of completedRounds) {
    for (const pairing of round.pairings) {
      if (pairing.player1Id === p1Id && pairing.player2Id === p2Id) {
        if (pairing.result === 'PLAYER1_WIN') return 1;
        if (pairing.result === 'PLAYER2_WIN') return -1;
        return 0;
      }
      if (pairing.player1Id === p2Id && pairing.player2Id === p1Id) {
        if (pairing.result === 'PLAYER1_WIN') return -1;
        if (pairing.result === 'PLAYER2_WIN') return 1;
        return 0;
      }
    }
  }
  return 0;
}

/**
 * Sort standings by a configured tiebreaker order.
 */
export function sortByTiebreakers(
  entries: StandingEntry[],
  tiebreakerOrder: TiebreakerType[],
  completedRounds: Round[]
): StandingEntry[] {
  return [...entries].sort((a, b) => {
    // Primary: match points
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;

    // Apply tiebreakers in configured order
    for (const tiebreaker of tiebreakerOrder) {
      let diff = 0;
      switch (tiebreaker) {
        case 'BUCHHOLZ':
          diff = b.buchholz - a.buchholz;
          break;
        case 'SOS':
          diff = b.sos - a.sos;
          break;
        case 'VP_DIFF':
          diff = b.vpDiff - a.vpDiff;
          break;
        case 'VP_TOTAL':
          diff = b.vpScored - a.vpScored;
          break;
        case 'HEAD_TO_HEAD':
          diff = getHeadToHead(a.playerId, b.playerId, completedRounds);
          break;
        case 'PAINTING':
          diff = b.paintingScore - a.paintingScore;
          break;
        case 'SPORTSMANSHIP':
          diff = b.sportsmanshipTotal - a.sportsmanshipTotal;
          break;
      }
      if (diff !== 0) return diff;
    }

    return 0;
  });
}
