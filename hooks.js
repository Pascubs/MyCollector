





import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from './toastContext.js';
import { API_BASE_URL } from './authContext.js';
import { useCookieConsent } from './cookieContext.js';

/**
 * A custom hook for persisting state to localStorage, respecting user cookie consent.
 * @param {string} key The key to use in localStorage.
 * @param {T | (() => T)} initialValue The initial value to use if none is found in storage or if consent is denied.
 * @returns A stateful value, and a function to update it.
 */
export function useLocalStorage(key, initialValue) {
  const { consent } = useCookieConsent();
  const canPersist = consent === 'accepted';

  // This function encapsulates the logic to get the initial state.
  // It reads from localStorage ONLY if consent is given.
  const getStoredValue = useCallback(() => {
    // Cannot persist on server or if consent is not given
    if (!canPersist || typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  }, [canPersist, key, initialValue]);

  const [value, setValue] = useState(getStoredValue);
  
  // This effect will run when getStoredValue changes (i.e., when consent changes).
  // It ensures the state is reset to the correct initial value (from storage or default).
  useEffect(() => {
    setValue(getStoredValue());
  }, [getStoredValue]);

  // This effect synchronizes the state back to localStorage whenever it changes, if consent is given.
  useEffect(() => {
    if (canPersist && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, value, canPersist]);

  return [value, setValue];
}

/**
 * A hook for managing the application theme that syncs with the global script in `index.html`.
 * @returns {{theme: 'light' | 'dark', toggleTheme: () => void}}
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'; // Default for SSR or build-time rendering.
    }
    // The single source of truth is the class on the <html> element, set by the inline script.
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Listen for the custom 'themechange' event dispatched by the global script.
  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail?.theme) {
        setTheme(event.detail.theme);
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []); // Empty dependency array ensures this effect runs only once.

  // This function calls the globally exposed function from index.html.
  const toggleTheme = () => {
    if (window.toggleMyCollectorTheme) {
      window.toggleMyCollectorTheme();
    } else {
      console.error('Theme toggle function not found on window object.');
    }
  };

  return { theme, toggleTheme };
}

// --- Data Synchronization Logic ---

const fetchCollections = async (userId) => {
    if (!userId) throw new Error("User ID is required.");
    // Path is relative to the unified API base URL
    const response = await fetch(`${API_BASE_URL}/collections/${userId}`);
    if (!response.ok) {
        if (response.status === 404) return []; // New user, return empty array
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
};

const saveCollections = async (userId, collections) => {
    if (!userId) throw new Error("User ID is required.");
    // Path is relative to the unified API base URL
    const response = await fetch(`${API_BASE_URL}/collections/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collections),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save collections: ${errorText || response.statusText}`);
    }
    return response.json();
};

// Expose on window for easier access from context
if (typeof window !== 'undefined') {
    window.fetchCollections = fetchCollections;
    window.saveCollections = saveCollections;
}


/**
 * Manages data synchronization with the backend worker.
 * @param {boolean} isEnabled Whether sync is active (user is authenticated).
 * @param {string | undefined} userId The current user's ID.
 * @param {any[]} collections The current collections state.
 * @param {boolean} isLoaded Whether the initial data has been loaded.
 * @returns {'idle' | 'syncing' | 'success' | 'error'}
 */
export function useDataSync(isEnabled, userId, collections, isLoaded) {
    const [syncStatus, setSyncStatus] = useState('idle');
    const toast = useToast();
    const saveTimeoutRef = useRef(null);
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!isEnabled || !isLoaded || !userId) {
            return;
        }

        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }
        
        // Clear any pending save operation
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSyncStatus('syncing');

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await window.saveCollections(userId, collections);
                setSyncStatus('success');
            } catch (error) {
                console.error("Data sync failed:", error);
                setSyncStatus('error');
                toast.error("Failed to save changes. Please check your connection.");
            }
        }, 2500); // 2.5-second debounce delay

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [collections, isEnabled, isLoaded, userId, toast]);

    return syncStatus;
}

/**
 * Custom hook for detecting clicks outside of a specified element.
 * @param {React.RefObject<HTMLElement>} ref The ref of the element to monitor.
 * @param {() => void} handler The function to call on an outside click.
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/**
 * Calculates collection progress based on the collection data and current set mode.
 * @param {Collection | undefined} collection The collection object.
 * @param {'standard' | 'complete' | 'master'} setMode The current set mode.
 * @returns {{collected: number, total: number, percentage: number}}
 */
