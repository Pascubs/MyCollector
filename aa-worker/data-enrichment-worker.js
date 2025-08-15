// data-enrichment-worker.js (ES Module Syntax)

// --- In-memory cache for the Google Cloud access token ---
let tokenCache = {
  accessToken: null,
  expiry: 0,
};

// --- JWT and Crypto Helpers ---
function str_to_b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(base64url) {
 base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
 let pad = base64url.length % 4;
 if(pad) {
   if(pad === 2) base64url += '==';
   else if (pad === 3) base64url += '=';
 }
 const raw = atob(base64url);
 const buffer = new Uint8Array(raw.length);
 for (let i = 0; i < raw.length; i++) {
   buffer[i] = raw.charCodeAt(i);
 }
 return buffer;
}

async function verifyJwt(token, secret) {
 const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
 if (!encodedHeader || !encodedPayload || !encodedSignature) {
   throw new Error('Invalid JWT format');
 }

 const key = await crypto.subtle.importKey(
   'raw',
   new TextEncoder().encode(secret),
   { name: 'HMAC', hash: 'SHA-256' },
   false,
   ['verify']
 );

 const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
 const signature = base64urlDecode(encodedSignature);
 const isValid = await crypto.subtle.verify('HMAC', key, signature, signatureData);

 if (!isValid) {
   throw new Error('Invalid signature');
 }

 const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));
 if (payload.exp && Date.now() / 1000 > payload.exp) {
   throw new Error('Token expired');
 }

 return payload;
}

function getCookie(request, name) {
 const cookieString = request.headers.get('Cookie');
 if (!cookieString) return undefined;
 
 const cookies = cookieString.split(';').map(c => c.trim());
 for (const cookie of cookies) {
   const [cookieName, cookieValue] = cookie.split('=', 2);
   if (cookieName === name) {
     return cookieValue;
   }
 }
 return undefined;
}


async function signJwt(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = str_to_b64url(JSON.stringify(header));
  const payloadB64 = str_to_b64url(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(toSign));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${toSign}.${signatureB64}`;
}

async function getAccessToken(env) {
  const now = Date.now() / 1000;
  if (tokenCache.accessToken && now < tokenCache.expiry) {
    return tokenCache.accessToken;
  }
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const { client_email, private_key } = serviceAccount;
  const privateKeyPem = private_key.replace(/\\n/g, '\n');
  const keyData = atob(privateKeyPem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, ''));
  const keyBuffer = new Uint8Array(keyData.length).map((_, i) => keyData.charCodeAt(i));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', keyBuffer.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(now);
  const exp = iat + 3600;
  const jwtPayload = { iss: client_email, sub: client_email, aud: 'https://oauth2.googleapis.com/token', iat, exp, scope: 'https://www.googleapis.com/auth/datastore' };
  const signedJwt = await signJwt(jwtPayload, cryptoKey);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedJwt }),
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google Auth Error: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  tokenCache = { accessToken: tokenData.access_token, expiry: exp - 30 };
  return tokenCache.accessToken;
}

// --- API Fetching Helpers ---

async function fetchFromCardTrader(endpoint, apiToken, env, params) {
  const url = new URL(`https://api.cardtrader.com${endpoint}`);
  if (params) {
    url.search = params.toString();
  }
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9',
    'Origin': env.ALLOWED_ORIGIN, 'Referer': `${env.ALLOWED_ORIGIN}/`,
    'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'cross-site',
  };
  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CardTrader API Error (${response.status}): ${errorText}`);
  }
  return response.status === 204 ? null : response.json();
}

async function fetchFromTcgApi(endpoint, env, params) {
    const url = new URL(`https://api.pokemontcg.io/v2${endpoint}`);
    if (params) {
        url.search = params.toString();
    }
    const headers = {};
    if (env.POKEMONTCG_API_KEY) {
        headers['X-Api-Key'] = env.POKEMONTCG_API_KEY;
    }
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PokemonTCG API Error (${response.status}): ${errorText}`);
    }
    return response.json();
}

async function fetchFromTcgDexApi(endpoint, env, language = 'en') {
    const url = new URL(`https://api.tcgdex.net/v2/${language}${endpoint}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TCGdex API Error (${response.status}): ${errorText}`);
    }
    return response.json();
}

// --- CORS and Environment Helpers ---

function applyCorsHeaders(response, env) {
  const allowedOrigin = env?.ALLOWED_ORIGIN || '*';
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
}

function handleOptions(request, env) {
  const response = new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
  }});
  applyCorsHeaders(response, env);
  return response;
}

