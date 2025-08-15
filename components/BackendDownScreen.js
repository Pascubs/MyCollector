import React from 'react';
import { ErrorIcon } from '../icons.js';
import { useAuth } from '../authContext.js';

const BackendDownScreen = () => {
    const { switchToOfflineMode } = useAuth();

    return React.createElement('div', { className: 'min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 font-cuphead-text' },
        React.createElement('div', { className: 'w-full max-w-md text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700' },
            React.createElement(ErrorIcon, { className: "w-24 h-24 mx-auto text-rose-500 dark:text-rose-400" }),
            React.createElement('h1', { className: 'font-cuphead-title text-4xl mt-6 text-slate-800 dark:text-slate-100' }, 'Temporarily Offline'),
            React.createElement('p', { className: 'mt-2 mb-8 text-slate-600 dark:text-slate-400' },
                'We\'re experiencing some technical difficulties and our team is working hard to get things back online.'
            ),
            React.createElement('p', { className: 'text-sm text-slate-500 dark:text-slate-400' },
                'Please check back again shortly. We apologize for the inconvenience.'
            ),
            React.createElement('div', { className: 'mt-8' },
                React.createElement('button', {
                    onClick: switchToOfflineMode,
                    className: 'w-full px-4 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800'
                },
                    'Continue in Offline Mode'
                ),
                React.createElement('p', { className: 'mt-3 text-xs text-slate-400 dark:text-slate-500' },
                    'In offline mode, your data is not saved across sessions.'
                )
            )
        )
    );
};

export default BackendDownScreen;