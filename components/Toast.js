import React, { useEffect, useState } from 'react';
import { useToastContext } from '../toastContext.js';
import { CheckCircleIcon, ExclamationCircleIcon, CloseIcon } from '../icons.js';

const Toast = ({ toast, onRemove }) => {
    const { id, message, type = 'info' } = toast;
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            const removeTimer = setTimeout(() => onRemove(id), 300); // Wait for animation
            return () => clearTimeout(removeTimer);
        }, toast.duration - 300); // Start exit animation before removal
        
        return () => clearTimeout(timer);
    }, [id, toast.duration, onRemove]);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(id), 300);
    };

    const icons = {
        success: React.createElement(CheckCircleIcon, { className: 'w-6 h-6 text-emerald-500' }),
        error: React.createElement(ExclamationCircleIcon, { className: 'w-6 h-6 text-rose-500' }),
        info: React.createElement(ExclamationCircleIcon, { className: 'w-6 h-6 text-blue-500' }),
    };

    const animationClass = isExiting ? 'toast-exit-active' : 'toast-enter-active';

    return React.createElement('div', {
        className: `max-w-sm w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${isExiting ? 'toast-exit' : 'toast-enter'} ${animationClass}`
    },
        React.createElement('div', { className: 'p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' }, icons[type]),
                React.createElement('div', { className: 'ml-3 w-0 flex-1 pt-0.5' },
                    React.createElement('p', { className: 'text-sm font-medium text-slate-900 dark:text-slate-100' }, message)
                ),
                React.createElement('div', { className: 'ml-4 flex-shrink-0 flex' },
                    React.createElement('button', {
                        onClick: handleRemove,
                        className: 'bg-transparent rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    },
                        React.createElement('span', { className: 'sr-only' }, 'Close'),
                        React.createElement(CloseIcon, { className: 'h-5 w-5', 'aria-hidden': 'true' })
                    )
                )
            )
        )
    );
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToastContext();

    if (toasts.length === 0) {
        return null;
    }

    return React.createElement('div', {
        'aria-live': 'assertive',
        className: 'fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[9999]'
    },
        React.createElement('div', { className: 'w-full flex flex-col items-center space-y-4 sm:items-end' },
            ...toasts.map(toast => React.createElement(Toast, {
                key: toast.id,
                toast: toast,
                onRemove: removeToast
            }))
        )
    );
};
