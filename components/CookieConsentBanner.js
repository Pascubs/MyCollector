import React from 'react';
import { useCookieConsent } from '../cookieContext.js';

const CookieConsentBanner = ({ onOpenPolicy }) => {
    const { consent, acceptConsent, declineConsent } = useCookieConsent();

    if (consent !== null) {
        return null; // Don't show the banner if a choice has been made
    }
    
    return React.createElement('div', {
        className: 'fixed bottom-0 left-0 right-0 bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-sm text-white p-4 z-[80] font-cuphead-text animate-fade-in'
    },
        React.createElement('div', { className: 'container mx-auto flex flex-col md:flex-row items-center justify-between gap-4' },
            React.createElement('div', { className: 'text-sm text-slate-200 text-center md:text-left' },
                React.createElement('p', null, "This website uses cookies and local storage to enhance your experience and remember your preferences."),
                React.createElement('button', {
                    onClick: onOpenPolicy,
                    className: 'text-blue-400 hover:text-blue-300 underline'
                }, 'Learn more about how we use data.')
            ),
            React.createElement('div', { className: 'flex items-center gap-3 flex-shrink-0' },
                React.createElement('button', {
                    onClick: declineConsent,
                    className: 'px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 transition-colors'
                }, 'Decline'),
                React.createElement('button', {
                    onClick: acceptConsent,
                    className: 'px-6 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-500 transition-colors'
                }, 'Accept')
            )
        )
    );
};

export default CookieConsentBanner;
