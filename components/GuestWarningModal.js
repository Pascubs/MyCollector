import React from 'react';
import { ErrorIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '../icons.js';

const GuestWarningModal = ({ isOpen, onConfirm }) => {
    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4 font-cuphead-text',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'guest-warning-title'
    },
        React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all' },
            React.createElement('div', { className: 'p-6 text-center' },
                React.createElement('div', { className: 'mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50' },
                    React.createElement(ErrorIcon, { className: 'h-7 w-7 text-amber-600 dark:text-amber-400', 'aria-hidden': 'true' })
                ),
                React.createElement('h3', { id: 'guest-warning-title', className: 'mt-4 font-cuphead-title text-2xl text-slate-900 dark:text-slate-100' }, 'You are in Guest Mode'),
                React.createElement('div', { className: 'mt-2 text-sm text-slate-600 dark:text-slate-400 font-cuphead-text space-y-2' },
                    React.createElement('p', null, 'Your collection data will NOT be saved if you refresh or close this browser tab.'),
                    React.createElement('p', { className: 'font-semibold' }, 'To keep your data, please use the backup feature regularly.')
                )
            ),
            React.createElement('div', { className: 'px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center' },
                React.createElement('div', { className: 'p-4 bg-slate-100 dark:bg-slate-700/60 rounded-lg' },
                    React.createElement('h4', { className: 'font-cuphead-title text-lg text-slate-800 dark:text-slate-200' }, '1. Export Data'),
                    React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3' }, 'Save a backup file of all your collections to your computer.'),
                    React.createElement(ArrowDownTrayIcon, { className: 'w-10 h-10 mx-auto text-slate-500 dark:text-slate-400 animate-icon-bob', style: { animationDelay: '0s' } })
                ),
                React.createElement('div', { className: 'p-4 bg-slate-100 dark:bg-slate-700/60 rounded-lg' },
                    React.createElement('h4', { className: 'font-cuphead-title text-lg text-slate-800 dark:text-slate-200' }, '2. Import Data'),
                    React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3' }, 'Restore your collections from a backup file in a future session.'),
                    React.createElement(ArrowUpTrayIcon, { className: 'w-10 h-10 mx-auto text-slate-500 dark:text-slate-400 animate-icon-bob', style: { animationDelay: '0.5s' } })
                )
            ),
            React.createElement('div', { className: 'bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3 rounded-b-xl' },
                React.createElement('button', {
                    type: 'button',
                    className: 'w-full justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-cuphead-text',
                    onClick: onConfirm
                },
                'I Understand, Continue'
                )
            )
        )
    );
};

export default GuestWarningModal;
