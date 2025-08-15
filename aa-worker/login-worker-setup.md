# Setup del Worker di Autenticazione (Login Worker)

Questo documento illustra i passaggi per distribuire un backend serverless su Cloudflare Workers che gestisce l'autenticazione degli utenti tramite Google OAuth 2.0 e le sessioni JWT.

## 1. Panoramica

Questo worker è responsabile dell'intero flusso di autenticazione per l'applicazione My Collector.

- **Scopo**: Gestire il login degli utenti, la creazione di sessioni sicure tramite JWT (JSON Web Tokens) e la verifica dello stato di autenticazione. Questo worker è anche responsabile di verificare se un utente ha un ruolo di amministratore.
- **Flusso**:
    1.  Il frontend reindirizza l'utente a `/api/auth/login/google`.
    2.  Il worker avvia il flusso OAuth 2.0 con Google.
    3.  Google reindirizza l'utente a `/api/auth/callback` con un codice di autorizzazione.
    4.  Il worker scambia il codice con i token di Google, estrae il profilo utente.
    5.  **Verifica del Ruolo**: Il worker contatta Firestore per controllare se l'ID dell'utente esiste nella collection `administrators`.
    6.  Il worker crea un JWT di sessione, includendo un claim `isAdmin: true` se l'utente è un amministratore.
    7.  Il JWT viene impostato come un cookie `HttpOnly`, `Secure` e il browser viene reindirizzato al frontend.
    8.  Le richieste successive a `/api/auth/me` utilizzano il cookie per verificare la sessione e restituire i dati dell'utente (incluso il suo stato di admin).
    9.  Il logout (`/api/auth/logout`) invalida il cookie.
- **Codice sorgente**: `login-worker.js`

## 2. Setup delle Credenziali Google Cloud

1.  **Crea un Progetto Google Cloud**: Vai alla [Console Google Cloud](https://console.cloud.google.com/) e crea un nuovo progetto.
2.  **Configura la Schermata di Consenso OAuth**:
    -   Nel menu di navigazione, vai su **API e servizi > Schermata consenso OAuth**.
    -   Scegli **Esterno** e clicca su "Crea".
    -   Compila i campi richiesti (nome app, email di assistenza utente, email sviluppatore). Clicca su "SALVA E CONTINUA".
    -   Nella schermata "Ambiti", clicca su "AGGIUNGI O RIMUOVI AMBITI". Seleziona `.../auth/userinfo.email`, `.../auth/userinfo.profile` e `openid`. Clicca su "AGGIORNA".
    -   Clicca su "SALVA E CONTINUA" e completa la configurazione.
3.  **Crea Credenziali OAuth 2.0**:
    -   Vai su **API e servizi > Credenziali**.
    -   Clicca su **+ CREA CREDENZIALI > ID client OAuth**.
    -   Seleziona **Applicazione web** come tipo di applicazione.
    -   Assegna un nome (es. "My Collector Web App").
    -   In **URI di reindirizzamento autorizzati**, clicca su **+ AGGIUNGI URI** e inserisci l'URL di callback del tuo worker. Deve essere l'URL completo del tuo worker seguito da `/api/auth/callback`. Ad esempio: `https://my-login-worker.username.workers.dev/api/auth/callback`. Se utilizzi un dominio personalizzato o un gateway, usa quell'URL.
    -   Clicca su "CREA". Verranno visualizzati il tuo **ID client** e il **Client secret**. Copiali e conservali in un luogo sicuro.
4.  **Configura Firestore e il Service Account**:
    -   Segui i passaggi nella **[guida al setup del worker per le collezioni](./collections-worker-setup.md)** per:
        -   Configurare il database Firestore.
        -   Creare un Service Account con il ruolo "Utente Cloud Datastore".
        -   Generare il file di chiave JSON del Service Account.
    -   **Importante**: Nel tuo database Firestore, crea una nuova collection di primo livello chiamata `administrators`. Per rendere un utente un amministratore, aggiungi un documento a questa collection. L'**ID del documento** deve essere l'UID Google dell'utente (il valore `sub` dal suo profilo Google). Il contenuto del documento può essere vuoto.

## 3. Distribuzione del Cloudflare Worker

1.  **Crea un Worker**:
    -   Accedi alla tua dashboard di Cloudflare e vai su `Workers e Pages`.
    -   Crea un nuovo worker e assegnagli un nome (es. `mycollector-auth-api`).
2.  **Modifica il Codice**:
    -   Clicca su "Modifica codice" e incolla il contenuto di `login-worker.js`.
    -   Clicca su "Salva e distribuisci".
3.  **Configura le Secrets**:
    -   Vai su **Impostazioni > Variabili** del tuo worker.
    -   Aggiungi le seguenti variabili segrete ("Encrypt" per tutte):
        -   `GOOGLE_CLIENT_ID`: L'ID client ottenuto da Google Cloud.
        -   `GOOGLE_CLIENT_SECRET`: Il client secret ottenuto da Google Cloud.
        -   `JWT_SECRET`: Una stringa lunga, casuale e sicura che generi tu stesso. Puoi usare un generatore di password per crearne una. È fondamentale per la sicurezza delle sessioni.
        -   **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Incolla qui l'intero contenuto del file JSON del Service Account che hai generato in precedenza.

## 4. Endpoint API

Questo worker espone i seguenti endpoint, che dovrebbero essere instradati tramite il tuo gateway API (es. `mycollector.it/api`).

#### Avvio Login Google
- **Endpoint**: `GET /auth/login/google`
- **Descrizione**: Avvia il processo di login.

#### Callback di Google
- **Endpoint**: `GET /auth/callback`
- **Descrizione**: Gestisce il reindirizzamento da Google. **Non chiamare direttamente.**

#### Controllo Sessione Utente
- **Endpoint**: `GET /auth/me`
- **Descrizione**: Verifica il cookie di sessione e restituisce i dati dell'utente se autenticato.
- **Risposte**:
  - **`200 OK`**: Corpo JSON con `uid`, `displayName`, `email`, `photoURL` e `isAdmin` (boolean).
  - **`401 Unauthorized`**: Se la sessione non è valida o è assente.

#### Logout Utente
- **Endpoint**: `POST /auth/logout`
- **Descrizione**: Invalida il cookie di sessione.
