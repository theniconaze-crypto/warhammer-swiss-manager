/**
 * src/routes/TournamentDetail.tsx
 * Main tournament view with tabbed interface.
 * Tabs: Rounds, Standings, Players, Settings
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Play, Trophy, Users, Settings, ListOrdered,
  AlertCircle, UserX, UserCheck, Plus, Presentation, Sword, Shield
} from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { useStandings } from '../hooks/useStandings';
import { StandingsTable } from '../components/StandingsTable';
import { ExportButton } from '../components/ExportButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlayerForm } from '../components/PlayerForm';
import { canGenerateNextRound, getAllRoundsComplete } from '../hooks/usePairings';
import type { Player } from '../types';
import { getFactionName } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Tab = 'rounds' | 'standings' | 'players' | 'settings';

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTournament, generateNextRound, completeRound, completeTournament, dropPlayer, undropPlayer, addPlayer, removePlayer, updateTournament } = useTournamentStore();
  const tournament = getTournament(id!);
  const standings = useStandings(tournament);
  const [tab, setTab] = useState<Tab>('rounds');
  const [dropConfirmId, setDropConfirmId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesTimerMinutes, setRulesTimerMinutes] = useState(tournament?.rules.defaultTimerMinutes ?? 150);
  const [rulesMaxVP, setRulesMaxVP] = useState(tournament?.rules.maxVP ?? 100);

  if (!tournament) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-400">Tournoi introuvable</p>
        <button onClick={() => navigate('/')} className="text-amber-400 hover:underline">Retour</button>
      </div>
    );
  }

  const formattedDate = (() => {
    try { return format(new Date(tournament.date), 'd MMMM yyyy', { locale: fr }); }
    catch { return tournament.date; }
  })();

  const canGenerate = canGenerateNextRound(tournament);
  const allDone = tournament.currentRound > 0 ? getAllRoundsComplete(tournament) : false;
  const isLastRound = tournament.currentRound >= tournament.numberOfRounds;

  const handleGenerateRound = () => {
    generateNextRound(tournament.id);
    toast.success(`Ronde ${tournament.currentRound + 1} générée !`);
  };

  const handleCompleteRound = () => {
    completeRound(tournament.id, tournament.currentRound);
    toast.success('Ronde terminée !');
  };

  const handleAddPlayer = (data: Omit<Player, 'id' | 'dropped'>) => {
    addPlayer(tournament.id, data);
    setShowPlayerForm(false);
    toast.success(`${data.firstName} ${data.lastName} ajouté`);
  };

  const handleSaveRules = () => {
    updateTournament(tournament.id, {
      rules: { ...tournament.rules, defaultTimerMinutes: rulesTimerMinutes, maxVP: rulesMaxVP }
    });
    setEditingRules(false);
    toast.success('Paramètres mis à jour');
  };

  const systemColor = tournament.gameSystem === 'W40K' ? 'from-red-900 to-red-950' : 'from-blue-900 to-blue-950';
  const SystemIcon = tournament.gameSystem === 'W40K' ? Sword : Shield;

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-b ${systemColor} px-4 pt-12 pb-0 sticky top-0 z-10`}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="text-gray-300/70 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{tournament.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-300/70">
              <SystemIcon size={10} />
              <span>{tournament.gameSystem === 'W40K' ? '40K' : 'AoS'}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span>Ronde {tournament.currentRound}/{tournament.numberOfRounds}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ExportButton tournament={tournament} standings={standings} />
            <button
              onClick={() => navigate(`/tournament/${id}/presentation`)}
              className="p-2 text-gray-400 hover:text-white"
              title="Mode présentation"
            >
              <Presentation size={16} />
            </button>
          </div>
        </div>

        {/* Action button */}
        <div className="pb-3">
          {tournament.status === 'DRAFT' && (
            <button
              onClick={handleGenerateRound}
              disabled={tournament.players.filter(p => !p.dropped).length < 2}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Générer la Ronde 1
            </button>
          )}
          {tournament.status === 'IN_PROGRESS' && !isLastRound && allDone && (
            <button
              onClick={handleGenerateRound}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Générer Ronde {tournament.currentRound + 1}
            </button>
          )}
          {tournament.status === 'IN_PROGRESS' && isLastRound && allDone && (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trophy size={16} />
              Clôturer le tournoi
            </button>
          )}
          {tournament.status === 'IN_PROGRESS' && !allDone && tournament.currentRound > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-900/20 rounded-xl px-4 py-2.5">
              <AlertCircle size={14} />
              <span>Résultats en attente — Ronde {tournament.currentRound}</span>
            </div>
          )}
          {tournament.status === 'COMPLETED' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-900/20 rounded-xl px-4 py-2.5">
              <Trophy size={14} />
              <span>Tournoi terminé</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {([
            { id: 'rounds', icon: ListOrdered, label: 'Rondes' },
            { id: 'standings', icon: Trophy, label: 'Classement' },
            { id: 'players', icon: Users, label: 'Joueurs' },
            { id: 'settings', icon: Settings, label: 'Config' },
          ] as const).map(({ id: tabId, icon: Icon, label }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                tab === tabId ? 'text-white border-b-2 border-amber-400' : 'text-gray-400/70 hover:text-white/70'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* ROUNDS TAB */}
        {tab === 'rounds' && (
          <div className="space-y-3">
            {tournament.rounds.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                <ListOrdered size={32} className="text-gray-600" />
                <p className="text-sm">Aucune ronde générée</p>
                <p className="text-xs text-gray-600">Ajoutez des joueurs et lancez la première ronde</p>
              </div>
            ) : (
              tournament.rounds.map(round => {
                const lockedCount = round.pairings.filter(p => p.locked || p.player2Id === 'BYE').length;
                const totalCount = round.pairings.length;
                const pct = totalCount > 0 ? (lockedCount / totalCount) * 100 : 0;
                const isCurrent = round.roundNumber === tournament.currentRound;

                return (
                  <button
                    key={round.id}
                    onClick={() => navigate(`/tournament/${id}/round/${round.roundNumber}`)}
                    className={`w-full bg-gray-900 border rounded-xl p-4 text-left transition-all active:scale-[0.98] ${
                      isCurrent ? 'border-amber-700/50' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Ronde {round.roundNumber}</span>
                        {isCurrent && (
                          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
                            En cours
                          </span>
                        )}
                        {round.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            Terminée
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{lockedCount}/{totalCount} résultats</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{round.pairings.length} tables</span>
                      <ChevronLeft size={14} className="text-gray-600 rotate-180" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* STANDINGS TAB */}
        {tab === 'standings' && (
          <div>
            {standings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
                <Trophy size={32} className="text-gray-600" />
                <p className="text-sm">Pas encore de classement</p>
              </div>
            ) : (
              <StandingsTable standings={standings} tournament={tournament} compact />
            )}
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{tournament.players.length} joueur{tournament.players.length > 1 ? 's' : ''}</span>
              {tournament.status === 'DRAFT' && (
                <button
                  onClick={() => setShowPlayerForm(true)}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                >
                  <Plus size={12} />
                  Ajouter
                </button>
              )}
            </div>

            {showPlayerForm && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <PlayerForm
                  gameSystem={tournament.gameSystem}
                  onSubmit={handleAddPlayer}
                  onCancel={() => setShowPlayerForm(false)}
                />
              </div>
            )}

            {tournament.players.map(player => (
              <div
                key={player.id}
                className={`bg-gray-900 border rounded-xl p-3 flex items-center gap-3 ${player.dropped ? 'border-red-900/50 opacity-60' : 'border-gray-800'}`}
              >
                <button
                  onClick={() => navigate(`/tournament/${id}/player/${player.id}`)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-400">
                      {player.firstName[0]}{player.lastName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {player.firstName} {player.lastName}
                      {player.dropped && <span className="text-xs text-red-400 ml-1">ABANDON</span>}
                    </div>
                    <div className="text-xs text-gray-500">{getFactionName(player.faction, tournament.gameSystem)}</div>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  {tournament.rules.allowDrops && (
                    <button
                      onClick={() => player.dropped ? undropPlayer(tournament.id, player.id) : setDropConfirmId(player.id)}
                      className={`p-1.5 rounded-lg transition-colors ${player.dropped ? 'text-emerald-400 hover:bg-emerald-900/20' : 'text-gray-500 hover:text-amber-400'}`}
                      title={player.dropped ? 'Réintégrer' : 'Abandon'}
                    >
                      {player.dropped ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                  )}
                  {tournament.status === 'DRAFT' && (
                    <button
                      onClick={() => setRemoveConfirmId(player.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <UserX size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Paramètres du tournoi</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Durée des rondes (min)</label>
                <input
                  type="number"
                  value={rulesTimerMinutes}
                  onChange={e => setRulesTimerMinutes(parseInt(e.target.value) || 150)}
                  min={30} max={300}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">VP Maximum théoriques</label>
                <input
                  type="number"
                  value={rulesMaxVP}
                  onChange={e => setRulesMaxVP(parseInt(e.target.value) || 100)}
                  min={10} max={500}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSaveRules}
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Enregistrer
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-medium text-gray-400 mb-3">Points de match</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Victoire</span>
                <span className="text-emerald-400 font-bold">{tournament.rules.winPoints} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Égalité</span>
                <span className="text-amber-400 font-bold">{tournament.rules.drawPoints} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Défaite</span>
                <span className="text-red-400 font-bold">{tournament.rules.lossPoints} pts</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={dropConfirmId !== null}
        onClose={() => setDropConfirmId(null)}
        onConfirm={() => { if (dropConfirmId) dropPlayer(tournament.id, dropConfirmId); }}
        title="Abandon du joueur"
        message="Le joueur sera retiré des futurs appariements mais restera dans le classement."
        confirmLabel="Confirmer l'abandon"
        variant="warning"
      />
      <ConfirmDialog
        isOpen={removeConfirmId !== null}
        onClose={() => setRemoveConfirmId(null)}
        onConfirm={() => { if (removeConfirmId) removePlayer(tournament.id, removeConfirmId); }}
        title="Supprimer le joueur"
        message="Le joueur sera définitivement retiré du tournoi."
        confirmLabel="Supprimer"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={() => completeTournament(tournament.id)}
        title="Clôturer le tournoi"
        message="Cette action est définitive. Le classement sera figé et un hash de vérification sera généré."
        confirmLabel="Clôturer"
        variant="warning"
      />
    </div>
  );
}
