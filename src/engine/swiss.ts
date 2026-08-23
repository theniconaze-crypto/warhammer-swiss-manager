/**
 * src/engine/swiss.ts
 * Core Swiss-round pairing algorithm for Warhammer tournaments.
 * Implements bracket-based pairing with re-match avoidance and backtracking.
 * Supports bye handling for odd player counts.
 */

import type { Player, StandingEntry, Pairing, Round } from '../types';
import { generateId } from '../utils/id';

export interface PairingInput {
  players: Player[];
  standings: StandingEntry[];
  completedRounds: Round[];
  rules: {
    maxVP: number;
    byePoints: number;
    winPoints: number;
  };
}

export interface GeneratedPairing {
  player1Id: string;
  player2Id: string | 'BYE';
  table: number;
}

/**
 * Build a set of all previous opponent pairs to avoid re-matches.
 * Key: sorted pair of player IDs joined by ':'
 */
function buildOpponentHistory(completedRounds: Round[]): Set<string> {
  const history = new Set<string>();
  for (const round of completedRounds) {
    for (const pairing of round.pairings) {
      if (pairing.player2Id !== 'BYE') {
        const key = [pairing.player1Id, pairing.player2Id].sort().join(':');
        history.add(key);
      }
    }
  }
  return history;
}

/**
 * Build a set of player IDs who have already received a BYE.
 */
function buildByeHistory(completedRounds: Round[]): Set<string> {
  const byeSet = new Set<string>();
  for (const round of completedRounds) {
    for (const pairing of round.pairings) {
      if (pairing.player2Id === 'BYE') {
        byeSet.add(pairing.player1Id);
      }
    }
  }
  return byeSet;
}

/**
 * Check if two players have already been paired.
 */
function havePlayed(p1Id: string, p2Id: string, history: Set<string>): boolean {
  const key = [p1Id, p2Id].sort().join(':');
  return history.has(key);
}

/**
 * Attempt to pair players within a bracket using top-half vs bottom-half.
 * Returns null if no valid pairing found (triggers backtracking).
 */
// pairBracket is used internally via attemptBracketPairing
function _pairBracketUnused(
  players: string[],
  opponentHistory: Set<string>,
  alreadyPaired: Set<string>
): GeneratedPairing[] | null {
  if (players.length === 0) return [];
  if (players.length === 1) return null;
  const available = players.filter(p => !alreadyPaired.has(p));
  if (available.length === 0) return [];
  if (available.length === 1) return null;
  const n = available.length;
  const midpoint = Math.floor(n / 2);
  const topHalf = available.slice(0, midpoint);
  const bottomHalf = available.slice(midpoint);
  return tryPairHalves(topHalf, bottomHalf, opponentHistory, alreadyPaired);
}
void _pairBracketUnused;

/**
 * Try to pair top and bottom halves, with fallback shifting.
 */
function tryPairHalves(
  top: string[],
  bottom: string[],
  opponentHistory: Set<string>,
  alreadyPaired: Set<string>
): GeneratedPairing[] | null {
  // Try to match top[i] with bottom[i]
  const result: GeneratedPairing[] = [];
  const usedTop = new Set<number>();
  const usedBottom = new Set<number>();

  // Greedy approach with backtracking for re-match conflicts
  function backtrack(topIdx: number): boolean {
    if (topIdx >= top.length) return true;
    if (usedTop.has(topIdx)) return backtrack(topIdx + 1);

    for (let bi = 0; bi < bottom.length; bi++) {
      if (usedBottom.has(bi)) continue;
      if (alreadyPaired.has(top[topIdx]) || alreadyPaired.has(bottom[bi])) continue;
      if (!havePlayed(top[topIdx], bottom[bi], opponentHistory)) {
        usedTop.add(topIdx);
        usedBottom.add(bi);
        result.push({ player1Id: top[topIdx], player2Id: bottom[bi], table: 0 });
        if (backtrack(topIdx + 1)) return true;
        result.pop();
        usedTop.delete(topIdx);
        usedBottom.delete(bi);
      }
    }

    // Allow re-match as last resort
    for (let bi = 0; bi < bottom.length; bi++) {
      if (usedBottom.has(bi)) continue;
      if (alreadyPaired.has(top[topIdx]) || alreadyPaired.has(bottom[bi])) continue;
      usedTop.add(topIdx);
      usedBottom.add(bi);
      result.push({ player1Id: top[topIdx], player2Id: bottom[bi], table: 0 });
      if (backtrack(topIdx + 1)) return true;
      result.pop();
      usedTop.delete(topIdx);
      usedBottom.delete(bi);
    }

    return false;
  }

  const success = backtrack(0);
  if (!success) return null;

  // Handle unpaired players from unequal halves
  const unpairedBottom = bottom.filter((_, i) => !usedBottom.has(i));
  if (unpairedBottom.length > 0) {
    return null; // Will be handled by bracket merging
  }

  return result;
}

