import React, { createContext, useReducer, useContext, useMemo, useCallback, useEffect } from 'react';
import { useAuth, API_BASE_URL } from './authContext.js';
import { ALL_COLLECTIONS } from './collections/index.js';
import { migrateCollection, parseApiError } from './utils.js';
import { useDataSync } from './hooks.js';
import { useToast } from './toastContext.js';

const CollectionsContext = createContext(undefined);

const collectionsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_INITIAL_DATA': {
        return {
            ...state,
            collections: action.payload.collections,
            selectedCollectionId: action.payload.selectedCollectionId,
            isLoaded: true,
        };
    }
    
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload };

    case 'SELECT_COLLECTION':
      return { ...state, selectedCollectionId: action.payload };

    case 'ADD_COLLECTION':
      return {
        ...state,
        collections: [...state.collections, action.payload],
        selectedCollectionId: action.payload.id, // Auto-select the new collection
      };

    case 'TOGGLE_COLLECTED': {
      const { collectionId, cardId } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === collectionId
            ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, collected: !card.collected } : card) }
            : c
        ),
      };
    }

    case 'TOGGLE_VARIANT_COLLECTED': {
      const { collectionId, cardId, variantId } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          return {
            ...c,
            cards: c.cards.map(card => {
              if (card.id !== cardId) return card;
              
              const newVariantCollected = { ...(card.variantCollected || {}) };
              newVariantCollected[variantId] = !newVariantCollected[variantId];
              
              return { ...card, variantCollected: newVariantCollected };
            })
          };
        }),
      };
    }
    
    case 'UPDATE_CARD_IMAGE': {
      const { collectionId, cardId, imageUrl } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === collectionId
            ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, customImageUrl: imageUrl } : card) }
            : c
        ),
      };
    }

    case 'UPDATE_CARD_DETAILS': {
      const { collectionId, cardId, details } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          return {
            ...c,
            cards: c.cards.map(card => {
              if (card.id !== cardId) return card;
              return { ...card, externalData: details };
            })
          };
        }),
      };
    }
    
    case 'ENRICH_CARD_DATA': {
        const { collectionId, cardId, data } = action.payload;
        return {
            ...state,
            collections: state.collections.map(c => {
                if (c.id !== collectionId) return c;
                return {
                    ...c,
                    cards: c.cards.map(card => {
                        if (card.id !== cardId) return card;
                        const updatedCard = { ...card, externalData: data.externalData };
                        // Only update rarity if the API returned one
                        if (data.rarity) {
                            updatedCard.rarity = data.rarity;
                        }
                        return updatedCard;
                    })
                };
            }),
        };
    }

    case 'RESET_COLLECTION':
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === action.payload
            ? { ...c, cards: c.cards.map(card => ({ ...card, collected: false, variantCollected: {} })) }
            : c
        ),
      };

    case 'UPDATE_STATUS_WITH_MAPPING': {
      const { collectionId, jsonData, mapping } = action.payload;
      
      const updatesMap = new Map();
      if(mapping.cardId) {
          jsonData.forEach(row => {
              const id = String(row[mapping.cardId] || '').trim();
              if (id) {
                  updatesMap.set(id, row);
              }
          });
      }

      if (updatesMap.size === 0) return state; // No valid updates found

      return {
        ...state,
        collections: state.collections.map(collection => {
          if (collection.id !== collectionId) {
            return collection;
          }

          const updatedCards = collection.cards.map(card => {
            const updatedRow = updatesMap.get(card.id);
            if (!updatedRow) {
              return card; // No update for this card
            }

            const newCardState = { ...card };
            const parseBool = (val) => {
              if (typeof val === 'string') {
                const lowerVal = val.toLowerCase().trim();
                return lowerVal === 'true' || lowerVal === 'x' || lowerVal === 'yes' || lowerVal === '1';
              }
              return val === true || val === 1;
            };
            
            // Update collected status
            if (mapping.collected && Object.prototype.hasOwnProperty.call(updatedRow, mapping.collected)) {
              newCardState.collected = parseBool(updatedRow[mapping.collected]);
            }

            // Update variant statuses
            const newVariantCollected = { ...(newCardState.variantCollected || {}) };
            let variantChanged = false;
            Object.entries(mapping.variants || {}).forEach(([variantId, headerName]) => {
                if (headerName && Object.prototype.hasOwnProperty.call(updatedRow, headerName)) {
                    newVariantCollected[variantId] = parseBool(updatedRow[headerName]);
                    variantChanged = true;
                }
            });

            if (variantChanged) {
              newCardState.variantCollected = newVariantCollected;
            }

            return newCardState;
          });

          return { ...collection, cards: updatedCards };
        })
      };
    }

    case 'EDIT_COLLECTION_DETAILS': {
      const { collectionId, name, description } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => c.id === collectionId ? { ...c, name, description } : c),
      };
    }
    
    case 'UPDATE_COLLECTION_RARITIES': {
        const { collectionId, newDefinitions, nameChanges, deletedRarityNames } = action.payload;
        return {
            ...state,
            collections: state.collections.map(c => {
                if (c.id !== collectionId) return c;

                let updatedCards = c.cards;
                if (nameChanges && nameChanges.length > 0) {
                    const changesMap = new Map(nameChanges.map(change => [change.oldName, change.newName]));
                    updatedCards = c.cards.map(card => {
                        if (card.rarity && changesMap.has(card.rarity)) {
                            return { ...card, rarity: changesMap.get(card.rarity) };
                        }
                        return card;
                    });
                }
                
                let updatedFeatures = c.features;
                if (c.features?.variants) {
                    const changesMap = new Map(nameChanges.map(change => [change.oldName, change.newName]));
                    const updatedVariants = c.features.variants.map(variant => ({
                        ...variant,
                        appliesTo: variant.appliesTo
                            .map(r => changesMap.get(r) || r) // Rename
                            .filter(r => !deletedRarityNames.includes(r)), // Remove deleted
                    }));
                    updatedFeatures = { ...c.features, variants: updatedVariants };
                }

                return { ...c, rarityDefinitions: newDefinitions, cards: updatedCards, features: updatedFeatures };
            }),
        };
    }
    
    case 'UPDATE_COLLECTION_VARIANTS': {
        const { collectionId, newVariants } = action.payload;
        return {
            ...state,
            collections: state.collections.map(c => {
                if (c.id !== collectionId) return c;

                const newVariantIds = new Set(newVariants.map(v => v.id));
                const updatedCards = c.cards.map(card => {
                    if (!card.variantCollected) return card;
                    const updatedVariantCollected = {};
                    for (const variantId in card.variantCollected) {
                        if (newVariantIds.has(variantId)) {
                            updatedVariantCollected[variantId] = card.variantCollected[variantId];
                        }
                    }
                    return { ...card, variantCollected: updatedVariantCollected };
                });

                return {
                    ...c,
                    features: { ...c.features, variants: newVariants },
                    cards: updatedCards,
                };
            }),
        };
    }

    case 'UPDATE_BINDER_SLOTS': {
      const { collectionId, slots } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          return {
            ...c,
            features: {
              ...c.features,
              binderSlots: slots,
            },
          };
        }),
      };
    }

    case 'ADD_CARD_TO_COLLECTION': {
      const { collectionId, card } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
            if (c.id !== collectionId) return c;
            const newFeatures = { ...c.features };
            // When adding a card, ensure binderSlots array can accommodate it if needed later, but don't place it.
            // This case is simple: just add the card to the main list.
            return { 
                ...c, 
                cards: [...c.cards, card],
                features: newFeatures,
            };
        }),
      };
    }

    case 'EDIT_CARD_IN_COLLECTION': {
      const { collectionId, oldCardId, updatedCard } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          
          const updatedCards = c.cards.map(card => card.id === oldCardId ? updatedCard : card);

          let updatedBinderSlots = c.features?.binderSlots || [];
          if (oldCardId !== updatedCard.id && updatedBinderSlots.length > 0) {
              updatedBinderSlots = updatedBinderSlots.map(slotId => slotId === oldCardId ? updatedCard.id : slotId);
          }
          
          return {
              ...c,
              cards: updatedCards,
              features: {
                  ...c.features,
                  binderSlots: updatedBinderSlots
              }
          };
        }),
      };
    }

    case 'DELETE_CARD_FROM_COLLECTION': {
      const { collectionId, cardId } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          
          const newCards = c.cards.filter(card => card.id !== cardId);
          // Also remove the card from its binder slot, leaving an empty space (null)
          const newBinderSlots = c.features?.binderSlots?.map(slotId => slotId === cardId ? null : slotId) || [];
          
          return {
              ...c,
              cards: newCards,
              features: {
                  ...c.features,
                  binderSlots: newBinderSlots
              }
          };
        }),
      };
    }

    case 'LOAD_BACKUP': {
      const newCollections = action.payload.map(migrateCollection);
      return {
        ...state,
        collections: newCollections,
        selectedCollectionId: newCollections.length > 0 ? newCollections[0].id : null,
      };
    }
      
    case 'DELETE_COLLECTION': {
      const collectionIdToDelete = action.payload;
      const newCollections = state.collections.filter(c => c.id !== collectionIdToDelete);
      
      let newSelectedId = state.selectedCollectionId;
      if (state.selectedCollectionId === collectionIdToDelete) {
          // If the deleted collection was selected, default to the first in the list, or null if empty.
          newSelectedId = newCollections.length > 0 ? newCollections[0].id : null;
      }

      return {
        ...state,
        collections: newCollections,
        selectedCollectionId: newSelectedId,
      };
    }
      
    case 'TOGGLE_COLLECTION_PIN': {
      const { collectionId } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === collectionId
            ? { ...c, isPinned: !c.isPinned }
            : c
        ),
      };
    }

    case 'SET_LANGUAGE_FOR_ALL_CARDS': {
        const { collectionId, language } = action.payload;
        return {
            ...state,
            collections: state.collections.map(c => {
                if (c.id !== collectionId) return c;
                const updatedCards = c.cards.map(card => ({
                    ...card,
                    language: language,
                }));
                return { ...c, cards: updatedCards };
            }),
        };
    }
      
    case 'REORDER_COLLECTIONS': {
      return { ...state, collections: action.payload };
    }

    default:
      return state;
  }
};

