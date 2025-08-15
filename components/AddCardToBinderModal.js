import React, { useState, useMemo } from 'react';
import { useCollections } from '../context.js';
import { getRarityStyling } from '../utils.js';
import { CloseIcon } from '../icons.js';

const AddCardToBinderModal = ({ isOpen, onClose, availableCards, onCardSelect }) => {
    const { selectedCollection } = useCollections();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
    const [rarityFilter, setRarityFilter] = useState(null);

    if (!isOpen) return null;

    const sortedAndFilteredCards = useMemo(() => {
        let cards = [...availableCards];

        if (rarityFilter) {
            cards = cards.filter(card => card.rarity === rarityFilter);
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            cards = cards.filter(card => 
                card.name.toLowerCase().includes(lowerSearch) || 
                card.id.toLowerCase().includes(lowerSearch)
            );
        }

        cards.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            let comparison = 0;
            if (sortConfig.key === 'id') {
                comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
            } else {
                comparison = String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' });
            }

            return comparison * (sortConfig.direction === 'asc' ? 1 : -1);
        });

        return cards;
    }, [availableCards, searchTerm, sortConfig, rarityFilter]);

    const handleSortChange = (key) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleRarityFilter = (rarityName) => {
        setRarityFilter(current => current === rarityName ? null : rarityName);
    };
    
    const fallbackImageUrl = `https://placehold.co/300x420/475569/94a3b8?text=Image+Not+Found`;

    const raritiesInList = useMemo(() => {
        if (!availableCards.length) return [];
        const rarityCounts = {};
        availableCards.forEach(card => {
            if (card.rarity) {
                rarityCounts[card.rarity] = (rarityCounts[card.rarity] || 0) + 1;
            }
        });
        return (selectedCollection?.rarityDefinitions || [])
            .filter(def => rarityCounts[def.name] > 0)
            .map(def => ({ ...def, count: rarityCounts[def.name] }));
    }, [availableCards, selectedCollection?.rarityDefinitions]);

    const sortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 font-cuphead-text',
        role: 'dialog',
        'aria-modal': 'true',
        onClick: onClose,
    },
      React.createElement('div', { 
          className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all relative flex flex-col',
          onClick: e => e.stopPropagation(),
          style: { maxHeight: '90vh' }
        },
        React.createElement('div', { className: 'p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h2', { className: 'font-cuphead-title text-xl text-blue-800 dark:text-blue-400' }, 'Add Card to Pocket'),
            React.createElement('button', { onClick: onClose, className: 'p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors', 'aria-label': 'Close' },
              React.createElement(CloseIcon, { className: 'w-5 h-5' })
            )
          ),
          React.createElement('input', {
            type: 'text',
            value: searchTerm,
            onChange: e => setSearchTerm(e.target.value),
            placeholder: `Search ${availableCards.length} unplaced cards...`,
            className: 'w-full mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base'
          })
        ),
        React.createElement('div', { className: 'p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0' },
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'text-sm font-semibold text-slate-500' }, 'Sort by:'),
                React.createElement('button', { onClick: () => handleSortChange('id'), className: 'px-2 py-0.5 text-sm rounded-md bg-slate-200 dark:bg-slate-600' }, `ID ${sortIndicator('id')}`),
                React.createElement('button', { onClick: () => handleSortChange('name'), className: 'px-2 py-0.5 text-sm rounded-md bg-slate-200 dark:bg-slate-600' }, `Name ${sortIndicator('name')}`)
            ),
            React.createElement('div', { className: 'text-sm font-semibold text-slate-500' }, `${sortedAndFilteredCards.length} matching cards`)
        ),
        raritiesInList.length > 0 && React.createElement('div', { className: 'px-4 pb-2 flex-shrink-0' },
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
                ...raritiesInList.map(rarity => {
                    const isActive = rarityFilter === rarity.name;
                    const { base, text } = getRarityStyling(rarity.definition);
                    return React.createElement('button', {
                        key: rarity.name,
                        onClick: () => handleRarityFilter(rarity.name),
                        className: `px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${base} ${text} ${isActive ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-70 hover:opacity-100'}`
                    }, `${rarity.name} (${rarity.count})`);
                })
            )
        ),
        React.createElement('div', { className: 'p-2 overflow-y-auto custom-scrollbar' },
          sortedAndFilteredCards.length > 0 ? (
            React.createElement('ul', { className: 'space-y-1' },
              ...sortedAndFilteredCards.map(card => React.createElement('li', { key: card.id },
                React.createElement('button', {
                    onClick: () => onCardSelect(card.id),
                    className: 'w-full flex items-center gap-3 p-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'
                  },
                  React.createElement('img', { 
                      src: card.externalData?.image_url || card.customImageUrl || `https://placehold.co/300x420/27272a/e5e5e5?text=${encodeURIComponent(card.name)}`,
                      alt: card.name,
                      className: 'w-10 h-14 object-cover rounded-md flex-shrink-0 bg-slate-200 dark:bg-slate-600',
                      onError: e => (e.currentTarget.src = fallbackImageUrl)
                  }),
                  React.createElement('div', { className: 'flex-1 min-w-0' },
                      React.createElement('p', { className: 'font-semibold text-sm text-slate-800 dark:text-slate-100 truncate' }, card.name),
                      React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400' }, `ID: ${card.id} | Rarity: ${card.rarity || 'N/A'}`)
                  )
                )
              ))
            )
          ) : (
            React.createElement('div', { className: 'text-center py-8' },
              React.createElement('p', { className: 'text-slate-500 dark:text-slate-400' }, 'No unplaced cards match your search or filter.')
            )
          )
        )
      )
    );
};

export default AddCardToBinderModal;