

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import RaritySummary from './RaritySummary.js';
import CircularProgressBar from './CircularProgressBar.js';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import { useCollectionProgress } from '../hooks.js';
import { exportCollectionToExcel, exportMissingCardsToExcel } from '../utils.js';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, PencilIcon, StarIcon, CloudArrowDownIcon, SpinnerIcon, ArrowsRightLeftIcon, ChevronUpIcon } from '../icons.js';
import Fireworks from './Fireworks.js';

const setModeStyles = {
  standard: {
    progress: 'text-teal-600 dark:text-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md border-transparent', // Active state
    title: 'Standard Set',
    firework: 'bg-teal-400',
  },
  complete: {
    progress: 'text-blue-800 dark:text-blue-500',
    button: 'bg-blue-800 hover:bg-blue-900 text-white shadow-md border-transparent', // Active state
    title: 'Complete Set',
    firework: 'bg-blue-500',
  },
  master: {
    progress: 'text-purple-700 dark:text-purple-500',
    button: 'bg-purple-700 hover:bg-purple-800 text-white shadow-md border-transparent', // Active state
    title: 'Master Set',
    firework: 'bg-purple-500',
  },
};

const baseButtonClass = 'px-3 py-1 rounded-md transition-colors duration-200 font-cuphead-text text-sm border';
const inactiveButtonClass = 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500';

