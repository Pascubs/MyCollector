import React from 'react';
import { ErrorIcon } from '../icons.js';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4 font-cuphead-text',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'confirmation-title'
  },
    React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all' },
      React.createElement('div', { className: 'p-6 text-center' },
        React.createElement('div', { className: 'mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50' },
          React.createElement(ErrorIcon, { className: 'h-7 w-7 text-rose-600 dark:text-rose-400', 'aria-hidden': 'true' })
        ),
        React.createElement('h3', { id: 'confirmation-title', className: 'mt-4 font-cuphead-title text-2xl text-slate-900 dark:text-slate-100' }, title),
        React.createElement('div', { className: 'mt-2 text-sm text-slate-600 dark:text-slate-400 font-cuphead-text' }, message)
      ),
      React.createElement('div', { className: 'bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-xl' },
        React.createElement('button', {
          type: 'button',
          className: 'w-full sm:w-auto justify-center rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 font-cuphead-text',
          onClick: onClose
        }, cancelButtonText),
        React.createElement('button', {
          type: 'button',
          className: 'w-full sm:w-auto justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 font-cuphead-text',
          onClick: handleConfirm
        }, confirmButtonText)
      )
    )
  );
};

export default ConfirmationModal;
