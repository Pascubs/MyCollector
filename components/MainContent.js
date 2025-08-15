import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { useCollections } from '../context.js';
import { useLocalStorage, useFilteredCards } from '../hooks.js';
import { useToast } from '../toastContext.js';
import Sidebar from './Sidebar.js';
import CardList from './CardList.js';
import BinderView from './BinderView.js';
import SearchAndFilterControls from './SearchAndFilterControls.js';
import UnplacedCardsIndicator from './UnplacedCardsIndicator.js';
import ConfirmationModal from './ConfirmationModal.js';
import { BookOpenIcon } from '../icons.js';

const LOCAL_STORAGE_KEY_VIEW_MODE = 'myCollectorViewMode_v2';
const LOCAL_STORAGE_KEY_RARITY_FILTER = 'myCollectorRarityFilter_v3';
const LOCAL_STORAGE_KEY_SET_MODE = 'myCollectorSetMode_v1';
const LOCAL_STORAGE_KEY_SORT_BY = 'myCollectorSortBy_v2';
const LOCAL_STORAGE_KEY_SORT_DIR = 'myCollectorSortDir_v2';
const LOCAL_STORAGE_KEY_BINDER_POCKETS = 'myCollectorBinderPockets_v1';
const LOCAL_STORAGE_KEY_BINDER_SORT = 'myCollectorBinderSort_v1';
const LOCAL_STORAGE_KEY_BINDER_ZOOM = 'myCollectorBinderZoom_v1';
const CARDS_PER_PAGE = 20;

