import React, { useState, useEffect, useMemo } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import { CloseIcon, PencilIcon, TrashIcon } from '../icons.js';
import ConfirmationModal from './ConfirmationModal.js';

const COLOR_PALETTE = [
  { name: 'Slate', style: { base: 'bg-slate-200 dark:bg-slate-600', text: 'text-slate-800 dark:text-slate-100', activeRing: 'ring-slate-500' } },
  { name: 'Sky', style: { base: 'bg-sky-200 dark:bg-sky-800', text: 'text-sky-800 dark:text-sky-100', activeRing: 'ring-sky-500' } },
  { name: 'Emerald', style: { base: 'bg-emerald-200 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-emerald-100', activeRing: 'ring-emerald-500' } },
  { name: 'Amber', style: { base: 'bg-amber-200 dark:bg-amber-800', text: 'text-amber-800 dark:text-amber-100', activeRing: 'ring-amber-500' } },
  { name: 'Indigo', style: { base: 'bg-indigo-200 dark:bg-indigo-800', text: 'text-indigo-800 dark:text-indigo-100', activeRing: 'ring-indigo-500' } },
  { name: 'Rose', style: { base: 'bg-rose-200 dark:bg-rose-800', text: 'text-rose-800 dark:text-rose-100', activeRing: 'ring-rose-500' } },
  { name: 'Pink', style: { base: 'bg-pink-200 dark:bg-pink-800', text: 'text-pink-800 dark:text-pink-100', activeRing: 'ring-pink-500' } },
  { name: 'Teal', style: { base: 'bg-teal-200 dark:bg-teal-800', text: 'text-teal-800 dark:text-teal-100', activeRing: 'ring-teal-500' } },
  { name: 'Purple', style: { base: 'bg-purple-200 dark:bg-purple-800', text: 'text-purple-800 dark:text-purple-100', activeRing: 'ring-purple-500' } },
  { name: 'Lime', style: { base: 'bg-lime-200 dark:bg-lime-800', text: 'text-lime-800 dark:text-lime-100', activeRing: 'ring-lime-500' } },
  { name: 'Cyan', style: { base: 'bg-cyan-200 dark:bg-cyan-800', text: 'text-cyan-800 dark:text-cyan-100', activeRing: 'ring-cyan-500' } },
  { name: 'Orange', style: { base: 'bg-orange-200 dark:bg-orange-800', text: 'text-orange-800 dark:text-orange-100', activeRing: 'ring-orange-500' } },
];

const TabButton = ({ isActive, onClick, children, isDanger = false }) => (
    React.createElement('button', {
        type: 'button',
        onClick: onClick,
        className: `px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            isActive
                ? isDanger
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-blue-700 text-blue-800 dark:text-blue-400'
                : `border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600`
        }`
    }, children)
);

