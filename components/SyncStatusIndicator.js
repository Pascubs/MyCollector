import React from 'react';
import { SpinnerIcon } from '../icons.js';

const SyncStatusIndicator = ({ status }) => {
    const getStatusContent = () => {
        switch (status) {
            case 'syncing':
                return {
                    icon: React.createElement(SpinnerIcon, { className: 'w-5 h-5 text-slate-500' }),
                    text: 'Saving...',
                    textColor: 'text-slate-500 dark:text-slate-400',
                    title: 'Syncing your changes with the server.'
                };
            case 'success':
                return {
                    icon: React.createElement('div', { className: 'w-5 h-5 flex items-center justify-center' }, 
                           React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', className: 'w-5 h-5 text-emerald-500' },
                               React.createElement('path', { fillRule: 'evenodd', d: 'M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z', clipRule: 'evenodd' })
                           )
                    ),
                    text: 'All changes saved',
                    textColor: 'text-slate-500 dark:text-slate-400',
                    title: 'Your data is up-to-date.'
                };
            case 'error':
                 return {
                    icon: React.createElement('div', { className: 'w-5 h-5 flex items-center justify-center' },
                           React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', className: 'w-5 h-5 text-rose-500' },
                               React.createElement('path', { fillRule: 'evenodd', d: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z', clipRule: 'evenodd' })
                           )
                    ),
                    text: 'Sync Error',
                    textColor: 'text-rose-600 dark:text-rose-400',
                    title: 'Could not save changes. Check your connection.'
                };
            case 'idle':
            default:
                return {
                    icon: React.createElement('div', { className: 'w-5 h-5 flex items-center justify-center' },
                           React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', className: 'w-5 h-5 text-slate-400' },
                              React.createElement('path', { d: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z' }),
                              React.createElement('path', { d: 'M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z' })
                           )
                    ),
                    text: 'Synced',
                    textColor: 'text-slate-500 dark:text-slate-400',
                    title: 'Your data is saved and up-to-date.'
                };
        }
    };

    const { icon, text, textColor, title } = getStatusContent();

    return React.createElement('div', { 
        className: 'flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 transition-all',
        title: title
    },
        icon,
        React.createElement('span', { className: `text-xs font-medium font-cuphead-text hidden md:inline ${textColor}` }, text)
    );
};

export default SyncStatusIndicator;
