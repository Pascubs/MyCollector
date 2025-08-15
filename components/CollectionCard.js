import React, { useMemo } from 'react';
import { useCollectionProgress } from '../hooks.js';
import { CloseIcon, StarIcon } from '../icons.js';

const BOOK_COLORS = [
    'border-sky-500', 'border-emerald-500', 'border-amber-500', 'border-indigo-500', 
    'border-rose-500', 'border-pink-500', 'border-teal-500', 'border-purple-500',
    'border-lime-600', 'border-cyan-500', 'border-orange-500', 'border-violet-500'
];

/**
 * Generates a consistent color from a string hash.
 * @param {string} str The string to hash.
 * @returns {string} A TailwindCSS border color class.
 */
function generateColorFromString(str) {
    if (!str) return BOOK_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % BOOK_COLORS.length;
    return BOOK_COLORS[index];
}

const LANGUAGE_MAP = {
    en: 'ENG',
    it: 'ITA',
    ja: 'JPN',
    de: 'DEU',
    fr: 'FRA',
    es: 'ESP',
    pt: 'POR',
    mix: 'MIX',
};

const LanguageBadge = ({ code }) => {
    if (!code) return null;
    const lang = LANGUAGE_MAP[code] || code.toUpperCase();
    return (
        React.createElement('div', {
            className: 'absolute bottom-3 left-3 px-2 py-0.5 bg-slate-800/70 text-white text-[10px] font-bold tracking-wider rounded backdrop-blur-sm'
        }, lang)
    );
};


const CollectionCard = ({ collection, isOwned, onSelect, onPinToggle, isEditMode, onDragStart, onDragEnter, onDragEnd, onDelete, onAdd }) => {
    const { collected, total, percentage } = useCollectionProgress(collection, 'standard');
    const colorClass = generateColorFromString(collection.id);

    const dominantLanguage = useMemo(() => {
        if (!collection || !collection.cards || collection.cards.length === 0) return null;
        
        const langCounts = collection.cards.reduce((acc, card) => {
            const lang = card.language || 'en';
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {});

        const entries = Object.entries(langCounts);
        if (entries.length === 0) return null;
        if (entries.length > 1) return 'mix';
        return entries[0][0];
    }, [collection]);
    
    // --- RENDER PATH: CATALOG ---
    // The `onAdd` prop signals that this card is being rendered in the catalog.
    if (onAdd) {
        const handleAdd = (e) => {
            e.stopPropagation();
            if (!isOwned) { // Prevent re-triggering the add action
                onAdd(collection);
            }
        };

        return React.createElement('div', {
            className: 'font-cuphead-text group aspect-[2/3] flex flex-col justify-between p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 border-l-8 hover:shadow-2xl ' + (isOwned ? 'border-emerald-500' : 'border-slate-400')
        },
            React.createElement('div', null,
                React.createElement('h3', { className: 'font-cuphead-title text-2xl font-bold text-slate-800 dark:text-slate-100 break-words' }, collection.name),
                React.createElement('p', { className: 'text-sm text-slate-500 dark:text-slate-400 mt-2' }, collection.description)
            ),
            isOwned ? (
                React.createElement('button', {
                    disabled: true,
                    className: 'w-full mt-4 py-2 px-4 bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold rounded-lg shadow-inner cursor-not-allowed flex items-center justify-center gap-2'
                },
                  React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'currentColor', className: 'w-5 h-5'},
                    React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z', clipRule: 'evenodd' })
                  ),
                  'Added to Shelf'
                )
            ) : (
                React.createElement('button', {
                    onClick: handleAdd,
                    className: 'w-full mt-4 py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition-all transform group-hover:scale-105'
                }, '+ Add to Shelf')
            )
        );
    }
    
    // --- RENDER PATH: SHELF (OWNED COLLECTIONS) ---
    // The `onSelect` prop signals this card is on the user's shelf.
    if (onSelect) {
        const handleSelect = (e) => {
            e.stopPropagation();
            if (isEditMode || e.target.closest('button')) return;
            onSelect(collection.id);
        };

        const handlePin = (e) => {
            e.stopPropagation();
            onPinToggle(collection.id);
        };
        
        const handleDelete = (e) => {
            e.stopPropagation();
            onDelete();
        };

        return (
            React.createElement('div', {
                draggable: isEditMode,
                onDragStart: onDragStart,
                onDragEnter: onDragEnter,
                onDragEnd: onDragEnd,
                onDragOver: (e) => e.preventDefault(),
                onClick: handleSelect,
                className: `relative font-cuphead-text group aspect-[2/3] flex flex-col justify-between p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-slate-100 dark:bg-slate-800 border-l-8 ${colorClass} ${isEditMode ? 'is-jiggling cursor-grab active:cursor-grabbing' : 'hover:-translate-y-2 cursor-pointer hover:shadow-2xl'}`
            },
                isEditMode && React.createElement('button', {
                    onClick: handleDelete,
                    className: 'absolute -top-2 -left-2 w-7 h-7 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-md hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all z-20',
                    title: 'Delete Collection'
                }, React.createElement(CloseIcon, { className: 'w-4 h-4' })),
                React.createElement('button', {
                    onClick: handlePin,
                    className: `pin-button absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 ${collection.isPinned ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'} ${isEditMode ? 'pointer-events-none' : ''}`,
                    title: collection.isPinned ? 'Unpin Collection' : 'Pin Collection'
                },
                    React.createElement(StarIcon, { className: `w-6 h-6 ${collection.isPinned ? 'fill-current' : ''}` })
                ),
                React.createElement('div', null,
                    React.createElement('h3', { className: 'font-cuphead-title text-2xl font-bold text-slate-800 dark:text-slate-100 break-words' }, collection.name)
                ),
                React.createElement('div', { className: 'w-full' },
                    React.createElement('div', { className: 'text-right text-sm font-semibold text-slate-600 dark:text-slate-300' },
                        `${collected} / ${total}`
                    ),
                    React.createElement('div', { className: 'w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2.5 mt-1' },
                        React.createElement('div', {
                            className: 'bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full',
                            style: { width: `${percentage}%` }
                        })
                    )
                ),
                React.createElement(LanguageBadge, { code: dominantLanguage })
            )
        );
    }

    return null; // Should not be reached
};

export default CollectionCard;