const RarityEditor = ({ rarities, setRarities, cards }) => {
  const handleRarityChange = (index, field, value) => {
    const newRarities = [...rarities];
    newRarities[index] = { ...newRarities[index], [field]: value };
    setRarities(newRarities);
  };

  const handleAddRarity = () => {
    const usedBaseColors = new Set(rarities.map(r => r.style.base));
    let nextColorStyle = null;

    for (const color of COLOR_PALETTE) {
      if (!usedBaseColors.has(color.style.base)) {
        nextColorStyle = color.style;
        break;
      }
    }

    if (!nextColorStyle) {
      nextColorStyle = COLOR_PALETTE[rarities.length % COLOR_PALETTE.length].style;
    }

    setRarities([...rarities, {
      name: `New Rarity ${rarities.length + 1}`,
      style: nextColorStyle,
      category: 'Standard',
    }]);
  };

  const handleRemoveRarity = (indexToRemove) => {
    setRarities(rarities.filter((_, index) => index !== indexToRemove));
  };

  const rarityInUse = useMemo(() => {
    const usageCount = {};
    cards.forEach(card => {
        if(card.rarity) {
            usageCount[card.rarity] = (usageCount[card.rarity] || 0) + 1;
        }
    });
    return usageCount;
  }, [cards]);

  return React.createElement('div', { className: 'space-y-4' },
    ...rarities.map((rarity, index) => {
        const isUsed = (rarityInUse[rarity.name] || 0) > 0;
        return React.createElement('div', { key: index, className: 'p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50' },
          React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'text-sm font-medium text-slate-600 dark:text-slate-300' }, 'Rarity Name'),
              React.createElement('input', { type: 'text', value: rarity.name, onChange: e => handleRarityChange(index, 'name', e.target.value), className: 'w-full mt-1 p-1.5 rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500 text-sm' })
            ),
            React.createElement('div', { className: 'flex justify-end items-center gap-2' },
              React.createElement('span', { className: `px-3 py-1.5 rounded-full text-sm font-semibold font-cuphead-text self-end mb-1 ${rarity.style.base} ${rarity.style.text}` }, 'Preview'),
              React.createElement('button', { onClick: () => handleRemoveRarity(index), disabled: isUsed, title: isUsed ? 'Cannot delete rarity while in use' : 'Delete Rarity', className: 'p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:text-slate-400/50 dark:disabled:text-slate-500/50 disabled:cursor-not-allowed self-end' },
                React.createElement(TrashIcon, { className: 'w-5 h-5' })
              )
            )
          ),
          React.createElement('div', { className: 'mt-3' },
            React.createElement('label', { className: 'text-sm font-medium text-slate-600 dark:text-slate-300' }, 'Color'),
            React.createElement('div', { className: 'mt-2 flex flex-wrap gap-2' },
              ...COLOR_PALETTE.map(color => {
                const isSelected = color.style.base === rarity.style.base;
                return React.createElement('button', {
                  type: 'button',
                  key: color.name,
                  onClick: () => handleRarityChange(index, 'style', color.style),
                  className: `w-7 h-7 rounded-full transition-transform duration-150 ${color.style.base} border border-black/10 dark:border-white/10 ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-700 scale-110' : 'hover:scale-110'}`,
                  title: color.name,
                  'aria-label': `Set rarity color to ${color.name}`
                });
              })
            )
          ),
          React.createElement('div', { className: 'mt-4' },
            React.createElement('label', { className: 'text-sm font-medium text-slate-600 dark:text-slate-300' }, 'Category'),
            React.createElement('div', { role: 'radiogroup', className: 'mt-2 flex gap-4' },
              React.createElement('label', { className: 'flex items-center gap-2 text-sm cursor-pointer' },
                React.createElement('input', { type: 'radio', name: `rarity-category-${index}`, value: 'Standard', checked: (rarity.category || 'Standard') === 'Standard', onChange: () => handleRarityChange(index, 'category', 'Standard'), className: 'form-radio text-blue-600 bg-slate-200 dark:bg-slate-600 border-slate-400 focus:ring-blue-500' }),
                React.createElement('span', null, 'Standard')
              ),
              React.createElement('label', { className: 'flex items-center gap-2 text-sm cursor-pointer' },
                React.createElement('input', { type: 'radio', name: `rarity-category-${index}`, value: 'Special', checked: rarity.category === 'Special', onChange: () => handleRarityChange(index, 'category', 'Special'), className: 'form-radio text-amber-600 bg-slate-200 dark:bg-slate-600 border-slate-400 focus:ring-amber-500' }),
                React.createElement('span', null, 'Special')
              )
            )
          )
        );
      }),
    React.createElement('button', { type: 'button', onClick: handleAddRarity, className: 'mt-3 w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-cuphead-text text-sm rounded-lg shadow-sm transition-colors' }, '+ Add New Rarity')
  );
};