/**
 * Main Swiss pairing algorithm.
 * Groups players by match points, pairs within brackets,
 * drops players down to next bracket if needed.
 */
export function generateSwissPairings(input: PairingInput): GeneratedPairing[] {
  const { players, standings, completedRounds } = input;

  const opponentHistory = buildOpponentHistory(completedRounds);
  const byeHistory = buildByeHistory(completedRounds);

  // Only active (non-dropped) players
  const activePlayers = players.filter(p => !p.dropped);
  const activeIds = new Set(activePlayers.map(p => p.id));

  // Sort by match points desc, then by tiebreakers (buchholz, sos, vpDiff)
  const sortedStandings = standings
    .filter(s => activeIds.has(s.playerId) && !players.find(p => p.id === s.playerId)?.dropped)
    .sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
      if (b.sos !== a.sos) return b.sos - a.sos;
      return b.vpDiff - a.vpDiff;
    });

  const sortedPlayerIds = sortedStandings.map(s => s.playerId);

  // Handle BYE for odd number
  let playerIdsForPairing = [...sortedPlayerIds];
  let byePlayerId: string | null = null;

  if (playerIdsForPairing.length % 2 !== 0) {
    // Give BYE to the lowest-ranked player who hasn't had one yet
    let byeIdx = playerIdsForPairing.length - 1;
    while (byeIdx >= 0 && byeHistory.has(playerIdsForPairing[byeIdx])) {
      byeIdx--;
    }
    if (byeIdx < 0) {
      // Everyone has had a BYE; give to the last player
      byeIdx = playerIdsForPairing.length - 1;
    }
    byePlayerId = playerIdsForPairing[byeIdx];
    playerIdsForPairing = playerIdsForPairing.filter((_, i) => i !== byeIdx);
  }

  // Group into brackets by match points
  const bracketMap = new Map<number, string[]>();
  for (const playerId of playerIdsForPairing) {
    const standing = sortedStandings.find(s => s.playerId === playerId);
    const pts = standing?.matchPoints ?? 0;
    if (!bracketMap.has(pts)) bracketMap.set(pts, []);
    bracketMap.get(pts)!.push(playerId);
  }

  const brackets = Array.from(bracketMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, ids]) => ids);

  const finalPairings: GeneratedPairing[] = [];
  const alreadyPaired = new Set<string>();
  const floaters: string[] = []; // Players dropped down from higher brackets

  for (let bi = 0; bi < brackets.length; bi++) {
    const bracket = [...floaters, ...brackets[bi]];
    floaters.length = 0;

    const available = bracket.filter(p => !alreadyPaired.has(p));
    if (available.length === 0) continue;

    if (available.length === 1) {
      // Float down to next bracket
      floaters.push(available[0]);
      continue;
    }

    const pairings = attemptBracketPairing(available, opponentHistory, alreadyPaired);

    for (const p of pairings.paired) {
      finalPairings.push(p);
      alreadyPaired.add(p.player1Id);
      alreadyPaired.add(p.player2Id as string);
    }

    // Float unpaired players to next bracket
    for (const unpaired of pairings.unpaired) {
      floaters.push(unpaired);
    }
  }

  // Handle remaining floaters
  if (floaters.length > 0) {
    const remaining = floaters.filter(p => !alreadyPaired.has(p));
    for (let i = 0; i < remaining.length - 1; i += 2) {
      finalPairings.push({ player1Id: remaining[i], player2Id: remaining[i + 1], table: 0 });
    }
  }

  // Assign table numbers
  let table = 1;
  const finalWithTables: GeneratedPairing[] = finalPairings.map(p => ({
    ...p,
    table: table++
  }));

  // Add BYE pairing
  if (byePlayerId) {
    finalWithTables.push({ player1Id: byePlayerId, player2Id: 'BYE', table: 0 });
  }

  return finalWithTables;
}

