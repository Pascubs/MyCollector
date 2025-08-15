import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, options = {}) => {
        const id = Date.now() + Math.random();
        const type = options.type || 'info';
        const duration = options.duration || 5000;

        setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message) => addToast(message, { type: 'info' }), [addToast]);
    toast.success = (message) => addToast(message, { type: 'success' });
    toast.error = (message) => addToast(message, { type: 'error' });
    toast.info = (message) => addToast(message, { type: 'info' });

    const value = { toasts, removeToast, toast };

    return React.createElement(ToastContext.Provider, { value }, children);
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context.toast;
};

export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};
