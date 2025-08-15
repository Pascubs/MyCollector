// collections-worker.js (ES Module Syntax with Service Account Auth)

// --- In-memory cache for the Google Cloud access token ---
// This avoids re-authenticating on every request. Tokens are valid for 1 hour.
let tokenCache = {
  accessToken: null,
  expiry: 0, // Expiry time in seconds since epoch
};

// --- JWT and Crypto Helpers ---

/**
 * Encodes a string to a URL-safe Base64 string.
 * @param {string} str The string to encode.
 * @returns {string} The base64url encoded string.
 */
function str_to_b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Signs the JWT payload and returns a signed JWT.
 * @param {object} payload The JWT payload.
 * @param {CryptoKey} privateKey The imported private key.
 * @returns {Promise<string>} The signed JWT.
 */
async function signJwt(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = str_to_b64url(JSON.stringify(header));
  const payloadB64 = str_to_b64url(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(toSign)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${toSign}.${signatureB64}`;
}

/**
 * Obtains a Google Cloud access token using a service account.
 * It caches the token in memory to reduce authentication requests.
 * @param {any} env The worker environment object.
 * @returns {Promise<string>} A Google Cloud access token.
 */
async function getAccessToken(env) {
  const now = Date.now() / 1000;
  if (tokenCache.accessToken && now < tokenCache.expiry) {
    return tokenCache.accessToken;
  }

  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const { client_email, private_key } = serviceAccount;

  // 1. Import the private key from the service account JSON
  const privateKeyPem = private_key.replace(/\\n/g, '\n');
  const keyData = atob(privateKeyPem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, ''));
  const keyBuffer = new Uint8Array(keyData.length).map((_, i) => keyData.charCodeAt(i));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 2. Create and sign the JWT
  const iat = Math.floor(now);
  const exp = iat + 3600; // Token is valid for 1 hour
  const jwtPayload = {
    iss: client_email,
    sub: client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: iat,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/datastore', // Firestore scope
  };
  const signedJwt = await signJwt(jwtPayload, cryptoKey);

  // 3. Exchange the JWT for an access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Failed to get access token:', errorText);
    throw new Error(`Google Auth Error: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();

  // 4. Cache the new token
  tokenCache = {
    accessToken: tokenData.access_token,
    expiry: exp - 30, // Set expiry with a 30-second buffer
  };

  return tokenCache.accessToken;
}

// --- Data Migration Logic ---

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

  let hash = 0;
  for (let i = 0; i < rarityName.length; i++) {
    const char = rarityName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const migrateCollection = (collection) => {
  if (!collection) return null;
  const migrated = { ...collection };

  if (!migrated.rarityDefinitions || !Array.isArray(migrated.rarityDefinitions)) {
    const uniqueRarities = [...new Set(migrated.cards.map(c => c.rarity).filter(Boolean))];
    migrated.rarityDefinitions = uniqueRarities.map(name => ({
      name,
      style: generateDefaultRarityStyles(name),
    }));
  }
  
  migrated.rarityDefinitions = migrated.rarityDefinitions.map(def => ({
      ...def,
      category: def.category || 'Standard'
  }));

  if (migrated.features?.hasVariants) {
    const oldVariant = migrated.features.hasVariants;
    const variantId = (oldVariant.variantName || 'variant').toLowerCase().replace(/\s+/g, '-') + '-v1';
    
    if (!migrated.features.variants) {
      migrated.features.variants = [];
    }
    migrated.features.variants.push({
      id: variantId,
      name: oldVariant.variantName || 'Holo',
      appliesTo: Array.isArray(oldVariant.appliesTo) ? oldVariant.appliesTo : ['Common'],
    });

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

    delete migrated.features.hasVariants;
  }
  
  if (migrated.features?.variants?.length > 0) {
      migrated.cards = migrated.cards.map(card => {
          if (!card.variantCollected) {
              return { ...card, variantCollected: {} };
          }
          return card;
      });
  }
  
  if (!migrated.features) {
      migrated.features = {};
  }
  if (!migrated.features.customFields) {
      migrated.features.customFields = [];
  }

  migrated.cards = migrated.cards.map(card => ({
      ...card,
      customFields: card.customFields || {},
  }));

  migrated.cards = migrated.cards.map(card => {
      const newCard = {
          ...card,
          customImageUrl: card.customImageUrl || null,
      };
      delete newCard.imageUrl;
      delete newCard.officialImageUrl;
      return newCard;
  });
  
  delete migrated.defaultCardImageUrlPattern;

  migrated.isPinned = collection.isPinned || false;

  migrated.cards = migrated.cards.map(card => {
      const newCard = { ...card };
      if (Object.prototype.hasOwnProperty.call(newCard, 'cardTraderData')) {
          if (newCard.cardTraderData) {
              newCard.externalData = newCard.cardTraderData;
          }
          delete newCard.cardTraderData;
      }
      if (!Object.prototype.hasOwnProperty.call(newCard, 'externalData')) {
          newCard.externalData = null;
      }
      return newCard;
  });
  
  if (migrated.features?.binderSortOrder) {
    migrated.features.binderSlots = migrated.features.binderSortOrder;
    delete migrated.features.binderSortOrder;
  }

  if (!migrated.features?.binderSlots) {
    migrated.features.binderSlots = [];
  }
  
  const collectionLang = collection.language || 'en';
  migrated.cards = migrated.cards.map(card => ({
      ...card,
      language: card.language || collectionLang,
  }));
  delete migrated.language;

  // 12. Add isCustom flag for user-created collections
  if (typeof collection.isCustom !== 'boolean') {
    // If the property is missing, we deduce it.
    // A collection is NOT custom if its ID is one of the known, pre-defined catalog IDs.
    const CATALOG_COLLECTION_IDS = new Set(['pixel-pals-v1', 'cosmic-creatures-v1']);
    migrated.isCustom = !CATALOG_COLLECTION_IDS.has(collection.id);
  } else {
    // If the property already exists, respect it.
    migrated.isCustom = collection.isCustom;
  }

  return migrated;
};


// --- CORS and Routing Helpers ---

function applyCorsHeaders(response, env) {
  const allowedOrigin = env?.ALLOWED_ORIGIN || '*';
  if (!env?.ALLOWED_ORIGIN) {
    console.warn("Worker Warning: ALLOWED_ORIGIN not set. Defaulting to '*'.");
  }
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handleOptions(request, env) {
  const response = new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
  applyCorsHeaders(response, env);
  return response;
}

function checkEnvironment(env) {
  if (!env) {
    const msg = 'Server configuration error: Environment not available.';
    console.error(msg);
    return new Response(msg, { status: 500 });
  }

  const requiredVars = ['FIREBASE_SERVICE_ACCOUNT_JSON', 'ALLOWED_ORIGIN'];
  const missingVars = requiredVars.filter(v => !env[v]);
  if (missingVars.length > 0) {
    const msg = `Server configuration error: Missing required settings: ${missingVars.join(', ')}.`;
    console.error(msg);
    return new Response(msg, { status: 500 });
  }

  try {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (!sa.project_id || !sa.client_email || !sa.private_key) {
      const msg = 'Server configuration error: FIREBASE_SERVICE_ACCOUNT_JSON is malformed.';
      console.error(msg);
      return new Response(msg, { status: 500 });
    }
  } catch (e) {
    const msg = 'Server configuration error: FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.';
    console.error(msg, e);
    return new Response(msg, { status: 500 });
  }

  return null;
}

// --- Firestore API Handlers ---

async function handleGetCollections(userId, env) {
  const envError = checkEnvironment(env);
  if (envError) return envError;

  try {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_collections/${userId}`;
    
    const firestoreResponse = await fetch(firestoreUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (firestoreResponse.status === 404) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (!firestoreResponse.ok) {
      const errorText = await firestoreResponse.text();
      throw new Error(`Firestore GET Error: ${errorText}`);
    }

    const data = await firestoreResponse.json();
    const collectionsJsonString = data.fields?.collections_json?.stringValue || '[]';
    
    const rawCollections = JSON.parse(collectionsJsonString);
    const migratedCollections = rawCollections.map(migrateCollection);
    const migratedJsonString = JSON.stringify(migratedCollections);

    return new Response(migratedJsonString, { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Worker GET error:', error.message);
    return new Response('An internal error occurred while fetching data.', { status: 500 });
  }
}

async function handleSetCollections(userId, request, env) {
  const envError = checkEnvironment(env);
  if (envError) return envError;

  try {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
    const collectionsJsonString = await request.text();

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_collections/${userId}`;
    const firestorePayload = {
      fields: {
        collections_json: { stringValue: collectionsJsonString },
        updated_at: { timestampValue: new Date().toISOString() },
      },
    };

    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(firestorePayload),
    });

    if (!firestoreResponse.ok) {
        const errorText = await firestoreResponse.text();
        throw new Error(`Firestore PATCH Error: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Worker POST error:', error.message);
    const status = error instanceof SyntaxError ? 400 : 500;
    const message = status === 400 ? 'Invalid JSON in request body.' : 'An internal error occurred while saving data.';
    return new Response(message, { status });
  }
}

async function handleGetCatalog(env) {
    const envError = checkEnvironment(env);
    if (envError) return envError;

    try {
        const accessToken = await getAccessToken(env);
        const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/catalog_collections`;

        const firestoreResponse = await fetch(firestoreUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!firestoreResponse.ok) {
            const errorText = await firestoreResponse.text();
            throw new Error(`Firestore Catalog GET Error: ${errorText}`);
        }

        const data = await firestoreResponse.json();
        if (!data.documents || data.documents.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }
        
        const collections = data.documents
            .filter(doc => doc.fields && doc.fields.collection_json && doc.fields.collection_json.stringValue)
            .map(doc => {
                const jsonString = doc.fields.collection_json.stringValue;
                return JSON.parse(jsonString);
            });

        return new Response(JSON.stringify(collections), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Worker Catalog GET error:', error.message);
        return new Response('An internal error occurred while fetching catalog data.', { status: 500 });
    }
}


// --- Main Worker Export ---

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    let response;

    if (pathParts.length >= 2 && pathParts[0] === 'api') {
      if (pathParts[1] === 'collections' && pathParts[2]) {
        const userId = decodeURIComponent(pathParts[2]);
        if (request.method === 'GET') {
          response = await handleGetCollections(userId, env);
        } else if (request.method === 'POST') {
          response = await handleSetCollections(userId, request, env);
        } else {
          response = new Response('Method Not Allowed', { status: 405 });
        }
      } else if (pathParts[1] === 'catalog' && request.method === 'GET') {
          response = await handleGetCatalog(env);
      } else {
        response = new Response('Not Found', { status: 404 });
      }
    } else {
      response = new Response('Not Found', { status: 404 });
    }

    applyCorsHeaders(response, env);
    return response;
  },
};