const Sidebar = ({ setMode, onSetModeChange, activeButtonName, onRarityFilterChange, onEdit, onFileForStatusImport }) => {
  const { selectedCollection, toggleCollectionPin, bulkFetchCardDetails } = useCollections();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileMenuRef = useRef(null);
  const prevPercentageRef = useRef(0);
  
  const { collected, total, percentage } = useCollectionProgress(selectedCollection, setMode);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
            setIsFileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const progressData = useMemo(() => {
    const currentModeStyle = setModeStyles[setMode] || setModeStyles.complete;
    return {
        collected,
        total,
        percentage,
        title: `${currentModeStyle.title} Progress`,
        progressColor: currentModeStyle.progress,
        fireworkColor: currentModeStyle.firework,
    };
  }, [collected, total, percentage, setMode]);

  useEffect(() => {
    const currentPercentage = progressData.percentage;
    if (prevPercentageRef.current < 100 && currentPercentage >= 100) {
        setShowFireworks(true);
        const timer = setTimeout(() => setShowFireworks(false), 2000);
        return () => clearTimeout(timer);
    }
    prevPercentageRef.current = currentPercentage;
  }, [progressData.percentage]);

  const handleBulkFetch = async () => {
    if (selectedCollection) {
        setIsBulkFetching(true);
        await bulkFetchCardDetails(selectedCollection.id);
        setIsBulkFetching(false);
    }
  };

  const handleExport = useCallback(() => {
    if (selectedCollection) {
      try {
        exportCollectionToExcel(selectedCollection);
        toast.success(`Exported "${selectedCollection.name}" successfully.`);
      } catch (error) {
        console.error('Failed to export collection:', error);
        toast.error('An error occurred during export.');
      }
    }
  }, [selectedCollection, toast]);

  const handleExportMissing = useCallback(() => {
    if (selectedCollection) {
      try {
        const wasExported = exportMissingCardsToExcel(selectedCollection, setMode);
        if (wasExported) {
          toast.success(`Exported missing items for "${selectedCollection.name}".`);
        } else {
          toast.info(`You have all items for the ${setMode} set!`);
        }
      } catch (error) {
        console.error('Failed to export missing cards:', error);
        toast.error('An error occurred during export.');
      }
    }
  }, [selectedCollection, setMode, toast]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && onFileForStatusImport) {
        onFileForStatusImport(file);
        setIsFileMenuOpen(false);
    }
    // Reset input to allow re-uploading the same file
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  if (!selectedCollection) return null;

  const hasSpecialRarities = (selectedCollection.rarityDefinitions || []).some(r => r.category === 'Special');
  const hasVariants = (selectedCollection.features?.variants?.length || 0) > 0;
  const showModeSelector = hasSpecialRarities || hasVariants;

  return React.createElement('div', { className: 'space-y-6 px-4' },
      progressData.total > 0 && React.createElement('div', { className: 'p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700', 'data-tour-id': 'progress-summary' },
        React.createElement('div', { className: 'relative flex justify-center items-center gap-2' },
            React.createElement('h2', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100 text-center truncate', title: selectedCollection.name }, selectedCollection.name),
            React.createElement('button', {
              onClick: () => toggleCollectionPin(selectedCollection.id),
              className: `p-1.5 rounded-full transition-colors ${
                selectedCollection.isPinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`,
              title: selectedCollection.isPinned ? 'Unpin Collection' : 'Pin Collection'
            }, React.createElement(StarIcon, { className: `w-6 h-6 ${selectedCollection.isPinned ? 'fill-current' : ''}` }))
        ),
        React.createElement('h3', { className: 'font-cuphead-text text-base text-slate-500 dark:text-slate-400 mb-3 text-center' }, progressData.title),
        React.createElement('div', { className: 'relative flex justify-center' },
          React.createElement(CircularProgressBar, { percentage: progressData.percentage, size: 140, strokeWidth: 12, progressColorClass: progressData.progressColor }),
          showFireworks && React.createElement(Fireworks, { colorClass: progressData.fireworkColor })
        ),
        React.createElement('p', { className: 'font-cuphead-text text-lg text-slate-700 dark:text-slate-200 mt-3 font-bold text-center' }, `${progressData.collected} / ${progressData.total}`),
        React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mb-3 text-center' }, 'items collected'),
        showModeSelector && React.createElement('div', { className: 'w-full max-w-xs mx-auto mt-3 pt-3 border-t border-slate-200 dark:border-slate-700' },
          React.createElement('div', { className: 'flex justify-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg' },
            React.createElement('button', { onClick: () => onSetModeChange('standard'), className: `${baseButtonClass} ${setMode === 'standard' ? setModeStyles.standard.button : inactiveButtonClass}` }, 'Standard'),
            hasSpecialRarities && React.createElement('button', { onClick: () => onSetModeChange('complete'), className: `${baseButtonClass} ${setMode === 'complete' ? setModeStyles.complete.button : inactiveButtonClass}` }, 'Complete'),
            hasVariants && React.createElement('button', { onClick: () => onSetModeChange('master'), className: `${baseButtonClass} ${setMode === 'master' ? setModeStyles.master.button : inactiveButtonClass}` }, 'Master')
          )
        )
      ),
      React.createElement('div', { className: 'p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700', 'data-tour-id': 'rarity-summary' },
        React.createElement(RaritySummary, { onRarityFilterChange: onRarityFilterChange, activeButtonName: activeButtonName })
      ),
      React.createElement('div', { className: 'p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700', 'data-tour-id': 'actions' },
        React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-700 dark:text-slate-200 mb-4 text-center' }, 'Actions'),
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('button', { onClick: onEdit, className: 'w-full flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-cuphead-text' },
            React.createElement(PencilIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, 'Edit Collection')
          ),
          React.createElement('button', { onClick: handleBulkFetch, disabled: isBulkFetching, className: 'w-full flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-cuphead-text disabled:opacity-60 disabled:cursor-wait' },
            isBulkFetching ? React.createElement(SpinnerIcon, { className: 'w-5 h-5' }) : React.createElement(CloudArrowDownIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, isBulkFetching ? 'Fetching...' : 'Fetch Info')
          ),
           React.createElement('div', { className: 'relative', ref: fileMenuRef },
            React.createElement('button', {
                onClick: () => setIsFileMenuOpen(prev => !prev),
                className: 'w-full flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-cuphead-text'
            },
                React.createElement(ArrowsRightLeftIcon, { className: 'w-5 h-5' }),
                React.createElement('span', null, 'Import / Export'),
                React.createElement(ChevronUpIcon, { className: `w-5 h-5 transition-transform ${isFileMenuOpen ? 'rotate-0' : 'rotate-180'}` })
            ),
            isFileMenuOpen && React.createElement('div', {
                className: 'absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10 p-1.5 space-y-1'
            },
                React.createElement('button', { 
                    onClick: () => { handleExport(); setIsFileMenuOpen(false); }, 
                    className: 'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                },
                    React.createElement(ArrowDownTrayIcon, { className: 'w-4 h-4' }),
                    'Export Full Collection'
                ),
                React.createElement('button', { 
                    onClick: () => { handleExportMissing(); setIsFileMenuOpen(false); }, 
                    className: 'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                },
                    React.createElement(ArrowDownTrayIcon, { className: 'w-4 h-4' }),
                    'Export Missing Cards'
                ),
                React.createElement('hr', { className: 'border-slate-200 dark:border-slate-600 my-1' }),
                React.createElement('button', { 
                    onClick: () => fileInputRef.current?.click(),
                    className: 'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                },
                    React.createElement(ArrowUpTrayIcon, { className: 'w-4 h-4' }),
                    'Import Card Status'
                )
            )
        ),
          React.createElement('input', { type: 'file', ref: fileInputRef, onChange: handleFileSelect, accept: '.xlsx, .xls, .csv', className: 'hidden' })
        )
      )
  );
};

export default Sidebar;