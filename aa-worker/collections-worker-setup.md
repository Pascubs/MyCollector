# Setup del Worker per le Collezioni

Questo documento illustra i passaggi per distribuire un backend serverless su Cloudflare Workers che utilizza Google Firebase (Firestore) come database NoSQL. Questo worker è responsabile della persistenza dei dati delle collezioni degli utenti.

## 1. Panoramica

L'architettura è composta da:
- **Frontend**: L'applicazione React esistente.
- **Backend di Autenticazione**: Un servizio separato che gestisce l'OAuth di Google e fornisce le informazioni sulla sessione utente.
- **Worker per le Collezioni (Questo Worker)**: Un backend dedicato in esecuzione su Cloudflare Workers per gestire la lettura e la scrittura dei dati delle collezioni su un database persistente.

Il flusso è il seguente:
1. L'utente si autentica tramite il backend di autenticazione e il frontend riceve un ID Utente univoco (`uid`).
2. Quando si salvano o caricano i dati, il frontend invia richieste a questo Cloudflare Worker, utilizzando l' `uid` per identificare i dati dell'utente.
3. Il worker si autentica con Firestore utilizzando un **Service Account** per la massima sicurezza, garantendo che le credenziali del database non siano mai esposte.
4. Questo worker è anche responsabile della lettura delle collezioni del catalogo pubblico da una collection Firestore dedicata.

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
    - **Importante**: Dopo la creazione, crea manualmente due *collections* di primo livello:
        - `user_collections`: per memorizzare i dati specifici dell'utente.
        - `catalog_collections`: per memorizzare i set "ufficiali" disponibili nel catalogo dell'app.

3.  **Crea un Service Account**:
    - Il worker utilizzerà un'identità di servizio per autenticarsi in modo sicuro.
    - Vai alla [Console Google Cloud](https://console.cloud.google.com/) e assicurati che il tuo progetto Firebase sia selezionato.
    - Naviga su **IAM e amministrazione > Account di servizio**.
    - Clicca su **+ CREA ACCOUNT DI SERVIZIO**.
    - Dai un nome all'account (es. `mycollector-collections-worker`) e clicca su "CREA E CONTINUA".
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
    - Dai al tuo worker un nome univoco (es. `mycollector-collections-api`) e clicca su "Distribuisci".

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
      - **`ALLOWED_ORIGIN`**: L'URL completo dell'applicazione dove stai eseguendo questo codice. Ad esempio, se l'URL del browser è `https://foo.bar.baz`, imposta questo valore su `https://foo.bar.baz`.

## 4. Configurazione del Gateway API

Il frontend comunicherà con un'unica base API (`https://mycollector.it/api`), che a sua volta instrada le richieste al servizio corretto. Assicurati che il tuo gateway API sia configurato per instradare le richieste.

- **Dati Utente**:
  - **Metodo**: `GET` / `POST`
  - **Percorso**: `/api/collections/:userId`
  - **Worker di destinazione**: `mycollector-collections-api` (o il nome che hai scelto)
- **Dati Catalogo**:
  - **Metodo**: `GET`
  - **Percorso**: `/api/catalog`
  - **Worker di destinazione**: `mycollector-collections-api` (o il nome che hai scelto)
