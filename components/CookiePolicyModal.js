import React from 'react';
import { CloseIcon } from '../icons.js';

const CookiePolicyModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-60 z-[90] flex items-center justify-center p-4 font-cuphead-text',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'cookie-policy-title'
    },
        React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all relative' },
            React.createElement('button', { onClick: onClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors', 'aria-label': 'Close' },
                React.createElement(CloseIcon, { className: 'w-6 h-6' })
            ),
            React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
                React.createElement('h2', { id: 'cookie-policy-title', className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Cookie & Data Policy')
            ),
            React.createElement('div', { className: 'p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar' },
                React.createElement('p', { className: 'text-sm text-slate-600 dark:text-slate-300' }, 'To provide you with the best experience, this application uses two types of data storage technology.'),
                React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                    React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, '1. Strictly Necessary Cookies'),
                    React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mt-2' },
                        "These are essential for the application to function. When you log in with your Google account, a secure, technical cookie is used to keep you signed in. This cookie is not used for tracking and does not store personal preferences. Under GDPR and Italian law, these cookies do not require prior consent, but we believe in being transparent about their use."
                    )
                ),
                React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                    React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, '2. Preference Storage (Local Storage)'),
                    React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-2' },
                        React.createElement('p', null, "We use your browser's local storage to remember your personal settings and preferences. This makes your experience seamless between visits. This includes preferences like:"),
                        React.createElement('ul', { className: 'list-disc list-inside pl-4' },
                            React.createElement('li', null, 'Your chosen theme (light/dark mode).'),
                            React.createElement('li', null, 'Your preferred view mode (list or grid).'),
                            React.createElement('li', null, 'Your sorting and filtering choices.'),
                            React.createElement('li', null, 'The on-screen position of UI elements like the binder pocket.'),
                            React.createElement('li', null, 'Whether you have completed the tutorial.')
                        ),
                        React.createElement('p', { className: 'font-semibold mt-2' },
                            "Under Italian and EU law, this type of storage requires your consent. By clicking 'Accept' on the banner, you agree to let us store this information on your device. If you 'Decline', we will not store these preferences, and they will reset to their defaults each time you visit."
                        )
                    )
                ),
                React.createElement('p', { className: 'text-sm text-slate-600 dark:text-slate-300' }, "You can change your consent choice at any time by clearing your browser's site data for this application.")
            ),
            React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end' },
                React.createElement('button', { onClick: onClose, className: 'px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Got it')
            )
        )
    );
};

export default CookiePolicyModal;
