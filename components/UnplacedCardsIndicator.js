import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FloatingPocketIcon } from '../icons.js';

const UnplacedCardsIndicator = ({ count, cards }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const listRef = useRef(null);

    const handlePocketClick = (e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    // Close the panel when clicking outside of it
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset search when opening/closing
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        } else {
            // Auto-focus the search input when opened
            setTimeout(() => listRef.current?.querySelector('input')?.focus(), 100);
        }
    }, [isOpen]);

    const filteredCards = useMemo(() => {
        if (!searchTerm) return cards;
        const lowerSearch = searchTerm.toLowerCase();
        return cards.filter(card =>
            card.name.toLowerCase().includes(lowerSearch) ||
            card.id.toLowerCase().includes(lowerSearch)
        );
    }, [cards, searchTerm]);

    const handleCardDragStart = (e, cardId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
    };

    const fallbackImageUrl = `https://placehold.co/300x420/475569/94a3b8?text=Image+Not+Found`;

    return React.createElement('div', {
        ref: wrapperRef,
        className: 'relative font-cuphead-text'
    },
        React.createElement('div', {
            onClick: handlePocketClick,
            className: 'relative group cursor-pointer select-none transition-transform hover:scale-110 active:scale-105',
            title: `${count} card(s) unplaced. Click to view.`
        },
            React.createElement(FloatingPocketIcon, { className: 'w-16 h-16 text-slate-700/80 dark:text-slate-200/80 drop-shadow-xl' }),
            React.createElement('div', {
                className: 'absolute -top-2 -right-2 w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md border-2 border-white dark:border-slate-800'
            }, count)
        ),
        isOpen && React.createElement('div', {
            ref: listRef,
            className: 'absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl flex flex-col',
            style: { maxHeight: '60vh' },
        },
            React.createElement('div', { className: 'p-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0' },
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Search unplaced...',
                    value: searchTerm,
                    onChange: e => setSearchTerm(e.target.value),
                    className: 'w-full px-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500'
                })
            ),
            React.createElement('ul', { className: 'overflow-y-auto custom-scrollbar p-1' },
                filteredCards.length > 0 ? (
                    filteredCards.map(card => React.createElement('li', {
                        key: card.id,
                        draggable: 'true',
                        onDragStart: (e) => handleCardDragStart(e, card.id),
                        className: 'p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing'
                    },
                        React.createElement('div', { className: 'flex items-center gap-3 pointer-events-none' }, // Disable pointer events on children
                            React.createElement('img', {
                                src: card.externalData?.image_url || card.customImageUrl || `https://placehold.co/300x420/27272a/e5e5e5?text=${encodeURIComponent(card.name)}`,
                                alt: card.name,
                                className: 'w-10 h-14 object-cover rounded-sm flex-shrink-0 bg-slate-200 dark:bg-slate-600',
                                onError: e => (e.currentTarget.src = fallbackImageUrl)
                            }),
                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                React.createElement('p', { className: 'font-semibold text-sm text-slate-800 dark:text-slate-100 truncate' }, card.name),
                                React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400' }, `ID: ${card.id}`)
                            )
                        )
                    ))
                ) : (
                    React.createElement('li', { className: 'p-4 text-center text-sm text-slate-500' }, 'No matching cards.')
                )
            )
        )
    );
};

export default UnplacedCardsIndicator;