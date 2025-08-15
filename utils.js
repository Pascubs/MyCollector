/**
 * Generates a consistent, yet distinct, set of TailwindCSS color classes for a given rarity name.
 * Uses a simple hashing algorithm to pick from a predefined color palette.
 * @param {string} rarityName The name of the rarity.
 * @returns {{ base: string; text: string; activeRing: string }}
 */
const generateDefaultRarityStyles = (rarityName) => {
  const colors = [
    { base: 'bg-sky-200 dark:bg-sky-800', text: 'text-sky-800 dark:text-sky-100', activeRing: 'ring-sky-500' },
    { base: 'bg-emerald-200 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-emerald-100', activeRing: 'ring-emerald-500' },
    { base: 'bg-amber-200 dark:bg-amber-800', text: 'text-amber-800 dark:text-amber-100', activeRing: 'ring-amber-500' },
    { base: 'bg-indigo-200 dark:bg-indigo-800', text: 'text-indigo-800 dark:text-indigo-100', activeRing: 'ring-indigo-500' },
    { base: 'bg-rose-200 dark:bg-rose-800', text: 'text-rose-800 dark:text-rose-100', activeRing: 'ring-rose-500' },
    { base: 'bg-pink-200 dark:bg-pink-800', text: 'text-pink-800 dark:text-pink-100', activeRing: 'ring-pink-500' },
    { base: 'bg-teal-200 dark:bg-teal-800', text: 'text-teal-800 dark:text-teal-100', activeRing: 'ring-teal-500' },
    { base: 'bg-purple-200 dark:bg-purple-800', text: 'text-purple-800 dark:text-purple-100', activeRing: 'ring-purple-500' },
  ];

  if (!rarityName || rarityName.toLowerCase() === 'common') {
    return { base: 'bg-slate-200 dark:bg-slate-600', text: 'text-slate-800 dark:text-slate-100', activeRing: 'ring-slate-500' };
  }
  if (rarityName.toLowerCase() === 'uncommon') {
    return colors[1];
  }
  if (rarityName.toLowerCase() === 'rare') {
    return colors[0];
  }

  // Simple hash function to get a color index
  let hash = 0;
  for (let i = 0; i < rarityName.length; i++) {
    const char = rarityName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Migrates a collection object to the latest data structure.
 * Ensures backward compatibility by adding `rarityDefinitions` if they don't exist,
 * migrating the variant system, and adding the new rarity `category`.
 * @param {any} collection - The collection object to migrate.
 * @returns {Collection} The migrated, valid collection object.
 */
export const migrateCollection = (collection) => {
  if (!collection) return null;
  const migrated = { ...collection };

  // 1. Migrate rarityDefinitions: ensure the array exists
  if (!migrated.rarityDefinitions || !Array.isArray(migrated.rarityDefinitions)) {
    const uniqueRarities = [...new Set(migrated.cards.map(c => c.rarity).filter(Boolean))];
    migrated.rarityDefinitions = uniqueRarities.map(name => ({
      name,
      style: generateDefaultRarityStyles(name),
    }));
  }
  
  // 2. Add rarity category for backward compatibility
  migrated.rarityDefinitions = migrated.rarityDefinitions.map(def => ({
      ...def,
      category: def.category || 'Standard' // Default to 'Standard' if not present
  }));


  // 3. Migrate from `hasVariants` (single) to `variants` (multi)
  if (migrated.features?.hasVariants) {
    const oldVariant = migrated.features.hasVariants;
    const variantId = (oldVariant.variantName || 'variant').toLowerCase().replace(/\s+/g, '-') + '-v1';
    
    // Create the new `variants` array
    if (!migrated.features.variants) {
      migrated.features.variants = [];
    }
    migrated.features.variants.push({
      id: variantId,
      name: oldVariant.variantName || 'Holo',
      appliesTo: Array.isArray(oldVariant.appliesTo) ? oldVariant.appliesTo : ['Common'],
    });

    // Migrate `isHoloCollected` on each card to `variantCollected`
    migrated.cards = migrated.cards.map(card => {
      const newCard = { ...card };
      if (Object.hasOwn(newCard, 'isHoloCollected')) {
        if (!newCard.variantCollected) {
          newCard.variantCollected = {};
        }
        newCard.variantCollected[variantId] = !!newCard.isHoloCollected;
        delete newCard.isHoloCollected;
      }
      return newCard;
    });

    delete migrated.features.hasVariants; // Clean up old property
  }
  
  // 4. Ensure cards have a variantCollected property if variants exist
  if (migrated.features?.variants?.length > 0) {
      migrated.cards = migrated.cards.map(card => {
          if (!card.variantCollected) {
              return { ...card, variantCollected: {} };
          }
          return card;
      });
  }
  
  // 5. Add customFields feature support for backward compatibility
  if (!migrated.features) {
      migrated.features = {};
  }
  if (!migrated.features.customFields) {
      migrated.features.customFields = [];
  }
  // Ensure each card has a customFields object
  migrated.cards = migrated.cards.map(card => ({
      ...card,
      customFields: card.customFields || {},
  }));

  // 6. Add customImageUrl and remove old image fields
  migrated.cards = migrated.cards.map(card => {
      const newCard = {
          ...card,
          customImageUrl: card.customImageUrl || null,
      };
      delete newCard.imageUrl;
      delete newCard.officialImageUrl;
      return newCard;
  });
  
  // 7. Remove default image pattern from collection
  delete migrated.defaultCardImageUrlPattern;

  // 8. Add isPinned property for pinning feature
  migrated.isPinned = collection.isPinned || false;

  // 9. Migrate cardTraderData to externalData
  migrated.cards = migrated.cards.map(card => {
      const newCard = { ...card };
      // Migrate old property to new property if it exists
      if (Object.prototype.hasOwnProperty.call(newCard, 'cardTraderData')) {
          if (newCard.cardTraderData) {
              newCard.externalData = newCard.cardTraderData;
          }
          delete newCard.cardTraderData;
      }
      // Ensure externalData property exists and is initialized
      if (!Object.prototype.hasOwnProperty.call(newCard, 'externalData')) {
          newCard.externalData = null;
      }
      return newCard;
  });
  
  // 10. Migrate to binderSlots to support empty slots.
  // The new `binderSlots` is an array of card IDs or nulls, which allows for empty pockets.
  if (migrated.features?.binderSortOrder) {
    // If the old array exists, move it to the new key.
    // The old format was just a list of IDs, which the new logic can handle for placement,
    // but the removal logic relies on nulls. This migration ensures the key exists.
    migrated.features.binderSlots = migrated.features.binderSortOrder;
    delete migrated.features.binderSortOrder;
  }

  if (!migrated.features?.binderSlots) {
    migrated.features.binderSlots = [];
  }
  
  // 11. Add language support per card
  const collectionLang = collection.language || 'en';
  migrated.cards = migrated.cards.map(card => ({
      ...card,
      language: card.language || collectionLang,
  }));
  delete migrated.language; // Remove from top-level collection

  // 12. Add isCustom flag for user-created collections
  const CATALOG_COLLECTION_IDS = new Set([]); // This will be populated by the API now.
  if (typeof collection.isCustom !== 'boolean') {
    migrated.isCustom = !CATALOG_COLLECTION_IDS.has(collection.id);
  } else {
    migrated.isCustom = collection.isCustom;
  }

  return migrated;
};


/**
 * Tries to guess column mappings based on common header names.
 * @param {string[]} headers - An array of header strings from the spreadsheet.
 * @returns {{id: string, name: string, rarity: string, description: string, collected: string}}
 */
export const guessMapping = (headers) => {
    const mapping = { id: '', name: '', rarity: '', description: '', collected: '' };
    const lowerCaseHeaders = headers.map(h => h ? String(h).toLowerCase() : '');
    
    const assignedHeaders = new Set();

    const assignMapping = (field, keywords) => {
        for (const keyword of keywords) {
            const foundIndex = lowerCaseHeaders.findIndex(h => h.includes(keyword));
            if (foundIndex !== -1 && !assignedHeaders.has(headers[foundIndex])) {
                mapping[field] = headers[foundIndex];
                assignedHeaders.add(headers[foundIndex]);
                return;
            }
        }
    };
    
    // Assign in order of importance to avoid conflicts
    assignMapping('id', ['id', 'number', 'no.']);
    assignMapping('name', ['name', 'title']);
    assignMapping('rarity', ['rarity', 'tier']);
    assignMapping('description', ['desc', 'text']);
    assignMapping('collected', ['collected', 'owned', 'have', 'posseduto', 'preso']);

    return mapping;
};

/**
 * Parses an uploaded spreadsheet file to extract headers and sample data for mapping.
 * @param {File} file The file to parse.
 * @returns {Promise<{headers: string[], sampleData: object[], jsonData: object[]}>}
 */
export const analyzeSpreadsheet = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return reject(new Error('The uploaded file appears to be empty or invalid.'));
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) return reject(new Error('The first sheet of the file is empty.'));
        
        const headers = Object.keys(jsonData[0] || {});
        const sampleData = jsonData.slice(0, 5);

        resolve({ headers, sampleData, jsonData });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Processes spreadsheet data based on user-defined column mappings.
 * @param {object[]} jsonData The full JSON data from the spreadsheet.
 * @param {{id: string, name: string, rarity: string, description: string, collected: string}} coreMapping The user-defined mapping for core fields.
 * @param {{header: string, label: string}[]} customMappings The user-defined mapping for custom fields.
 * @returns {{cards: Card[], uniqueRarities: string[], customFieldDefinitions: {key: string, label: string}[]}}
 */
export const processMappedFile = (jsonData, coreMapping, customMappings) => {
    if (!coreMapping.id || !coreMapping.name) {
        throw new Error('Mapping for "ID" and "Name" columns is required.');
    }

    const uniqueRarities = new Set();
    const customFieldDefinitions = customMappings.map(m => ({ key: m.label, label: m.label }));
    
    const parseBool = (val) => {
        if (typeof val === 'string') {
            const lowerVal = val.toLowerCase().trim();
            return lowerVal === 'true' || lowerVal === 'yes' || lowerVal === 'si' || lowerVal === '1' || lowerVal === 'x';
        }
        return val === true || val === 1;
    };

    const cards = jsonData.map((row, index) => {
        const id = row[coreMapping.id] ? String(row[coreMapping.id]).trim() : '';
        const name = row[coreMapping.name] ? String(row[coreMapping.name]).trim() : '';

        if (!id || !name) {
            console.warn(`Skipping row ${index + 2}: missing required ID or Name.`);
            return null;
        }

        const rarity = coreMapping.rarity && row[coreMapping.rarity] ? String(row[coreMapping.rarity]).trim() : undefined;
        if (rarity) {
            uniqueRarities.add(rarity);
        }

        const customFields = {};
        customMappings.forEach(mapping => {
            const value = row[mapping.header];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                customFields[mapping.label] = String(value);
            }
        });

        const isCollected = coreMapping.collected && Object.prototype.hasOwnProperty.call(row, coreMapping.collected)
            ? parseBool(row[coreMapping.collected])
            : false;

        const card = {
            id,
            name,
            description: coreMapping.description && row[coreMapping.description] ? String(row[coreMapping.description]) : undefined,
            rarity: rarity,
            collected: isCollected,
            variantCollected: {},
            language: 'en',
            customFields,
            customImageUrl: null,
            externalData: null,
        };
        return card;
    }).filter(card => card !== null);

    return { cards, uniqueRarities: Array.from(uniqueRarities), customFieldDefinitions };
};

