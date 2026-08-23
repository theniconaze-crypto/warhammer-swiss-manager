/**
 * src/engine/standings.ts
 * Generates live tournament standings from completed round data.
 * Calculates match points, VP totals, and all tiebreaker values.
 */

import type {
  Tournament,
  StandingEntry,
  Player,
  Round,
  Pairing,
  TiebreakerType,
} from '../types';
import { calculateBuchholz, calculateSOS, sortByTiebreakers } from './tiebreakers';

interface RoundResult {
  matchPoints: number;
  vpScored: number;
  vpConceded: number;
  win: boolean;
  draw: boolean;
  loss: boolean;
  bye: boolean;
  opponentId: string | null;
  sportsmanship: number;
}

function getPlayerRoundResult(
  playerId: string,
  round: Round,
  rules: { winPoints: number; drawPoints: number; lossPoints: number; byePoints?: number }
): RoundResult | null {
  const pairing = round.pairings.find(
    p => p.player1Id === playerId || (p.player2Id !== 'BYE' && p.player2Id === playerId)
  );

  if (!pairing) return null;

  const byePoints = rules.byePoints ?? rules.winPoints;

  if (pairing.player2Id === 'BYE' && pairing.player1Id === playerId) {
    return {
      matchPoints: byePoints,
      vpScored: pairing.player1Score ?? 0,
      vpConceded: 0,
      win: true,
      draw: false,
      loss: false,
      bye: true,
      opponentId: null,
      sportsmanship: 0,
    };
  }

  const isPlayer1 = pairing.player1Id === playerId;
  const opponentId = isPlayer1 ? pairing.player2Id as string : pairing.player1Id;
  const vpScored = isPlayer1 ? (pairing.player1Score ?? 0) : (pairing.player2Score ?? 0);
  const vpConceded = isPlayer1 ? (pairing.player2Score ?? 0) : (pairing.player1Score ?? 0);
  const battlePoints = isPlayer1 ? (pairing.player1BattlePoints ?? 0) : (pairing.player2BattlePoints ?? 0);
  const sportsmanship = isPlayer1
    ? (pairing.player2Sportsmanship ?? 0) // player receives sportsmanship FROM opponent
    : (pairing.player1Sportsmanship ?? 0);

  const win = battlePoints === rules.winPoints;
  const draw = battlePoints === rules.drawPoints && rules.drawPoints > 0;
  const loss = !win && !draw;

  return {
    matchPoints: battlePoints,
    vpScored,
    vpConceded,
    win,
    draw,
    loss,
    bye: false,
    opponentId,
    sportsmanship,
  };
}

// Utility kept for future use
function _getCompletedPairings(rounds: Round[]): Pairing[] {
  return rounds
    .filter(r => r.status === 'COMPLETED' || r.pairings.some(p => p.locked))
    .flatMap(r => r.pairings.filter(p => p.locked || p.player2Id === 'BYE'));
}
void _getCompletedPairings;

export function calculateStandings(
  tournament: Tournament,
  tiebreakerOrder?: TiebreakerType[]
): StandingEntry[] {
  const { players, rounds, rules } = tournament;
  const tiebreakers = tiebreakerOrder ?? rules.tiebreakerOrder;

  // Only consider rounds with locked pairings
  const relevantRounds = rounds.filter(r =>
    r.pairings.some(p => p.locked || p.player2Id === 'BYE')
  );

  // Build initial entries
  const entryMap = new Map<string, StandingEntry>();

  for (const player of players) {
    entryMap.set(player.id, {
      rank: 0,
      playerId: player.id,
      matchPoints: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
      vpScored: 0,
      vpConceded: 0,
      vpDiff: 0,
      buchholz: 0,
      sos: 0,
      paintingScore: player.painting ?? 0,
      sportsmanshipTotal: player.sportsmanship ?? 0,
      opponents: [],
      dropped: player.dropped,
      winRate: 0,
    });
  }

  // Accumulate results from each relevant round
  for (const round of relevantRounds) {
    for (const player of players) {
      const result = getPlayerRoundResult(player.id, round, rules);
      if (!result) continue;

      const entry = entryMap.get(player.id);
      if (!entry) continue;

      entry.matchPoints += result.matchPoints;
      entry.vpScored += result.vpScored;
      entry.vpConceded += result.vpConceded;
      if (result.win) entry.wins++;
      if (result.draw) entry.draws++;
      if (result.loss) entry.losses++;
      if (result.bye) entry.byes++;
      if (result.opponentId) entry.opponents.push(result.opponentId);
      entry.sportsmanshipTotal += result.sportsmanship;
    }
  }

  // Calculate derived values
  for (const entry of entryMap.values()) {
    entry.vpDiff = entry.vpScored - entry.vpConceded;
    const totalGames = entry.wins + entry.draws + entry.losses;
    entry.winRate = totalGames > 0 ? entry.wins / totalGames : 0;
  }

  // Calculate tiebreakers (needs full map to be populated first)
  for (const entry of entryMap.values()) {
    const ctx = {
      playerId: entry.playerId,
      opponents: entry.opponents,
      completedRounds: relevantRounds,
      allEntries: entryMap,
    };
    entry.buchholz = calculateBuchholz(ctx);
    entry.sos = calculateSOS(ctx);
  }

  // Sort and assign ranks
  const sortedEntries = sortByTiebreakers(
    Array.from(entryMap.values()),
    tiebreakers,
    relevantRounds
  );

  let rank = 1;
  for (let i = 0; i < sortedEntries.length; i++) {
    if (i > 0) {
      const prev = sortedEntries[i - 1];
      const curr = sortedEntries[i];
      // Same rank if same points and same primary tiebreaker
      if (curr.matchPoints === prev.matchPoints && curr.buchholz === prev.buchholz) {
        curr.rank = prev.rank;
      } else {
        curr.rank = rank;
      }
    } else {
      sortedEntries[i].rank = 1;
    }
    rank++;
  }

  return sortedEntries;
}

export function getPlayerStanding(
  playerId: string,
  tournament: Tournament
): StandingEntry | undefined {
  const standings = calculateStandings(tournament);
  return standings.find(s => s.playerId === playerId);
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.dropped);
}
