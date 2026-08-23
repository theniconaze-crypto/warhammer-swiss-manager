/**
 * src/routes/SettingsPage.tsx
 * App settings page: theme, language, default rules, and data management.
 */

import { useSettingsStore } from '../store/useSettingsStore';
import { useTournamentStore } from '../store/useTournamentStore';
import { Settings, Moon, Globe, Database, Trash2, Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { importTournamentJSON } from '../utils/export';
import toast from 'react-hot-toast';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { tournaments, createTournament } = useTournamentStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const tournament = await importTournamentJSON(file);
        createTournament({
          name: tournament.name,
          date: tournament.date,
          gameSystem: tournament.gameSystem,
          format: tournament.format,
          teamSize: tournament.teamSize,
          pointsLimit: tournament.pointsLimit,
          numberOfRounds: tournament.numberOfRounds,
          rules: tournament.rules,
          players: tournament.players,
          teams: tournament.teams,
          rounds: tournament.rounds,
        });
        toast.success('Tournoi importé avec succès');
      } catch {
        toast.error('Erreur lors de l\'import');
      }
    };
    input.click();
  };

  const handleExportAll = () => {
    const data = JSON.stringify(tournaments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warhammer-tournaments-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exporté');
  };

  const handleClearAll = () => {
    localStorage.removeItem('warhammer-tournaments');
    window.location.reload();
  };

  function ToggleRow({ label, description, settingKey }: {
    label: string;
    description?: string;
    settingKey: keyof AppSettings;
  }) {
    const value = settings[settingKey] as boolean;
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
        <div>
          <div className="text-sm text-white">{label}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
        <button
          onClick={() => updateSettings({ [settingKey]: !value })}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-amber-600' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-amber-400" />
          <h1 className="text-lg font-bold text-white">Paramètres</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Appearance */}
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Moon size={12} />
            Apparence
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4">
            <div className="py-3 border-b border-gray-800">
              <div className="text-sm text-white mb-2">Thème</div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'dark', label: '⚔️ Dark (défaut)' },
                  { value: 'imperium', label: '🔴 Imperium' },
                  { value: 'sigmar', label: '🔵 Sigmar' },
                  { value: 'warhammer', label: '🟡 Warhammer' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ theme: value })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      settings.theme === value
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="Retour haptique"
              description="Vibrations sur les actions importantes"
              settingKey="hapticFeedback"
            />
            <ToggleRow
              label="Sons"
              description="Alertes sonores pour le chronomètre"
              settingKey="soundEnabled"
            />
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe size={12} />
            Langue
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ language: 'fr' })}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${settings.language === 'fr' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                🇫🇷 Français
              </button>
              <button
                onClick={() => updateSettings({ language: 'en' })}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${settings.language === 'en' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        </section>

        {/* Default values */}
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Settings size={12} />
            Valeurs par défaut
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-300">Chrono (min)</span>
              <input
                type="number"
                value={settings.defaultTimerMinutes}
                onChange={e => updateSettings({ defaultTimerMinutes: parseInt(e.target.value) || 150 })}
                min={30} max={300}
                className="w-20 text-center py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-300">VP maximum</span>
              <input
                type="number"
                value={settings.defaultMaxVP}
                onChange={e => updateSettings({ defaultMaxVP: parseInt(e.target.value) || 100 })}
                min={10} max={500}
                className="w-20 text-center py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Data management */}
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database size={12} />
            Données
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="text-sm text-gray-400">
                {tournaments.length} tournoi{tournaments.length > 1 ? 's' : ''} • {
                  Math.round(JSON.stringify(tournaments).length / 1024)
                } Ko
              </div>
            </div>
            <button
              onClick={handleImport}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <Upload size={14} className="text-blue-400" />
              Importer un tournoi (JSON)
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <Download size={14} className="text-emerald-400" />
              Exporter toutes les données
            </button>
            <button
              onClick={resetSettings}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-amber-400 hover:bg-amber-900/10 transition-colors border-b border-gray-800"
            >
              <Settings size={14} />
              Réinitialiser les paramètres
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-900/10 transition-colors"
            >
              <Trash2 size={14} />
              Effacer toutes les données
            </button>
          </div>
        </section>

        {/* About */}
        <section className="pb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-amber-400 text-lg font-bold mb-1">⚔️ WarTournoi</div>
            <div className="text-xs text-gray-500">Version 1.0.0 • PWA • Hors-ligne</div>
            <div className="text-xs text-gray-600 mt-1">
              Gestion de tournois Warhammer 40K & Age of Sigmar
            </div>
            <div className="text-xs text-gray-700 mt-2">
              Fan project • Non affilié à Games Workshop
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Effacer toutes les données"
        message="Tous vos tournois seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Tout effacer"
        variant="danger"
      />
    </div>
  );
}
