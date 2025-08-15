import React from 'react';
import CardItem from './CardItem.js';
import { useCollections } from '../context.js';

const CardList = ({ cards, viewMode, isTutorialActive = false }) => {
  const { selectedCollection } = useCollections();

  if (cards.length === 0) {
    return null;
  }

  const listClasses = viewMode === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-3';

  return React.createElement('div', { className: listClasses },
    ...cards.map((card, index) => (
      React.createElement(CardItem, {
        key: `${selectedCollection?.id}-${card.id}`,
        card: card,
        viewMode: viewMode,
        isTutorialHighlight: isTutorialActive && index === 0
      })
    ))
  );
};

export default CardList;