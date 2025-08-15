import React, { useState, useCallback, useMemo } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import { analyzeSpreadsheet, processMappedFile, guessMapping, downloadTemplate, migrateCollection } from '../utils.js';
import { UploadIcon, SpinnerIcon, CloseIcon, ErrorIcon, ChevronLeftIcon } from '../icons.js';

const AddCollectionModal = ({ isOpen, onClose }) => {
  const { addNewCollection } = useCollections();
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'error'
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [mapping, setMapping] = useState({ id: '', name: '', rarity: '', description: '', collected: '' });
  const [customMappings, setCustomMappings] = useState([]);

  const resetState = useCallback(() => {
    setTitle('');
    setFile(null);
    setIsDragOver(false);
    setAnalysisResult(null);
    setMapping({ id: '', name: '', rarity: '', description: '', collected: '' });
    setCustomMappings([]);
    setStep(1);
    setStatus('idle');
    setLoadingMessage('');
    setError(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (files) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTemplate();
      toast.success("Template downloaded successfully!");
    } catch (err) {
      console.error('Failed to generate template file:', err);
      toast.error('Could not generate the template file.');
    }
  };

  const handleProceedToMapping = async () => {
    if (!file || !title.trim()) return;

    setStatus('loading');
    setLoadingMessage('Analyzing your spreadsheet...');
    setError(null);

    try {
      const result = await analyzeSpreadsheet(file);
      setAnalysisResult(result);
      
      const guessed = guessMapping(result.headers);
      setMapping(guessed);
      
      const coreMappingValues = new Set(Object.values(guessed));
      const potentialCustomHeaders = result.headers.filter(h => !coreMappingValues.has(h));
      
      setCustomMappings(potentialCustomHeaders.map(header => ({
          header: header,
          checked: false, // Default to not importing
          label: header,
      })));
      
      setStep(2);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Could not read or analyze the file.');
    }
  };
  
  const handleCustomMappingChange = (index, field, value) => {
    const newMappings = [...customMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setCustomMappings(newMappings);
  };


  const handleFinalizeImport = () => {
    if (!analysisResult || !mapping.id || !mapping.name) {
      toast.error('Card ID and Name columns must be mapped.');
      return;
    }

    setStatus('loading');
    setLoadingMessage('Building your collection...');
    setError(null);

    try {
      const activeCustomMappings = customMappings
        .filter(m => m.checked && m.label.trim())
        .map(({ header, label }) => ({ header, label: label.trim() }));
        
      const { cards, customFieldDefinitions } = processMappedFile(analysisResult.jsonData, mapping, activeCustomMappings);

      const newCollectionRaw = {
        id: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + `-${Date.now()}`,
        name: title.trim(),
        cards: cards,
        description: `Created from '${file.name}' on ${new Date().toLocaleDateString()}`,
        isCustom: true,
        features: {
          variants: [],
          customFields: customFieldDefinitions,
        }
      };
      
      const newCollection = migrateCollection(newCollectionRaw);

      addNewCollection(newCollection);
      toast.success(`Collection "${newCollection.name}" created!`);
      handleClose();
    } catch (err) {
      setStatus('error');
      setError(err.message || 'An unknown error occurred during processing.');
      setStep(1);
    }
  };

  const detectedRarities = useMemo(() => {
    if (!analysisResult || !mapping.rarity) return [];
    const rarities = new Set();
    analysisResult.jsonData.forEach(row => {
      const rarityValue = row[mapping.rarity];
      if (rarityValue) {
        rarities.add(String(rarityValue).trim());
      }
    });
    return Array.from(rarities).sort();
  }, [analysisResult, mapping.rarity]);
  
  const collectableColumns = useMemo(() => {
    if (!analysisResult) return [];
    
    // Regex to test for boolean-like values (including empty strings for "false")
    const booleanLikeRegex = /^(true|false|yes|no|si|1|0|x|)$/i;
    
    return analysisResult.headers.filter(header => {
        // Check if every non-empty value in this column is boolean-like
        return analysisResult.jsonData.every(row => {
            const value = String(row[header] || '').trim();
            return booleanLikeRegex.test(value);
        });
    });
  }, [analysisResult]);

  const renderMappingRow = (field, label, isRequired = false) => {
    const headerOptions = analysisResult?.headers.map(h => React.createElement('option', { key: h, value: h }, h)) || [];
    if (!isRequired) {
      headerOptions.unshift(React.createElement('option', { key: 'none', value: '' }, 'Do not import'));
    }

    return React.createElement('div', { key: field, className: 'grid grid-cols-3 gap-4 items-center' },
      React.createElement('label', { htmlFor: `map-${field}`, className: 'col-span-1 font-cuphead-text font-semibold text-slate-700 dark:text-slate-300' },
        label, isRequired && React.createElement('span', { className: 'text-rose-500' }, '*')
      ),
      React.createElement('select', {
        id: `map-${field}`,
        value: mapping[field],
        onChange: e => setMapping(prev => ({ ...prev, [field]: e.target.value })),
        className: 'col-span-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base text-slate-700 dark:text-slate-200'
      },
        React.createElement('option', { value: '', disabled: true }, 'Select a column...'),
        ...headerOptions
      )
    );
  };
  
  const renderCollectedMappingRow = (field, label) => {
    const headerOptions = collectableColumns.map(h => React.createElement('option', { key: h, value: h }, h));
    headerOptions.unshift(React.createElement('option', { key: 'none', value: '' }, 'Do not import (default to No)'));

    return React.createElement('div', { key: field, className: 'grid grid-cols-3 gap-4 items-center' },
      React.createElement('label', { htmlFor: `map-${field}`, className: 'col-span-1 font-cuphead-text font-semibold text-slate-700 dark:text-slate-300' },
        label
      ),
      React.createElement('select', {
        id: `map-${field}`,
        value: mapping[field],
        onChange: e => setMapping(prev => ({ ...prev, [field]: e.target.value })),
        className: 'col-span-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base text-slate-700 dark:text-slate-200'
      },
        ...headerOptions
      )
    );
  };

  const renderStep1 = () => React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
      React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Create New Collection'),
      React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mt-1' }, 'Step 1 of 2: Provide a title and upload your card list file.')
    ),
    React.createElement('div', { className: 'p-6 space-y-5' },
      React.createElement('div', null,
        React.createElement('label', { htmlFor: 'collection-title', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Collection Title'),
        React.createElement('input', { type: 'text', id: 'collection-title', value: title, onChange: (e) => setTitle(e.target.value), placeholder: 'e.g., Pokémon 151 Set', className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-700 focus:border-blue-700 transition-shadow shadow-sm font-cuphead-text text-base text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-400', required: true })
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Upload Card List'),
        React.createElement('div', {
          onDragOver: (e) => { e.preventDefault(); setIsDragOver(true); },
          onDragLeave: () => setIsDragOver(false),
          onDrop: (e) => { e.preventDefault(); setIsDragOver(false); handleFileChange(e.dataTransfer.files); },
          className: `relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragOver ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`
        },
          React.createElement(UploadIcon, { className: 'w-10 h-10 text-slate-400 dark:text-slate-500 mb-2' }),
          React.createElement('span', { className: 'font-cuphead-text text-slate-600 dark:text-slate-300' }, file ? file.name : 'Drag & drop a file here, or click to select'),
          React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-1' }, '.xlsx, .xls, or .csv files accepted'),
          React.createElement('input', { type: 'file', id: 'file-upload', className: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer', onChange: (e) => handleFileChange(e.target.files), accept: '.xlsx,.xls,.csv' })
        ),
        React.createElement('div', { className: 'text-xs text-slate-500 dark:text-slate-400 mt-2 text-center' },
            React.createElement('button', { type: 'button', onClick: handleDownloadTemplate, className: 'text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded' }, 'Download a .xlsx template'), ' if you need a starting point.'
        )
      )
    ),
    React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3' },
      React.createElement('button', { type: 'button', onClick: handleClose, className: 'px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors' }, 'Cancel'),
      React.createElement('button', { type: 'button', onClick: handleProceedToMapping, disabled: !title.trim() || !file, className: 'px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed' }, 'Next: Map Columns')
    )
  );
  
  const renderStep2 = () => React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
      React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Confirm Import'),
      React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mt-1' }, `Step 2 of 2: Map your data from "${file.name}" and confirm.` )
    ),
    React.createElement('div', { className: 'p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar' },
      React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
        React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-4' }, 'Core Column Mapping'),
        React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mb-4' }, 'Match the app fields to the columns from your uploaded file. We\'ve made some guesses for you.'),
        React.createElement('div', { className: 'space-y-3' },
          renderMappingRow('id', 'Card ID', true),
          renderMappingRow('name', 'Card Name', true),
          renderMappingRow('rarity', 'Rarity'),
          renderMappingRow('description', 'Description'),
          renderCollectedMappingRow('collected', 'Collected Status')
        )
      ),
      React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
        React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-4' }, 'Additional Data (Optional)'),
        React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mb-4' }, 'Select other columns from your file to import as custom fields.'),
        React.createElement('div', { className: 'space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2' },
          customMappings.length > 0 ? (
            customMappings.map((customMap, index) => React.createElement('div', { key: customMap.header, className: 'grid grid-cols-12 gap-2 items-center' },
              React.createElement('div', { className: 'col-span-1 flex justify-center' }, React.createElement('input', { type: 'checkbox', checked: customMap.checked, onChange: e => handleCustomMappingChange(index, 'checked', e.target.checked), className: 'form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500', 'aria-labelledby': `label-for-${customMap.header}` })),
              React.createElement('div', { className: 'col-span-5' }, React.createElement('label', { id: `label-for-${customMap.header}`, className: 'text-sm font-medium text-slate-700 dark:text-slate-300 truncate', title: customMap.header }, customMap.header)),
              React.createElement('div', { className: 'col-span-6' }, React.createElement('input', { type: 'text', value: customMap.label, onChange: e => handleCustomMappingChange(index, 'label', e.target.value), disabled: !customMap.checked, className: 'w-full text-sm p-1.5 rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500 disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed', placeholder: 'Field Name' }))
            ))
          ) : ( React.createElement('p', { className: 'text-sm text-slate-500 dark:text-slate-400 text-center' }, 'No other columns available to import.') )
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
      ),
      detectedRarities.length > 0 && React.createElement('div', { className: 'p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
        React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100 mb-3' }, 'Detected Rarities'),
        React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-400 mb-4' }, 'We found these rarities in your file. They will be automatically added to your new collection. You can customize them later in the "Edit Collection" screen.'),
        React.createElement('div', { className: 'flex flex-wrap gap-2' },
          ...detectedRarities.map(r => React.createElement('span', { key: r, className: 'px-2 py-1 bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 text-sm font-medium rounded-full font-cuphead-text' }, r))
        )
      )
    ),
    React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3' },
      React.createElement('button', { type: 'button', onClick: () => setStep(1), className: 'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors' }, 
        React.createElement(ChevronLeftIcon, { className: 'w-4 h-4' }),
        'Back'
      ),
      React.createElement('button', { type: 'button', onClick: handleFinalizeImport, disabled: !mapping.id || !mapping.name, className: 'px-6 py-2 bg-emerald-600 text-white font-cuphead-text rounded-lg shadow hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed' }, 'Finalize Import')
    )
  );

  const renderLoading = () => React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 h-64' },
    React.createElement(SpinnerIcon, { className: 'w-16 h-16 text-blue-800 dark:text-blue-400' }),
    React.createElement('p', { className: 'font-cuphead-text text-xl text-slate-700 dark:text-slate-200' }, loadingMessage)
  );

  const renderError = () => React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 text-center h-64' },
    React.createElement(ErrorIcon, { className: 'w-16 h-16 text-rose-500' }),
    React.createElement('h3', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100' }, 'Oops, something went wrong!'),
    React.createElement('p', { className: 'font-cuphead-text text-base text-slate-600 bg-rose-50 dark:bg-rose-900/40 p-3 rounded-md border border-rose-200 dark:border-rose-500/50' }, error),
    React.createElement('button', { onClick: () => { setStatus('idle'); setError(null); setStep(1); }, className: 'mt-4 px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Try Again')
  );

  const renderContent = () => {
    switch (status) {
      case 'loading': return renderLoading();
      case 'error': return renderError();
      default:
        switch (step) {
          case 2: return renderStep2();
          case 1:
          default: return renderStep1();
        }
    }
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-cuphead-text',
    role: 'dialog',
    'aria-modal': 'true'
  },
    React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all relative' },
      React.createElement('button', { onClick: handleClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors z-10', 'aria-label': 'Close' },
        React.createElement(CloseIcon, { className: 'w-6 h-6' })
      ),
      renderContent()
    )
  );
};

export default AddCollectionModal;