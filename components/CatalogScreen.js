import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useCollections } from '../context.js';
import { useToast } from '../toastContext.js';
import CollectionCard from './CollectionCard.js';
import { SpinnerIcon, ErrorIcon } from '../icons.js';
import { API_BASE_URL } from '../authContext.js';
import { parseApiError } from '../utils.js';


const FlyingCardComponent = ({ collection, startRect, endRect }) => {
    const elRef = useRef(null);

    React.useEffect(() => {
        const node = elRef.current;
        if (!node) return;

        // Set initial state
        node.style.position = 'fixed';
        node.style.left = `${startRect.left}px`;
        node.style.top = `${startRect.top}px`;
        node.style.width = `${startRect.width}px`;
        node.style.height = `${startRect.height}px`;
        node.style.zIndex = '100';
        node.style.pointerEvents = 'none';
        node.style.transition = 'all 0.6s cubic-bezier(0.5, 0, 0.75, 0)';

        // Animate on next frame
        requestAnimationFrame(() => {
            const targetX = endRect.left + (endRect.width / 2) - (startRect.width * 0.1 / 2);
            const targetY = endRect.top + (endRect.height / 2) - (startRect.height * 0.1 / 2);
            node.style.transform = `translate(${targetX - startRect.left}px, ${targetY - startRect.top}px) scale(0.1)`;
            node.style.opacity = '0';
        });
    }, [startRect, endRect, startRect.width, startRect.height]);

    return (
        React.createElement('div', { ref: elRef },
            React.createElement(CollectionCard, { collection: collection, onAdd: () => {}, isOwned: false })
        )
    );
};

const CatalogScreen = ({ setView }) => {
    const { collections, addNewCollection } = useCollections();
    const toast = useToast();
    const [flyingCard, setFlyingCard] = useState(null);
    const [hidingCardId, setHidingCardId] = useState(null);
    const collectionCardRefs = useRef({});
    
    const [catalogCollections, setCatalogCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCatalog = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/catalog`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to load catalog (${response.status})`);
            }
            const data = await response.json();
            setCatalogCollections(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            const friendlyError = parseApiError(err);
            setError(friendlyError);
            toast.error(friendlyError);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCatalog();

        const handleCatalogUpdate = () => {
            toast.info('Catalog updated. Refreshing list...');
            fetchCatalog();
        };

        window.addEventListener('catalogupdated', handleCatalogUpdate);
        return () => window.removeEventListener('catalogupdated', handleCatalogUpdate);
    }, [fetchCatalog, toast]);

    const userCollectionIds = useMemo(() => new Set(collections.map(c => c.id)), [collections]);
    
    const handleAddCollection = (collection) => {
        const startElement = collectionCardRefs.current[collection.id];
        const targetElement = document.querySelector('[data-tour-id="collection-selector"]');

        if (!startElement || !targetElement) {
            addNewCollection(collection);
            toast.success(`"${collection.name}" added to your shelf!`);
            return;
        }

        const startRect = startElement.getBoundingClientRect();
        const endRect = targetElement.getBoundingClientRect();
        
        setHidingCardId(collection.id);
        setFlyingCard({ collection, startRect, endRect });

        setTimeout(() => {
            addNewCollection(collection);
            toast.success(`"${collection.name}" added to your shelf!`);
            setFlyingCard(null);
            setHidingCardId(null);
        }, 600);
    };
    
    const renderContent = () => {
        if (isLoading) {
            return React.createElement('div', { className: 'flex justify-center items-center py-20' },
                React.createElement(SpinnerIcon, { className: 'w-16 h-16 text-blue-800 dark:text-blue-400' })
            );
        }
        
        if (error) {
            return React.createElement('div', { className: 'text-center text-rose-600 dark:text-rose-400 font-cuphead-text text-xl py-12 bg-rose-50 dark:bg-rose-900/40 rounded-xl shadow-sm border border-rose-200 dark:border-rose-500/50' },
                React.createElement(ErrorIcon, { className: 'w-12 h-12 mx-auto mb-4' }),
                React.createElement('p', { className: 'font-bold' }, 'Could not load catalog'),
                React.createElement('p', { className: 'text-base mt-2' }, error)
            );
        }
        
        if (catalogCollections.length === 0) {
             return React.createElement('div', { className: 'text-center text-slate-600 dark:text-slate-400 font-cuphead-text text-2xl py-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700' },
                React.createElement('p', { className: 'text-3xl mb-2' }, '🚧'),
                React.createElement('p', { className: 'font-bold' }, 'The Catalog is Currently Empty'),
                React.createElement('p', { className: 'text-lg mt-2' }, "You can start by creating your own collection from a spreadsheet."),
                React.createElement('button', {
                    onClick: () => setView('shelf'),
                    className: 'mt-6 px-6 py-2 text-lg bg-blue-800 text-white font-cuphead-text rounded-lg shadow hover:bg-blue-900 transition-colors'
                }, 'Go to My Shelf')
            );
        }
        
        return React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' },
            ...catalogCollections.map(collection => (
                React.createElement('div', {
                    key: collection.id,
                    ref: el => (collectionCardRefs.current[collection.id] = el),
                    style: { opacity: hidingCardId === collection.id ? 0 : 1, transition: 'opacity 0.3s' }
                },
                    React.createElement(CollectionCard, {
                        collection: collection,
                        isOwned: userCollectionIds.has(collection.id),
                        onAdd: handleAddCollection,
                    })
                )
            ))
        );
    };

    return React.createElement('div', { className: 'flex-1 bg-slate-50 dark:bg-slate-900' },
        React.createElement('div', { className: 'container mx-auto p-4 sm:p-6 lg:p-8' },
            React.createElement('div', { className: 'text-center mb-8' },
                React.createElement('h1', { className: 'font-cuphead-title text-4xl sm:text-5xl font-bold text-slate-800 dark:text-slate-100' }, 'Collection Catalog'),
                React.createElement('p', { className: 'mt-2 text-lg text-slate-600 dark:text-slate-400 font-cuphead-text' }, 'Browse available collections or create your own.')
            ),
            renderContent()
        ),
        flyingCard && React.createElement(FlyingCardComponent, flyingCard)
    );
};

export default CatalogScreen;
