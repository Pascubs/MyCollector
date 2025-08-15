import React, { useMemo, useState } from 'react';
import { useCollections } from '../context.js';
import { CloseIcon, PlusCircleIcon } from '../icons.js';
import ConfirmationModal from './ConfirmationModal.js';
import { useToast } from '../toastContext.js';
import CollectionCard from './CollectionCard.js';

const AddNewCollectionCard = ({ onClick }) => (
    React.createElement('button', {
        onClick: (e) => {
            e.stopPropagation();
            onClick();
        },
        className: 'font-cuphead-text group aspect-[2/3] flex flex-col items-center justify-center p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 bg-slate-200/50 dark:bg-slate-800/50 border-4 border-dashed border-slate-400 dark:border-slate-600 hover:border-blue-500'
    },
        React.createElement(PlusCircleIcon, { className: 'w-20 h-20 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors' }),
        React.createElement('span', { className: 'mt-2 font-cuphead-title text-2xl text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400' }, 'Add New')
    )
);

const CollectionShowcaseModal = ({ isOpen, onClose, onAddNew, setView }) => {
    const { collections, selectCollection, toggleCollectionPin, reorderCollections, deleteCollection } = useCollections();
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggedId, setDraggedId] = useState(null);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    
    const { basicCollections, customCollections } = useMemo(() => {
        const basic = collections.filter(c => !(c.isCustom || false));
        const custom = collections.filter(c => (c.isCustom || false));

        const sortWithinGroup = (group) => {
            const pinned = group.filter(c => c.isPinned);
            const unpinned = group.filter(c => !c.isPinned);
            return [...pinned, ...unpinned];
        };

        return {
            basicCollections: sortWithinGroup(basic),
            customCollections: sortWithinGroup(custom),
        };
    }, [collections]);

    const handleSelectCollection = (id) => {
        selectCollection(id);
        setView('shelf');
        onClose();
    };
    
    const handleBrowseCatalog = () => {
        onClose();
        setView('catalog');
    };
    
    const handleDragStart = (id) => {
        setDraggedId(id);
    };

    const handleDragEnter = (e, targetId) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const collectionsCopy = [...collections];
        const draggedItem = collectionsCopy.find(c => c.id === draggedId);
        const targetItem = collectionsCopy.find(c => c.id === targetId);

        if (!draggedItem || !targetItem) return;

        // Prevent moving between custom and basic sections
        if ((draggedItem.isCustom || false) !== (targetItem.isCustom || false)) {
            return;
        }

        // Prevent moving between pinned and unpinned sections
        if (draggedItem.isPinned !== targetItem.isPinned) {
            return;
        }
        
        const draggedIndex = collectionsCopy.findIndex(c => c.id === draggedId);
        const targetIndex = collectionsCopy.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [movedItem] = collectionsCopy.splice(draggedIndex, 1);
        collectionsCopy.splice(targetIndex, 0, movedItem);
        
        reorderCollections(collectionsCopy);
    };
    
    const handleDragEnd = () => {
        setDraggedId(null);
    };
    
    const handleDeleteCollection = () => {
        if (collectionToDelete) {
            deleteCollection(collectionToDelete.id);
            setCollectionToDelete(null);
        }
    };
    
    const deleteConfirmationMessage = collectionToDelete && React.createElement(React.Fragment, null,
      React.createElement('p', null, `Are you sure you want to permanently delete the collection "${collectionToDelete.name}"?`),
      React.createElement('p', { className: 'mt-1' }, 'All cards and progress within this collection will be lost.'),
      React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
    );

    if (!isOpen) return null;

    const CollectionSection = ({ title, collections, isCustomSection }) => (
        React.createElement('section', { 'aria-labelledby': `${title.toLowerCase().replace(/\s/g, '-')}-heading` },
          React.createElement('h3', { id: `${title.toLowerCase().replace(/\s/g, '-')}-heading`, className: 'font-cuphead-title text-2xl text-slate-300 mb-4 pl-1' }, title),
          React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6' },
            ...collections.map(collection => (
              React.createElement(CollectionCard, {
                key: collection.id,
                collection: collection,
                isOwned: true,
                onSelect: handleSelectCollection,
                onPinToggle: toggleCollectionPin,
                isEditMode: isEditMode,
                onDragStart: () => handleDragStart(collection.id),
                onDragEnter: (e) => handleDragEnter(e, collection.id),
                onDragEnd: handleDragEnd,
                onDelete: () => setCollectionToDelete(collection)
              })
            )),
            isCustomSection && !isEditMode && React.createElement(AddNewCollectionCard, { onClick: onAddNew })
          )
        )
    );

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', {
                onClick: onClose,
                className: 'fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 p-4 sm:p-8 flex flex-col font-cuphead-text animate-fade-in',
                role: 'dialog',
                'aria-modal': 'true',
                'data-tour-id': 'collection-showcase'
            },
                React.createElement('div', {
                    onClick: (e) => e.stopPropagation(),
                    className: 'flex-shrink-0 flex justify-between items-center mb-6'
                },
                    React.createElement('div', { className: 'flex items-center gap-x-6' },
                        React.createElement('h2', { className: 'font-cuphead-title text-4xl text-white' }, 'My Shelf'),
                        React.createElement('button', {
                            onClick: handleBrowseCatalog,
                            className: 'px-4 py-2 text-base font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors'
                        }, 'Browse Catalog')
                    ),
                    React.createElement('div', { className: 'flex items-center gap-4' },
                        React.createElement('button', {
                            onClick: () => setIsEditMode(prev => !prev),
                            className: 'px-6 py-2 text-lg font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors'
                        }, isEditMode ? 'Done' : 'Edit'),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'p-2 rounded-full text-slate-300 bg-white/10 hover:bg-white/20 transition-colors',
                            'aria-label': 'Close collection showcase'
                        },
                            React.createElement(CloseIcon, { className: 'w-8 h-8' })
                        )
                    )
                ),
                React.createElement('div', { className: 'flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 pt-4' },
                    React.createElement('div', { className: 'space-y-10' },
                        React.createElement(CollectionSection, { 
                            title: 'My Custom Collections', 
                            collections: customCollections, 
                            isCustomSection: true 
                        }),
                        basicCollections.length > 0 && React.createElement(CollectionSection, { 
                            title: 'From the Catalog', 
                            collections: basicCollections, 
                            isCustomSection: false 
                        })
                    )
                )
            ),
            collectionToDelete && React.createElement(ConfirmationModal, {
                isOpen: !!collectionToDelete,
                onClose: () => setCollectionToDelete(null),
                onConfirm: handleDeleteCollection,
                title: 'Delete Collection?',
                message: deleteConfirmationMessage,
                confirmButtonText: 'Yes, Delete'
            })
        )
    );
};

export default CollectionShowcaseModal;