function checkEnvironment(env) {
    const required = ['CARDTRADER_API_TOKEN', 'ALLOWED_ORIGIN', 'JWT_SECRET', 'FIREBASE_SERVICE_ACCOUNT_JSON'];
    const missing = required.filter(key => !env[key]);
    if (missing.length > 0) {
        return new Response(JSON.stringify({ error: `Server configuration error: Missing secrets: ${missing.join(', ')}.` }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
    return null;
}

// --- Data Fetching Logic for /card-details ---

async function getDataFromCardTrader(collectionName, cardName, env) {
    const apiToken = env.CARDTRADER_API_TOKEN;
    const expansionParams = new URLSearchParams({ name: collectionName, game_id: 1 });
    const expansions = await fetchFromCardTrader('/v2/expansions', apiToken, env, expansionParams);
    const expansion = expansions.find(exp => exp.name.toLowerCase() === collectionName.toLowerCase());
    if (!expansion) return { blueprint: null, products: [] };

    const blueprintParams = new URLSearchParams({ expansion_id: expansion.id, name: cardName });
    const blueprints = await fetchFromCardTrader('/v2/blueprints', apiToken, env, blueprintParams);
    const blueprint = blueprints.find(bp => bp.name.toLowerCase() === cardName.toLowerCase());
    if (!blueprint) return { blueprint: null, products: [] };

    const products = await fetchFromCardTrader(`/v2/marketplace/products?blueprint_id=${blueprint.id}`, apiToken, env);
    return { blueprint, products: products || [] };
}

async function handleCardDetails(request, env) {
    try {
        const { collectionName, cardName, cardId, language } = await request.json();
        if (!cardName) {
            return new Response(JSON.stringify({ error: 'Missing "cardName".' }), { status: 400 });
        }
        
        let tcgDexCard = null;
        let ctData = null;
        let tcgApiCard = null;
        let finalRarity = null;

        // --- Primary Source: TCGdex (if cardId is available and looks like a TCGdex ID) ---
        if (cardId && cardId.includes('-')) {
            try {
                tcgDexCard = await fetchFromTcgDexApi(`/cards/${cardId}`, env, language || 'en');
                if (tcgDexCard && tcgDexCard.rarity) {
                    finalRarity = tcgDexCard.rarity;
                }
            } catch (e) {
                console.warn(`TCGdex fetch for ${cardId} failed: ${e.message}`);
            }
        }
        
        // --- Secondary Source: CardTrader (for pricing and image fallback) ---
        try {
            ctData = await getDataFromCardTrader(collectionName, cardName, env);
        } catch (e) {
            console.warn(`CardTrader fetch for ${cardName} failed: ${e.message}`);
        }

        // --- Tertiary Source: Pokémon TCG API (for image fallback) ---
        const isPokemonCollection = collectionName && collectionName.toLowerCase().includes('pokémon');
        if (isPokemonCollection && env.POKEMONTCG_API_KEY) {
            try {
                const query = cardId && cardId.includes('-') ? `id:${cardId}` : `name:"${cardName}" set.name:"${collectionName}"`;
                const tcgApiUrl = new URL('https://api.pokemontcg.io/v2/cards');
                tcgApiUrl.searchParams.set('q', query);
                const tcgResponse = await fetch(tcgApiUrl.toString(), { headers: { 'X-Api-Key': env.POKEMONTCG_API_KEY } });
                if (tcgResponse.ok) {
                    const tcgData = await tcgResponse.json();
                    if (tcgData.data && tcgData.data.length > 0) {
                        tcgApiCard = tcgData.data[0];
                        if (!finalRarity && tcgApiCard.rarity) {
                           finalRarity = tcgApiCard.rarity;
                        }
                    }
                }
            } catch (e) {
                 console.warn(`PokemonTCG API fetch failed: ${e.message}`);
            }
        }
        
        let externalData = {
            name: cardName,
            marketplace: ctData?.products || [],
            fixed_url: ctData?.blueprint?.fixed_url,
            image_url: null,
            image_source: null,
        };
        
        // Image source priority: TCGdex > CardTrader > Pokémon TCG API
        if (tcgDexCard?.image) {
            externalData.image_url = `${tcgDexCard.image}/high.webp`;
            externalData.image_source = 'TCGdex';
        } else if (ctData?.blueprint?.image_url) {
            externalData.image_url = ctData.blueprint.image_url;
            externalData.image_source = 'CardTrader';
        } else if (tcgApiCard?.images?.large) {
            externalData.image_url = tcgApiCard.images.large;
            externalData.image_source = 'Pokémon TCG API';
        }

        if (!externalData.fixed_url && tcgApiCard?.cardmarket?.url) {
            externalData.fixed_url = tcgApiCard.cardmarket.url;
        }

        const responsePayload = {
            rarity: finalRarity,
            externalData: externalData
        };

        if (finalRarity || externalData.image_url || externalData.fixed_url || externalData.marketplace.length > 0) {
            return new Response(JSON.stringify(responsePayload), { status: 200 });
        }

        return new Response(JSON.stringify({ error: `Card details not found in any available source.` }), { status: 404 });

    } catch (error) {
        console.error('Data Enrichment worker error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// --- Rarity Styling Helper ---

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

  if (!rarityName) {
      return { base: 'bg-slate-200 dark:bg-slate-600', text: 'text-slate-800 dark:text-slate-100', activeRing: 'ring-slate-500' };
  }
  const lowerName = rarityName.toLowerCase();

  if (lowerName === 'common') {
    return { base: 'bg-slate-200 dark:bg-slate-600', text: 'text-slate-800 dark:text-slate-100', activeRing: 'ring-slate-500' };
  }
  if (lowerName === 'uncommon') {
    return colors[1];
  }
  if (lowerName === 'rare') {
    return colors[0];
  }

  // Simple hash function to get a color index for all other rarities
  let hash = 0;
  for (let i = 0; i < rarityName.length; i++) {
    const char = rarityName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};


// --- Admin Import Logic ---

async function saveCollectionToCatalog(collection, env) {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_collections/${collection.id}`;
    const firestorePayload = { fields: {
        collection_json: { stringValue: JSON.stringify(collection) },
        name: { stringValue: collection.name },
    }};
    const firestoreResponse = await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(firestorePayload),
    });
    if (!firestoreResponse.ok) {
        throw new Error(`Firestore PATCH Error: ${await firestoreResponse.text()}`);
    }
}

async function deleteCollectionFromCatalog(collectionId, env) {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_collections/${collectionId}`;

    const firestoreResponse = await fetch(firestoreUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!firestoreResponse.ok && firestoreResponse.status !== 404) {
        throw new Error(`Firestore DELETE Error: ${await firestoreResponse.text()}`);
    }
}

async function importFromCardTrader(expansionId, env) {
    const expansionDetails = await fetchFromCardTrader(`/v2/expansions/${expansionId}`, env.CARDTRADER_API_TOKEN, env);
    let allBlueprints = [], page = 1, limit = 250;
    while (true) {
        const params = new URLSearchParams({ expansion_id: expansionId, _limit: limit, _page: page });
        const blueprintPage = await fetchFromCardTrader('/v2/blueprints', env.CARDTRADER_API_TOKEN, env, params);
        if (blueprintPage.length === 0) break;
        allBlueprints.push(...blueprintPage);
        page++;
    }
    const uniqueRarities = [...new Set(allBlueprints.map(bp => bp.rarity).filter(Boolean))];
    return {
        id: expansionDetails.slug,
        name: expansionDetails.name,
        description: `Official set from CardTrader. Released on ${expansionDetails.release_date}.`,
        cards: allBlueprints.map(bp => ({
            id: bp.slug, name: bp.name, rarity: bp.rarity,
            description: bp.fixed_properties.text || '', collected: false, variantCollected: {},
            customImageUrl: null, externalData: null, language: 'en', customFields: {}
        })),
        rarityDefinitions: uniqueRarities.map(name => ({
            name, category: 'Standard', style: generateDefaultRarityStyles(name)
        })),
        features: { variants: [], customFields: [] }, isCustom: false
    };
}

async function importFromTcgApi(setId, env) {
    if (!env.POKEMONTCG_API_KEY) throw new Error("POKEMONTCG_API_KEY secret is not configured.");
    
    const initialData = await fetchFromTcgApi('/cards', env, new URLSearchParams({ q: `set.id:${setId}`, pageSize: 250, page: 1 }));
    if (!initialData || initialData.data.length === 0) {
        throw new Error(`No cards found for Pokémon TCG set ID "${setId}".`);
    }
    let allCards = [...initialData.data];
    const totalPages = Math.ceil(initialData.totalCount / initialData.pageSize);
    for (let page = 2; page <= totalPages; page++) {
        const pageData = await fetchFromTcgApi('/cards', env, new URLSearchParams({ q: `set.id:${setId}`, pageSize: 250, page }));
        allCards.push(...pageData.data);
    }
    const setInfo = allCards[0].set;
    const uniqueRarities = [...new Set(allCards.map(c => c.rarity).filter(Boolean))];
    return {
        id: setInfo.id,
        name: setInfo.name,
        description: `Official Pokémon TCG set from pokemontcg.io. Released on ${setInfo.releaseDate}.`,
        cards: allCards.map(c => ({
            id: c.id, name: c.name, rarity: c.rarity,
            description: c.flavorText || '', collected: false, variantCollected: {},
            customImageUrl: null, externalData: null, language: 'en', customFields: {}
        })),
        rarityDefinitions: uniqueRarities.map(name => ({
            name, category: 'Standard', style: generateDefaultRarityStyles(name)
        })),
        features: { variants: [], customFields: [] }, isCustom: false
    };
}

async function importFromTcgDex(setId, language, env) {
    // 1. Fetch the set information first to ensure we have it. This is more robust.
    const setInfo = await fetchFromTcgDexApi(`/sets/${setId}`, env, language);
    if (!setInfo) {
        throw new Error(`Could not find set info for TCGdex set ID "${setId}" in ${language}.`);
    }

    // 2. Fetch all detailed cards in a single request using the prefix-based ID search.
    const detailedCardsData = await fetchFromTcgDexApi(`/cards?id=like:${setId}-`, env, language);
    if (!detailedCardsData || detailedCardsData.length === 0) {
        throw new Error(`No cards found for TCGdex set ID "${setId}" in ${language}.`);
    }

    // 3. Process the cards
    const uniqueRarities = new Set();
    const cards = detailedCardsData.map(c => {
        if (c.rarity) {
            uniqueRarities.add(c.rarity);
        }
        const imageUrl = c.image ? `${c.image}/high.webp` : null;
        
        return {
            id: c.id,
            name: c.name,
            rarity: c.rarity,
            description: c.flavorText || '',
            collected: false,
            variantCollected: {},
            customImageUrl: imageUrl,
            externalData: null,
            language: language,
            customFields: {},
        };
    });

    // 4. Construct the collection object using the fetched setInfo
    return {
        id: `${setInfo.id}-${language}`,
        name: `${setInfo.name} (${language.toUpperCase()})`,
        description: `Official Pokémon TCG set from TCGdex. Released on ${setInfo.releaseDate || 'N/A'}.`,
        cards: cards,
        rarityDefinitions: Array.from(uniqueRarities).map(name => ({
            name, category: 'Standard', style: generateDefaultRarityStyles(name)
        })),
        features: { variants: [], customFields: [] }, isCustom: false
    };
}


async function handleAdminImportSet(request, env) {
    const sessionToken = getCookie(request, 'auth_session');
    if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized: No session token' }), { status: 401 });
    }
    try {
        const payload = await verifyJwt(sessionToken, env.JWT_SECRET);
        if (!payload.isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const { source, id, language } = await request.json();
        let newCollection;
        switch (source) {
            case 'cardtrader': newCollection = await importFromCardTrader(id, env); break;
            case 'pokemontcg': newCollection = await importFromTcgApi(id, env); break;
            case 'tcgdex': newCollection = await importFromTcgDex(id, language, env); break;
            default: return new Response(JSON.stringify({ error: 'Invalid source specified' }), { status: 400 });
        }
        
        await saveCollectionToCatalog(newCollection, env);
        
        return new Response(JSON.stringify({ message: `Successfully imported "${newCollection.name}" (${newCollection.cards.length} cards) into the catalog.` }), { status: 200 });
    } catch (e) {
        if (e.message.includes('Invalid') || e.message.includes('expired')) {
            return new Response(JSON.stringify({ error: `Unauthorized: ${e.message}` }), { status: 401 });
        }
        console.error('Admin Import Error:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

async function handleAdminRemoveFromCatalog(request, env) {
    const sessionToken = getCookie(request, 'auth_session');
    if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized: No session token' }), { status: 401 });
    }
    try {
        const payload = await verifyJwt(sessionToken, env.JWT_SECRET);
        if (!payload.isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const { collectionId } = await request.json();
        if (!collectionId) {
            return new Response(JSON.stringify({ error: 'Bad Request: Missing collectionId' }), { status: 400 });
        }
        
        await deleteCollectionFromCatalog(collectionId, env);
        
        return new Response(JSON.stringify({ message: `Collection with ID "${collectionId}" has been removed from the public catalog.` }), { status: 200 });
    } catch (e) {
        if (e.message.includes('Invalid') || e.message.includes('expired')) {
            return new Response(JSON.stringify({ error: `Unauthorized: ${e.message}` }), { status: 401 });
        }
        console.error('Admin Remove Error:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


// --- Worker Main Fetch Handler ---

export default {
  async fetch(request, env, ctx) {
    const envError = checkEnvironment(env);
    if (envError) return envError;
    
    if (request.method === 'OPTIONS') {
      const response = handleOptions(request, env);
      return response;
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    let response;
    
    if (path.startsWith('/api/')) {
        const apiPath = path.substring(4);
        
        if (apiPath === '/card-details' && request.method === 'POST') {
            response = await handleCardDetails(request, env);
        } else if (apiPath === '/admin/import-set' && request.method === 'POST') {
            response = await handleAdminImportSet(request, env);
        } else if (apiPath === '/admin/remove-from-catalog' && request.method === 'POST') {
            response = await handleAdminRemoveFromCatalog(request, env);
        } else {
            response = new Response('API Endpoint Not Found', { status: 404 });
        }
    } else {
        response = new Response('Not Found', { status: 404 });
    }
    
    applyCorsHeaders(response, env);
    return response;
  }
};