const VariantEditor = ({ variants, setVariants, rarityDefinitions }) => {
    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };
    
    const handleAppliesToChange = (variantIndex, rarityName, isChecked) => {
        const newVariants = [...variants];
        const variant = newVariants[variantIndex];
        const currentAppliesTo = new Set(variant.appliesTo);
        if (isChecked) {
            currentAppliesTo.add(rarityName);
        } else {
            currentAppliesTo.delete(rarityName);
        }
        variant.appliesTo = Array.from(currentAppliesTo);
        setVariants(newVariants);
    };

    const handleAddVariant = () => {
        setVariants([...variants, {
            id: `variant-${Date.now()}`,
            name: `New Variant ${variants.length + 1}`,
            appliesTo: []
        }]);
    };

    const handleRemoveVariant = (indexToRemove) => {
        setVariants(variants.filter((_, index) => index !== indexToRemove));
    };

    return React.createElement('div', { className: 'space-y-4' },
        ...variants.map((variant, index) => (
          React.createElement('div', { key: variant.id, className: 'p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50' },
            React.createElement('div', { className: 'flex justify-between items-start gap-4' },
              React.createElement('div', { className: 'flex-grow' },
                React.createElement('label', { className: 'text-sm font-medium text-slate-600 dark:text-slate-300' }, 'Variant Name'),
                React.createElement('input', { type: 'text', value: variant.name, onChange: e => handleVariantChange(index, 'name', e.target.value), className: 'w-full mt-1 p-1.5 rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500 text-sm' })
              ),
              React.createElement('div', { className: 'flex-shrink-0 mt-6' },
                React.createElement('button', { type: 'button', onClick: () => handleRemoveVariant(index), title: 'Delete Variant', className: 'p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400' }, React.createElement(TrashIcon, { className: 'w-5 h-5' }))
              )
            ),
            React.createElement('div', { className: 'mt-3' },
              React.createElement('label', { className: 'text-sm font-medium text-slate-600 dark:text-slate-300' }, 'Applies To Rarities'),
              React.createElement('div', { className: 'mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2' },
                rarityDefinitions.length > 0 ? (
                  rarityDefinitions.map(rarityDef => {
                    const isChecked = variant.appliesTo.includes(rarityDef.name);
                    const checkboxId = `variant-${variant.id}-rarity-${rarityDef.name}`;
                    return React.createElement('label', { key: rarityDef.name, htmlFor: checkboxId, className: 'flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 -m-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600' },
                      React.createElement('input', { id: checkboxId, type: 'checkbox', checked: isChecked, onChange: e => handleAppliesToChange(index, rarityDef.name, e.target.checked), className: 'form-checkbox h-4 w-4 rounded text-blue-600 focus:ring-blue-500' }),
                      React.createElement('span', null, rarityDef.name)
                    );
                  })
                ) : (
                  React.createElement('p', { className: 'text-xs text-slate-500 col-span-full' }, 'No rarities defined. Add rarities first.')
                )
              )
            )
          )
        )),
      React.createElement('button', { type: 'button', onClick: handleAddVariant, className: 'mt-3 w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-cuphead-text text-sm rounded-lg shadow-sm transition-colors' }, '+ Add New Variant')
    );
};

