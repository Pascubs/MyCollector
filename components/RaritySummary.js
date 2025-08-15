import React, { useMemo } from 'react';
import { useCollections } from '../context.js';
import { getRarityStyling } from '../utils.js';

const RarityGroup = ({ title, rarities, onRarityFilterChange, activeButtonName }) => (
  React.createElement('div', { className: 'py-2' },
    React.createElement('h4', { className: 'font-cuphead-text text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center uppercase tracking-wider' }, title),
    React.createElement('div', { className: 'flex flex-wrap gap-2 justify-center' },
      ...rarities.map(({ name, definition, collected, total }) => {
        const isActive = activeButtonName === name;
        const colors = getRarityStyling(definition);

        const activeClasses = isActive
          ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${colors.activeRing}`
          : 'hover:opacity-80';

        return React.createElement('button', {
          key: name,
          onClick: () => onRarityFilterChange(name, name),
          'aria-pressed': isActive,
          className: `px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm font-cuphead-text ${colors.base} ${colors.text} ${activeClasses}`,
          title: `Filter by ${name}: ${collected} of ${total} collected`
        },
          `${name} (${collected}/${total})`
        );
      })
    )
  )
);

const RaritySummary = ({ onRarityFilterChange, activeButtonName }) => {
  const { selectedCollection } = useCollections();

  const summary = useMemo(() => {
    if (!selectedCollection || !selectedCollection.rarityDefinitions) return { standard: [], special: [] };

    const { cards, rarityDefinitions } = selectedCollection;

    const rarityCounts = rarityDefinitions.map(def => {
      const filteredCards = cards.filter(card => card.rarity === def.name);
      return {
        name: def.name,
        definition: def,
        collected: filteredCards.filter(card => card.collected).length,
        total: filteredCards.length,
        category: def.category || 'Standard',
      };
    }).filter(item => item.total > 0);
    
    return {
      standard: rarityCounts.filter(r => r.category === 'Standard'),
      special: rarityCounts.filter(r => r.category === 'Special'),
    };
  }, [selectedCollection]);

  if (summary.standard.length === 0 && summary.special.length === 0) {
    return null;
  }

  return React.createElement('div', null,
    React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-700 dark:text-slate-200 mb-2 text-center' }, 'Rarity Summary'),
    React.createElement('div', { className: 'space-y-2' },
      summary.standard.length > 0 && React.createElement(RarityGroup, {
        title: 'Standard',
        rarities: summary.standard,
        onRarityFilterChange: onRarityFilterChange,
        activeButtonName: activeButtonName
      }),
      summary.special.length > 0 && summary.standard.length > 0 && React.createElement('hr', { className: 'border-slate-200 dark:border-slate-700 my-3' }),
      summary.special.length > 0 && React.createElement(RarityGroup, {
        title: 'Special',
        rarities: summary.special,
        onRarityFilterChange: onRarityFilterChange,
        activeButtonName: activeButtonName
      })
    )
  );
};

export default RaritySummary;
