# Setup Backend su Cloudflare Worker e Firebase

Questo documento illustra i passaggi per distribuire un backend serverless su Cloudflare Workers che utilizza Google Firebase (Firestore) come database NoSQL. Questo backend è responsabile della persistenza dei dati delle collezioni degli utenti.

## 1. Panoramica

L'architettura è composta da:
- **Frontend**: L'applicazione React esistente.
- **Backend di Autenticazione**: Il servizio esistente su `https://mycollector.it/api` che gestisce l'OAuth di Google e fornisce le informazioni sulla sessione utente.
- **Backend Dati (Questo Worker)**: Un nuovo backend separato, in esecuzione su Cloudflare Workers, per gestire la lettura e la scrittura dei dati delle collezioni su un database persistente.

Il flusso è il seguente:
1. L'utente si autentica tramite il backend principale (`mycollector.it`).
2. Il frontend riceve un ID Utente univoco (`uid`).
3. Quando si salvano o caricano i dati, il frontend invia richieste a questo Cloudflare Worker, utilizzando l' `uid` per identificare i dati dell'utente. Il worker si autentica con Firestore utilizzando un **Service Account** per la massima sicurezza.

## 2. Setup del Progetto Firebase

È necessario un progetto Firebase che funga da database.

1.  **Crea un Progetto Firebase**:
    - Vai alla [Console di Firebase](https://console.firebase.google.com/).
    - Clicca su "Aggiungi progetto" e segui le istruzioni sullo schermo.

2.  **Configura il Database Firestore**:
    - Nella dashboard del tuo nuovo progetto, vai alla sezione "Build" nel menu a sinistra e clicca su "Firestore Database".
    - Clicca su "Crea database".
    - Seleziona **Avvia in modalità produzione**. Clicca su "Avanti".
    - Scegli una località per il tuo database. Clicca su "Abilita".

3.  **Crea un Service Account**:
    - Il worker utilizzerà un'identità di servizio per autenticarsi in modo sicuro.
    - Vai alla [Console Google Cloud](https://console.cloud.google.com/) e assicurati che il tuo progetto Firebase sia selezionato.
    - Naviga su **IAM e amministrazione > Account di servizio**.
    - Clicca su **+ CREA ACCOUNT DI SERVIZIO**.
    - Dai un nome all'account (es. `mycollector-worker`) e clicca su "CREA E CONTINUA".
    - Nel campo "Seleziona un ruolo", cerca e assegna il ruolo **"Utente Cloud Datastore"**. Questo concede le autorizzazioni di lettura/scrittura per Firestore.
    - Clicca su "CONTINUA", quindi su "FINE".

4.  **Genera la Chiave del Service Account (File JSON)**:
    - Trova l'account di servizio appena creato nella lista. Clicca sull'icona con i tre puntini sotto "Azioni" e seleziona **"Gestisci chiavi"**.
    - Clicca su **AGGIUNGI CHIAVE > Crea nuova chiave**.
    - Seleziona **JSON** come tipo di chiave e clicca su **CREA**.
    - Un file JSON verrà scaricato sul tuo computer. **Tratta questo file come una password, è estremamente sensibile.**

## 3. Distribuzione del Cloudflare Worker

1.  **Crea un Worker**:
    - Accedi alla tua dashboard di Cloudflare.
    - Vai su `Workers e Pages` > `Panoramica`.
    - Clicca su "Crea applicazione", quindi seleziona "Crea Worker".
    - Dai al tuo worker un nome univoco (es. `mycollector-data-api`) e clicca su "Distribuisci".

2.  **Modifica il Codice del Worker**:
    - Dopo la distribuzione, clicca su "Modifica codice".
    - Si aprirà un editor nel browser. Cancella il codice predefinito.
    - Copia l'intero contenuto del file `collections-worker.js` da questo progetto e incollalo nell'editor.
    - Clicca su **"Salva e distribuisci"**.

3.  **Configura le Secrets**:
    - Il tuo worker necessita delle credenziali del service account per autenticarsi.
    - Torna alla dashboard del tuo worker. Clicca sulla scheda "Impostazioni", quindi su "Variabili".
    - Sotto "Variabili di ambiente", clicca su "Aggiungi variabile" per aggiungere i seguenti segreti:
      - **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Apri il file JSON del service account che hai scaricato in precedenza. Copia **l'intero contenuto** del file e incollalo nel campo del valore. Clicca su "Crittografa" per la sicurezza.
      - **`ALLOWED_ORIGIN`**: L'URL completo dell'applicazione dove stai eseguendo questo codice. Ad esempio, se l'URL del browser è `https://foo.bar.baz`, imposta questo valore su `https://foo.bar.baz`. Per lo sviluppo locale, potresti usare `http://localhost:3000`.

## 4. Configurazione del Frontend

L'applicazione frontend ora utilizza un unico URL di base per tutte le chiamate API, definito nel file `src/authContext.js`. Non sono necessarie ulteriori configurazioni se non quella già presente.

## 5. Endpoint dell'API Unificata

Il frontend comunicherà con un'unica base API (`https://mycollector.it/api`), che a sua volta instrada le richieste al servizio corretto (autenticazione o dati).

#### Ottieni Collezioni
- **Metodo**: `GET`
- **Percorso API**: `/api/collections/:userId`
- **Descrizione**: Recupera tutte le collezioni per l' `userId` specificato.
- **Risposta di Successo (`200 OK`)**: Restituisce un array JSON di oggetti collezione. Se l'utente è nuovo, restituisce un array vuoto `[]`.
- **Esempio completo**: `GET https://mycollector.it/api/collections/google-user-12345`

#### Salva Collezioni
- **Metodo**: `POST`
- **Percorso API**: `/api/collections/:userId`
- **Descrizione**: Salva o sovrascrive l'intero set di collezioni per un utente.
- **Corpo della Richiesta**: L'array di oggetti collezione grezzo, convertito in stringa con `JSON.stringify`.
- **Risposta di Successo (`200 OK`)**: Restituisce `{"success": true}`.
- **Esempio completo**: `POST https://mycollector.it/api/collections/google-user-12345`