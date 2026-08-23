/**
 * src/components/ExportButton.tsx
 * Export dropdown for tournament data (JSON, CSV standings, CSV pairings).
 */

import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, Share2 } from 'lucide-react';
import type { Tournament, StandingEntry } from '../types';
import { exportTournamentJSON, exportStandingsCSV, shareText } from '../utils/export';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  tournament: Tournament;
  standings?: StandingEntry[];
}

export function ExportButton({ tournament, standings }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExportJSON = () => {
    exportTournamentJSON(tournament);
    setOpen(false);
    toast.success('Export JSON téléchargé');
  };

  const handleExportCSV = () => {
    if (standings) {
      exportStandingsCSV(standings, tournament);
      toast.success('Classement CSV téléchargé');
    }
    setOpen(false);
  };

  const handleShare = async () => {
    if (!standings) return;
    const top5 = standings.slice(0, 5).map((s, i) => {
      const player = tournament.players.find(p => p.id === s.playerId);
      return `${i + 1}. ${player?.firstName} ${player?.lastName} — ${s.matchPoints} pts`;
    }).join('\n');
    const text = `🏆 ${tournament.name}\n📅 ${tournament.date}\n\nTop 5 :\n${top5}`;
    try {
      await shareText(text);
      toast.success('Résultats copiés / partagés');
    } catch {
      toast.error('Impossible de partager');
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
      >
        <Download size={14} />
        <span>Exporter</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <FileJson size={14} className="text-amber-400" />
            Backup JSON
          </button>
          {standings && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <FileText size={14} className="text-emerald-400" />
              Classement CSV
            </button>
          )}
          {standings && (
            <button
              onClick={handleShare}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Share2 size={14} className="text-blue-400" />
              Partager Top 5
            </button>
          )}
        </div>
      )}
    </div>
  );
}
