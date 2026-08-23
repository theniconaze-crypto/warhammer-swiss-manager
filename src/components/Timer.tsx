/**
 * src/components/Timer.tsx
 * Round countdown timer with visual progress ring.
 * Supports haptic feedback and warning notifications.
 */

import { useTimer } from '../hooks/useTimer';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

interface TimerProps {
  durationMinutes: number;
  onComplete?: () => void;
}

export function Timer({ durationMinutes, onComplete }: TimerProps) {
  const { formattedTime, isRunning, isCompleted, progress, start, pause, reset } = useTimer({
    durationMinutes,
    onComplete,
    warningMinutes: [15, 5],
    onWarning: (minutes) => {
      toast(`⏰ ${minutes} minutes restantes !`, {
        style: { background: '#1f2937', color: '#fbbf24' },
        duration: 4000,
      });
    },
  });

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const timerColor = isCompleted
    ? 'text-red-400'
    : progress < 0.1
    ? 'text-red-400'
    : progress < 0.25
    ? 'text-amber-400'
    : 'text-emerald-400';

  const strokeColor = isCompleted
    ? '#ef4444'
    : progress < 0.1
    ? '#ef4444'
    : progress < 0.25
    ? '#f59e0b'
    : '#10b981';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG circle timer */}
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#374151" strokeWidth="6" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-mono font-bold ${timerColor}`}>
            {formattedTime}
          </span>
        </div>
        {isCompleted && (
          <div className="absolute -top-1 -right-1">
            <Bell size={16} className="text-red-400 animate-bounce" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
          title="Réinitialiser"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={isRunning ? pause : start}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            isRunning
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
          }`}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : isCompleted ? 'Relancer' : 'Démarrer'}
        </button>
      </div>
    </div>
  );
}