const MainContent = ({ 
  isSidebarOpen, setIsSidebarOpen, 
  isFilterPanelOpen, setIsFilterPanelOpen, 
  isTutorialActive, 
  onEditCollection, onFileForStatusImport, onEditCard, onAddNew
}) => {
  const { selectedCollection, collections, resetCollection, updateBinderSlots } = useCollections();
  const toast = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [filterCollected, setFilterCollected] = useState('all');
  const [viewMode, setViewMode] = useLocalStorage(LOCAL_STORAGE_KEY_VIEW_MODE, 'list');
  
  const initialRarityFilterValue = useMemo(() => ({ rarity: null, buttonName: null }), []);
  const [rarityFilterState, setRarityFilterState] = useLocalStorage(LOCAL_STORAGE_KEY_RARITY_FILTER, initialRarityFilterValue);
  
  const [setMode, setSetMode] = useLocalStorage(LOCAL_STORAGE_KEY_SET_MODE, 'standard');
  const [sortBy, setSortBy] = useLocalStorage(LOCAL_STORAGE_KEY_SORT_BY, 'id');
  const [sortDirection, setSortDirection] = useLocalStorage(LOCAL_STORAGE_KEY_SORT_DIR, 'asc');
  
  const [isBinderMode, setIsBinderMode] = useState(false);
  const [binderPocketCount, setBinderPocketCount] = useLocalStorage(LOCAL_STORAGE_KEY_BINDER_POCKETS, 9);
  const [binderSortMode, setBinderSortMode] = useLocalStorage(LOCAL_STORAGE_KEY_BINDER_SORT, 'standard');
  const [binderZoomLevel, setBinderZoomLevel] = useLocalStorage(LOCAL_STORAGE_KEY_BINDER_ZOOM, 50);
  const [binderCurrentPage, setBinderCurrentPage] = useState(1);
  
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearPlacementsConfirmOpen, setIsClearPlacementsConfirmOpen] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(CARDS_PER_PAGE);

  const scrollableContainerRef = useRef(null);
  
  const collectionId = selectedCollection?.id;

  // --- Binder Zoom Logic ---
  const maxBinderZoom = useMemo(() => {
    return binderPocketCount === 12 ? 65 : 50;
  }, [binderPocketCount]);

  const handleBinderPocketCountChange = (count) => {
    setBinderPocketCount(count);
    const newDefaultZoom = count === 12 ? 65 : 50;
    setBinderZoomLevel(newDefaultZoom);
  };

  const handleBinderZoomLevelChange = (newZoom) => {
    // Clamp the zoom value within the allowed range for the current view
    setBinderZoomLevel(Math.max(10, Math.min(newZoom, maxBinderZoom)));
  };
  
  // This effect ensures that if the stored zoom is invalid for the current pocket count on load, it gets corrected.
  useEffect(() => {
    if (binderZoomLevel > maxBinderZoom) {
      setBinderZoomLevel(maxBinderZoom);
    }
  }, [binderPocketCount, binderZoomLevel, maxBinderZoom, setBinderZoomLevel]);
  // --- End Binder Zoom Logic ---

  useEffect(() => {
    setSearchTerm('');
    setFilterCollected('all');
    setRarityFilterState({ rarity: null, buttonName: null });
    setVisibleItemsCount(CARDS_PER_PAGE);
    setBinderCurrentPage(1);
    setIsBinderMode(false);
  }, [collectionId, setRarityFilterState]); 

  useEffect(() => {
    if (selectedCollection) {
        const hasSpecial = (selectedCollection.rarityDefinitions || []).some(r => r.category === 'Special');
        const hasVars = (selectedCollection.features?.variants?.length || 0) > 0;
        if (!hasSpecial && !hasVars) {
            setSetMode('standard');
        }
    }
  }, [selectedCollection, setSetMode]);

  useEffect(() => {
    setVisibleItemsCount(CARDS_PER_PAGE);
    setBinderCurrentPage(1);
    scrollableContainerRef.current?.scrollTo(0, 0);
  }, [deferredSearchTerm, filterCollected, rarityFilterState, sortBy, sortDirection, viewMode, binderSortMode, isBinderMode]);

  const handleRarityFilterChange = (buttonName, rarityValue) => {
    setRarityFilterState(prevState => {
      if (prevState.buttonName === buttonName) {
        return { rarity: null, buttonName: null };
      }
      return { rarity: rarityValue, buttonName };
    });
  };

  const handleResetCollection = () => {
    if (selectedCollection) {
      setIsResetConfirmOpen(true);
    }
  };

  const executeResetCollection = () => {
    if (selectedCollection) {
      resetCollection(selectedCollection.id);
      setRarityFilterState({ rarity: null, buttonName: null });
      setVisibleItemsCount(CARDS_PER_PAGE);
    }
  };
  
  const executeClearBinderPlacements = () => {
    if (selectedCollection) {
        updateBinderSlots(selectedCollection.id, []);
        toast.info("Binder placements cleared. All cards are now unplaced.");
    }
  };

  const handleLoadMore = () => {
    setVisibleItemsCount(prevCount => prevCount + CARDS_PER_PAGE);
  };
  
  const cardsForView = useFilteredCards({
    selectedCollection,
    isBinderMode,
    binderSortMode,
    deferredSearchTerm,
    filterCollected,
    rarityFilterState,
    sortBy,
    sortDirection
  });

  const totalBinderPages = Math.ceil(cardsForView.length / binderPocketCount) || 1;

  const visibleCardsForList = useMemo(() => {
    return cardsForView.slice(0, visibleItemsCount);
  }, [cardsForView, visibleItemsCount]);

  const { unplacedCards, unplacedCardCount } = useMemo(() => {
      if (!selectedCollection || !isBinderMode || binderSortMode !== 'custom') {
          return { unplacedCards: [], unplacedCardCount: 0 };
      }
      
      const placedCardIds = new Set((selectedCollection.features?.binderSlots || []).filter(Boolean));
      const unplaced = selectedCollection.cards
          .filter(c => !placedCardIds.has(c.id))
          .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }));
          
      return { unplacedCards: unplaced, unplacedCardCount: unplaced.length };
  }, [selectedCollection, isBinderMode, binderSortMode]);

  const resetConfirmationMessage = React.createElement(React.Fragment, null,
    React.createElement('p', null, `Are you sure you want to reset the collection "${selectedCollection?.name}"?`),
    React.createElement('p', { className: 'mt-1' }, 'This will mark all its cards as uncollected (including variant status).'),
    React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );
  
  const clearPlacementsConfirmationMessage = React.createElement(React.Fragment, null,
    React.createElement('p', null, `Are you sure you want to clear all custom card placements for "${selectedCollection?.name}"?`),
    React.createElement('p', { className: 'mt-1' }, 'All cards will be un-placed and ready to be re-ordered.'),
    React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );
  
  const sidebarContent = selectedCollection && React.createElement(Sidebar, {
    setMode: setMode,
    onSetModeChange: setSetMode,
    activeButtonName: rarityFilterState.buttonName,
    onRarityFilterChange: handleRarityFilterChange,
    onEdit: onEditCollection,
    onFileForStatusImport: onFileForStatusImport
  });

  const mainRenderContent = isBinderMode
    ? React.createElement(BinderView, {
        cards: cardsForView,
        pocketCount: binderPocketCount,
        sortMode: binderSortMode,
        zoomLevel: binderZoomLevel,
        onBinderZoomLevelChange: handleBinderZoomLevelChange,
        currentPage: binderCurrentPage,
        onPageChange: setBinderCurrentPage,
        totalPages: totalBinderPages,
        onEditCard: (card) => onEditCard(card, false),
      })
    : cardsForView.length > 0
      ? React.createElement(CardList, { cards: visibleCardsForList, viewMode: viewMode, isTutorialActive: isTutorialActive })
      : React.createElement('div', { className: 'text-center text-slate-600 dark:text-slate-400 font-cuphead-text text-2xl py-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700' },
          React.createElement('p', null, 'No cards match your search or filter.'),
          React.createElement('p', { className: 'text-lg mt-2' }, 'Try adjusting your criteria!'),
          rarityFilterState.buttonName && React.createElement('span', { className: 'block mt-4 text-base' },
            `Current rarity filter: '${rarityFilterState.buttonName}'.`,
            React.createElement('br'),
            'Click it again in the summary to clear.'
          )
        );
        
  const contentContainerClass = isBinderMode
    ? 'flex-1 flex items-center justify-center p-4 overflow-hidden'
    : 'flex-1 overflow-y-auto px-4 pt-4 pb-8';

  return React.createElement(React.Fragment, null,
    isResetConfirmOpen && selectedCollection && React.createElement(ConfirmationModal, {
      isOpen: isResetConfirmOpen,
      onClose: () => setIsResetConfirmOpen(false),
      onConfirm: executeResetCollection,
      title: 'Reset Collection?',
      message: resetConfirmationMessage,
      confirmButtonText: 'Yes, Reset'
    }),
    isClearPlacementsConfirmOpen && selectedCollection && React.createElement(ConfirmationModal, {
      isOpen: isClearPlacementsConfirmOpen,
      onClose: () => setIsClearPlacementsConfirmOpen(false),
      onConfirm: executeClearBinderPlacements,
      title: 'Clear Placements?',
      message: clearPlacementsConfirmationMessage,
      confirmButtonText: 'Yes, Clear'
    }),
    React.createElement('div', { className: 'container mx-auto flex-1' },
      React.createElement('div', { className: 'flex flex-row gap-8 h-full' },
        collections.length > 0 && React.createElement('aside', { className: 'hidden lg:block lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-[69px] lg:h-[calc(100vh-69px)]' },
            React.createElement('div', { className: 'h-full overflow-y-auto py-6' }, sidebarContent)
        ),
        isSidebarOpen && React.createElement('div', {
            className: 'fixed inset-0 bg-black/60 z-40 lg:hidden',
            onClick: () => setIsSidebarOpen(false),
            'aria-hidden': 'true'
        }),
        React.createElement('aside', {
            className: `fixed top-0 left-0 h-full w-80 bg-slate-50 dark:bg-slate-900 z-50 transform transition-transform ease-in-out duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        },
            React.createElement('div', { className: 'h-full overflow-y-auto py-6' }, sidebarContent)
        ),
        React.createElement('main', { className: 'flex-1 min-w-0 flex flex-col lg:h-[calc(100vh-69px)] bg-slate-50 dark:bg-slate-900 rounded-xl' },
          selectedCollection ? (
            React.createElement(React.Fragment, null,
              React.createElement('div', { className: 'relative flex-shrink-0 z-20 px-4 pt-6' },
                React.createElement(SearchAndFilterControls, {
                  searchTerm: searchTerm,
                  onSearchTermChange: setSearchTerm,
                  selectedCollectionName: selectedCollection.name,
                  filterCollected: filterCollected,
                  onFilterCollectedChange: setFilterCollected,
                  viewMode: viewMode,
                  onViewModeChange: setViewMode,
                  sortBy: sortBy,
                  onSortByChange: setSortBy,
                  sortDirection: sortDirection,
                  onSortDirectionChange: setSortDirection,
                  isBinderMode: isBinderMode,
                  setIsBinderMode: setIsBinderMode,
                  binderPocketCount: binderPocketCount,
                  onBinderPocketCountChange: handleBinderPocketCountChange,
                  binderSortMode: binderSortMode,
                  onBinderSortModeChange: setBinderSortMode,
                  binderZoomLevel: binderZoomLevel,
                  onBinderZoomLevelChange: handleBinderZoomLevelChange,
                  maxBinderZoom: maxBinderZoom,
                  binderCurrentPage: binderCurrentPage,
                  totalBinderPages: totalBinderPages,
                  setBinderCurrentPage: setBinderCurrentPage,
                  customFields: selectedCollection.features?.customFields || [],
                  onResetCollection: handleResetCollection,
                  onClearBinderPlacements: () => setIsClearPlacementsConfirmOpen(true),
                  isPanelOpen: isFilterPanelOpen,
                  setIsPanelOpen: setIsFilterPanelOpen,
                  unplacedCardCount: unplacedCardCount,
                  unplacedCards: unplacedCards,
                })
              ),
              React.createElement('div', { ref: scrollableContainerRef, className: contentContainerClass },
                mainRenderContent,
                !isBinderMode && visibleItemsCount < cardsForView.length && React.createElement('div', { className: 'text-center mt-8' },
                    React.createElement('button', {
                        onClick: handleLoadMore,
                        className: 'px-8 py-3 bg-blue-800 text-white font-cuphead-text rounded-lg shadow-lg hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all transform hover:scale-105',
                        'data-tour-id': 'load-more'
                    }, 'Load More Cards')
                )
              )
            )
          ) : (
            React.createElement('div', { className: 'flex-1 flex flex-col items-center justify-center p-6 text-center' },
              React.createElement('div', { className: 'max-w-md' },
                React.createElement(BookOpenIcon, { className: 'w-24 h-24 mx-auto text-slate-300 dark:text-slate-600' }),
                React.createElement('h2', { className: 'font-cuphead-title text-4xl text-slate-700 dark:text-slate-200 mt-4' }, 'No Collection Selected'),
                React.createElement('p', { className: 'font-cuphead-text text-lg text-slate-500 dark:text-slate-400 mt-2' }, 
                  "Click 'My Shelf' in the header to choose a collection to view."
                )
              )
            )
          )
        )
      )
    )
  );
};

export default MainContent;
