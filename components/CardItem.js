import React, { useRef, useState } from 'react';
import { useCollections } from '../context.js';
import { getRarityStyling, parseApiError } from '../utils.js';
import { useToast } from '../toastContext.js';
import { PencilIcon, CloudArrowDownIcon, SpinnerIcon } from '../icons.js';
import { API_BASE_URL } from '../authContext.js';

const RarityBadge = ({ rarityName, rarityDefinitions, viewMode }) => {
  if (!rarityName) return null;

  const rarityDef = rarityDefinitions.find(r => r.name === rarityName);
  const { base: bgColor, text: textColor } = getRarityStyling(rarityDef);
  const positionClasses = viewMode === 'grid' ? 'absolute top-2 right-2' : '';

  return React.createElement('span', {
    className: `${positionClasses} ${bgColor} ${textColor} text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm font-cuphead-text whitespace-nowrap`
  }, rarityName);
};

const ImageSourceBadge = ({ source, viewMode }) => {
    if (!source) return null;

    const baseClasses = 'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded';
    let colorClasses = 'bg-slate-500/80 text-white'; // default
    let sourceName = source;

    if (source === 'CardTrader') {
        colorClasses = 'bg-red-600/90 text-white';
    } else if (source === 'Pokémon TCG API') {
        colorClasses = 'bg-yellow-400/90 text-slate-900';
        sourceName = 'pokemontcg.io'; // shorter name
    } else if (source === 'TCGdex') {
        colorClasses = 'bg-blue-500/90 text-white';
    }
    
    const positionClasses = viewMode === 'grid' 
        ? 'absolute bottom-2 left-2' 
        : 'absolute bottom-1 left-1';

    return React.createElement('div', {
        className: `${positionClasses} ${baseClasses} ${colorClasses} backdrop-blur-sm`,
        title: `Image from ${source}`
    }, sourceName);
};


const ExternalInfo = ({ data, viewMode }) => {
    if (!data) return null;

    const findLowestPrice = () => {
        if (!data.marketplace || data.marketplace.length === 0) return null;

        const prices = data.marketplace
            .filter(p => p.price.cents > 0)
            .map(p => ({
                cents: p.price.cents,
                currency: p.price.currency,
            }));

        if (prices.length === 0) return null;

        const minPrice = prices.reduce((min, current) => {
            return (current.cents < min.cents) ? current : min;
        }, prices[0]);

        if (minPrice) {
            return `${(minPrice.cents / 100).toFixed(2)} ${minPrice.currency}`;
        }
        return null;
    };

    const lowestPrice = findLowestPrice();
    const baseClasses = 'text-xs text-slate-600 dark:text-slate-400';
    const gridClasses = 'mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50';
    const listClasses = 'mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50';

    if (!lowestPrice && !data.fixed_url) {
        return React.createElement('div', { className: viewMode === 'grid' ? gridClasses : listClasses },
            React.createElement('p', { className: baseClasses }, 'No market data found.')
        );
    }
    
    if (!lowestPrice && data.fixed_url) {
         return (
            React.createElement('div', { className: viewMode === 'grid' ? gridClasses : listClasses },
                React.createElement('a', {
                    href: data.fixed_url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: `${baseClasses} hover:underline`
                },
                    React.createElement('span', { className: 'font-semibold' }, 'View on Marketplace')
                )
            )
        );
    }

    return (
        React.createElement('div', { className: viewMode === 'grid' ? gridClasses : listClasses },
            React.createElement('a', {
                href: data.fixed_url,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: `${baseClasses} hover:underline`
            },
                React.createElement('span', { className: 'font-semibold' }, 'Market Lowest Price:'), ` ${lowestPrice}`
            )
        )
    );
};


