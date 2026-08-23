/**
 * src/store/useTournamentStore.ts
 * Main Zustand store for all tournament data.
 * Persisted to localStorage via persist middleware.
 * Handles CRUD operations on tournaments, players, rounds, and pairings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tournament,
  Player,
  Team,
  Round,
  SubPairing,
  TournamentStatus,
  RoundStatus,
  AuditLog,
} from '../types';
import { generateId } from '../utils/id';
import { generateChecksum } from '../utils/export';
import { generateSwissPairings, generatedPairingsToRound, determineResult } from '../engine/swiss';
import { calculateStandings } from '../engine/standings';
import { generateTeamSwissPairings, teamPairingsToRound, calculateTeamResult, calculateTeamStandings } from '../engine/teamSwiss';

interface TournamentStore {
  tournaments: Tournament[];

  // CRUD
  createTournament: (data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'currentRound' | 'status' | 'rounds' | 'players'> & { players?: Player[] }) => string;
  updateTournament: (id: string, data: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  duplicateTournament: (id: string) => string;
  getTournament: (id: string) => Tournament | undefined;

  // Player management
  addPlayer: (tournamentId: string, player: Omit<Player, 'id' | 'dropped'>) => string;
  updatePlayer: (tournamentId: string, playerId: string, data: Partial<Player>) => void;
  removePlayer: (tournamentId: string, playerId: string) => void;
  dropPlayer: (tournamentId: string, playerId: string) => void;
  undropPlayer: (tournamentId: string, playerId: string) => void;
  importPlayers: (tournamentId: string, players: Omit<Player, 'id' | 'dropped'>[]) => void;

  // Team management
  addTeam: (tournamentId: string, team: Omit<Team, 'id'>) => string;
  updateTeam: (tournamentId: string, teamId: string, data: Partial<Team>) => void;
  removeTeam: (tournamentId: string, teamId: string) => void;
  assignPlayerToTeam: (tournamentId: string, playerId: string, teamId: string | null) => void;

  // Round management
  generateNextRound: (tournamentId: string) => void;
  startRound: (tournamentId: string, roundNumber: number) => void;
  completeRound: (tournamentId: string, roundNumber: number) => void;

  // Pairing management
  updatePairingScore: (tournamentId: string, roundNumber: number, pairingId: string, p1Score: number, p2Score: number) => void;
  lockPairing: (tournamentId: string, roundNumber: number, pairingId: string) => void;
  unlockPairing: (tournamentId: string, roundNumber: number, pairingId: string, adminConfirm?: boolean) => void;
  updateSportsmanship: (tournamentId: string, roundNumber: number, pairingId: string, p1Sportsmanship: number, p2Sportsmanship: number) => void;

  // Sub-pairing management (team format)
  updateSubPairing: (tournamentId: string, roundNumber: number, pairingId: string, subPairingId: string, p1Score: number, p2Score: number) => void;
  addSubPairing: (tournamentId: string, roundNumber: number, pairingId: string, subPairing: Omit<SubPairing, 'id'>) => void;

  // Tournament lifecycle
  startTournament: (tournamentId: string) => void;
  completeTournament: (tournamentId: string) => void;
  resetTournament: (tournamentId: string) => void;

  // Check-in
  checkInPlayer: (tournamentId: string, playerId: string) => void;
  resetCheckIns: (tournamentId: string) => void;
}

function addAuditEntry(tournament: Tournament, action: string, entityType: AuditLog['entityType'], entityId: string, prevVal?: string, newVal?: string): AuditLog[] {
  const log: AuditLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    previousValue: prevVal,
    newValue: newVal,
  };
  return [...(tournament.auditLog ?? []), log];
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],

      getTournament: (id) => get().tournaments.find(t => t.id === id),

      createTournament: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const tournament: Tournament = {
          ...data,
          id,
          status: 'DRAFT',
          currentRound: 0,
          rounds: [],
          players: data.players ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set(state => ({ tournaments: [tournament, ...state.tournaments] }));
        return id;
      },

      updateTournament: (id, data) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTournament: (id) => {
        set(state => ({
          tournaments: state.tournaments.filter(t => t.id !== id),
        }));
      },

      duplicateTournament: (id) => {
        const original = get().getTournament(id);
        if (!original) return '';
        const newId = generateId();
        const now = new Date().toISOString();
        const duplicate: Tournament = {
          ...original,
          id: newId,
          name: `${original.name} (copie)`,
          status: 'DRAFT',
          currentRound: 0,
          rounds: [],
          players: original.players.map(p => ({ ...p, id: generateId(), dropped: false })),
          createdAt: now,
          updatedAt: now,
          auditLog: [],
        };
        set(state => ({ tournaments: [duplicate, ...state.tournaments] }));
        return newId;
      },

      addPlayer: (tournamentId, playerData) => {
        const id = generateId();
        const player: Player = { ...playerData, id, dropped: false };
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? { ...t, players: [...t.players, player], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
        return id;
      },

      updatePlayer: (tournamentId, playerId, data) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.map(p => p.id === playerId ? { ...p, ...data } : p),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      removePlayer: (tournamentId, playerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.filter(p => p.id !== playerId),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      dropPlayer: (tournamentId, playerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              players: t.players.map(p => p.id === playerId ? { ...p, dropped: true } : p),
              auditLog: addAuditEntry(t, 'DROP_PLAYER', 'player', playerId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      undropPlayer: (tournamentId, playerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              players: t.players.map(p => p.id === playerId ? { ...p, dropped: false } : p),
              auditLog: addAuditEntry(t, 'UNDROP_PLAYER', 'player', playerId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      importPlayers: (tournamentId, players) => {
        const newPlayers: Player[] = players.map(p => ({ ...p, id: generateId(), dropped: false }));
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? { ...t, players: [...t.players, ...newPlayers], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      addTeam: (tournamentId, teamData) => {
        const id = generateId();
        const team: Team = { ...teamData, id };
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? { ...t, teams: [...(t.teams ?? []), team], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
        return id;
      },

      updateTeam: (tournamentId, teamId, data) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  teams: (t.teams ?? []).map(team => team.id === teamId ? { ...team, ...data } : team),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      removeTeam: (tournamentId, teamId) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  teams: (t.teams ?? []).filter(team => team.id !== teamId),
                  players: t.players.map(p => p.teamId === teamId ? { ...p, teamId: undefined } : p),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      assignPlayerToTeam: (tournamentId, playerId, teamId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            const updatedPlayers = t.players.map(p =>
              p.id === playerId ? { ...p, teamId: teamId ?? undefined } : p
            );
            const updatedTeams = (t.teams ?? []).map(team => {
              let playerIds = team.playerIds.filter(id => id !== playerId);
              if (team.id === teamId) playerIds = [...playerIds, playerId];
              return { ...team, playerIds };
            });
            return { ...t, players: updatedPlayers, teams: updatedTeams, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      generateNextRound: (tournamentId) => {
        const tournament = get().getTournament(tournamentId);
        if (!tournament) return;

        const nextRoundNumber = tournament.currentRound + 1;
        const activePlayers = tournament.players.filter(p => !p.dropped);

        if (activePlayers.length < 2 && tournament.format === 'SOLO') return;

        let newRound: Round;

        if (tournament.format === 'SOLO') {
          const standings = calculateStandings(tournament);
          const pairings = generateSwissPairings({
            players: tournament.players,
            standings,
            completedRounds: tournament.rounds,
            rules: {
              maxVP: tournament.rules.maxVP,
              byePoints: tournament.rules.byePoints,
              winPoints: tournament.rules.winPoints,
            },
          });
          newRound = generatedPairingsToRound(pairings, nextRoundNumber, {
            maxVP: tournament.rules.maxVP,
            byePoints: tournament.rules.byePoints,
            winPoints: tournament.rules.winPoints,
            timerDuration: tournament.rules.defaultTimerMinutes,
          });
        } else {
          // Team format
          const teamStandings = calculateTeamStandings(tournament.teams ?? [], tournament.rounds);
          const teamPairings = generateTeamSwissPairings(tournament.teams ?? [], teamStandings, tournament.rounds);
          newRound = teamPairingsToRound(teamPairings, nextRoundNumber, tournament.rules.defaultTimerMinutes);
        }

        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: [...t.rounds, newRound],
              currentRound: nextRoundNumber,
              status: 'IN_PROGRESS' as TournamentStatus,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      startRound: (tournamentId, roundNumber) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r =>
                r.roundNumber === roundNumber
                  ? { ...r, status: 'IN_PROGRESS' as RoundStatus, startTime: new Date().toISOString() }
                  : r
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      completeRound: (tournamentId, roundNumber) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r =>
                r.roundNumber === roundNumber
                  ? { ...r, status: 'COMPLETED' as RoundStatus, endTime: new Date().toISOString() }
                  : r
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updatePairingScore: (tournamentId, roundNumber, pairingId, p1Score, p2Score) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            const { result, p1Battle, p2Battle } = determineResult(p1Score, p2Score);
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p => {
                    if (p.id !== pairingId || p.locked) return p;
                    return {
                      ...p,
                      player1Score: p1Score,
                      player2Score: p2Score,
                      result,
                      player1BattlePoints: p1Battle,
                      player2BattlePoints: p2Battle,
                    };
                  }),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      lockPairing: (tournamentId, roundNumber, pairingId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p =>
                    p.id === pairingId ? { ...p, locked: true } : p
                  ),
                };
              }),
              auditLog: addAuditEntry(t, 'LOCK_PAIRING', 'pairing', pairingId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      unlockPairing: (tournamentId, roundNumber, pairingId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p =>
                    p.id === pairingId ? { ...p, locked: false } : p
                  ),
                };
              }),
              auditLog: addAuditEntry(t, 'UNLOCK_PAIRING', 'pairing', pairingId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateSportsmanship: (tournamentId, roundNumber, pairingId, p1Sportsmanship, p2Sportsmanship) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p =>
                    p.id === pairingId
                      ? { ...p, player1Sportsmanship: p1Sportsmanship, player2Sportsmanship: p2Sportsmanship }
                      : p
                  ),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updateSubPairing: (tournamentId, roundNumber, pairingId, subPairingId, p1Score, p2Score) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            const subResult: SubPairing['result'] = p1Score > p2Score ? 'PLAYER1_WIN' : p2Score > p1Score ? 'PLAYER2_WIN' : 'DRAW';
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p => {
                    if (p.id !== pairingId) return p;
                    const updatedSubs: SubPairing[] = (p.subPairings ?? []).map(sp =>
                      sp.id === subPairingId ? { ...sp, player1Score: p1Score, player2Score: p2Score, result: subResult } : sp
                    );
                    // Recalculate team result
                    const teamResult = calculateTeamResult(updatedSubs);
                    return {
                      ...p,
                      subPairings: updatedSubs,
                      result: teamResult,
                      player1BattlePoints: teamResult === 'PLAYER1_WIN' ? 3 : teamResult === 'DRAW' ? 1 : 0,
                      player2BattlePoints: teamResult === 'PLAYER2_WIN' ? 3 : teamResult === 'DRAW' ? 1 : 0,
                    };
                  }),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addSubPairing: (tournamentId, roundNumber, pairingId, subPairingData) => {
        const subPairing: SubPairing = { ...subPairingData, id: generateId() };
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.roundNumber !== roundNumber) return r;
                return {
                  ...r,
                  pairings: r.pairings.map(p =>
                    p.id === pairingId
                      ? { ...p, subPairings: [...(p.subPairings ?? []), subPairing] }
                      : p
                  ),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      startTournament: (tournamentId) => {
        get().generateNextRound(tournamentId);
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? { ...t, status: 'IN_PROGRESS' as TournamentStatus, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      completeTournament: (tournamentId) => {
        const tournament = get().getTournament(tournamentId);
        if (!tournament) return;
        const checksum = generateChecksum(tournament);
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  status: 'COMPLETED' as TournamentStatus,
                  checksum,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      resetTournament: (tournamentId) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  status: 'DRAFT' as TournamentStatus,
                  currentRound: 0,
                  rounds: [],
                  players: t.players.map(p => ({ ...p, dropped: false })),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      checkInPlayer: (tournamentId, playerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.map(p =>
                    p.id === playerId ? { ...p, checkedIn: true } : p
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      resetCheckIns: (tournamentId) => {
        set(state => ({
          tournaments: state.tournaments.map(t =>
            t.id === tournamentId
              ? {
                  ...t,
                  players: t.players.map(p => ({ ...p, checkedIn: false })),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },
    }),
    {
      name: 'warhammer-tournaments',
      version: 1,
    }
  )
);

// Selector helpers
export const selectTournament = (id: string) => (state: { tournaments: Tournament[] }) =>
  state.tournaments.find(t => t.id === id);

export const selectActivePlayers = (tournament: Tournament) =>
  tournament.players.filter(p => !p.dropped);

export const selectCurrentRound = (tournament: Tournament) =>
  tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
