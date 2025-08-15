import React from 'react';
import { PencilIcon, CloseIcon } from '../icons.js';

const BinderCard = ({ card, isDraggable, onDragStart, onDragEnd, onEdit, onRemove }) => {
  const fallbackImageUrl = `https://placehold.co/300x420/475569/94a3b8?text=Image+Not+Found`;
  const imageUrl = card.externalData?.image_url || card.customImageUrl || `https://placehold.co/300x420/27272a/e5e5e5?text=${encodeURIComponent(card.name)}`;

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove();
  };

  return React.createElement('div', { className: 'relative group w-full h-full' },
    React.createElement('div', {
        draggable: isDraggable,
        onDragStart: onDragStart,
        onDragEnd: onDragEnd,
        className: `w-full h-full rounded-lg overflow-hidden shadow-lg border-2 ${card.collected ? 'border-amber-500' : 'border-transparent'} bg-slate-200 dark:bg-slate-700 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`
      },
      React.createElement('img', {
        src: imageUrl,
        alt: card.name,
        className: 'w-full h-full object-cover pointer-events-none transition-all' + (!card.collected ? ' grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100' : ''),
        onError: (e) => (e.currentTarget.src = fallbackImageUrl)
      })
    ),
    isDraggable && React.createElement('div', { className: 'absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 p-2 pointer-events-none' },
        React.createElement('button', {
            onClick: handleEdit,
            className: 'p-2 bg-slate-100/80 text-slate-800 rounded-full hover:bg-white hover:scale-110 transition-all pointer-events-auto',
            title: 'Edit Card Details'
        }, React.createElement(PencilIcon, { className: 'w-5 h-5' })),
        React.createElement('button', {
            onClick: handleRemove,
            className: 'p-2 bg-slate-100/80 text-slate-800 rounded-full hover:bg-white hover:scale-110 transition-all pointer-events-auto',
            title: 'Remove from Binder Slot'
        }, React.createElement(CloseIcon, { className: 'w-5 h-5' }))
    )
  );
};

export default BinderCard;