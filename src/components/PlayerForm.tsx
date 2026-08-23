/**
 * src/components/PlayerForm.tsx
 * Form for adding or editing a player in a tournament.
 * Includes faction dropdown with subfaction support.
 */

import { useState } from 'react';
import type { Player, GameSystem } from '../types';
import { getFactionsForSystem } from '../types';
import { User, Shield, ChevronDown } from 'lucide-react';

interface PlayerFormProps {
  gameSystem: GameSystem;
  initialData?: Partial<Player>;
  onSubmit: (data: Omit<Player, 'id' | 'dropped'>) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PlayerForm({ gameSystem, initialData, onSubmit, onCancel, submitLabel = 'Ajouter' }: PlayerFormProps) {
  const factions = getFactionsForSystem(gameSystem);
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [nickname, setNickname] = useState(initialData?.nickname ?? '');
  const [faction, setFaction] = useState(initialData?.faction ?? '');
  const [subfaction, setSubfaction] = useState(initialData?.subfaction ?? '');
  const [painting, setPainting] = useState(initialData?.painting?.toString() ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const selectedFaction = factions.find(f => f.id === faction);
  const subfactions = selectedFaction?.subfactions ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !faction) return;

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || undefined,
      faction,
      subfaction: subfaction || undefined,
      painting: painting ? parseInt(painting) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Prénom *</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              placeholder="Jean"
              className="w-full pl-8 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Nom *</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            placeholder="Dupont"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Pseudo (optionnel)</label>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="GrimDarkLord"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Faction *</label>
        <div className="relative">
          <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={faction}
            onChange={e => { setFaction(e.target.value); setSubfaction(''); }}
            required
            className="w-full pl-8 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
          >
            <option value="">Choisir une faction...</option>
            {factions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {subfactions.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Sous-faction</label>
          <div className="relative">
            <select
              value={subfaction}
              onChange={e => setSubfaction(e.target.value)}
              className="w-full px-3 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
            >
              <option value="">Aucune</option>
              {subfactions.map(sf => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Score peinture (0-20)</label>
        <input
          type="number"
          min={0}
          max={20}
          value={painting}
          onChange={e => setPainting(e.target.value)}
          placeholder="—"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Informations complémentaires..."
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={!firstName || !lastName || !faction}
          className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-sm text-white font-medium transition-colors disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
