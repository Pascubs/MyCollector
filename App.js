import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCollections } from './context.js';
import { useAuth } from './authContext.js';
import { useLocalStorage, useTheme } from './hooks.js';
import { useToast } from './toastContext.js';
import Header from './components/Header.js';
import MainContent from './components/MainContent.js';
import CatalogScreen from './components/CatalogScreen.js';
import AddCollectionModal from './components/AddCollectionModal.js';
import EditCollectionModal from './components/EditCollectionModal.js';
import CardEditor from './components/CardEditor.js';
import InteractiveTutorial from './components/InteractiveTutorial.js';
import DataManagementModal from './components/DataManagementModal.js';
import { SpinnerIcon } from './icons.js';
import { ToastContainer } from './components/Toast.js';
import BackendDownScreen from './components/BackendDownScreen.js';
import ImportStatusModal from './components/ImportStatusModal.js';
import CollectionShowcaseModal from './components/CollectionShowcaseModal.js';
import CookieConsentBanner from './components/CookieConsentBanner.js';
import CookiePolicyModal from './components/CookiePolicyModal.js';
import LoginScreen from './components/LoginScreen.js';
import GuestWarningModal from './components/GuestWarningModal.js';
import AdminPanelModal from './components/AdminPanelModal.js';

const LOCAL_STORAGE_KEY_TUTORIAL_COMPLETED = 'myCollectorTutorialCompleted_v1';

