

import React from 'react';
import { useAuth } from '../authContext.js';
import { GoogleIcon, CloseIcon } from '../icons.js';

const LoginScreen = ({ onGuestContinue }) => {
    const { login } = useAuth();

    return React.createElement('div', {
        className: 'fixed inset-0 bg-slate-50 dark:bg-slate-900 z-[70] flex items-center justify-center p-4 font-cuphead-text',
        role: 'dialog',
        'aria-modal': 'true',
    },
        React.createElement('div', { 
            className: 'w-full max-w-sm text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative',
        },
            React.createElement('h1', { className: 'font-cuphead-title text-3xl text-blue-800 dark:text-blue-400' }, 'My Collector'),
            React.createElement('p', { className: 'mt-2 mb-8 text-slate-600 dark:text-slate-400' }, 'Sign in or continue as a guest to manage your collections.'),
            React.createElement('div', { className: 'space-y-4' },
                React.createElement('button', {
                    onClick: login,
                    className: 'w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800'
                },
                    React.createElement(GoogleIcon, { className: 'w-6 h-6' }),
                    React.createElement('span', null, 'Sign in with Google')
                ),
                React.createElement('button', {
                    onClick: onGuestContinue,
                    className: 'w-full px-4 py-2 text-sm text-slate-500 dark:text-slate-400 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-offset-slate-800'
                }, 'Continue as Guest')
            ),
            React.createElement('p', { className: 'mt-8 text-xs text-slate-400 dark:text-slate-500' },
                'By signing in, your data will be saved to your Google account.'
            )
        )
    );
};

export default LoginScreen;