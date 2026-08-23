/**
 * src/routes/TournamentCreate.tsx
 * Multi-step tournament creation wizard.
 * Steps: General Info → Rules → Players → Teams → Summary
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Plus, Trash2, Users, Shield, Sword } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { PlayerForm } from '../components/PlayerForm';
import type { Player, GameSystem, TournamentFormat, TeamSize, TiebreakerType, TournamentRules } from '../types';
import { generateId } from '../utils/id';
import { recommendedRounds } from '../engine/swiss';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormState {
  name: string;
  date: string;
  gameSystem: GameSystem;
  format: TournamentFormat;
  teamSize: TeamSize;
  pointsLimit: number;
  numberOfRounds: number;
  location: string;
  organizer: string;
  description: string;
  // Rules
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  byePoints: number;
  maxVP: number;
  usePaintingScore: boolean;
  useSportsmanshipScore: boolean;
  tiebreakerOrder: TiebreakerType[];
  defaultTimerMinutes: number;
  allowDrops: boolean;
}

const TIEBREAKERS: { value: TiebreakerType; label: string }[] = [
  { value: 'BUCHHOLZ', label: 'Buchholz' },
  { value: 'SOS', label: 'Force du calendrier (SOS)' },
  { value: 'VP_DIFF', label: 'Différentiel VP' },
  { value: 'VP_TOTAL', label: 'Total VP marqués' },
  { value: 'HEAD_TO_HEAD', label: 'Face à face' },
  { value: 'PAINTING', label: 'Score peinture' },
  { value: 'SPORTSMANSHIP', label: 'Fair-play' },
];

const STEPS = ['Général', 'Règles', 'Joueurs', 'Équipes', 'Récap'];

export function TournamentCreate() {
  const navigate = useNavigate();
  const { createTournament, addPlayer, addTeam, assignPlayerToTeam } = useTournamentStore();
  const { settings } = useSettingsStore();
  const [step, setStep] = useState<Step>(1);
  const [players, setPlayers] = useState<(Omit<Player, 'id' | 'dropped'> & { id: string })[]>([]);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string; playerIds: string[] }[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>({
    name: '',
    date: today,
    gameSystem: 'W40K',
    format: 'SOLO',
    teamSize: 4,
    pointsLimit: 2000,
    numberOfRounds: 5,
    location: '',
    organizer: '',
    description: '',
    winPoints: settings.defaultWinPoints,
    drawPoints: settings.defaultDrawPoints,
    lossPoints: settings.defaultLossPoints,
    byePoints: settings.defaultWinPoints,
    maxVP: settings.defaultMaxVP,
    usePaintingScore: false,
    useSportsmanshipScore: false,
    tiebreakerOrder: ['BUCHHOLZ', 'SOS', 'VP_DIFF', 'VP_TOTAL'],
    defaultTimerMinutes: settings.defaultTimerMinutes,
    allowDrops: true,
  });

  const recommendedRoundCount = recommendedRounds(players.length);

  const handleAddPlayer = (data: Omit<Player, 'id' | 'dropped'>) => {
    const id = generateId();
    setPlayers(prev => [...prev, { ...data, id }]);
    setShowPlayerForm(false);
    // Update recommended rounds
    const newCount = players.length + 1;
    setForm(f => ({ ...f, numberOfRounds: recommendedRounds(newCount) }));
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setTeams(prev => prev.map(t => ({ ...t, playerIds: t.playerIds.filter(pid => pid !== id) })));
  };

  const handleAddTeam = () => {
    const teamNumber = teams.length + 1;
    setTeams(prev => [...prev, { id: generateId(), name: `Équipe ${teamNumber}`, playerIds: [] }]);
  };

  const handleTeamNameChange = (teamId: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t));
  };

  const handleAssignPlayer = (playerId: string, teamId: string | '') => {
    setTeams(prev => prev.map(t => ({
      ...t,
      playerIds: teamId === t.id
        ? [...t.playerIds.filter(id => id !== playerId), playerId]
        : t.playerIds.filter(id => id !== playerId)
    })));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Le nom du tournoi est requis');
      return;
    }

    const rules: TournamentRules = {
      maxRounds: form.numberOfRounds,
      winPoints: form.winPoints,
      drawPoints: form.drawPoints,
      lossPoints: form.lossPoints,
      usePaintingScore: form.usePaintingScore,
      useSportsmanshipScore: form.useSportsmanshipScore,
      tiebreakerOrder: form.tiebreakerOrder,
      defaultTimerMinutes: form.defaultTimerMinutes,
      allowDrops: form.allowDrops,
      byePoints: form.byePoints,
      maxVP: form.maxVP,
    };

    const tournamentId = createTournament({
      name: form.name.trim(),
      date: form.date,
      gameSystem: form.gameSystem,
      format: form.format,
      teamSize: form.format === 'TEAM' ? form.teamSize : undefined,
      pointsLimit: form.pointsLimit,
      numberOfRounds: form.numberOfRounds,
      rules,
      location: form.location || undefined,
      organizer: form.organizer || undefined,
      description: form.description || undefined,
    });

    // Add players
    const playerIdMap = new Map<string, string>();
    players.forEach(p => {
      const { id: tempId, ...playerData } = p;
      const realId = addPlayer(tournamentId, playerData);
      playerIdMap.set(tempId, realId);
    });

    // Add teams with real player IDs
    if (form.format === 'TEAM') {
      teams.forEach(team => {
        const teamId = addTeam(tournamentId, { name: team.name, playerIds: [], captain: undefined });
        team.playerIds.forEach(tempPlayerId => {
          const realPlayerId = playerIdMap.get(tempPlayerId);
          if (realPlayerId) assignPlayerToTeam(tournamentId, realPlayerId, teamId);
        });
      });
    }

    toast.success('Tournoi créé !');
    navigate(`/tournament/${tournamentId}`);
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 3) return players.length >= 2;
    if (step === 4) return form.format !== 'TEAM' || teams.length >= 2;
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) {
      if (step === 1) toast.error('Nom du tournoi requis');
      if (step === 3) toast.error('Minimum 2 joueurs requis');
      return;
    }
    if (step === 3 && form.format !== 'TEAM') {
      setStep(5);
    } else {
      setStep(s => Math.min(s + 1, 5) as Step);
    }
  };

  const prevStep = () => {
    if (step === 5 && form.format !== 'TEAM') {
      setStep(3);
    } else {
      setStep(s => Math.max(s - 1, 1) as Step);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Nouveau tournoi</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            const isSkipped = form.format !== 'TEAM' && stepNum === 4;
            if (isSkipped) return null;
            return (
              <div key={label} className="flex items-center gap-1.5">
                {i > 0 && !isSkipped && <div className={`h-px w-4 ${isDone ? 'bg-amber-500' : 'bg-gray-700'}`} />}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  isActive ? 'bg-amber-700 text-white' :
                  isDone ? 'bg-amber-900/50 text-amber-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {isDone ? <Check size={10} /> : <span>{stepNum}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Step 1: General Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4">Informations générales</h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Nom du tournoi *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Grand Tournoi de Paris 2025"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-3 font-medium">Système de jeu</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, gameSystem: 'W40K' }))}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    form.gameSystem === 'W40K' ? 'border-red-600 bg-red-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Sword size={24} className={form.gameSystem === 'W40K' ? 'text-red-400' : 'text-gray-500'} />
                  <span className={`text-sm font-medium ${form.gameSystem === 'W40K' ? 'text-red-300' : 'text-gray-400'}`}>
                    Warhammer 40,000
                  </span>
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, gameSystem: 'AOS' }))}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    form.gameSystem === 'AOS' ? 'border-blue-600 bg-blue-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Shield size={24} className={form.gameSystem === 'AOS' ? 'text-blue-400' : 'text-gray-500'} />
                  <span className={`text-sm font-medium ${form.gameSystem === 'AOS' ? 'text-blue-300' : 'text-gray-400'}`}>
                    Age of Sigmar
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-3 font-medium">Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, format: 'SOLO' }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    form.format === 'SOLO' ? 'border-amber-600 bg-amber-900/20' : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <span className={`text-sm font-medium ${form.format === 'SOLO' ? 'text-amber-300' : 'text-gray-400'}`}>
                    🧍 Solo
                  </span>
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, format: 'TEAM' }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    form.format === 'TEAM' ? 'border-amber-600 bg-amber-900/20' : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <span className={`text-sm font-medium ${form.format === 'TEAM' ? 'text-amber-300' : 'text-gray-400'}`}>
                    👥 Équipes
                  </span>
                </button>
              </div>
            </div>

            {form.format === 'TEAM' && (
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-medium">Taille des équipes</label>
                <div className="flex gap-2">
                  {([4, 6, 8] as TeamSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setForm(f => ({ ...f, teamSize: size }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.teamSize === size ? 'border-amber-600 bg-amber-900/20 text-amber-300' : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {size}v{size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Limite de points (pts)</label>
              <input
                type="number"
                value={form.pointsLimit}
                onChange={e => setForm(f => ({ ...f, pointsLimit: parseInt(e.target.value) || 2000 }))}
                min={500}
                step={250}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Paris, France"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Organisateur</label>
                <input
                  type="text"
                  value={form.organizer}
                  onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                  placeholder="GW Store"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Rules */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white">Règles du tournoi</h2>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Points de match</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-emerald-400 block mb-1">Victoire</span>
                  <input type="number" min={0} max={10} value={form.winPoints}
                    onChange={e => setForm(f => ({ ...f, winPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <span className="text-xs text-amber-400 block mb-1">Égalité</span>
                  <input type="number" min={0} max={10} value={form.drawPoints}
                    onChange={e => setForm(f => ({ ...f, drawPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <span className="text-xs text-red-400 block mb-1">Défaite</span>
                  <input type="number" min={0} max={10} value={form.lossPoints}
                    onChange={e => setForm(f => ({ ...f, lossPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">VP max théoriques</label>
                <input type="number" min={10} max={500} value={form.maxVP}
                  onChange={e => setForm(f => ({ ...f, maxVP: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Chrono (minutes)</label>
                <input type="number" min={30} max={300} value={form.defaultTimerMinutes}
                  onChange={e => setForm(f => ({ ...f, defaultTimerMinutes: parseInt(e.target.value) || 150 }))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Nombre de rondes</label>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={10} value={form.numberOfRounds}
                  onChange={e => setForm(f => ({ ...f, numberOfRounds: parseInt(e.target.value) || 1 }))}
                  className="w-24 text-center py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:border-amber-500 focus:outline-none" />
                <span className="text-xs text-gray-500">
                  Recommandé : <button onClick={() => setForm(f => ({ ...f, numberOfRounds: recommendedRoundCount }))}
                    className="text-amber-400 hover:underline">{recommendedRoundCount} rondes</button> pour {players.length} joueurs
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-gray-400 font-medium">Options scoring</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.usePaintingScore}
                  onChange={e => setForm(f => ({ ...f, usePaintingScore: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600" />
                <span className="text-sm text-gray-300">Activer le score peinture</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.useSportsmanshipScore}
                  onChange={e => setForm(f => ({ ...f, useSportsmanshipScore: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600" />
                <span className="text-sm text-gray-300">Activer le score fair-play</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.allowDrops}
                  onChange={e => setForm(f => ({ ...f, allowDrops: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600" />
                <span className="text-sm text-gray-300">Autoriser les abandons (drops)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Ordre des départages</label>
              <div className="space-y-1.5">
                {form.tiebreakerOrder.map((tb, i) => (
                  <div key={tb} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-xs text-amber-400 font-bold w-5">{i + 1}.</span>
                    <span className="text-sm text-gray-300 flex-1">{TIEBREAKERS.find(t => t.value === tb)?.label}</span>
                    <button
                      onClick={() => {
                        if (i > 0) {
                          const arr = [...form.tiebreakerOrder];
                          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                          setForm(f => ({ ...f, tiebreakerOrder: arr }));
                        }
                      }}
                      className="text-gray-500 hover:text-gray-300 text-xs"
                    >↑</button>
                    <button
                      onClick={() => {
                        if (i < form.tiebreakerOrder.length - 1) {
                          const arr = [...form.tiebreakerOrder];
                          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                          setForm(f => ({ ...f, tiebreakerOrder: arr }));
                        }
                      }}
                      className="text-gray-500 hover:text-gray-300 text-xs"
                    >↓</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Players */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Joueurs ({players.length})</h2>
              <button
                onClick={() => setShowPlayerForm(true)}
                className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300"
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>

            {players.length > 0 && (
              <p className="text-xs text-gray-500">
                Rondes recommandées : <span className="text-amber-400 font-medium">{recommendedRoundCount}</span>
              </p>
            )}

            {showPlayerForm && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-4">Nouveau joueur</h3>
                <PlayerForm
                  gameSystem={form.gameSystem}
                  onSubmit={handleAddPlayer}
                  onCancel={() => setShowPlayerForm(false)}
                />
              </div>
            )}

            <div className="space-y-2">
              {players.map((player, i) => (
                <div key={player.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2.5">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {player.firstName} {player.lastName}
                      {player.nickname && <span className="text-gray-500 ml-1">"{player.nickname}"</span>}
                    </div>
                    <div className="text-xs text-gray-500">{player.faction}</div>
                  </div>
                  <button onClick={() => handleRemovePlayer(player.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {players.length === 0 && !showPlayerForm && (
              <button
                onClick={() => setShowPlayerForm(true)}
                className="w-full py-8 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center gap-2 text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors"
              >
                <Users size={24} />
                <span className="text-sm">Ajouter des joueurs</span>
              </button>
            )}
          </div>
        )}

        {/* Step 4: Teams */}
        {step === 4 && form.format === 'TEAM' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Équipes ({teams.length})</h2>
              <button onClick={handleAddTeam} className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300">
                <Plus size={14} />
                Ajouter équipe
              </button>
            </div>

            {teams.map(team => (
              <div key={team.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <input
                  type="text"
                  value={team.name}
                  onChange={e => handleTeamNameChange(team.id, e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-white mb-3 border-b border-gray-700 pb-2 focus:outline-none focus:border-amber-500"
                />
                <div className="space-y-2">
                  {players.map(player => {
                    const currentTeam = teams.find(t => t.playerIds.includes(player.id));
                    const isInThisTeam = currentTeam?.id === team.id;
                    return (
                      <label key={player.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInThisTeam}
                          onChange={e => handleAssignPlayer(player.id, e.target.checked ? team.id : '')}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800"
                        />
                        <span className="text-sm text-gray-300">{player.firstName} {player.lastName}</span>
                        <span className="text-xs text-gray-500">{player.faction}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {teams.length === 0 && (
              <button onClick={handleAddTeam} className="w-full py-8 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center gap-2 text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors">
                <Users size={24} />
                <span className="text-sm">Créer les équipes</span>
              </button>
            )}
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Récapitulatif</h2>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nom</span>
                <span className="text-white font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date</span>
                <span className="text-white">{form.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Système</span>
                <span className="text-white">{form.gameSystem === 'W40K' ? 'Warhammer 40,000' : 'Age of Sigmar'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Format</span>
                <span className="text-white">{form.format === 'SOLO' ? 'Solo' : `Équipes ${form.teamSize}v${form.teamSize}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Joueurs</span>
                <span className="text-white">{players.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rondes</span>
                <span className="text-white">{form.numberOfRounds}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Points</span>
                <span className="text-white">{form.pointsLimit} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Victoire / Égalité / Défaite</span>
                <span className="text-white">{form.winPoints} / {form.drawPoints} / {form.lossPoints}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Créer le tournoi
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-4 py-3 flex gap-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-gray-300 transition-colors"
        >
          <ChevronLeft size={16} />
          Retour
        </button>
        <div className="flex-1" />
        {step < 5 && (
          <button
            onClick={nextStep}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-sm text-white font-medium transition-colors"
          >
            Suivant
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
