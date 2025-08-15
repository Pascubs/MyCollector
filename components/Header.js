import React, { useRef } from 'react';
import { useAuth } from '../authContext.js';
import { useCollections } from '../context.js';
import { SunIcon, MoonIcon, DataManagementIcon, ArrowLeftOnRectangleIcon, Bars3Icon, UserCircleIcon, BookOpenIcon, CloseIcon, QuestionMarkCircleIcon } from '../icons.js';
import SyncStatusIndicator from './SyncStatusIndicator.js';
import { useOnClickOutside } from '../hooks.js';

const Header = ({ 
    theme, toggleTheme, onOpenDataManagement, onToggleSidebar, 
    isActionsMenuOpen, setIsActionsMenuOpen, onOpenCollectionShowcase,
    onStartTutorial, onOpenAdminPanel
}) => {
  const { authStatus, currentUser, logout, login, isAdmin } = useAuth();
  const { syncStatus, collections, selectedCollection } = useCollections();
  
  const menuRef = useRef(null);
  useOnClickOutside(menuRef, () => setIsActionsMenuOpen(false));

  const handleMenuAction = (action) => {
    action();
    setIsActionsMenuOpen(false);
  };
  
  const AuthControls = () => {
    if (authStatus === 'authenticated' && currentUser) {
      return React.createElement('div', { className: 'relative', ref: menuRef },
        React.createElement('button', {
          onClick: () => setIsActionsMenuOpen(prev => !prev),
          className: 'w-10 h-10 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 hover:border-blue-700 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 dark:focus:ring-offset-slate-800 transition-all',
          'aria-label': 'Open user menu',
          'data-tour-id': 'header-actions-toggle' // Keep for main tutorial
        },
          React.createElement('img', { src: currentUser.photoURL, alt: 'User profile', className: 'w-full h-full object-cover', referrerPolicy: 'no-referrer' })
        ),
        isActionsMenuOpen && React.createElement('div', {
          className: 'absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 origin-top-right font-cuphead-text p-1',
          'data-tour-id': 'header-actions-menu'
        },
          React.createElement('div', { className: 'p-2 border-b border-slate-200 dark:border-slate-700 mb-1' },
            React.createElement('div', { className: 'flex items-center gap-3' },
              React.createElement('img', { src: currentUser.photoURL, alt: 'User profile', className: 'w-10 h-10 rounded-full object-cover', referrerPolicy: 'no-referrer' }),
              React.createElement('div', { className: 'min-w-0' },
                React.createElement('p', { className: 'text-sm font-semibold text-slate-800 dark:text-slate-100 truncate' }, currentUser.displayName),
                React.createElement('p', { className: 'text-xs text-slate-500 dark:text-slate-400 truncate' }, currentUser.email)
              )
            )
          ),
          React.createElement('button', { onClick: () => handleMenuAction(onOpenDataManagement), className: 'w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700' },
            React.createElement(DataManagementIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, 'Data Management')
          ),
          React.createElement('button', { onClick: () => handleMenuAction(toggleTheme), className: 'w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700' },
            theme === 'light' ? React.createElement(MoonIcon, { className: 'w-5 h-5' }) : React.createElement(SunIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`)
          ),
          React.createElement('div', { className: 'my-1 h-px bg-slate-200 dark:bg-slate-700' }),
          React.createElement('button', { onClick: () => handleMenuAction(logout), className: 'w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/40' },
            React.createElement(ArrowLeftOnRectangleIcon, { className: 'w-5 h-5' }),
            React.createElement('span', null, 'Logout')
          )
        )
      );
    }
    
    // Guest user state
    return React.createElement('button', {
      onClick: login,
      className: 'flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-md text-sm sm:text-base'
    },
      React.createElement(UserCircleIcon, { className: 'w-6 h-6' }),
      React.createElement('span', { className: 'hidden sm:inline' }, 'Sign In')
    );
  };

  const ViewToggleButton = () => {
      // This button now consistently opens the "My Shelf" modal, regardless of the current view.
      return React.createElement('button', {
          onClick: onOpenCollectionShowcase,
          'data-tour-id': 'collection-selector',
          className: 'flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all font-cuphead-text text-sm sm:text-base shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600',
      },
          React.createElement(BookOpenIcon, { className: 'w-5 h-5 text-blue-800 dark:text-blue-400' }),
          React.createElement('span', { className: 'text-slate-800 dark:text-slate-200' }, 'My Shelf')
      );
  };

  return React.createElement('header', { className: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-30 h-[69px] flex items-center' },
    React.createElement('div', { className: 'container mx-auto flex justify-between items-center' },
      React.createElement('div', { className: 'flex items-center gap-2' },
        (collections.length > 0 && selectedCollection) && React.createElement('button', {
          onClick: onToggleSidebar,
          className: 'lg:hidden p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
          'aria-label': 'Open menu',
          'data-tour-id': 'mobile-menu-toggle'
        },
          React.createElement(Bars3Icon, { className: 'w-6 h-6' })
        ),
        React.createElement('h1', { className: 'font-cuphead-title text-xl sm:text-3xl text-blue-800 dark:text-blue-400' }, 'My Collector'),
        (authStatus === 'authenticated') && React.createElement(SyncStatusIndicator, { status: syncStatus })
      ),
      
      React.createElement('div', { className: 'flex items-center gap-2 sm:gap-4' },
        React.createElement(ViewToggleButton, null),
        isAdmin && React.createElement('button', {
            onClick: onOpenAdminPanel,
            className: 'px-3 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow',
            title: 'Open Admin Panel'
        }, 'Admin'),
        React.createElement('button', {
          onClick: onStartTutorial,
          className: 'p-2 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
          'aria-label': 'Start interactive tutorial'
        }, React.createElement(QuestionMarkCircleIcon, { className: 'w-7 h-7' })),
        React.createElement(AuthControls, null)
      )
    )
  );
};

export default Header;
