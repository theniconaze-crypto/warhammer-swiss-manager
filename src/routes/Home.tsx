/**
 * src/routes/Home.tsx
 * Tournament library - main landing page.
 * Lists all tournaments with search, filter, and create functionality.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trophy, Swords } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { TournamentCard } from '../components/TournamentCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { TournamentStatus, GameSystem } from '../types';
import toast from 'react-hot-toast';

export function Home() {
  const navigate = useNavigate();
  const { tournaments, deleteTournament, duplicateTournament } = useTournamentStore();
  const [search, setSearch] = useState('');
  const [filterSystem, setFilterSystem] = useState<GameSystem | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TournamentStatus | 'ALL'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tournaments.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.organizer?.toLowerCase().includes(search.toLowerCase());
      const matchSystem = filterSystem === 'ALL' || t.gameSystem === filterSystem;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchSearch && matchSystem && matchStatus;
    });
  }, [tournaments, search, filterSystem, filterStatus]);

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (deleteId) {
      deleteTournament(deleteId);
      toast.success('Tournoi supprimé');
    }
  };

  const handleDuplicate = (id: string) => {
    const newId = duplicateTournament(id);
    if (newId) {
      toast.success('Tournoi dupliqué');
      navigate(`/tournament/${newId}`);
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-14 pb-4 sticky top-0 z-10 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white">Tournois</h1>
          </div>
          <button
            onClick={() => navigate('/tournament/new')}
            className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors active:scale-95"
          >
            <Plus size={16} />
            Nouveau
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un tournoi..."
            className="w-full pl-8 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
            <Filter size={12} />
          </div>
          {(['ALL', 'W40K', 'AOS'] as const).map(sys => (
            <button
              key={sys}
              onClick={() => setFilterSystem(sys)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterSystem === sys
                  ? sys === 'W40K' ? 'bg-red-900 text-red-300' : sys === 'AOS' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {sys === 'ALL' ? 'Tous' : sys === 'W40K' ? 'Warhammer 40K' : 'Age of Sigmar'}
            </button>
          ))}
          <div className="w-px bg-gray-700 shrink-0" />
          {(['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status === 'ALL' ? 'Tous' : status === 'DRAFT' ? 'Brouillon' : status === 'IN_PROGRESS' ? 'En cours' : 'Terminé'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
              <Swords size={32} className="text-gray-600" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-gray-400">
                {tournaments.length === 0 ? 'Aucun tournoi' : 'Aucun résultat'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {tournaments.length === 0
                  ? 'Créez votre premier tournoi pour commencer'
                  : 'Modifiez vos filtres de recherche'}
              </p>
            </div>
            {tournaments.length === 0 && (
              <button
                onClick={() => navigate('/tournament/new')}
                className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                <Plus size={16} />
                Créer un tournoi
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              {filtered.length} tournoi{filtered.length > 1 ? 's' : ''}
            </p>
            {filtered.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/tournament/new')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-amber-700 hover:bg-amber-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 z-30"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={24} />
      </button>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Supprimer le tournoi"
        message="Cette action est irréversible. Toutes les données du tournoi seront perdues."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