interface BracketResult {
  paired: GeneratedPairing[];
  unpaired: string[];
}

function attemptBracketPairing(
  players: string[],
  opponentHistory: Set<string>,
  _alreadyPaired: Set<string>
): BracketResult {
  if (players.length === 0) return { paired: [], unpaired: [] };

  const n = players.length;
  const mid = Math.floor(n / 2);
  const top = players.slice(0, mid);
  const bottom = players.slice(mid, mid * 2);
  const leftover = players.slice(mid * 2);

  const paired: GeneratedPairing[] = [];
  const usedBottom = new Set<number>();

  function backtrack(ti: number): boolean {
    if (ti >= top.length) return true;

    // Try preferred pairing (avoid re-match)
    for (let bi = 0; bi < bottom.length; bi++) {
      if (usedBottom.has(bi)) continue;
      if (!havePlayed(top[ti], bottom[bi], opponentHistory)) {
        usedBottom.add(bi);
        paired.push({ player1Id: top[ti], player2Id: bottom[bi], table: 0 });
        if (backtrack(ti + 1)) return true;
        paired.pop();
        usedBottom.delete(bi);
      }
    }

    // Allow re-match as fallback
    for (let bi = 0; bi < bottom.length; bi++) {
      if (usedBottom.has(bi)) continue;
      usedBottom.add(bi);
      paired.push({ player1Id: top[ti], player2Id: bottom[bi], table: 0 });
      if (backtrack(ti + 1)) return true;
      paired.pop();
      usedBottom.delete(bi);
    }

    return false;
  }

  const success = backtrack(0);

  if (!success) {
    return { paired: [], unpaired: players };
  }

  return { paired, unpaired: leftover };
}

/**
 * Convert GeneratedPairing[] to Round pairings format.
 */
export function generatedPairingsToRound(
  pairings: GeneratedPairing[],
  roundNumber: number,
  rules: { maxVP: number; byePoints: number; winPoints: number; timerDuration?: number }
): Round {
  const roundPairings: Pairing[] = pairings.map(gp => {
    const isBye = gp.player2Id === 'BYE';
    const pairing: Pairing = {
      id: generateId(),
      table: gp.table,
      player1Id: gp.player1Id,
      player2Id: gp.player2Id,
      locked: isBye,
      result: isBye ? 'BYE' : undefined,
      player1Score: isBye ? rules.maxVP : undefined,
      player2Score: isBye ? 0 : undefined,
      player1BattlePoints: isBye ? rules.winPoints : undefined,
      player2BattlePoints: isBye ? 0 : undefined,
    };
    return pairing;
  });

  return {
    id: generateId(),
    roundNumber,
    status: 'PENDING',
    pairings: roundPairings,
    timerDuration: rules.timerDuration ?? 150,
  };
}

/**
 * Determine result of a pairing from scores.
 */
export function determineResult(
  p1Score: number,
  p2Score: number
): { result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'; p1Battle: number; p2Battle: number } {
  if (p1Score > p2Score) {
    return { result: 'PLAYER1_WIN', p1Battle: 3, p2Battle: 0 };
  }
  if (p2Score > p1Score) {
    return { result: 'PLAYER2_WIN', p1Battle: 0, p2Battle: 3 };
  }
  return { result: 'DRAW', p1Battle: 1, p2Battle: 1 };
}

/**
 * Calculate recommended number of rounds based on player count.
 */
export function recommendedRounds(playerCount: number): number {
  if (playerCount <= 1) return 1;
  if (playerCount <= 4) return 2;
  if (playerCount <= 8) return 3;
  if (playerCount <= 16) return 4;
  if (playerCount <= 32) return 5;
  if (playerCount <= 64) return 6;
  return Math.ceil(Math.log2(playerCount));
}
