import React, { useState, useEffect } from 'react';
import { useToast } from '../toastContext.js';
import { CloseIcon, SpinnerIcon, ErrorIcon, TrashIcon, CheckCircleIcon } from '../icons.js';
import ConfirmationModal from './ConfirmationModal.js';
import { API_BASE_URL } from '../authContext.js';
import { parseApiError } from '../utils.js';

const TCGDEX_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'es-mx', label: 'Spanish (Mexico)' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pt-br', label: 'Portuguese (Brazil)' },
  { value: 'pt-pt', label: 'Portuguese (Portugal)' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-cn', label: 'Chinese (Simplified)' },
  { value: 'zh-tw', label: 'Chinese (Traditional)' },
  { value: 'id', label: 'Indonesian' },
  { value: 'th', label: 'Thai' },
];

const TabButton = ({ isActive, onClick, children }) => (
    React.createElement('button', {
        type: 'button',
        onClick: onClick,
        className: `px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
            isActive
                ? 'border-blue-700 text-blue-800 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        }`
    }, children)
);

const AdminPanelModal = ({ isOpen, onClose }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('import');

  // Import Tab State
  const [source, setSource] = useState('pokemontcg');
  const [setId, setSetId] = useState('');
  const [language, setLanguage] = useState('en');

  // Manage Catalog Tab State
  const [catalog, setCatalog] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [collectionToRemove, setCollectionToRemove] = useState(null);

  // General Status for actions
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'error', 'success'
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState(null);
  
  useEffect(() => {
    if (isOpen && activeTab === 'manage' && catalogStatus === 'idle') {
        const fetchCatalog = async () => {
            setCatalogStatus('loading');
            try {
                const response = await fetch(`${API_BASE_URL}/catalog`);
                if (!response.ok) throw new Error('Failed to fetch catalog collections.');
                const data = await response.json();
                setCatalog(data.sort((a, b) => a.name.localeCompare(b.name)));
                setCatalogStatus('success');
            } catch (err) {
                setCatalogStatus('error');
                toast.error(parseApiError(err));
            }
        };
        fetchCatalog();
    }
  }, [isOpen, activeTab, catalogStatus, toast]);

  const handleClose = () => {
    if (status === 'loading') return;
    setSource('pokemontcg');
    setSetId('');
    setLanguage('en');
    setStatus('idle');
    setError(null);
    setResultMessage(null);
    setActiveTab('import');
    setCatalog([]);
    setCatalogStatus('idle');
    setCollectionToRemove(null);
    onClose();
  };

  const handleSubmitImport = async (e) => {
    e.preventDefault();
    if (!setId.trim()) {
      toast.error('Set ID is required.');
      return;
    }

    setStatus('loading');
    setError(null);
    setResultMessage(null);

    try {
      const body = { source, id: setId.trim() };
      if (source === 'tcgdex') {
          body.language = language;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/import-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Import failed with status ${response.status}`);
      }
      
      setStatus('success');
      setResultMessage(data.message);
      toast.success(data.message);
      window.dispatchEvent(new CustomEvent('catalogupdated'));
      setCatalogStatus('idle'); // Invalidate catalog cache
      setCatalog([]);

    } catch (err) {
      const friendlyError = parseApiError(err);
      setStatus('error');
      setError(friendlyError);
      toast.error(friendlyError);
    }
  };
  
  const handleRemoveCollection = async () => {
    if (!collectionToRemove) return;
    setStatus('loading'); // Use main status for this action
    try {
        const response = await fetch(`${API_BASE_URL}/admin/remove-from-catalog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ collectionId: collectionToRemove.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to remove collection.');
        
        toast.success(data.message);
        setCatalog(prev => prev.filter(c => c.id !== collectionToRemove.id));
        window.dispatchEvent(new CustomEvent('catalogupdated'));
    } catch (err) {
        toast.error(parseApiError(err));
    } finally {
        setStatus('idle');
        setCollectionToRemove(null);
    }
  };

  if (!isOpen) return null;
  
  const renderImportTab = () => {
    if (status === 'loading') {
        return React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 h-64' },
          React.createElement(SpinnerIcon, { className: 'w-16 h-16 text-blue-800 dark:text-blue-400' }),
          React.createElement('p', { className: 'font-cuphead-text text-xl text-slate-700 dark:text-slate-200' }, 'Importing Set...')
        );
    }
    if (status === 'error') {
        return React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 text-center h-64' },
          React.createElement(ErrorIcon, { className: 'w-16 h-16 text-rose-500' }),
          React.createElement('h3', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100' }, 'Import Failed'),
          React.createElement('p', { className: 'font-cuphead-text text-base text-slate-600 bg-rose-50 dark:bg-rose-900/40 p-3 rounded-md border border-rose-200 dark:border-rose-500/50' }, error),
          React.createElement('button', { onClick: () => setStatus('idle'), className: 'mt-4 px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Try Again')
        );
    }
    if (status === 'success') {
        return React.createElement('div', { className: 'flex flex-col items-center justify-center p-8 gap-4 text-center h-64' },
          React.createElement(CheckCircleIcon, { className: 'w-16 h-16 text-emerald-500' }),
          React.createElement('h3', { className: 'font-cuphead-title text-2xl text-slate-800 dark:text-slate-100' }, 'Import Successful!'),
          React.createElement('p', { className: 'font-cuphead-text text-base text-slate-600 dark:text-slate-400' }, resultMessage),
          React.createElement('button', { onClick: handleClose, className: 'mt-4 px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900' }, 'Close')
        );
    }

    return React.createElement('form', { onSubmit: handleSubmitImport },
      React.createElement('div', { className: 'p-6 space-y-5' },
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'source-select', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Data Source'),
          React.createElement('select', {
              id: 'source-select',
              value: source,
              onChange: (e) => setSource(e.target.value),
              className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg'
          },
              React.createElement('option', { value: 'pokemontcg' }, 'Pokémon TCG API'),
              React.createElement('option', { value: 'tcgdex' }, 'TCGdex (Multi-language)'),
              React.createElement('option', { value: 'cardtrader' }, 'CardTrader')
          )
        ),
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'set-id', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Set ID'),
          React.createElement('input', {
              type: 'text',
              id: 'set-id',
              value: setId,
              onChange: (e) => setSetId(e.target.value),
              placeholder: source === 'pokemontcg' ? 'e.g., sv3' : (source === 'tcgdex' ? 'e.g., sv3' : 'e.g., 2514'),
              className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg'
          })
        ),
        source === 'tcgdex' && React.createElement('div', null,
          React.createElement('label', { htmlFor: 'language-select', className: 'block font-cuphead-text text-sm font-medium text-slate-700 dark:text-slate-200 mb-1' }, 'Language'),
          React.createElement('select', {
              id: 'language-select',
              value: language,
              onChange: (e) => setLanguage(e.target.value),
              className: 'w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg'
          },
              ...TCGDEX_LANGUAGES.map(lang => React.createElement('option', { key: lang.value, value: lang.value }, lang.label))
          )
        )
      ),
      React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3' },
        React.createElement('button', { type: 'button', onClick: handleClose, className: 'px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors' }, 'Cancel'),
        React.createElement('button', { type: 'submit', className: 'px-6 py-2 bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors' }, 'Import Set')
      )
    );
  };
  
  const renderManageTab = () => {
    if (catalogStatus === 'loading') {
      return React.createElement('div', { className: 'flex justify-center items-center p-8 h-64' },
        React.createElement(SpinnerIcon, { className: 'w-10 h-10 text-blue-800 dark:text-blue-400' })
      );
    }
    if (catalogStatus === 'error') {
      return React.createElement('div', { className: 'text-center p-8 text-rose-500' }, 'Failed to load catalog.');
    }
    if (status === 'loading') {
      return React.createElement('div', { className: 'flex justify-center items-center p-8 h-64' },
        React.createElement(SpinnerIcon, { className: 'w-10 h-10 text-blue-800 dark:text-blue-400' })
      );
    }

    return React.createElement('div', { className: 'p-6 space-y-4' },
      catalog.length > 0 ? (
        React.createElement('ul', { className: 'divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto custom-scrollbar pr-2' },
          ...catalog.map(collection => React.createElement('li', { key: collection.id, className: 'flex items-center justify-between py-2' },
            React.createElement('div', { className: 'min-w-0' },
              React.createElement('p', { className: 'text-sm font-bold text-slate-800 dark:text-slate-100 truncate' }, collection.name),
              React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400' }, `ID: ${collection.id}`)
            ),
            React.createElement('button', {
              onClick: () => setCollectionToRemove(collection),
              className: 'p-2 text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors',
              title: 'Remove from Catalog'
            }, React.createElement(TrashIcon, { className: 'w-5 h-5' }))
          ))
        )
      ) : (
        React.createElement('p', { className: 'text-center text-slate-500 p-8' }, 'The public catalog is empty.')
      )
    );
  };
  
  const removeConfirmationMessage = collectionToRemove && React.createElement(React.Fragment, null,
    React.createElement('p', null, `Are you sure you want to remove "${collectionToRemove.name}" from the public catalog?`),
    React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );
  
  return React.createElement(React.Fragment, null,
    React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-cuphead-text',
      role: 'dialog',
      'aria-modal': 'true',
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all relative',
        onClick: e => e.stopPropagation()
      },
        React.createElement('button', { onClick: handleClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors z-10', 'aria-label': 'Close' },
          React.createElement(CloseIcon, { className: 'w-6 h-6' })
        ),
        React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
          React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Admin Panel'),
          React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mt-1' }, 'Manage the public collection catalog.')
        ),
        React.createElement('div', { className: 'border-b border-slate-200 dark:border-slate-700' },
          React.createElement('nav', { className: 'flex space-x-2 px-4' },
            React.createElement(TabButton, { onClick: () => setActiveTab('import'), isActive: activeTab === 'import' }, 'Import Set'),
            React.createElement(TabButton, { onClick: () => setActiveTab('manage'), isActive: activeTab === 'manage' }, 'Manage Catalog')
          )
        ),
        activeTab === 'import' && renderImportTab(),
        activeTab === 'manage' && renderManageTab()
      )
    ),
    collectionToRemove && React.createElement(ConfirmationModal, {
      isOpen: !!collectionToRemove,
      onClose: () => setCollectionToRemove(null),
      onConfirm: handleRemoveCollection,
      title: 'Remove Collection?',
      message: removeConfirmationMessage,
      confirmButtonText: 'Yes, Remove'
    })
  );
};

export default AdminPanelModal;