const CardItem = ({ card, viewMode, isTutorialHighlight = false }) => {
  const { selectedCollection, toggleCardCollected, toggleCardVariantCollected, updateCardImage, enrichCardData } = useCollections();
  const rootAttributes = isTutorialHighlight ? { 'data-tour-id': 'card-item' } : {};
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isFetching, setIsFetching] = useState(false);

  const onToggleCollected = () => {
    if (selectedCollection) {
      toggleCardCollected(selectedCollection.id, card.id);
    }
  };

  const onToggleVariant = (variantId) => {
    if (selectedCollection) {
      toggleCardVariantCollected(selectedCollection.id, card.id, variantId);
    }
  };
  
  const handleFetchDetails = async () => {
    if (!selectedCollection || isFetching) return;
    setIsFetching(true);
    toast.info(`Fetching details for "${card.name}"...`);
    try {
        const response = await fetch(`${API_BASE_URL}/card-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collectionName: selectedCollection.name,
                cardName: card.name,
                cardId: card.id,
                language: card.language || 'en',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Failed to fetch details (${response.status})`);
        }
        
        enrichCardData(selectedCollection.id, card.id, data);
        toast.success(`Details for "${card.name}" updated!`);

    } catch (err) {
        toast.error(parseApiError(err));
    } finally {
        setIsFetching(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('File is too large. Max size is 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        if (selectedCollection && typeof reader.result === 'string') {
            updateCardImage(selectedCollection.id, card.id, reader.result);
            toast.success('Image updated!');
        }
    };
    reader.onerror = () => {
        toast.error('Failed to read file.');
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getImageUrl = () => {
    if (card.externalData?.image_url) {
        return card.externalData.image_url;
    }
    return card.customImageUrl || `https://placehold.co/300x420/27272a/e5e5e5?text=${encodeURIComponent(card.name)}`;
  };

  const fallbackImageUrl = `https://placehold.co/300x420/475569/94a3b8?text=Image+Not+Found`;
  const imageUrl = getImageUrl();
  const uniqueCheckboxId = `collected-${selectedCollection?.id}-${card.id}`;
  const cardNameLabelId = `card-name-${selectedCollection?.id}-${card.id}`;
  
  const applicableVariants = (selectedCollection?.features?.variants || [])
    .filter(variant => card.rarity && variant.appliesTo.includes(card.rarity));
    
  const hasCustomFields = card.customFields && Object.keys(card.customFields).length > 0;

  if (viewMode === 'list') {
    return React.createElement('div', {
      ...rootAttributes,
      className: `relative flex items-start gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md ${card.collected ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-900' : 'border border-slate-200 dark:border-slate-700'}`
    },
      React.createElement('div', { className: 'relative group flex-shrink-0' },
        React.createElement('img', {
            src: imageUrl,
            alt: card.name,
            className: 'w-20 h-28 object-cover rounded-md flex-shrink-0 bg-slate-100 dark:bg-slate-700',
            onError: (e) => (e.currentTarget.src = fallbackImageUrl)
        }),
        React.createElement(ImageSourceBadge, { source: card.externalData?.image_source, viewMode: 'list' }),
        React.createElement('input', {
            type: 'file',
            ref: fileInputRef,
            onChange: handleImageUpload,
            accept: 'image/*',
            className: 'hidden'
        }),
        React.createElement('button', {
            onClick: triggerFileUpload,
            className: 'absolute top-1 right-1 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100',
            'aria-label': 'Change card image',
            title: 'Change card image'
        },
            React.createElement(PencilIcon, { className: 'w-4 h-4' })
        )
      ),
      React.createElement('div', { className: 'flex-1 min-w-0' },
        React.createElement('div', { className: 'flex items-center gap-2 mb-0.5' },
          React.createElement('h3', { className: 'font-cuphead-title text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate', title: card.name, id: cardNameLabelId }, card.name),
          React.createElement(RarityBadge, { rarityName: card.rarity, rarityDefinitions: selectedCollection.rarityDefinitions, viewMode: viewMode })
        ),
        React.createElement('p', { className: 'font-cuphead-text text-xs text-slate-500 dark:text-slate-400 mb-2' }, `Card No: ${card.id}`),
        React.createElement('div', { className: 'flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2' },
          React.createElement('label', { htmlFor: uniqueCheckboxId, className: 'flex items-center space-x-2 cursor-pointer p-1 -m-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors' },
            React.createElement('input', {
              id: uniqueCheckboxId,
              type: 'checkbox',
              checked: card.collected,
              onChange: onToggleCollected,
              className: 'form-checkbox h-5 w-5 text-amber-600 bg-slate-100 dark:bg-slate-600 border-slate-400 dark:border-slate-500 rounded focus:ring-amber-500 focus:ring-offset-0 transition-all duration-150 dark:checked:bg-amber-600',
              'aria-labelledby': cardNameLabelId
            }),
            React.createElement('span', { className: `font-cuphead-text text-sm ${card.collected ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}` }, 'Collected')
          ),
          ...applicableVariants.map(variant => {
            const isCollected = card.variantCollected?.[variant.id] ?? false;
            const uniqueVariantId = `variant-${selectedCollection?.id}-${card.id}-${variant.id}`;
            return React.createElement('label', { key: variant.id, htmlFor: uniqueVariantId, className: 'flex items-center space-x-2 cursor-pointer p-1 -m-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors' },
              React.createElement('input', {
                id: uniqueVariantId,
                type: 'checkbox',
                checked: isCollected,
                onChange: () => onToggleVariant(variant.id),
                className: 'form-checkbox h-4 w-4 text-blue-800 bg-slate-100 dark:bg-slate-600 border-slate-400 dark:border-slate-500 rounded focus:ring-blue-700 focus:ring-offset-0 transition-all duration-150 dark:checked:bg-blue-700',
                'aria-labelledby': cardNameLabelId,
                'aria-describedby': `variant-label-${variant.id}`
              }),
              React.createElement('span', { id: `variant-label-${variant.id}`, className: `font-cuphead-text text-sm ${isCollected ? 'text-blue-800 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}` }, variant.name)
            );
          }),
           React.createElement('button', {
              onClick: handleFetchDetails,
              disabled: isFetching,
              className: 'flex items-center space-x-2 cursor-pointer p-1 -m-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:cursor-wait',
              title: "Fetch details from external sources"
            },
                isFetching
                    ? React.createElement(SpinnerIcon, { className: 'w-4 h-4' })
                    : React.createElement(CloudArrowDownIcon, { className: 'w-4 h-4' }),
                React.createElement('span', { className: 'font-cuphead-text text-sm' }, 'Fetch Info')
           )
        ),
         hasCustomFields && React.createElement('div', { className: 'mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-x-3 gap-y-1' },
            ...Object.entries(card.customFields).map(([key, value]) => React.createElement('div', { key: key, className: 'text-xs' },
                React.createElement('span', { className: 'font-semibold text-slate-600 dark:text-slate-400' }, `${key}: `),
                React.createElement('span', { className: 'text-slate-500 dark:text-slate-300' }, value)
            ))
        ),
        React.createElement(ExternalInfo, { data: card.externalData, viewMode: 'list' })
      ),
      React.createElement('div', { className: 'hidden xl:block w-1/4' },
        card.description && React.createElement('p', { className: 'text-slate-600 dark:text-slate-400 text-xs max-h-24 overflow-y-auto font-cuphead-text custom-scrollbar text-pretty', title: card.description }, card.description)
      ),
      card.collected && React.createElement('div', { className: 'absolute top-1 right-1 transform' },
        React.createElement('span', { className: 'font-cuphead-title text-slate-800 text-xs bg-amber-400 px-1.5 py-0.5 rounded-full shadow' }, 'OWNED')
      )
    );
  }

  // Grid View
  return React.createElement('div', {
    ...rootAttributes,
    className: `relative bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${card.collected ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900' : 'ring-2 ring-slate-200 dark:ring-slate-700'}`
  },
    React.createElement('div', { className: 'relative group' },
        React.createElement('img', {
          src: imageUrl,
          alt: card.name,
          className: 'w-full h-72 object-cover bg-slate-100 dark:bg-slate-700',
          onError: (e) => (e.currentTarget.src = fallbackImageUrl)
        }),
        React.createElement(ImageSourceBadge, { source: card.externalData?.image_source, viewMode: 'grid' }),
        React.createElement('input', {
            type: 'file',
            ref: fileInputRef,
            onChange: handleImageUpload,
            accept: 'image/*',
            className: 'hidden'
        }),
        React.createElement('button', {
            onClick: triggerFileUpload,
            className: 'absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100',
            'aria-label': 'Change card image',
            title: 'Change card image'
        },
            React.createElement(PencilIcon, { className: 'w-5 h-5' })
        )
    ),
    React.createElement('div', { className: 'p-5 bg-white dark:bg-slate-800' },
      React.createElement('div', { className: 'relative mb-1' },
        React.createElement('h3', { className: 'font-cuphead-title text-2xl font-bold text-slate-800 dark:text-slate-100 truncate pr-20', title: card.name, id: cardNameLabelId }, card.name),
        React.createElement(RarityBadge, { rarityName: card.rarity, rarityDefinitions: selectedCollection.rarityDefinitions, viewMode: viewMode })
      ),
      selectedCollection?.name && React.createElement('p', { className: 'text-slate-500 dark:text-slate-400 text-xs mb-0.5 font-cuphead-text truncate', title: selectedCollection.name }, `Set: ${selectedCollection.name}`),
      React.createElement('p', { className: 'font-cuphead-text text-xs text-slate-600 dark:text-slate-400 mb-1' }, `Card No: ${card.id}`),
      card.description && React.createElement('p', { className: 'text-slate-600 dark:text-slate-400 text-xs mb-3 h-10 overflow-y-auto font-cuphead-text custom-scrollbar text-pretty', title: card.description }, card.description),
      React.createElement('div', { className: 'flex flex-col gap-2' },
        React.createElement('label', { htmlFor: uniqueCheckboxId, className: 'flex items-center space-x-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors' },
          React.createElement('input', {
            id: uniqueCheckboxId,
            type: 'checkbox',
            checked: card.collected,
            onChange: onToggleCollected,
            className: 'form-checkbox h-6 w-6 text-amber-600 bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 rounded focus:ring-amber-500 focus:ring-offset-0 transition-all duration-150 dark:checked:bg-amber-600',
            'aria-labelledby': cardNameLabelId
          }),
          React.createElement('span', { className: `font-cuphead-text text-lg ${card.collected ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}` },
            card.collected ? 'Collected!' : 'Mark as Collected'
          )
        ),
        ...applicableVariants.map(variant => {
          const isCollected = card.variantCollected?.[variant.id] ?? false;
          const uniqueVariantId = `variant-grid-${selectedCollection?.id}-${card.id}-${variant.id}`;
          return React.createElement('label', { key: variant.id, htmlFor: uniqueVariantId, className: 'flex items-center space-x-2 cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors' },
            React.createElement('input', {
              id: uniqueVariantId,
              type: 'checkbox',
              checked: isCollected,
              onChange: () => onToggleVariant(variant.id),
              className: 'form-checkbox h-5 w-5 text-blue-800 bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 rounded focus:ring-blue-700 focus:ring-offset-0 transition-all duration-150 dark:checked:bg-blue-700',
              'aria-labelledby': cardNameLabelId,
              'aria-describedby': `variant-label-grid-${variant.id}`
            }),
            React.createElement('span', { id: `variant-label-grid-${variant.id}`, className: `font-cuphead-text text-base ${isCollected ? 'text-blue-800 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}` },
              isCollected ? `${variant.name} Collected!` : `Mark ${variant.name}`
            )
          );
        })
      ),
       React.createElement('div', { className: 'mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50' },
            React.createElement('button', {
                onClick: handleFetchDetails,
                disabled: isFetching,
                className: 'w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:cursor-wait'
            },
                isFetching
                    ? React.createElement(SpinnerIcon, { className: 'w-5 h-5' })
                    : React.createElement(CloudArrowDownIcon, { className: 'w-5 h-5' }),
                React.createElement('span', { className: 'font-cuphead-text font-semibold' }, isFetching ? 'Fetching...' : 'Fetch Info')
            )
        ),
      hasCustomFields && React.createElement('div', { className: 'mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-1' },
          ...Object.entries(card.customFields).map(([key, value]) => React.createElement('div', { key: key, className: 'flex justify-between text-xs' },
              React.createElement('span', { className: 'font-semibold text-slate-600 dark:text-slate-400' }, `${key}:`),
              React.createElement('span', { className: 'text-slate-500 dark:text-slate-300 font-mono' }, value)
          ))
      ),
      React.createElement(ExternalInfo, { data: card.externalData, viewMode: 'grid' })
    ),
    card.collected && React.createElement('div', { className: 'absolute top-0 left-0 w-full h-full bg-amber-500 bg-opacity-10 dark:bg-opacity-20 pointer-events-none' },
      React.createElement('span', { className: 'absolute top-3 left-3 transform -rotate-12 font-cuphead-title text-slate-800 text-xl bg-amber-400 px-2 py-1 rounded shadow-md' }, 'OWNED')
    )
  );
};

export default CardItem;