/**
 * Generates and triggers the download of a pre-filled Excel template.
 * Throws an error if generation fails.
 */
export const downloadTemplate = () => {
  const templateData = [
    ['ID', 'Name', 'Rarity', 'Description'],
    ['pxp-001', 'Pixel Knight', 'Common', 'A brave knight in a pixelated world.'],
    ['pxp-002', 'Glyph Mage', 'Rare', 'Casts spells using ancient symbols.'],
    ['pxp-003', 'Sprite Dragon', 'Legendary', 'A tiny but powerful dragon.'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  worksheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 50 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Card List Template');
  XLSX.writeFile(workbook, 'MyCollector_Template.xlsx');
};

/**
 * Exports a given collection's current state to an Excel file.
 * Throws an error if export fails.
 * @param {Collection} collection The collection to export.
 */
export const exportCollectionToExcel = (collection) => {
  const variants = collection.features?.variants || [];
  const dataToExport = collection.cards.map(card => {
    const row = {
      'ID': card.id,
      'Name': card.name,
      'Rarity': card.rarity || 'N/A',
      'Description': card.description || '',
      'Collected': card.collected,
    };
    
    variants.forEach(variant => {
        if (variant.appliesTo.includes(card.rarity)) {
            row[`${variant.name} Collected`] = card.variantCollected?.[variant.id] ?? false;
        }
    });

    return row;
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `${collection.name.replace(/\s/g, '_')}_Collection_${timestamp}.xlsx`;

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, collection.name);
  XLSX.writeFile(workbook, filename);
};

/**
 * Exports the missing cards from a collection to an Excel file, respecting the current set mode.
 * Throws an error if export fails.
 * @param {Collection} collection The collection to check.
 * @param {'standard' | 'complete' | 'master'} setMode Determines what is considered "missing".
 * @returns {boolean} Returns `false` if no items were missing, `true` if an export was generated.
 */
export const exportMissingCardsToExcel = (collection, setMode) => {
  const missingItems = [];
  const { cards, rarityDefinitions, features } = collection;
  const variants = features?.variants || [];

  const standardRarityNames = new Set(
    (rarityDefinitions || []).filter(r => r.category === 'Standard').map(r => r.name)
  );

  cards.forEach(card => {
    let includeCardInStandardCheck = false;
    if (setMode === 'standard' && standardRarityNames.has(card.rarity)) {
      includeCardInStandardCheck = true;
    } else if (setMode === 'complete' || setMode === 'master') {
      includeCardInStandardCheck = true;
    }

    if (includeCardInStandardCheck && !card.collected) {
      missingItems.push({ 
        'ID': card.id, 
        'Name': card.name, 
        'Rarity': card.rarity || 'N/A', 
        'Type': 'Standard', 
        'Description': card.description || '' 
      });
    }

    if (setMode === 'master') {
      variants.forEach(variant => {
        if (variant.appliesTo.includes(card.rarity) && !card.variantCollected?.[variant.id]) {
          missingItems.push({ 
            'ID': card.id, 
            'Name': card.name, 
            'Rarity': card.rarity || 'N/A', 
            'Type': variant.name, 
            'Description': card.description || '' 
          });
        }
      });
    }
  });

  if (missingItems.length === 0) {
    return false; // Nothing to export.
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `${collection.name.replace(/\s/g, '_')}_Missing_Cards_${timestamp}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(missingItems);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Cards');
  return true; // Export was successful.
};

/**
 * Returns consistent styling classes for a given rarity definition.
 * @param {RarityDefinition} rarityDef The rarity definition object.
 * @returns {{ base: string; text: string; activeRing: string }} TailwindCSS classes.
 */
export const getRarityStyling = (rarityDef) => {
  const fallback = { base: 'bg-gray-200 dark:bg-gray-600', text: 'text-gray-800 dark:text-gray-100', activeRing: 'ring-gray-500' };
  if (!rarityDef || !rarityDef.style) {
    return fallback;
  }
  return rarityDef.style;
};

/**
 * Parses a raw API error to return a user-friendly string.
 * @param {Error | string | any} error The raw error from a catch block.
 * @returns {string} A user-friendly error message.
 */
export const parseApiError = (error) => {
  const errorMessage = error?.message || String(error);
  const lowerCaseError = errorMessage.toLowerCase();

  // Handle common browser network errors
  if (lowerCaseError.includes('failed to fetch') || lowerCaseError.includes('networkerror')) {
    return "Network error. Please check your internet connection and try again.";
  }

  // Handle specific API error patterns
  if (lowerCaseError.includes('403') || lowerCaseError.includes('blocked') || lowerCaseError.includes('attention required')) {
    return 'The request was blocked, possibly due to rate limits. Please try again in a moment.';
  }
  
  if (lowerCaseError.includes('404') || lowerCaseError.includes('not found')) {
    return 'The requested item could not be found from external sources.';
  }
  
  if (lowerCaseError.includes('cardtrader api error (5') || lowerCaseError.includes('502 bad gateway') || lowerCaseError.includes('503 service unavailable')) {
    return 'The external data service is currently unavailable. Please try again later.';
  }

  // Clean up potential HTML responses without showing the user everything
  if (lowerCaseError.startsWith('<!doctype html>')) {
      return 'The API returned an unexpected (HTML) response. This might be a temporary issue.';
  }

  // Return the original message if it's short and doesn't seem like an object or HTML
  const firstLine = errorMessage.split('\n')[0];
  if (firstLine.length < 150) {
    return firstLine;
  }

  return 'An unexpected API error occurred. Please try again.';
};
