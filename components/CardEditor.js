import React, { useState } from 'react';

const CardEditor = ({ card, onSave, onCancel, isAddingNewCard, rarityDefinitions, customFieldDefinitions }) => {
  const [localCard, setLocalCard] = useState(card);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalCard(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomFieldChange = (key, value) => {
    setLocalCard(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localCard);
  };

  return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 font-cuphead-text' },
    React.createElement('div', { 
        className: 'bg-slate-100 dark:bg-slate-700 rounded-lg shadow-xl w-full max-w-md transform transition-all',
        onClick: e => e.stopPropagation() 
      },
      React.createElement('div', { className: 'p-6' },
        React.createElement('h3', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100 mb-4' }, isAddingNewCard ? 'Add New Card' : 'Edit Card'),
        React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3 -mr-3' },
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'id', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200' }, 'Card ID'),
            React.createElement('input', { type: 'text', name: 'id', value: localCard.id, onChange: handleChange, disabled: !isAddingNewCard, className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed' })
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'name', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200' }, 'Name'),
            React.createElement('input', { type: 'text', name: 'name', value: localCard.name, onChange: handleChange, className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm' })
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'language', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200' }, 'Language'),
            React.createElement('select', { 
                name: 'language', 
                value: localCard.language || 'en', 
                onChange: handleChange, 
                className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm' 
            },
              React.createElement('option', { value: 'en' }, 'English'),
              React.createElement('option', { value: 'it' }, 'Italian'),
              React.createElement('option', { value: 'ja' }, 'Japanese'),
              React.createElement('option', { value: 'de' }, 'German'),
              React.createElement('option', { value: 'fr' }, 'French'),
              React.createElement('option', { value: 'es' }, 'Spanish'),
              React.createElement('option', { value: 'pt' }, 'Portuguese')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'rarity', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200' }, 'Rarity'),
            React.createElement('select', { name: 'rarity', value: localCard.rarity || '', onChange: handleChange, className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm' },
              React.createElement('option', { value: '' }, 'N/A'),
              ...(rarityDefinitions || []).map(r => React.createElement('option', { key: r.name, value: r.name }, r.name))
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'description', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200' }, 'Description'),
            React.createElement('textarea', { name: 'description', value: localCard.description || '', onChange: handleChange, rows: 3, className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm' })
          ),
          customFieldDefinitions && customFieldDefinitions.length > 0 && React.createElement('div', { className: 'pt-4 border-t border-slate-300 dark:border-slate-600' },
              React.createElement('h4', { className: 'font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-2' }, 'Custom Fields'),
              React.createElement('div', { className: 'space-y-3' },
              ...customFieldDefinitions.map(field => React.createElement('div', { key: field.key },
                  React.createElement('label', { htmlFor: `custom-${field.key}`, className: 'block font-cuphead-text text-xs font-medium text-slate-600 dark:text-slate-300' }, field.label),
                  React.createElement('input', { type: 'text', id: `custom-${field.key}`, name: `custom-${field.key}`, value: localCard.customFields?.[field.key] || '', onChange: e => handleCustomFieldChange(field.key, e.target.value), className: 'mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm' })
              ))
              )
          )
        )
      ),
      React.createElement('div', { className: 'flex justify-end gap-3 p-4 bg-slate-200 dark:bg-slate-700/50 rounded-b-lg' },
        React.createElement('button', { type: 'button', onClick: onCancel, className: 'px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors' }, 'Cancel'),
        React.createElement('button', { type: 'button', onClick: handleSubmit, className: 'px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Save Card')
      )
    )
  );
};

export default CardEditor;