export const CollectionsProvider = ({ children }) => {
  const { authStatus, currentUser } = useAuth();
  const toast = useToast();
  const isPersistenceEnabled = authStatus === 'authenticated';
  
  const [state, dispatch] = useReducer(collectionsReducer, { 
      collections: [], 
      selectedCollectionId: null,
      isLoaded: false 
  });
  
  const syncStatus = useDataSync(
    isPersistenceEnabled,
    currentUser?.uid,
    state.collections,
    state.isLoaded
  );
  
  // Effect to load data from backend or defaults
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
        // For guests, start with an empty shelf. The catalog will be populated from ALL_COLLECTIONS.
        if (!isPersistenceEnabled) {
            if (isMounted) {
                dispatch({ type: 'SET_INITIAL_DATA', payload: { collections: [], selectedCollectionId: null } });
            }
            return;
        }

        if (currentUser?.uid) {
            try {
                const initialCollections = await window.fetchCollections(currentUser.uid);
                if (isMounted) {
                    // The worker now handles migration, so we can use the data directly.
                    const collectionsToLoad = (initialCollections && initialCollections.length > 0)
                        ? initialCollections
                        : [];
                    
                    const selectedId = collectionsToLoad.length > 0 ? collectionsToLoad[0].id : null;
                    dispatch({ type: 'SET_INITIAL_DATA', payload: { collections: collectionsToLoad, selectedCollectionId: selectedId } });
                }
            } catch (error) {
                console.error("Failed to fetch initial collections:", error);
                // Fallback to an empty shelf on error.
                if (isMounted) {
                    dispatch({ type: 'SET_INITIAL_DATA', payload: { collections: [], selectedCollectionId: null } });
                }
            }
        }
    };
    
    if (authStatus === 'authenticated' || authStatus === 'guest') {
        loadInitialData();
    }

    return () => { isMounted = false; };
  }, [isPersistenceEnabled, authStatus, currentUser]);

  const bulkFetchCardDetails = useCallback(async (collectionId) => {
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) {
        toast.error("Collection not found.");
        return { success: false };
    }

    const cardsToFetch = collection.cards.filter(c => !c.externalData);
    if (cardsToFetch.length === 0) {
        toast.info("All card details are already up-to-date!");
        return { success: true, count: 0 };
    }
    
    toast.info(`Fetching details for ${cardsToFetch.length} cards. This may take a moment...`);
    
    let processedCount = 0;
    for (const card of cardsToFetch) {
        try {
            const detailsResponse = await fetch(`${API_BASE_URL}/card-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionName: collection.name,
                    cardName: card.name,
                    cardId: card.id,
                    language: card.language || 'en',
                }),
            });
            const detailsData = await detailsResponse.json();
            if (detailsResponse.ok) {
                dispatch({ type: 'ENRICH_CARD_DATA', payload: { collectionId, cardId: card.id, data: detailsData } });
                processedCount++;
            } else {
                console.warn(`Could not fetch details for ${card.name}: ${detailsData.error || 'Unknown error'}`);
            }
            // Add a delay to avoid rate-limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (innerError) {
            console.error(`Error fetching details for ${card.name}:`, innerError);
        }
    }

    if (processedCount > 0) {
        toast.success(`Successfully fetched data for ${processedCount} cards.`);
    } else {
        toast.info("No new data was found for any card.");
    }
    return { success: true, count: processedCount };
  }, [state.collections, toast]);
  
  const selectCollection = useCallback((id) => {
    dispatch({ type: 'SELECT_COLLECTION', payload: id });
  }, []);

  const addNewCollection = useCallback((collection) => {
    dispatch({ type: 'ADD_COLLECTION', payload: collection });
  }, []);

  const toggleCardCollected = useCallback((collectionId, cardId) => {
    dispatch({ type: 'TOGGLE_COLLECTED', payload: { collectionId, cardId } });
  }, []);

  const toggleCardVariantCollected = useCallback((collectionId, cardId, variantId) => {
    dispatch({ type: 'TOGGLE_VARIANT_COLLECTED', payload: { collectionId, cardId, variantId } });
  }, []);
  
  const updateCardImage = useCallback((collectionId, cardId, imageUrl) => {
    dispatch({ type: 'UPDATE_CARD_IMAGE', payload: { collectionId, cardId, imageUrl } });
  }, []);

  const enrichCardData = useCallback((collectionId, cardId, data) => {
    dispatch({ type: 'ENRICH_CARD_DATA', payload: { collectionId, cardId, data } });
  }, []);

  const resetCollection = useCallback((collectionId) => {
    dispatch({ type: 'RESET_COLLECTION', payload: collectionId });
  }, []);

  const updateStatusWithMapping = useCallback((collectionId, jsonData, mapping) => {
    dispatch({ type: 'UPDATE_STATUS_WITH_MAPPING', payload: { collectionId, jsonData, mapping } });
  }, []);
  
  const editCollectionDetails = useCallback((collectionId, name, description) => {
    dispatch({ type: 'EDIT_COLLECTION_DETAILS', payload: { collectionId, name, description } });
  }, []);
  
  const updateCollectionRarities = useCallback((collectionId, newDefinitions, nameChanges, deletedRarityNames) => {
    dispatch({ type: 'UPDATE_COLLECTION_RARITIES', payload: { collectionId, newDefinitions, nameChanges, deletedRarityNames } });
  }, []);

  const updateCollectionVariants = useCallback((collectionId, newVariants) => {
    dispatch({ type: 'UPDATE_COLLECTION_VARIANTS', payload: { collectionId, newVariants } });
  }, []);

  const updateBinderSlots = useCallback((collectionId, slots) => {
    dispatch({ type: 'UPDATE_BINDER_SLOTS', payload: { collectionId, slots } });
  }, []);

  const addCardToCollection = useCallback((collectionId, card) => {
    dispatch({ type: 'ADD_CARD_TO_COLLECTION', payload: { collectionId, card } });
  }, []);

  const editCardInCollection = useCallback((collectionId, oldCardId, updatedCard) => {
    dispatch({ type: 'EDIT_CARD_IN_COLLECTION', payload: { collectionId, oldCardId, updatedCard } });
  }, []);

  const deleteCardFromCollection = useCallback((collectionId, cardId) => {
    dispatch({ type: 'DELETE_CARD_FROM_COLLECTION', payload: { collectionId, cardId } });
  }, []);

  const loadCollectionsFromBackup = useCallback((collectionsToLoad) => {
    dispatch({ type: 'LOAD_BACKUP', payload: collectionsToLoad });
  }, []);
  
  const deleteCollection = useCallback((collectionId) => {
    dispatch({ type: 'DELETE_COLLECTION', payload: collectionId });
  }, []);
  
  const toggleCollectionPin = useCallback((collectionId) => {
    dispatch({ type: 'TOGGLE_COLLECTION_PIN', payload: { collectionId } });
  }, []);

  const setLanguageForAllCards = useCallback((collectionId, language) => {
    dispatch({ type: 'SET_LANGUAGE_FOR_ALL_CARDS', payload: { collectionId, language } });
  }, []);
    
  const reorderCollections = useCallback((reorderedCollections) => {
    dispatch({ type: 'REORDER_COLLECTIONS', payload: reorderedCollections });
  }, []);

  const value = useMemo(() => {
    const selectedCollection = state.collections.find(c => c.id === state.selectedCollectionId);

    return {
      collections: state.collections,
      selectedCollection,
      selectedCollectionId: state.selectedCollectionId,
      isLoaded: state.isLoaded,
      syncStatus,
      selectCollection,
      addNewCollection,
      toggleCardCollected,
      toggleCardVariantCollected,
      updateCardImage,
      enrichCardData,
      bulkFetchCardDetails,
      resetCollection,
      updateStatusWithMapping,
      editCollectionDetails,
      updateCollectionRarities,
      updateCollectionVariants,
      updateBinderSlots,
      addCardToCollection,
      editCardInCollection,
      deleteCardFromCollection,
      loadCollectionsFromBackup,
      deleteCollection,
      toggleCollectionPin,
      setLanguageForAllCards,
      reorderCollections,
    };
  }, [state, selectCollection, addNewCollection, toggleCardCollected, toggleCardVariantCollected, updateCardImage, enrichCardData, bulkFetchCardDetails, resetCollection, updateStatusWithMapping, editCollectionDetails, updateCollectionRarities, updateCollectionVariants, updateBinderSlots, addCardToCollection, editCardInCollection, deleteCardFromCollection, loadCollectionsFromBackup, deleteCollection, toggleCollectionPin, setLanguageForAllCards, reorderCollections, syncStatus]);

  return React.createElement(CollectionsContext.Provider, { value: value }, children);
};

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
};