/**
 * src/store/useSettingsStore.ts
 * User preferences store. Persisted to localStorage.
 * Controls theme, language, sound, and default tournament rules.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  theme: 'dark',
  hapticFeedback: true,
  soundEnabled: true,
  defaultTimerMinutes: 150,
  defaultWinPoints: 3,
  defaultDrawPoints: 1,
  defaultLossPoints: 0,
  defaultMaxVP: 100,
  showConfirmDialogs: true,
  autoLockResults: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (data) => {
        set(state => ({
          settings: { ...state.settings, ...data },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'warhammer-settings',
      version: 1,
    }
  )
);
