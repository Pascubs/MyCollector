import React, { useRef, useEffect, useState } from 'react';
import { useOnClickOutside } from '../hooks.js';
import { RefreshIcon, ViewGridIcon, ViewListIcon, FunnelIcon, TrashIcon, Cog8ToothIcon } from '../icons.js';
import UnplacedCardsIndicator from './UnplacedCardsIndicator.js';

const SearchAndFilterControls = ({
  searchTerm,
  onSearchTermChange,
  selectedCollectionName,
  filterCollected,
  onFilterCollectedChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  customFields,
  onResetCollection,
  isBinderMode,
  setIsBinderMode,
  binderPocketCount,
  onBinderPocketCountChange,
  binderSortMode,
  onBinderSortModeChange,
  binderZoomLevel,
  onBinderZoomLevelChange,
  maxBinderZoom,
  binderCurrentPage,
  totalBinderPages,
  setBinderCurrentPage,
  onClearBinderPlacements,
  isPanelOpen,
  setIsPanelOpen,
  unplacedCardCount,
  unplacedCards,
}) => {
  const popoverRef = useRef(null);
  useOnClickOutside(popoverRef, () => setIsPanelOpen(false));
  const [pageInput, setPageInput] = useState(binderCurrentPage.toString());

  useEffect(() => {
    setIsPanelOpen(false);
  }, [isBinderMode, setIsPanelOpen]);

  useEffect(() => {
    setPageInput(binderCurrentPage.toString());
  }, [binderCurrentPage]);

  const handlePageJump = () => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum)) {
      const clampedPage = Math.max(1, Math.min(pageNum, totalBinderPages));
      setBinderCurrentPage(clampedPage);
    } else {
      setPageInput(binderCurrentPage.toString());
    }
  };

  const selectClass = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200';

  const browseModeContent = React.createElement('div', { className: 'p-4 space-y-4' },
    React.createElement('div', { className: 'space-y-3' },
        React.createElement('select', {
          value: filterCollected, onChange: (e) => onFilterCollectedChange(e.target.value),
          className: selectClass, 'aria-label': 'Filter cards by collected status'
        },
          React.createElement('option', { value: 'all' }, 'Show: All Cards'),
          React.createElement('option', { value: 'collected' }, 'Show: Collected'),
          React.createElement('option', { value: 'uncollected' }, 'Show: Uncollected')
        ),
        React.createElement('select', {
          value: sortBy, onChange: (e) => onSortByChange(e.target.value),
          className: selectClass, 'aria-label': 'Sort cards by'
        },
          React.createElement('option', { value: 'id' }, 'Sort by: Card ID'),
          React.createElement('option', { value: 'name' }, 'Sort by: Name'),
          React.createElement('option', { value: 'rarity' }, 'Sort by: Rarity'),
          ...(customFields || []).map(field => React.createElement('option', { key: field.key, value: field.key }, `Sort by: ${field.label}`))
        ),
        React.createElement('select', {
            value: sortDirection, onChange: (e) => onSortDirectionChange(e.target.value),
            className: selectClass, 'aria-label': 'Sort direction'
        },
            React.createElement('option', { value: 'asc' }, 'Direction: Ascending'),
            React.createElement('option', { value: 'desc' }, 'Direction: Descending')
        )
    ),
    React.createElement('div', { className: 'flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700' },
        React.createElement('span', { className: 'text-sm font-semibold text-slate-500 dark:text-slate-400' }, 'View:'),
        React.createElement('div', { className: 'flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg' },
          React.createElement('button', { onClick: () => onViewModeChange('list'), title: 'List View', 'aria-pressed': viewMode === 'list', className: `p-1.5 rounded-md transition-colors duration-200 ${viewMode === 'list' ? 'bg-blue-800 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}` },
            React.createElement(ViewListIcon, { className: 'w-5 h-5' })
          ),
          React.createElement('button', { onClick: () => onViewModeChange('grid'), title: 'Grid View', 'aria-pressed': viewMode === 'grid', className: `p-1.5 rounded-md transition-colors duration-200 ${viewMode === 'grid' ? 'bg-blue-800 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'}` },
            React.createElement(ViewGridIcon, { className: 'w-5 h-5' })
          )
        )
    ),
    React.createElement('div', { className: 'pt-3 border-t border-slate-200 dark:border-slate-700' },
        React.createElement('button', {
          onClick: onResetCollection,
          className: 'w-full flex items-center justify-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors',
          title: 'Reset Selected Collection'
        },
          React.createElement(RefreshIcon, { className: 'w-5 h-5' }),
          React.createElement('span', { className: 'text-sm font-semibold' }, 'Reset Collection Progress')
        )
    )
  );

  const binderModeContent = React.createElement('div', { className: 'p-4 space-y-4' },
    React.createElement('div', null,
        React.createElement('label', { className: 'text-sm font-semibold text-slate-500 dark:text-slate-400' }, 'Page Layout'),
        React.createElement('div', { className: 'mt-1 grid grid-cols-2 gap-2' },
          React.createElement('button', { onClick: () => onBinderPocketCountChange(9), 'aria-pressed': binderPocketCount === 9, className: `py-2 rounded-md text-sm font-semibold ${binderPocketCount === 9 ? 'bg-blue-800 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors'}` }, '9 Pockets'),
          React.createElement('button', { onClick: () => onBinderPocketCountChange(12), 'aria-pressed': binderPocketCount === 12, className: `py-2 rounded-md text-sm font-semibold ${binderPocketCount === 12 ? 'bg-blue-800 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors'}` }, '12 Pockets')
        )
    ),
    React.createElement('div', null,
        React.createElement('label', { className: 'text-sm font-semibold text-slate-500 dark:text-slate-400' }, 'Sort Mode'),
        React.createElement('div', { className: 'mt-1 grid grid-cols-2 gap-2' },
          React.createElement('button', { onClick: () => onBinderSortModeChange('standard'), 'aria-pressed': binderSortMode === 'standard', className: `py-2 rounded-md text-sm font-semibold ${binderSortMode === 'standard' ? 'bg-blue-800 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors'}` }, 'Standard'),
          React.createElement('button', { onClick: () => onBinderSortModeChange('custom'), 'aria-pressed': binderSortMode === 'custom', className: `py-2 rounded-md text-sm font-semibold ${binderSortMode === 'custom' ? 'bg-blue-800 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors'}` }, 'Custom')
        )
    ),
    React.createElement('div', null,
      React.createElement('label', { htmlFor: 'binder-zoom', className: 'text-sm font-semibold text-slate-500 dark:text-slate-400' }, 'Zoom Level'),
      React.createElement('div', { className: 'flex items-center gap-3 mt-1' },
          React.createElement('input', {
              id: 'binder-zoom', type: 'range', min: '10', max: maxBinderZoom, value: binderZoomLevel,
              onChange: (e) => onBinderZoomLevelChange(Number(e.target.value)),
              className: 'w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer'
          }),
          React.createElement('span', { className: 'text-sm text-slate-500 dark:text-slate-400 font-mono w-10 text-center' }, `${binderZoomLevel}%`)
      )
    ),
    React.createElement('div', { className: 'pt-3 border-t border-slate-200 dark:border-slate-700' },
      React.createElement('label', { className: 'text-sm font-semibold text-slate-500 dark:text-slate-400' }, 'Page Navigation'),
      React.createElement('div', { className: 'mt-1 flex items-center gap-2' },
        React.createElement('input', {
          type: 'number',
          value: pageInput,
          onChange: e => setPageInput(e.target.value),
          onBlur: handlePageJump,
          onKeyDown: e => { if (e.key === 'Enter') { e.target.blur(); handlePageJump(); } },
          className: 'w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-mono bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200',
          min: '1',
          max: totalBinderPages,
          'aria-label': 'Jump to page'
        }),
        React.createElement('span', { className: 'text-sm text-slate-500 dark:text-slate-400' }, `of ${totalBinderPages}`)
      )
    ),
    binderSortMode === 'custom' && React.createElement('div', { className: 'pt-3 border-t border-slate-200 dark:border-slate-700' },
        React.createElement('button', {
          onClick: onClearBinderPlacements,
          className: 'w-full flex items-center justify-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors'
        }, React.createElement(TrashIcon, { className: 'w-5 h-5' }), React.createElement('span', { className: 'text-sm font-semibold' }, 'Clear Custom Placements'))
    )
  );

  return React.createElement('div', {
    className: 'p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700',
    'data-tour-id': 'search-filter-controls'
  },
    React.createElement('div', { className: 'flex flex-col md:flex-row items-center gap-4' },
      React.createElement('input', {
        type: 'text',
        placeholder: `Search in ${selectedCollectionName}...`,
        value: searchTerm,
        onChange: (e) => onSearchTermChange(e.target.value),
        className: 'w-full md:flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed',
        'aria-label': 'Search cards by name, ID, or description',
        'data-tour-id': 'search-bar',
        disabled: isBinderMode,
      }),
      React.createElement('div', { className: 'flex items-stretch gap-2 w-full md:w-auto' },
        React.createElement('div', { className: 'flex items-center bg-slate-200 dark:bg-slate-700 p-1 rounded-lg' },
          React.createElement('button', {
            onClick: () => setIsBinderMode(false),
            className: `px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${!isBinderMode ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-300'}`
          }, 'Browse'),
          React.createElement('button', {
            onClick: () => setIsBinderMode(true),
            className: `px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${isBinderMode ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-300'}`
          }, 'Binder')
        ),
        React.createElement('div', { className: 'relative', ref: popoverRef },
          React.createElement('button', {
            onClick: () => setIsPanelOpen(p => !p),
            'data-tour-id': 'search-filter-toggle',
            className: 'h-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-cuphead-text text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors'
          },
            isBinderMode
              ? React.createElement(Cog8ToothIcon, { className: 'w-5 h-5' })
              : React.createElement(FunnelIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, isBinderMode ? 'Options' : 'Filters')
          ),
          isPanelOpen && React.createElement('div', {
            className: 'absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-20 origin-top-right',
            'data-tour-id': 'filter-panel-content' // Keep for tutorial
          },
            isBinderMode ? binderModeContent : browseModeContent
          ),
          isBinderMode && binderSortMode === 'custom' && unplacedCardCount > 0 &&
            React.createElement('div', { className: 'absolute top-full mt-4 -right-4' },
              React.createElement(UnplacedCardsIndicator, {
                count: unplacedCardCount,
                cards: unplacedCards
              })
            )
        )
      )
    )
  );
};

export default SearchAndFilterControls;