/**
 * src/engine/teamSwiss.ts
 * Team-based Swiss pairing for Warhammer team tournaments.
 * Handles team-level Swiss pairings and internal player matchups.
 */

import type { Team, Round, Pairing, SubPairing, TeamStandingEntry } from '../types';
import { generateId } from '../utils/id';

/**
 * Generate Swiss pairings between teams.
 */
export function generateTeamSwissPairings(
  teams: Team[],
  teamStandings: TeamStandingEntry[],
  completedRounds: Round[]
): Array<{ team1Id: string; team2Id: string; table: number }> {
  const opponentHistory = buildTeamOpponentHistory(completedRounds);

  const sortedTeamIds = teamStandings
    .sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      return b.buchholz - a.buchholz;
    })
    .map(s => s.teamId);

  const pairings: Array<{ team1Id: string; team2Id: string; table: number }> = [];
  const paired = new Set<string>();
  const activeTeams = teams.filter(t => t.playerIds.length > 0);
  const activeIds = new Set(activeTeams.map(t => t.id));
  const sortedActive = sortedTeamIds.filter(id => activeIds.has(id));

  // Handle odd number of teams (BYE)
  let byeTeamId: string | null = null;
  let teamsForPairing = [...sortedActive];

  if (teamsForPairing.length % 2 !== 0 && teamsForPairing.length > 0) {
    byeTeamId = teamsForPairing[teamsForPairing.length - 1];
    teamsForPairing = teamsForPairing.slice(0, -1);
  }

  // Simple top-half vs bottom-half with re-match avoidance
  const mid = Math.floor(teamsForPairing.length / 2);
  const top = teamsForPairing.slice(0, mid);
  const bottom = teamsForPairing.slice(mid);

  let table = 1;
  for (let i = 0; i < top.length; i++) {
    const t1 = top[i];
    let t2 = bottom[i];

    // Try to avoid re-match
    if (havePairedBefore(t1, t2, opponentHistory)) {
      // Find alternative
      const alt = bottom.find((b, idx) => idx !== i && !paired.has(b) && !havePairedBefore(t1, b, opponentHistory));
      if (alt) t2 = alt;
    }

    if (!paired.has(t1) && !paired.has(t2)) {
      pairings.push({ team1Id: t1, team2Id: t2, table: table++ });
      paired.add(t1);
      paired.add(t2);
    }
  }

  if (byeTeamId) {
    pairings.push({ team1Id: byeTeamId, team2Id: 'BYE' as unknown as string, table: 0 });
  }

  return pairings;
}

function buildTeamOpponentHistory(rounds: Round[]): Set<string> {
  const history = new Set<string>();
  for (const round of rounds) {
    for (const pairing of round.pairings) {
      if (pairing.player2Id !== 'BYE') {
        const key = [pairing.player1Id, pairing.player2Id].sort().join(':');
        history.add(key);
      }
    }
  }
  return history;
}

function havePairedBefore(t1: string, t2: string, history: Set<string>): boolean {
  return history.has([t1, t2].sort().join(':'));
}

/**
 * Generate internal sub-pairings for a team match (random mode).
 */
export function generateRandomSubPairings(
  team1PlayerIds: string[],
  team2PlayerIds: string[]
): SubPairing[] {
  const shuffled1 = [...team1PlayerIds].sort(() => Math.random() - 0.5);
  const shuffled2 = [...team2PlayerIds].sort(() => Math.random() - 0.5);

  const subPairings: SubPairing[] = [];
  const count = Math.min(shuffled1.length, shuffled2.length);

  for (let i = 0; i < count; i++) {
    subPairings.push({
      id: generateId(),
      player1Id: shuffled1[i],
      player2Id: shuffled2[i],
    });
  }

  return subPairings;
}

/**
 * Calculate team result from sub-pairings.
 * Returns 'TEAM1_WIN', 'TEAM2_WIN', or 'DRAW'.
 */
