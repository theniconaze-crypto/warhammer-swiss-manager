/**
 * src/utils/validators.ts
 * Validation functions for tournament data integrity and user input.
 */

import type { Tournament, Player, Pairing } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTournament(tournament: Partial<Tournament>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tournament.name?.trim()) {
    errors.push('Le nom du tournoi est requis');
  }
  if (!tournament.date) {
    errors.push('La date du tournoi est requise');
  }
  if (!tournament.gameSystem) {
    errors.push('Le système de jeu est requis');
  }
  if (!tournament.pointsLimit || tournament.pointsLimit < 500) {
    errors.push('La limite de points doit être supérieure à 500');
  }
  if (!tournament.numberOfRounds || tournament.numberOfRounds < 1) {
    errors.push('Le nombre de rondes doit être supérieur à 0');
  }
  if (tournament.numberOfRounds && tournament.numberOfRounds > 10) {
    warnings.push('Un grand nombre de rondes peut allonger le tournoi considérablement');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePlayer(player: Partial<Player>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!player.firstName?.trim()) {
    errors.push('Le prénom est requis');
  }
  if (!player.lastName?.trim()) {
    errors.push('Le nom de famille est requis');
  }
  if (!player.faction?.trim()) {
    errors.push('La faction est requise');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateScore(score: number, maxVP: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (score < 0) {
    errors.push('Le score ne peut pas être négatif');
  }
  if (score > maxVP) {
    warnings.push(`Le score (${score}) dépasse le maximum théorique (${maxVP})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePairing(pairing: Pairing, maxVP: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pairing.player2Id === 'BYE') {
    return { valid: true, errors: [], warnings: [] };
  }

  const p1Score = pairing.player1Score ?? 0;
  const p2Score = pairing.player2Score ?? 0;

  if (p1Score < 0 || p2Score < 0) {
    errors.push('Les scores ne peuvent pas être négatifs');
  }
  if (p1Score > maxVP) {
    warnings.push(`Score J1 (${p1Score}) dépasse le maximum théorique (${maxVP})`);
  }
  if (p2Score > maxVP) {
    warnings.push(`Score J2 (${p2Score}) dépasse le maximum théorique (${maxVP})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function canStartNextRound(tournament: Tournament): { canStart: boolean; reason?: string } {
  const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);

  if (!currentRound) {
    if (tournament.currentRound === 0) {
      if (tournament.players.filter(p => !p.dropped).length < 2) {
        return { canStart: false, reason: 'Il faut au moins 2 joueurs actifs' };
      }
      return { canStart: true };
    }
    return { canStart: false, reason: 'Ronde introuvable' };
  }

  if (currentRound.status !== 'COMPLETED') {
    const pendingPairings = currentRound.pairings.filter(p => !p.locked && p.player2Id !== 'BYE');
    if (pendingPairings.length > 0) {
      return {
        canStart: false,
        reason: `${pendingPairings.length} résultat(s) en attente de verrouillage`
      };
    }
  }

  return { canStart: true };
}

export function recommendedRounds(playerCount: number): number {
  if (playerCount <= 1) return 1;
  return Math.ceil(Math.log2(playerCount));
}
