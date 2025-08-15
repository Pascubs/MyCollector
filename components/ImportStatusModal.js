import React, { useState, useEffect } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import { analyzeSpreadsheet } from '../utils.js';
import { UploadIcon, SpinnerIcon, CloseIcon, ErrorIcon, ChevronRightIcon } from '../icons.js';

const ImportStatusModal = ({ isOpen, onClose, file, collection }) => {
    const { updateStatusWithMapping } = useCollections();
    const toast = useToast();

    const [status, setStatus] = useState('analyzing'); // 'analyzing', 'mapping', 'importing', 'error'
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    
    const initialMapping = {
        cardId: '',
        collected: '',
        variants: {},
    };
    const [mapping, setMapping] = useState(initialMapping);

    useEffect(() => {
        if (!file || !isOpen) return;

        const processFile = async () => {
            setStatus('analyzing');
            setError(null);
            setMapping(initialMapping);

            try {
                const result = await analyzeSpreadsheet(file);
                setAnalysisResult(result);
                
                // Guess mappings
                const lowerCaseHeaders = result.headers.map(h => h ? String(h).toLowerCase() : '');
                const guess = {
                    cardId: result.headers[lowerCaseHeaders.findIndex(h => h.includes('id') || h.includes('number') || h.includes('no.'))] || '',
                    collected: result.headers[lowerCaseHeaders.findIndex(h => h.includes('collected') || h.includes('owned') || h.includes('have'))] || '',
                    variants: {},
                };
                setMapping(guess);
                setStatus('mapping');
            } catch (err) {
                setStatus('error');
                setError(err.message || 'Could not read or analyze the file.');
            }
        };

        processFile();
    }, [file, isOpen]);

    const handleMappingChange = (field, value) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };
    
    const handleVariantMappingChange = (variantId, value) => {
        setMapping(prev => ({
            ...prev,
            variants: {
                ...prev.variants,
                [variantId]: value,
            },
        }));
    };

    const handleImport = () => {
        if (!mapping.cardId || !mapping.collected) {
            toast.error('You must map columns for both Card ID and Collected status.');
            return;
        }

        setStatus('importing');
        try {
            updateStatusWithMapping(collection.id, analysisResult.jsonData, mapping);
            toast.success('Collection status updated successfully!');
            onClose();
        } catch (err) {
            setStatus('error');
            setError('An error occurred while updating the collection.');
            toast.error('Failed to update collection.');
        }
    };

    const renderHeaderOptions = (isRequired = false) => {
        const options = analysisResult?.headers.map(h => React.createElement('option', { key: h, value: h }, h)) || [];
        if (isRequired) {
            options.unshift(React.createElement('option', { key: 'disabled', value: '', disabled: true }, 'Select a column...'));
        } else {
            options.unshift(React.createElement('option', { key: 'none', value: '' }, 'Do not import'));
        }
        return options;
    };
    
    const renderContent = () => {
        switch (status) {
            case 'analyzing':
            case 'importing':
                return React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 h-64' },
                    React.createElement(SpinnerIcon, { className: 'w-16 h-16 text-blue-800 dark:text-blue-400' }),
                    React.createElement('p', { className: 'font-cuphead-text text-xl text-slate-700 dark:text-slate-200' }, 
                        status === 'analyzing' ? 'Analyzing file...' : 'Importing status...'
                    )
                );
            case 'error':
                 return React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 text-center h-64' },
                    React.createElement(ErrorIcon, { className: 'w-16 h-16 text-rose-500' }),
                    React.createElement('h3', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100' }, 'Import Failed'),
                    React.createElement('p', { className: 'font-cuphead-text text-base text-slate-600 bg-rose-50 dark:bg-rose-900/40 p-3 rounded-md border border-rose-200 dark:border-rose-500/50' }, error),
                    React.createElement('button', { onClick: onClose, className: 'mt-4 px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Close')
                );
            case 'mapping':
                return React.createElement(React.Fragment, null,
                    React.createElement('div', { className: 'p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar' },
                        React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                            React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-4' }, 'Required Mappings'),
                            React.createElement('div', { className: 'space-y-4' },
                                React.createElement('div', { className: 'grid grid-cols-3 gap-4 items-center' },
                                    React.createElement('label', { htmlFor: 'map-cardId', className: 'col-span-1 font-cuphead-text font-semibold text-slate-700 dark:text-slate-300' }, 'Card ID', React.createElement('span', { className: 'text-rose-500' }, '*')),
                                    React.createElement('select', { id: 'map-cardId', value: mapping.cardId, onChange: e => handleMappingChange('cardId', e.target.value), className: 'col-span-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text' }, renderHeaderOptions(true))
                                ),
                                React.createElement('div', { className: 'grid grid-cols-3 gap-4 items-center' },
                                    React.createElement('label', { htmlFor: 'map-collected', className: 'col-span-1 font-cuphead-text font-semibold text-slate-700 dark:text-slate-300' }, 'Collected Status', React.createElement('span', { className: 'text-rose-500' }, '*')),
                                    React.createElement('select', { id: 'map-collected', value: mapping.collected, onChange: e => handleMappingChange('collected', e.target.value), className: 'col-span-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text' }, renderHeaderOptions(true))
                                )
                            ),
                             React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-2' }, 'For collected status, values like "true", "x", "yes", or "1" will be counted as collected.')
                        ),

                        (collection.features?.variants?.length > 0) && React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                            React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-4' }, 'Optional Variant Mappings'),
                            React.createElement('div', { className: 'space-y-4' },
                                ...collection.features.variants.map(variant => (
                                    React.createElement('div', { key: variant.id, className: 'grid grid-cols-3 gap-4 items-center' },
                                        React.createElement('label', { htmlFor: `map-variant-${variant.id}`, className: 'col-span-1 font-cuphead-text font-semibold text-slate-700 dark:text-slate-300' }, variant.name),
                                        React.createElement('select', { id: `map-variant-${variant.id}`, value: mapping.variants[variant.id] || '', onChange: e => handleVariantMappingChange(variant.id, e.target.value), className: 'col-span-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text' }, renderHeaderOptions(false))
                                    )
                                ))
                            )
                        ),

                        React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
                            React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-4' }, 'Data Preview'),
                            React.createElement('div', { className: 'overflow-x-auto custom-scrollbar rounded-md' },
                                React.createElement('table', { className: 'w-full text-sm text-left' },
                                    React.createElement('thead', null, React.createElement('tr', { className: 'bg-slate-100 dark:bg-slate-700' },
                                        ...analysisResult.headers.map(h => React.createElement('th', { key: h, scope: 'col', className: 'px-4 py-2 font-cuphead-text text-slate-600 dark:text-slate-300' }, h))
                                    )),
                                    React.createElement('tbody', null,
                                        ...analysisResult.sampleData.map((row, index) => React.createElement('tr', { key: index, className: 'bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700' },
                                            ...analysisResult.headers.map(h => React.createElement('td', { key: h, className: 'px-4 py-2 text-slate-600 dark:text-slate-400 truncate max-w-[150px]' }, String(row[h])))
                                        ))
                                    )
                                )
                            ),
                            React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-2 text-center' }, `Showing first ${analysisResult.sampleData.length} of ${analysisResult.jsonData.length} rows.`)
                        )
                    )
                );
        }
    };
    
    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-cuphead-text',
        role: 'dialog',
        'aria-modal': 'true',
    },
        React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all relative' },
            React.createElement('button', { onClick: onClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors z-10', 'aria-label': 'Close' },
                React.createElement(CloseIcon, { className: 'w-6 h-6' })
            ),
            React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
              React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Import Collection Status'),
              React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mt-1' }, `Update status for "${collection.name}" from "${file?.name || 'your file'}".`)
            ),
            renderContent(),
             status === 'mapping' && React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3' },
                React.createElement('button', { type: 'button', onClick: onClose, className: 'px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors' }, 'Cancel'),
                React.createElement('button', { type: 'button', onClick: handleImport, disabled: !mapping.cardId || !mapping.collected, className: 'flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-cuphead-text rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed' }, 
                    'Confirm and Import',
                    React.createElement(ChevronRightIcon, { className: 'w-4 h-4' })
                )
            )
        )
    );
};

export default ImportStatusModal;
