/**
 * src/utils/export.ts
 * Export utilities for tournament data: JSON, CSV, and clipboard sharing.
 * Handles serialization and file download triggers.
 */

import type { Tournament, StandingEntry } from '../types';
import { getFactionName } from '../types';

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTournamentJSON(tournament: Tournament): void {
  const json = JSON.stringify(tournament, null, 2);
  const filename = `${tournament.name.replace(/\s+/g, '_')}_${tournament.date}.json`;
  downloadFile(json, filename, 'application/json');
}

export function importTournamentJSON(file: File): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Tournament;
        resolve(data);
      } catch {
        reject(new Error('Fichier JSON invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
}

export function exportStandingsCSV(
  standings: StandingEntry[],
  tournament: Tournament
): void {
  const headers = ['Rang', 'Joueur', 'Faction', 'V', 'N', 'D', 'Pts', 'VP+', 'VP-', 'Diff', 'Buchholz', 'SOS'];
  const rows = standings.map((s) => {
    const player = tournament.players.find(p => p.id === s.playerId);
    if (!player) return [];
    return [
      s.rank,
      `${player.firstName} ${player.lastName}${player.nickname ? ` (${player.nickname})` : ''}`,
      getFactionName(player.faction, tournament.gameSystem),
      s.wins,
      s.draws,
      s.losses,
      s.matchPoints,
      s.vpScored,
      s.vpConceded,
      s.vpDiff,
      s.buchholz.toFixed(2),
      s.sos.toFixed(4),
    ];
  });

  const csvContent = [
    `# ${tournament.name} - ${tournament.date}`,
    `# ${tournament.gameSystem} - Ronde ${tournament.currentRound}/${tournament.numberOfRounds}`,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const filename = `${tournament.name.replace(/\s+/g, '_')}_standings.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportPairingsCSV(tournament: Tournament, roundNumber: number): void {
  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return;

  const headers = ['Table', 'Joueur 1', 'Faction 1', 'VP 1', 'VP 2', 'Faction 2', 'Joueur 2', 'Résultat'];
  const rows = round.pairings.map((p) => {
    const p1 = tournament.players.find(pl => pl.id === p.player1Id);
    const p2 = p.player2Id === 'BYE' ? null : tournament.players.find(pl => pl.id === p.player2Id);
    return [
      p.table,
      p1 ? `${p1.firstName} ${p1.lastName}` : '?',
      p1 ? getFactionName(p1.faction, tournament.gameSystem) : '?',
      p.player1Score ?? '',
      p.player2Score ?? '',
      p2 ? getFactionName(p2.faction, tournament.gameSystem) : 'BYE',
      p2 ? `${p2.firstName} ${p2.lastName}` : 'BYE',
      p.result ?? 'En attente',
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const filename = `${tournament.name.replace(/\s+/g, '_')}_ronde${roundNumber}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function generateChecksum(tournament: Tournament): string {
  const data = JSON.stringify({
    id: tournament.id,
    standings: tournament.rounds.map(r => r.pairings.map(p => ({
      p1: p.player1Id, p2: p.player2Id, r: p.result, s1: p.player1Score, s2: p.player2Score
    })))
  });
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

export function shareText(text: string): Promise<void> {
  if (navigator.share) {
    return navigator.share({ text });
  }
  return navigator.clipboard.writeText(text);
}
