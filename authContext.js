import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

const AuthContext = createContext(undefined);

// Unified base URL for all backend services.
export const API_BASE_URL = 'https://mycollector.it/api';

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated', 'guest', 'error'
  const [currentUser, setCurrentUser] = useState(null);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      // Guest mode is client-side only and takes precedence
      if (sessionStorage.getItem('myCollectorGuestMode') === 'true') {
        setAuthStatus('guest');
        return;
      }

      try {
        // Fetch user data from the backend's session endpoint, ensuring cookies are sent.
        const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        
        if (!response.ok) {
            // Any non-2xx response means the user is not authenticated.
            // This includes 401 Unauthorized, which is the expected response for no session.
            setAuthStatus('unauthenticated');
            setCurrentUser(null);
            return;
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            // The backend's /api/auth/me endpoint returns the user object directly.
            // We check for 'uid' as a sign of a valid user object.
            if (data && data.uid) {
              setCurrentUser(data);
              setAuthStatus('authenticated');
            } else {
              // The API responded with JSON but it wasn't a valid user object.
              setAuthStatus('unauthenticated');
              setCurrentUser(null);
            }
        } else {
            // This handles cases where the server responds with something other than JSON.
            console.warn('Received non-JSON response from session check; treating as unauthenticated.');
            setAuthStatus('unauthenticated');
            setCurrentUser(null);
        }
      } catch (error) {
        // This catches network errors, indicating the backend is likely down or unreachable.
        console.error("Failed to connect to backend for session check:", error);
        setAuthStatus('error');
        setCurrentUser(null);
      }
    };
    
    checkUserSession();
    
  }, []);

  const login = useCallback(() => {
    // Clear any guest session flag before initiating login.
    // This ensures that upon returning from Google, the app doesn't
    // incorrectly default back to guest mode.
    sessionStorage.removeItem('myCollectorGuestMode');
    // Redirect to the backend's Google OAuth endpoint. The backend handles the flow
    // and will redirect back to the app upon successful authentication.
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  }, []);
  
  const logout = useCallback(async () => {
    try {
        // Inform the backend to destroy the session, ensuring cookies are sent.
        await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error("Logout API call failed, proceeding with client-side state cleanup:", error);
    } finally {
        // Always clean up the client-side state.
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
        setShowGuestWarning(false);
        sessionStorage.removeItem('myCollectorGuestMode');
        // Reload to ensure all states are reset, especially after logging out of a guest session.
        window.location.reload();
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    setShowGuestWarning(true);
  }, []);

  const acceptGuestWarning = useCallback(() => {
    setShowGuestWarning(false);
    setAuthStatus('guest');
    sessionStorage.setItem('myCollectorGuestMode', 'true');
  }, []);

  const switchToOfflineMode = useCallback(() => {
    setAuthStatus('guest');
    sessionStorage.setItem('myCollectorGuestMode', 'true');
  }, []);

  const value = useMemo(() => ({
    authStatus,
    currentUser,
    showGuestWarning,
    login,
    logout,
    continueAsGuest,
    acceptGuestWarning,
    switchToOfflineMode
  }), [authStatus, currentUser, showGuestWarning, login, logout, continueAsGuest, acceptGuestWarning, switchToOfflineMode]);

  return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Expose isAdmin for convenience, derived from the currentUser object
  const isAdmin = !!context.currentUser?.isAdmin;
  return { ...context, isAdmin };
};