export function useCollectionProgress(collection, setMode) {
  return useMemo(() => {
    if (!collection?.cards) {
      return { collected: 0, total: 0, percentage: 0 };
    }

    const { cards, rarityDefinitions, features } = collection;
    const variants = features?.variants || [];
    
    const standardRarityNames = new Set(
        (rarityDefinitions || []).filter(r => r.category === 'Standard').map(r => r.name)
    );

    let collected = 0;
    let total = 0;

    switch (setMode) {
        case 'standard':
            cards.forEach(card => {
                if (standardRarityNames.has(card.rarity)) {
                    total++;
                    if (card.collected) collected++;
                }
            });
            break;

        case 'complete':
            total = cards.length;
            collected = cards.filter(c => c.collected).length;
            break;

        case 'master':
            total = cards.length;
            collected = cards.filter(c => c.collected).length;
            cards.forEach(card => {
                const applicableVariants = variants.filter(v => v.appliesTo.includes(card.rarity));
                total += applicableVariants.length;
                applicableVariants.forEach(variant => {
                    if (card.variantCollected?.[variant.id]) {
                        collected++;
                    }
                });
            });
            break;

        default: // Should not happen, but default to 'complete' logic
            total = cards.length;
            collected = cards.filter(c => c.collected).length;
            break;
    }

    return {
        collected,
        total,
        percentage: total > 0 ? (collected / total) * 100 : 0,
    };
  }, [collection, setMode]);
}

/**
 * A custom hook to memoize filtering and sorting logic for cards.
 */
export function useFilteredCards({
  selectedCollection,
  isBinderMode,
  binderSortMode,
  deferredSearchTerm,
  filterCollected,
  rarityFilterState,
  sortBy,
  sortDirection
}) {
  return useMemo(() => {
    if (!selectedCollection) return [];

    const rarityOrderMap = sortBy === 'rarity'
        ? new Map((selectedCollection.rarityDefinitions || []).map((def, index) => [def.name, index]))
        : null;

    const sortFn = (a, b) => {
        let valA, valB;

        if (sortBy === 'id' || sortBy === 'name' || sortBy === 'rarity') {
            valA = a[sortBy];
            valB = b[sortBy];
        } else { // It's a custom field
            valA = a.customFields?.[sortBy];
            valB = b.customFields?.[sortBy];
        }

        const aExists = valA !== null && valA !== undefined && valA !== '';
        const bExists = valB !== null && valB !== undefined && valB !== '';

        if (!aExists && !bExists) return 0;
        if (!aExists) return 1;
        if (!bExists) return -1;
        
        let comparison = 0;
        if (sortBy === 'rarity' && rarityOrderMap) {
            const orderA = rarityOrderMap.get(valA) ?? Infinity;
            const orderB = rarityOrderMap.get(valB) ?? Infinity;
            comparison = orderA - orderB;
        } else if (sortBy === 'id') {
            comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        } else {
            const numA = parseFloat(String(valA).replace(/,/g, ''));
            const numB = parseFloat(String(valB).replace(/,/g, ''));

            if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
            } else {
                comparison = String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' });
            }
        }
        
        return comparison * (sortDirection === 'asc' ? 1 : -1);
    };

    if (isBinderMode) {
        if (binderSortMode === 'custom') {
            const slots = selectedCollection.features?.binderSlots || [];
            const cardMap = new Map(selectedCollection.cards.map(c => [c.id, c]));
            return slots.map(id => id ? cardMap.get(id) : null);
        }
        return [...selectedCollection.cards].sort(sortFn);
    }

    const lowerSearch = deferredSearchTerm.toLowerCase();
    const filtered = selectedCollection.cards.filter(card => {
        const matchesSearch = lowerSearch === '' ||
            card.name.toLowerCase().includes(lowerSearch) ||
            (card.description && card.description.toLowerCase().includes(lowerSearch)) ||
            card.id.toLowerCase().includes(lowerSearch);
        const matchesCollected = filterCollected === 'all' ||
            (filterCollected === 'collected' && card.collected) ||
            (filterCollected === 'uncollected' && !card.collected);
        const matchesRarity = !rarityFilterState.rarity || card.rarity === rarityFilterState.rarity;
        return matchesSearch && matchesCollected && matchesRarity;
    });

    return filtered.sort(sortFn);

  }, [selectedCollection, isBinderMode, binderSortMode, deferredSearchTerm, filterCollected, rarityFilterState, sortBy, sortDirection]);
}
