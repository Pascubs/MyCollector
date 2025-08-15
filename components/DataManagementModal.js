import React, { useState } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import { CloseIcon, UploadIcon, ArrowDownTrayIcon } from '../icons.js';
import ConfirmationModal from './ConfirmationModal.js';

const DataManagementModal = ({ isOpen, onClose }) => {
  const { collections, loadCollectionsFromBackup } = useCollections();
  const toast = useToast();
  const [importedData, setImportedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleExport = () => {
    try {
      if (collections.length === 0) {
        toast.error("There is no data to export.");
        return;
      }
      const jsonString = JSON.stringify(collections, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `my-collector-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Could not export your data.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setImportedData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (!text) throw new Error('File is empty.');

        const data = JSON.parse(text);
        if (!Array.isArray(data) || (data.length > 0 && (!data[0].id || !data[0].name || !Array.isArray(data[0].cards)))) {
          throw new Error('Invalid backup file format. The file must be an array of collections with id, name, and cards properties.');
        }
        setImportedData(data);
        toast.success(`File "${file.name}" is ready to be imported.`);
      } catch (err) {
        setError(`Error reading file: ${err.message}`);
        setImportedData(null);
        setFileName('');
        toast.error(`Error reading file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      const errorMessage = 'Failed to read the file.';
      setError(errorMessage);
      setImportedData(null);
      setFileName('');
      toast.error(errorMessage);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (importedData) {
      setIsConfirmModalOpen(true);
    }
  };

  const executeImport = () => {
    if (importedData) {
      loadCollectionsFromBackup(importedData);
      toast.success("Data restored successfully!");
      onClose();
    }
  };

  if (!isOpen) return null;

  const confirmationMessage = React.createElement(React.Fragment, null,
      React.createElement('p', null, 'Are you sure you want to replace ALL current collection data with the selected file?'),
      React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-2' }, 'This action cannot be undone.')
  );

  return React.createElement(React.Fragment, null,
    React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 font-cuphead-text',
      role: 'dialog',
      'aria-modal': 'true'
    },
      React.createElement('div', { className: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all relative' },
        React.createElement('button', { onClick: onClose, className: 'absolute top-3 right-3 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors', 'aria-label': 'Close' },
          React.createElement(CloseIcon, { className: 'w-6 h-6' })
        ),
        React.createElement('div', { className: 'p-6 border-b border-slate-200 dark:border-slate-700' },
          React.createElement('h2', { className: 'font-cuphead-title text-2xl text-blue-800 dark:text-blue-400' }, 'Data Management'),
          React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-500 dark:text-slate-400 mt-1' }, 'Export your progress to a file or import a backup.')
        ),
        React.createElement('div', { className: 'p-6 space-y-6' },
          React.createElement('div', { className: 'space-y-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
            React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, 'Export Backup'),
            React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-300' }, 'Save all your collections and progress to a single JSON file. Keep this file safe to restore your data later.'),
            React.createElement('button', { onClick: handleExport, className: 'w-full justify-center bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-600 dark:hover:bg-slate-500 p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2' },
              React.createElement(ArrowDownTrayIcon, { className: 'w-5 h-5' }),
              React.createElement('span', null, 'Export All Data')
            )
          ),
          React.createElement('div', { className: 'space-y-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg' },
            React.createElement('h3', { className: 'font-cuphead-title text-xl text-slate-800 dark:text-slate-100' }, 'Import Backup'),
            React.createElement('p', { className: 'font-cuphead-text text-sm text-slate-600 dark:text-slate-300' },
              'Restore your data from a previously exported backup file.',
              React.createElement('strong', { className: 'text-rose-500 dark:text-rose-400 block mt-1' }, 'Warning: This will overwrite all your current data.')
            ),
            React.createElement('label', { htmlFor: 'backup-upload', className: 'relative flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700' },
              React.createElement(UploadIcon, { className: 'w-8 h-8 text-slate-400 dark:text-slate-500 mr-3' }),
              React.createElement('span', { className: 'font-cuphead-text text-slate-600 dark:text-slate-300 truncate' }, fileName || 'Click to select a .json file'),
              React.createElement('input', { type: 'file', id: 'backup-upload', className: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer', onChange: handleFileChange, accept: '.json' })
            ),
            error && React.createElement('p', { className: 'text-xs text-rose-500 dark:text-rose-400 text-center' }, error),
            React.createElement('button', { onClick: handleImportConfirm, disabled: !importedData, className: 'w-full justify-center bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-3 flex items-center gap-2' },
              React.createElement(UploadIcon, { className: 'w-5 h-5' }),
              React.createElement('span', null, 'Import and Replace Data')
            )
          )
        ),
        React.createElement('div', { className: 'p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end' },
          React.createElement('button', { onClick: onClose, className: 'px-6 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-cuphead-text hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors' }, 'Close')
        )
      )
    ),
    isConfirmModalOpen && React.createElement(ConfirmationModal, {
      isOpen: isConfirmModalOpen,
      onClose: () => setIsConfirmModalOpen(false),
      onConfirm: executeImport,
      title: 'Replace All Data?',
      message: confirmationMessage,
      confirmButtonText: 'Yes, Replace Data'
    })
  );
};

export default DataManagementModal;
