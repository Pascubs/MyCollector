import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'myCollectorCookieConsent';

const CookieConsentContext = createContext(undefined);

export const CookieConsentProvider = ({ children }) => {
    // State can be 'accepted', 'declined', or null (not yet chosen)
    const [consent, setConsent] = useState(null);

    // On initial load, check if a choice was already saved in localStorage
    useEffect(() => {
        try {
            const savedConsent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
            if (savedConsent === 'accepted' || savedConsent === 'declined') {
                setConsent(savedConsent);
            }
        } catch (e) {
            console.warn('Could not access localStorage for cookie consent.');
        }
    }, []);

    const acceptConsent = useCallback(() => {
        try {
            window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        } catch (e) {
            console.warn('Could not save cookie consent to localStorage.');
        }
        setConsent('accepted');
    }, []);

    const declineConsent = useCallback(() => {
        try {
            // Remove all preference-related keys from localStorage
            Object.keys(window.localStorage).forEach(key => {
                if (key.startsWith('myCollector')) {
                    window.localStorage.removeItem(key);
                }
            });
            // Then save the "declined" choice
            window.localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        } catch (e) {
            console.warn('Could not save cookie consent or clear preferences from localStorage.');
        }
        setConsent('declined');
    }, []);
    
    const value = useMemo(() => ({
        consent,
        acceptConsent,
        declineConsent
    }), [consent, acceptConsent, declineConsent]);

    return React.createElement(CookieConsentContext.Provider, { value }, children);
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
