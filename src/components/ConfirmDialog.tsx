/**
 * src/components/ConfirmDialog.tsx
 * Reusable confirmation dialog using Headless UI Dialog.
 * Used for destructive actions like deleting tournaments or unlocking scores.
 */

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}: ConfirmDialogProps) {
  const colors = {
    danger: { btn: 'bg-red-700 hover:bg-red-600', icon: 'text-red-400', bg: 'bg-red-900/20' },
    warning: { btn: 'bg-amber-700 hover:bg-amber-600', icon: 'text-amber-400', bg: 'bg-amber-900/20' },
    info: { btn: 'bg-blue-700 hover:bg-blue-600', icon: 'text-blue-400', bg: 'bg-blue-900/20' },
  }[variant];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                    <AlertTriangle size={20} className={colors.icon} />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title className="text-base font-bold text-white">{title}</Dialog.Title>
                    <p className="mt-1.5 text-sm text-gray-400">{message}</p>
                  </div>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-300 shrink-0">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`flex-1 py-2.5 rounded-xl ${colors.btn} text-sm text-white font-medium transition-colors`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
