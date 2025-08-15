/**
 * @typedef {{
 *   GOOGLE_CLIENT_ID: string;
 *   GOOGLE_CLIENT_SECRET: string;
 *   JWT_SECRET: string;
 *   ALLOWED_ORIGIN: string;
 *   FIREBASE_SERVICE_ACCOUNT_JSON: string;
 * }} Env
 */

// --- Base64URL Encoding/Decoding Helpers ---

function base64urlEncode(data) {
 let base64 = btoa(String.fromCharCode.apply(null, data));
 return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

// --- JWT Creation and Verification using Web Crypto API ---

/**
* Creates a JWT using SubtleCrypto.
* @param {object} payload The payload to include in the JWT.
* @param {string} secret The secret key for signing.
* @returns {Promise<string>} The generated JWT string.
*/
async function createJwt(payload, secret) {
 const header = { alg: 'HS256', typ: 'JWT' };
 const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
 const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
 
 const key = await crypto.subtle.importKey(
   'raw',
   new TextEncoder().encode(secret),
   { name: 'HMAC', hash: 'SHA-256' },
   false,
   ['sign']
 );
 
 const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
 const signature = await crypto.subtle.sign('HMAC', key, signatureData);
 const encodedSignature = base64urlEncode(new Uint8Array(signature));
 
 return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
* Verifies a JWT using SubtleCrypto.
* @param {string} token The JWT string to verify.
* @param {string} secret The secret key for verification.
* @returns {Promise<object>} The decoded payload if the token is valid.
* @throws {Error} if the token is invalid or expired.
*/
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

// --- Firestore Auth Helpers ---

let tokenCache = {
  accessToken: null,
  expiry: 0,
};

function str_to_b64url_jwt(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJwtForFirestore(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = str_to_b64url_jwt(JSON.stringify(header));
  const payloadB64 = str_to_b64url_jwt(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(toSign));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${toSign}.${signatureB64}`;
}

async function getFirestoreAccessToken(env) {
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
  const signedJwt = await signJwtForFirestore(jwtPayload, cryptoKey);
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

// --- Cookie Helpers ---

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

function createSetCookieHeader(name, value, options = {}) {
 let cookie = `${name}=${value}`;
 if (options.path) cookie += `; Path=${options.path}`;
 if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
 if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
 if (options.secure) cookie += '; Secure';
 if (options.httpOnly) cookie += '; HttpOnly';
 return cookie;
}

// --- CORS Helpers ---

/**
 * Sets standard CORS headers on a response.
 * @param {Response} response The response to modify.
 * @param {Env} env The worker environment object.
 */
function applyCorsHeaders(response, env) {
  const allowedOrigin = env?.ALLOWED_ORIGIN || undefined;
  if (!allowedOrigin) {
    console.warn("Worker Warning: ALLOWED_ORIGIN not set. CORS will likely fail.");
    return;
  }
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 * @param {Request} request The incoming request.
 * @param {Env} env The worker environment object.
 * @returns {Response} A response with appropriate CORS headers.
 */
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


// --- WORKER LOGIC ---

export default {
 /**
  * @param {Request} request
  * @param {Env} env
  * @param {ExecutionContext} ctx
  * @returns {Promise<Response>}
  */
 async fetch(request, env, ctx) {
   // Handle CORS preflight requests first
   if (request.method === 'OPTIONS') {
     return handleOptions(request, env);
   }

   const url = new URL(request.url);
   let response;

   // ROUTE: /api/auth/login/google
   if (url.pathname === '/api/auth/login/google' && request.method === 'GET') {
     const googleLoginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
     googleLoginUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
     googleLoginUrl.searchParams.set('redirect_uri', new URL('/api/auth/callback', url).toString());
     googleLoginUrl.searchParams.set('response_type', 'code');
     googleLoginUrl.searchParams.set('scope', 'openid profile email');
     googleLoginUrl.searchParams.set('prompt', 'select_account');

     return Response.redirect(googleLoginUrl.toString(), 302);
   }

   // ROUTE: /api/auth/callback
   if (url.pathname === '/api/auth/callback' && request.method === 'GET') {
     const code = url.searchParams.get('code');
     if (!code) {
       return new Response('Authorization code is missing', { status: 400 });
     }

     try {
       const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           code,
           client_id: env.GOOGLE_CLIENT_ID,
           client_secret: env.GOOGLE_CLIENT_SECRET,
           redirect_uri: new URL('/api/auth/callback', url).toString(),
           grant_type: 'authorization_code',
         }),
       });

       const tokenData = await tokenResponse.json();
       if (!tokenResponse.ok || !tokenData.id_token) {
         console.error('Google token exchange failed:', tokenData);
         return new Response(JSON.stringify({ error: 'Failed to retrieve user identity.', details: tokenData.error_description }), { status: 500 });
       }

       const userProfile = JSON.parse(atob(tokenData.id_token.split('.')[1]));
       
       let isAdmin = false;
       try {
           const accessToken = await getFirestoreAccessToken(env);
           const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;
           const adminCheckUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/administrators/${userProfile.sub}`;
           const adminCheckResponse = await fetch(adminCheckUrl, {
               headers: { Authorization: `Bearer ${accessToken}` },
           });
           if (adminCheckResponse.ok) {
               isAdmin = true;
           }
       } catch (e) {
           console.error('Admin check failed during login:', e);
       }

       const sessionPayload = {
         uid: userProfile.sub,
         displayName: userProfile.name,
         email: userProfile.email,
         photoURL: userProfile.picture,
         isAdmin: isAdmin,
         iat: Math.floor(Date.now() / 1000),
         exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days expiration
       };

       const sessionJwt = await createJwt(sessionPayload, env.JWT_SECRET);
       
       const cookieHeader = createSetCookieHeader('auth_session', sessionJwt, {
         path: '/',
         secure: true,
         httpOnly: true,
         sameSite: 'Lax',
         maxAge: 60 * 60 * 24 * 7,
       });
       
       const frontendUrl = new URL(url);
       frontendUrl.pathname = '/';
       frontendUrl.search = '';
       
       return new Response(null, {
           status: 302,
           headers: { 'Location': frontendUrl.toString(), 'Set-Cookie': cookieHeader }
       });
     } catch (error) {
       console.error('Callback error:', error);
       return new Response('An internal error occurred during authentication.', { status: 500 });
     }
   }

   // ROUTE: /api/auth/me
   if (url.pathname === '/api/auth/me' && request.method === 'GET') {
     const token = getCookie(request, 'auth_session');
     if (!token) {
       response = new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
     } else {
       try {
         const payload = await verifyJwt(token, env.JWT_SECRET);
         // The payload already contains the isAdmin flag from login time.
         const userData = {
           uid: payload.uid,
           displayName: payload.displayName,
           email: payload.email,
           photoURL: payload.photoURL,
           isAdmin: payload.isAdmin || false, // Ensure it exists
         };
         response = new Response(JSON.stringify(userData), { 
             status: 200, 
             headers: { 'Content-Type': 'application/json' }
         });
       } catch (error) {
         const deleteCookieHeader = createSetCookieHeader('auth_session', '', { path: '/', maxAge: -1 });
         response = new Response(JSON.stringify({ error: 'Invalid session' }), {
             status: 401,
             headers: { 'Set-Cookie': deleteCookieHeader, 'Content-Type': 'application/json' }
         });
       }
     }
     applyCorsHeaders(response, env);
     return response;
   }

   // ROUTE: /api/auth/logout
   if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
       const deleteCookieHeader = createSetCookieHeader('auth_session', '', { path: '/', maxAge: -1, httpOnly: true, secure: true, sameSite: 'Lax' });
       response = new Response(JSON.stringify({ message: 'Logged out successfully' }), {
           status: 200,
           headers: { 'Set-Cookie': deleteCookieHeader, 'Content-Type': 'application/json' }
       });
       applyCorsHeaders(response, env);
       return response;
   }

   // DEFAULT 404
   response = new Response('Login Not found.', { status: 404 });
   applyCorsHeaders(response, env);
   return response;
 },
};