const EditCollectionModal = ({ isOpen, onClose, onEditCard, onAddNewCard }) => {
  const { selectedCollection, editCollectionDetails, updateCollectionRarities, updateCollectionVariants, deleteCardFromCollection, deleteCollection, setLanguageForAllCards } = useCollections();
  const toast = useToast();

  const [initialState, setInitialState] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState([]);
  const [rarityDefinitions, setRarityDefinitions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [activeTab, setActiveTab] = useState('cards');
  
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isCollectionDeleteConfirmOpen, setIsCollectionDeleteConfirmOpen] = useState(false);
  const [isBulkLangConfirmOpen, setIsBulkLangConfirmOpen] = useState(false);
  const [bulkLanguage, setBulkLanguage] = useState('en');

  useEffect(() => {
    if (selectedCollection && isOpen) {
      const sortedCards = [...selectedCollection.cards].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      const initial = {
        name: selectedCollection.name,
        description: selectedCollection.description || '',
        cards: sortedCards,
        rarityDefinitions: JSON.parse(JSON.stringify(selectedCollection.rarityDefinitions || [])),
        variants: JSON.parse(JSON.stringify(selectedCollection.features?.variants || [])),
      };
      setInitialState(initial);
      setName(initial.name);
      setDescription(initial.description);
      setCards(initial.cards);
      setRarityDefinitions(initial.rarityDefinitions);
      setVariants(initial.variants);
      setActiveTab('cards'); // Reset to first tab on open
    }
  }, [selectedCollection, isOpen]);

  useEffect(() => {
      if (selectedCollection) {
          const sortedCards = [...selectedCollection.cards].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
          setCards(sortedCards);
      }
  }, [selectedCollection?.cards]);

  if (!isOpen || !selectedCollection || !initialState) return null;

  const handleSaveAndClose = () => {
    if (name !== initialState.name || description !== initialState.description) {
      editCollectionDetails(selectedCollection.id, name, description);
    }

    const initialRarityNames = new Set(initialState.rarityDefinitions.map(r => r.name));
    const newRarityNames = new Set(rarityDefinitions.map(r => r.name));
    const deletedRarityNames = [...initialRarityNames].filter(name => !newRarityNames.has(name));

    const nameChanges = [];
    initialState.rarityDefinitions.forEach((oldDef, index) => {
      if (rarityDefinitions[index] && oldDef.name !== rarityDefinitions[index].name) {
         nameChanges.push({ oldName: oldDef.name, newName: rarityDefinitions[index].name });
      }
    });

    updateCollectionRarities(selectedCollection.id, rarityDefinitions, nameChanges, deletedRarityNames);
    updateCollectionVariants(selectedCollection.id, variants);
    toast.success(`Collection "${name}" updated successfully.`);
    onClose();
  };

  const executeDeleteCard = () => {
    if (cardToDelete) {
      deleteCardFromCollection(selectedCollection.id, cardToDelete.id);
      toast.success(`Card "${cardToDelete.name}" deleted.`);
      setCardToDelete(null);
    }
  };
  
  const handleDeleteCollection = () => {
    if (selectedCollection) {
        deleteCollection(selectedCollection.id);
        toast.success(`Collection "${selectedCollection.name}" was deleted.`);
        onClose();
    }
  };

  const executeBulkSetLanguage = () => {
    setLanguageForAllCards(selectedCollection.id, bulkLanguage);
    toast.success(`All cards have been set to ${bulkLanguage}.`);
  };

  const cardDeleteConfirmationMessage = cardToDelete && React.createElement(React.Fragment, null,
    React.createElement('p', null, `Are you sure you want to delete the card "${cardToDelete.name}" (ID: ${cardToDelete.id})?`),
    React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );

  const collectionDeleteConfirmationMessage = React.createElement(React.Fragment, null,
    React.createElement('p', null, `Are you sure you want to permanently delete the collection "${selectedCollection?.name}"?`),
    React.createElement('p', { className: 'mt-1' }, 'All cards and progress within this collection will be lost.'),
    React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );
  
  const bulkLanguageConfirmationMessage = React.createElement(React.Fragment, null,
      React.createElement('p', null, `Are you sure you want to set the language for ALL ${cards.length} cards in this collection to "${bulkLanguage}"?`),
      React.createElement('p', { className: 'mt-1' }, 'This will overwrite any individual language settings on the cards.'),
      React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );

  const renderTabContent = () => {
    switch (activeTab) {
        case 'cards':
            return React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, `Cards (${cards.length})`),
                    React.createElement('button', { type: 'button', onClick: onAddNewCard, className: 'px-4 py-2 bg-emerald-600 text-white font-cuphead-text text-sm rounded-lg shadow hover:bg-emerald-700 transition-colors' }, '+ Add New Card')
                ),
                React.createElement('div', { className: 'mt-4 max-h-[calc(80vh-250px)] overflow-y-auto custom-scrollbar pr-2 -mr-2' },
                    React.createElement('ul', { className: 'divide-y divide-slate-200 dark:divide-slate-700' },
                        ...cards.map(card => React.createElement('li', { key: card.id, className: 'flex items-center justify-between py-3' },
                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                React.createElement('p', { className: 'text-sm font-bold text-slate-800 dark:text-slate-100 truncate', title: card.name }, card.name),
                                React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400' }, `ID: ${card.id} | Rarity: ${card.rarity || 'N/A'}`)
                            ),
                            React.createElement('div', { className: 'flex items-center gap-2 flex-shrink-0 ml-4' },
                                React.createElement('button', { type: 'button', onClick: () => onEditCard(card), className: 'p-2 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors', title: 'Edit Card' }, React.createElement(PencilIcon, { className: 'w-5 h-5' })),
                                React.createElement('button', { type: 'button', onClick: () => setCardToDelete(card), className: 'p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors', title: 'Delete Card' }, React.createElement(TrashIcon, { className: 'w-5 h-5' }))
                            )
                        ))
                    )
                )
            );
        case 'details':
            return React.createElement('div', { className: 'space-y-6' },
                React.createElement('div', null,
                  React.createElement('label', { htmlFor: 'collection-name', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Collection Name'),
                  React.createElement('input', { id: 'collection-name', type: 'text', value: name, onChange: e => setName(e.target.value), className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg' })
                ),
                React.createElement('div', null,
                  React.createElement('label', { htmlFor: 'collection-description', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Description'),
                  React.createElement('textarea', { id: 'collection-description', value: description, onChange: e => setDescription(e.target.value), rows: 3, className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg' })
                ),
                React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                  React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, 'Bulk Set Language'),
                  React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mt-1 mb-3' }, 'Apply a language to all cards in this collection at once. This will overwrite individual card language settings.'),
                  React.createElement('div', { className: 'flex items-stretch gap-2' },
                      React.createElement('select', { 
                          value: bulkLanguage, 
                          onChange: e => setBulkLanguage(e.target.value), 
                          className: 'flex-grow px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg'
                       },
                           React.createElement('option', { value: 'en' }, 'English'),
                           React.createElement('option', { value: 'it' }, 'Italian'),
                           React.createElement('option', { value: 'ja' }, 'Japanese'),
                           React.createElement('option', { value: 'de' }, 'German'),
                           React.createElement('option', { value: 'fr' }, 'French'),
                           React.createElement('option', { value: 'es' }, 'Spanish'),
                           React.createElement('option', { value: 'pt' }, 'Portuguese')
                      ),
                      React.createElement('button', { type: 'button', onClick: () => setIsBulkLangConfirmOpen(true), className: 'px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-cuphead-text text-sm rounded-lg shadow-sm transition-colors' }, 'Apply to All')
                  )
                )
            );
        case 'rarities':
            return React.createElement(RarityEditor, { rarities: rarityDefinitions, setRarities: setRarityDefinitions, cards: selectedCollection.cards });
        case 'variants':
            return React.createElement(VariantEditor, { variants: variants, setVariants: setVariants, rarityDefinitions: rarityDefinitions });
        case 'danger':
            return React.createElement('div', { className: 'p-4 border border-rose-500/50 dark:border-rose-500/70 rounded-lg bg-rose-50/50 dark:bg-rose-900/20' },
                React.createElement('h3', { className: 'font-cuphead-title text-xl text-rose-700 dark:text-rose-400 mb-2' }, 'Delete Collection'),
                React.createElement('p', { className: 'text-sm text-rose-600 dark:text-rose-400/80 mb-4' },
                    'Deleting a collection is permanent and cannot be undone. All cards and progress within this collection will be lost.'
                ),
                React.createElement('button', {
                    type: 'button',
                    onClick: () => setIsCollectionDeleteConfirmOpen(true),
                    className: 'w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white font-cuphead-text text-sm rounded-lg shadow-md hover:bg-rose-700 transition-colors'
                },
                    React.createElement(TrashIcon, { className: 'w-5 h-5' }),
                    React.createElement('span', null, 'Delete This Collection')
                )
            );
        default: return null;
    }
  };

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto font-cuphead-text', role: 'dialog', 'aria-modal': 'true' },
      React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl my-8 transform transition-all relative flex flex-col' },
        React.createElement('div', { className: 'p-4 pr-16 border-b border-slate-200 dark:border-slate-700' },
          React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400 truncate' }, `Edit: ${name}`)
        ),
        React.createElement('div', { className: 'flex-shrink-0 border-b border-slate-200 dark:border-slate-700' },
            React.createElement('nav', { className: 'flex space-x-2 px-4' },
                React.createElement(TabButton, { onClick: () => setActiveTab('cards'), isActive: activeTab === 'cards' }, `Cards (${cards.length})`),
                React.createElement(TabButton, { onClick: () => setActiveTab('details'), isActive: activeTab === 'details' }, 'Details & Settings'),
                React.createElement(TabButton, { onClick: () => setActiveTab('rarities'), isActive: activeTab === 'rarities' }, 'Rarities'),
                React.createElement(TabButton, { onClick: () => setActiveTab('variants'), isActive: activeTab === 'variants' }, 'Variants'),
                React.createElement(TabButton, { onClick: () => setActiveTab('danger'), isActive: activeTab === 'danger', isDanger: true }, 'Danger Zone')
            )
        ),
        React.createElement('div', { className: 'p-6 flex-grow overflow-y-auto', style: { minHeight: '50vh' } },
            renderTabContent()
        ),
        React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end flex-shrink-0' },
          React.createElement('button', { type: 'button', onClick: handleSaveAndClose, className: 'px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Save & Close')
        ),
        React.createElement('button', { type: 'button', onClick: onClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors', 'aria-label': 'Close' },
          React.createElement(CloseIcon, { className: 'w-6 h-6' })
        )
      )
    ),
    cardToDelete && React.createElement(ConfirmationModal, {
      isOpen: !!cardToDelete,
      onClose: () => setCardToDelete(null),
      onConfirm: executeDeleteCard,
      title: 'Delete Card?',
      message: cardDeleteConfirmationMessage,
      confirmButtonText: 'Yes, Delete Card'
    }),
    isCollectionDeleteConfirmOpen && React.createElement(ConfirmationModal, {
        isOpen: isCollectionDeleteConfirmOpen,
        onClose: () => setIsCollectionDeleteConfirmOpen(false),
        onConfirm: handleDeleteCollection,
        title: 'Delete Collection?',
        message: collectionDeleteConfirmationMessage,
        confirmButtonText: 'Yes, Delete Collection'
    }),
    isBulkLangConfirmOpen && React.createElement(ConfirmationModal, {
        isOpen: isBulkLangConfirmOpen,
        onClose: () => setIsBulkLangConfirmOpen(false),
        onConfirm: executeBulkSetLanguage,
        title: 'Set All Card Languages?',
        message: bulkLanguageConfirmationMessage,
        confirmButtonText: 'Yes, Set All'
    })
  );
};

export default EditCollectionModal;