export function calculateTeamResult(subPairings: SubPairing[]): 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' {
  let team1Wins = 0;
  let team2Wins = 0;

  for (const sp of subPairings) {
    if (sp.result === 'PLAYER1_WIN') team1Wins++;
    else if (sp.result === 'PLAYER2_WIN') team2Wins++;
  }

  if (team1Wins > team2Wins) return 'PLAYER1_WIN';
  if (team2Wins > team1Wins) return 'PLAYER2_WIN';
  return 'DRAW';
}

/**
 * Calculate team standings from completed rounds.
 */
export function calculateTeamStandings(
  teams: Team[],
  rounds: Round[],
  winPoints = 3,
  drawPoints = 1,
  lossPoints = 0
): TeamStandingEntry[] {
  const entryMap = new Map<string, TeamStandingEntry>();

  for (const team of teams) {
    entryMap.set(team.id, {
      rank: 0,
      teamId: team.id,
      teamName: team.name,
      matchPoints: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      playerPoints: 0,
      buchholz: 0,
      sos: 0,
      opponents: [],
    });
  }

  for (const round of rounds) {
    for (const pairing of round.pairings) {
      if (!pairing.locked) continue;

      const e1 = entryMap.get(pairing.player1Id);
      const e2 = pairing.player2Id !== 'BYE' ? entryMap.get(pairing.player2Id) : null;

      if (!e1) continue;

      if (pairing.result === 'PLAYER1_WIN' || pairing.result === 'BYE') {
        e1.matchPoints += winPoints;
        e1.wins++;
        if (e2) { e2.matchPoints += lossPoints; e2.losses++; }
      } else if (pairing.result === 'PLAYER2_WIN' && e2) {
        e2.matchPoints += winPoints;
        e2.wins++;
        e1.matchPoints += lossPoints;
        e1.losses++;
      } else if (pairing.result === 'DRAW') {
        e1.matchPoints += drawPoints;
        e1.draws++;
        if (e2) { e2.matchPoints += drawPoints; e2.draws++; }
      }

      if (e2 && pairing.player2Id !== 'BYE') {
        e1.opponents.push(pairing.player2Id as string);
        e2.opponents.push(pairing.player1Id);
      }

      // Count player-level points from sub-pairings
      if (pairing.subPairings) {
        for (const sp of pairing.subPairings) {
          if (!sp.result) continue;
          if (sp.result === 'PLAYER1_WIN') {
            if (e1) e1.playerPoints++;
          } else if (sp.result === 'PLAYER2_WIN') {
            if (e2) e2.playerPoints++;
          }
        }
      }
    }
  }

  // Calculate buchholz for teams
  for (const entry of entryMap.values()) {
    let buchholz = 0;
    for (const oppId of entry.opponents) {
      const oppEntry = entryMap.get(oppId);
      if (oppEntry) buchholz += oppEntry.matchPoints;
    }
    entry.buchholz = buchholz;
  }

  const sorted = Array.from(entryMap.values()).sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
    if (b.playerPoints !== a.playerPoints) return b.playerPoints - a.playerPoints;
    return b.buchholz - a.buchholz;
  });

  sorted.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return sorted;
}

/**
 * Convert team pairings to Round format.
 */
export function teamPairingsToRound(
  pairings: Array<{ team1Id: string; team2Id: string; table: number }>,
  roundNumber: number,
  timerDuration = 150
): Round {
  const roundPairings: Pairing[] = pairings.map(tp => ({
    id: generateId(),
    table: tp.table,
    player1Id: tp.team1Id,
    player2Id: tp.team2Id as string | 'BYE',
    locked: tp.team2Id === 'BYE',
    result: tp.team2Id === 'BYE' ? ('BYE' as const) : undefined,
    subPairings: [],
  }));

  return {
    id: generateId(),
    roundNumber,
    status: 'PENDING',
    pairings: roundPairings,
    timerDuration,
  };
}
