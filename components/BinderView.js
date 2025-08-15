

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import BinderCard from './BinderCard.js';
import AddCardToBinderModal from './AddCardToBinderModal.js';
import { PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons.js';

const BinderView = ({ cards, pocketCount, sortMode, zoomLevel, onBinderZoomLevelChange, currentPage, onPageChange, totalPages, onEditCard }) => {
    const { selectedCollection, updateBinderSlots } = useCollections();
    const toast = useToast();
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [addCardTargetIndex, setAddCardTargetIndex] = useState(null);

    const binderRef = useRef(null);
    const initialTouchDistRef = useRef(null);
    const zoomOnTouchStartRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                if (currentPage > 1) {
                    onPageChange(currentPage - 1);
                }
            } else if (e.key === 'ArrowRight') {
                if (currentPage < totalPages) {
                    onPageChange(currentPage + 1);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, onPageChange]);

    useEffect(() => {
        const binderElement = binderRef.current;
        if (!binderElement) return;

        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomSpeed = 0.0015;
                const zoomFactor = 1 - e.deltaY * zoomSpeed;
                const newZoom = zoomLevel * zoomFactor;
                onBinderZoomLevelChange(newZoom);
            }
        };

        const getTouchDistance = (touches) => {
            const touch1 = touches[0];
            const touch2 = touches[1];
            return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialTouchDistRef.current = getTouchDistance(e.touches);
                zoomOnTouchStartRef.current = zoomLevel;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && initialTouchDistRef.current !== null && zoomOnTouchStartRef.current !== null) {
                e.preventDefault();
                const currentDist = getTouchDistance(e.touches);
                const scale = currentDist / initialTouchDistRef.current;
                const newZoom = zoomOnTouchStartRef.current * scale;
                onBinderZoomLevelChange(newZoom);
            }
        };

        const handleTouchEnd = () => {
            initialTouchDistRef.current = null;
            zoomOnTouchStartRef.current = null;
        };
        
        binderElement.addEventListener('wheel', handleWheel, { passive: false });
        binderElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        binderElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        binderElement.addEventListener('touchend', handleTouchEnd);
        binderElement.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            binderElement.removeEventListener('wheel', handleWheel);
            binderElement.removeEventListener('touchstart', handleTouchStart);
            binderElement.removeEventListener('touchmove', handleTouchMove);
            binderElement.removeEventListener('touchend', handleTouchEnd);
            binderElement.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [zoomLevel, onBinderZoomLevelChange]);


    if (currentPage > totalPages) {
        onPageChange(1);
    }

    const startIndex = (currentPage - 1) * pocketCount;
    const cardsOnPage = cards.slice(startIndex, startIndex + pocketCount);

    const unplacedCards = useMemo(() => {
        if (sortMode !== 'custom' || !selectedCollection) return [];
        const placedCardIds = new Set((selectedCollection.features?.binderSlots || []).filter(Boolean));
        return selectedCollection.cards
            .filter(c => !placedCardIds.has(c.id))
            .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }));
    }, [selectedCollection?.cards, selectedCollection?.features?.binderSlots, sortMode]);

    const handleDragStart = (e, cardId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // This is crucial to allow dropping
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        setDragOverIndex(startIndex + index);
    };
    
    const handleDragLeave = (e) => {
        // Only clear the highlight if the cursor leaves the element and its children
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e, targetPageIndex) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (!selectedCollection || sortMode !== 'custom') return;

        const fullTargetIndex = startIndex + targetPageIndex;
        const draggedCardId = e.dataTransfer.getData('text/plain');

        if (!draggedCardId) return;

        let currentSlots = [...(selectedCollection.features?.binderSlots || [])];
        const draggedItemIndexInSlots = currentSlots.indexOf(draggedCardId);

        const requiredLength = Math.max(draggedItemIndexInSlots, fullTargetIndex) + 1;
        while (currentSlots.length < requiredLength) {
            currentSlots.push(null);
        }
        
        const cardInTargetSlot = currentSlots[fullTargetIndex];
        
        if (draggedItemIndexInSlots === fullTargetIndex) return;

        // Case 1: Dragging from the unplaced list or swapping with an unplaced card
        if (draggedItemIndexInSlots === -1) {
            if (currentSlots.includes(draggedCardId)) {
                toast.error("This card is already placed in the binder.");
                return;
            }
            currentSlots[fullTargetIndex] = draggedCardId;
            updateBinderSlots(selectedCollection.id, currentSlots);
            toast.success(`Card placed in binder.`);
        }
        // Case 2: Swapping cards already within the binder
        else {
            currentSlots[fullTargetIndex] = draggedCardId;
            currentSlots[draggedItemIndexInSlots] = cardInTargetSlot; // Swap back
            updateBinderSlots(selectedCollection.id, currentSlots);
        }
    };
    
    const handleRemoveFromBinder = (cardIdToRemove) => {
        if (!selectedCollection) return;

        const currentSlots = [...(selectedCollection.features?.binderSlots || [])];
        const indexToRemove = currentSlots.findIndex(id => id === cardIdToRemove);
        
        if (indexToRemove !== -1) {
            currentSlots[indexToRemove] = null; // Replace with null to leave an empty slot
            updateBinderSlots(selectedCollection.id, currentSlots);
            toast.info("Card removed from binder slot.");
        }
    };

    const handleOpenAddCardModal = (targetIndex) => {
        setAddCardTargetIndex(targetIndex);
        setIsAddCardModalOpen(true);
    };

    const handleCardSelect = (cardId) => {
        if (addCardTargetIndex === null || !selectedCollection) return;

        const fullTargetIndex = startIndex + addCardTargetIndex;
        const currentSlots = [...(selectedCollection.features?.binderSlots || [])];
        
        while (currentSlots.length <= fullTargetIndex) {
            currentSlots.push(null);
        }

        if (currentSlots[fullTargetIndex] !== null) {
            toast.error("This binder slot is already occupied.");
            return;
        }

        currentSlots[fullTargetIndex] = cardId;

        updateBinderSlots(selectedCollection.id, currentSlots);
        setIsAddCardModalOpen(false);
        setAddCardTargetIndex(null);
        toast.success("Card added to binder.");
    };

    const gridClass = pocketCount === 12 ? 'grid grid-cols-4 gap-4' : 'grid grid-cols-3 gap-4';

    const binderStyle = {
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-out',
    };

    const pockets = [];
    for (let i = 0; i < pocketCount; i++) {
        const card = cardsOnPage[i];
        const isDragOver = (startIndex + i) === dragOverIndex;
        
        const emptyPocketContent = sortMode === 'custom'
            ? React.createElement('button', {
                onClick: () => handleOpenAddCardModal(i),
                className: 'group w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200'
              },
              React.createElement(PlusCircleIcon, { className: 'w-10 h-10 transition-transform group-hover:scale-110' })
            )
            : React.createElement('div', { className: 'w-full h-full' });

        pockets.push(React.createElement('div', {
                key: `pocket-${i}`,
                onDragEnter: (e) => sortMode === 'custom' && handleDragEnter(e, i),
                onDragOver: (e) => sortMode === 'custom' && handleDragOver(e),
                onDragLeave: (e) => sortMode === 'custom' && handleDragLeave(e),
                onDrop: (e) => sortMode === 'custom' && handleDrop(e, i),
                className: `aspect-[5/7] rounded-lg transition-all flex items-center justify-center ${isDragOver ? 'bg-blue-200 dark:bg-blue-800 scale-105 shadow-2xl' : 'bg-slate-100 dark:bg-slate-800'}`
            },
            card ? React.createElement(BinderCard, {
                card: card,
                isDraggable: sortMode === 'custom',
                onDragStart: (e) => handleDragStart(e, card.id),
                onDragEnd: null,
                onEdit: () => onEditCard(card),
                onRemove: () => handleRemoveFromBinder(card.id),
            }) : emptyPocketContent
        ));
    }
    
    return React.createElement(React.Fragment, null,
        React.createElement('div', {
            ref: binderRef,
            className: 'flex items-center justify-center gap-x-2 sm:gap-x-4 touch-none w-full h-full'
        },
            React.createElement('button', {
              onClick: () => onPageChange(currentPage - 1),
              disabled: currentPage === 1,
              className: 'flex-shrink-0 p-3 bg-slate-800/50 text-white rounded-full backdrop-blur-sm hover:bg-slate-800/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all',
              'aria-label': 'Previous Page'
            }, React.createElement(ChevronLeftIcon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })),
            
            React.createElement('div', { className: 'py-4 flex-1 min-w-0' },
                React.createElement('div', { style: binderStyle, className: `${gridClass} w-full max-w-6xl mx-auto` }, ...pockets)
            ),
            
            React.createElement('button', {
              onClick: () => onPageChange(currentPage + 1),
              disabled: currentPage >= totalPages,
              className: 'flex-shrink-0 p-3 bg-slate-800/50 text-white rounded-full backdrop-blur-sm hover:bg-slate-800/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all',
              'aria-label': 'Next Page'
            }, React.createElement(ChevronRightIcon, { className: 'w-6 h-6 sm:w-8 sm:h-8' }))
        ),
        isAddCardModalOpen && React.createElement(AddCardToBinderModal, {
            isOpen: isAddCardModalOpen,
            onClose: () => setIsAddCardModalOpen(false),
            onCardSelect: handleCardSelect,
            availableCards: unplacedCards
        })
    );
};

export default BinderView;