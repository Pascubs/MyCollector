import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { CollectionsProvider } from './context.js';
import { AuthProvider } from './authContext.js';
import { ToastProvider } from './toastContext.js';
import { CookieConsentProvider } from './cookieContext.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(CookieConsentProvider, null,
      React.createElement(ToastProvider, null,
        React.createElement(AuthProvider, null,
          React.createElement(CollectionsProvider, null,
            React.createElement(App, null)
          )
        )
      )
    )
  )
);