const AppLayout = () => {
  const { authStatus, isAdmin } = useAuth();
  const { selectedCollection, collections, addCardToCollection, editCardInCollection, isLoaded } = useCollections();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  
  const [view, setView] = useState('catalog'); // 'catalog' or 'shelf'

  const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] = useState(false);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isCollectionShowcaseOpen, setIsCollectionShowcaseOpen] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useLocalStorage(LOCAL_STORAGE_KEY_TUTORIAL_COMPLETED, false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImportStatusModalOpen, setIsImportStatusModalOpen] = useState(false);
  const [fileForStatusImport, setFileForStatusImport] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddingNewCard, setIsAddingNewCard] = useState(false);
  const [isCookiePolicyOpen, setIsCookiePolicyOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // State lifted for tutorial control
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  useEffect(() => {
    // If user has no collections, keep them on the catalog page
    if (collections.length === 0) {
      setView('catalog');
    }
  }, [collections]);
  
  const handleCompleteTutorial = () => {
    setIsTutorialActive(false);
    setHasCompletedTutorial(true);
  };
  
  const handleFileForStatusImport = (file) => {
    if (file && selectedCollection) {
        setFileForStatusImport(file);
        setIsImportStatusModalOpen(true);
    }
  };
  
  const handleOpenCardEditor = (card, isNew = false) => {
    setIsAddingNewCard(isNew);
    setEditingCard(card);
  };

  const handleSaveCard = (cardToSave) => {
    if (!selectedCollection) return;
    if (!cardToSave.id.trim() || !cardToSave.name.trim()) {
      toast.error('Card ID and Name are required.');
      return;
    }

    if (isAddingNewCard) {
      if (selectedCollection.cards.some(c => c.id.toLowerCase() === cardToSave.id.toLowerCase())) {
        toast.error(`Error: A card with ID "${cardToSave.id}" already exists.`);
        return;
      }
      addCardToCollection(selectedCollection.id, cardToSave);
      toast.success(`Card "${cardToSave.name}" added.`);
    } else {
      editCardInCollection(selectedCollection.id, editingCard.id, cardToSave);
      toast.success(`Card "${cardToSave.name}" updated.`);
    }
    setEditingCard(null);
  };
  
  const tutorialControls = {
    openSidebar: () => setIsSidebarOpen(true),
    closeSidebar: () => setIsSidebarOpen(false),
    openFilterPanel: () => setIsFilterPanelOpen(true),
    closeFilterPanel: () => setIsFilterPanelOpen(false),
    openActionsMenu: () => setIsActionsMenuOpen(true),
    closeActionsMenu: () => setIsActionsMenuOpen(false),
    openCollectionShowcase: () => setIsCollectionShowcaseOpen(true),
    closeCollectionShowcase: () => setIsCollectionShowcaseOpen(false),
  };
  
  const handleStartTutorial = () => {
    // Reset state before starting to ensure a clean tutorial run
    tutorialControls.closeSidebar();
    tutorialControls.closeFilterPanel();
    tutorialControls.closeActionsMenu();
    tutorialControls.closeCollectionShowcase();
    setIsTutorialActive(true);
  };
  
  const renderView = () => {
    if (!isLoaded) {
      return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900' },
        React.createElement(SpinnerIcon, { className: 'w-12 h-12 text-blue-800 dark:text-blue-400' })
      );
    }
    
    switch(view) {
        case 'catalog':
            return React.createElement(CatalogScreen, { setView: setView });
        case 'shelf':
            return React.createElement(MainContent, {
              isSidebarOpen: isSidebarOpen,
              setIsSidebarOpen: setIsSidebarOpen,
              isFilterPanelOpen: isFilterPanelOpen,
              setIsFilterPanelOpen: setIsFilterPanelOpen,
              isTutorialActive: isTutorialActive,
              onEditCollection: () => setIsEditCollectionModalOpen(true),
              onFileForStatusImport: handleFileForStatusImport,
              onEditCard: handleOpenCardEditor,
              onAddNew: () => setIsAddCollectionModalOpen(true),
            });
        default:
             return React.createElement(CatalogScreen, { setView: setView });
    }
  };
  
  return React.createElement('div', { className: 'min-h-screen flex flex-col' },
    React.createElement(Header, {
      theme: theme,
      toggleTheme: toggleTheme,
      onOpenDataManagement: () => setIsDataModalOpen(true),
      onToggleSidebar: () => setIsSidebarOpen(prev => !prev),
      isActionsMenuOpen: isActionsMenuOpen,
      setIsActionsMenuOpen: setIsActionsMenuOpen,
      onOpenCollectionShowcase: () => setIsCollectionShowcaseOpen(true),
      onStartTutorial: handleStartTutorial,
      onOpenAdminPanel: () => setIsAdminPanelOpen(true),
    }),
    React.createElement(ToastContainer, null),
    isCollectionShowcaseOpen && React.createElement(CollectionShowcaseModal, {
        isOpen: isCollectionShowcaseOpen,
        onClose: () => setIsCollectionShowcaseOpen(false),
        onAddNew: () => {
            setIsCollectionShowcaseOpen(false);
            setIsAddCollectionModalOpen(true);
        },
        setView: setView,
    }),
    isAddCollectionModalOpen && React.createElement(AddCollectionModal, { isOpen: isAddCollectionModalOpen, onClose: () => setIsAddCollectionModalOpen(false) }),
    isEditCollectionModalOpen && selectedCollection && React.createElement(EditCollectionModal, {
      isOpen: isEditCollectionModalOpen,
      onClose: () => setIsEditCollectionModalOpen(false),
      onEditCard: (card) => handleOpenCardEditor(card, false),
      onAddNewCard: () => {
        const newCard = {
          id: '', name: '', collected: false, variantCollected: {}, customFields: {}, customImageUrl: null, 
          rarity: selectedCollection.rarityDefinitions?.[0]?.name || ''
        };
        handleOpenCardEditor(newCard, true);
      }
    }),
    editingCard && React.createElement(CardEditor, {
        card: editingCard,
        isAddingNewCard: isAddingNewCard,
        onSave: handleSaveCard,
        onCancel: () => setEditingCard(null),
        rarityDefinitions: selectedCollection?.rarityDefinitions,
        customFieldDefinitions: selectedCollection?.features?.customFields,
    }),
    isDataModalOpen && React.createElement(DataManagementModal, { isOpen: isDataModalOpen, onClose: () => setIsDataModalOpen(false) }),
    isTutorialActive && selectedCollection && React.createElement(InteractiveTutorial, { 
      onComplete: handleCompleteTutorial, 
      controls: tutorialControls 
    }),
    isImportStatusModalOpen && selectedCollection && fileForStatusImport && React.createElement(ImportStatusModal, {
      isOpen: isImportStatusModalOpen,
      onClose: () => {
        setIsImportStatusModalOpen(false);
        setFileForStatusImport(null);
      },
      file: fileForStatusImport,
      collection: selectedCollection
    }),
    
    isAdmin && React.createElement(AdminPanelModal, {
        isOpen: isAdminPanelOpen,
        onClose: () => setIsAdminPanelOpen(false)
    }),
    
    renderView(),
    
    React.createElement(CookieConsentBanner, { onOpenPolicy: () => setIsCookiePolicyOpen(true) }),
    React.createElement(CookiePolicyModal, { isOpen: isCookiePolicyOpen, onClose: () => setIsCookiePolicyOpen(false) }),
    React.createElement('footer', { className: 'text-center py-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0' },
      React.createElement('p', { className: 'font-cuphead-text text-slate-600 dark:text-slate-400' }, 'My Collector - Happy Collecting!'),
      React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-500 mt-1 font-cuphead-text' }, `© ${new Date().getFullYear()}`)
    )
  );
};

const App = () => {
  const { authStatus, showGuestWarning, continueAsGuest, acceptGuestWarning } = useAuth();

  if (authStatus === 'loading') {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900' },
      React.createElement(SpinnerIcon, { className: 'w-12 h-12 text-blue-800 dark:text-blue-400' })
    );
  }
  
  if (authStatus === 'unauthenticated') {
    return React.createElement(React.Fragment, null,
      React.createElement(LoginScreen, { onGuestContinue: continueAsGuest }),
      React.createElement(GuestWarningModal, { isOpen: showGuestWarning, onConfirm: acceptGuestWarning })
    );
  }
  
  if (authStatus === 'error') {
    return React.createElement(BackendDownScreen, null);
  }

  return React.createElement(AppLayout, null);
};

export default App;
