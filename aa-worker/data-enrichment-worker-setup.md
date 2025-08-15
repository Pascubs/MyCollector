# Setup del Worker di Arricchimento Dati

Questo documento illustra i passaggi per distribuire un backend serverless su Cloudflare Workers che funge da proxy sicuro per le API di dati esterni (es. CardTrader, Pokémon TCG API).

## 1. Panoramica

L'architettura utilizza un worker di Cloudflare per intermediare le chiamate a API di terze parti. Questo approccio è fondamentale per diversi motivi:
1.  **Sicurezza**: Le chiavi API (token) non vengono mai esposte al browser del client, ma sono conservate in modo sicuro come "secret" nelle impostazioni del worker.
2.  **Orchestrazione**: Il worker può interrogare più fonti di dati (es. prima CardTrader, poi l'API di Pokémon TCG se necessario) e combinare i risultati per fornire i dati più completi possibili al frontend.
3.  **CORS**: Il worker gestisce le policy CORS, consentendo al frontend (che gira su un dominio diverso) di effettuare chiamate API in modo pulito.
4.  **Amministrazione**: Questo worker ospita anche un endpoint protetto per importare interi set di carte nel catalogo dell'app da più fonti, autorizzando le richieste tramite JWT di sessione.

Questo worker è uno dei componenti dell'infrastruttura di microservizi backend dell'applicazione. Per una visione d'insieme, consulta la [documentazione principale dei worker](./README.md).

## 2. Ottenere i Token API

Per utilizzare le API, hai bisogno di token di autenticazione.

### 2.1. Token di CardTrader (Fonte Primaria)

1.  **Crea un Account**: Se non ne hai uno, registrati su [CardTrader.com](https://www.cardtrader.com/).
2.  **Genera il tuo Token**:
    -   Accedi al tuo account.
    -   Naviga nella tua area utente e vai su **Impostazioni**.
    -   Cerca la sezione **API** nel menu delle impostazioni.
    -   In questa sezione, troverai un'opzione per generare il tuo token API. Clicca sul pulsante per crearlo.
    -   Copia il token generato. **Tratta questo token come una password e non condividerlo pubblicamente.**

### 2.2. Chiave API di Pokémon TCG (Fonte Secondaria - Opzionale ma Raccomandato)

Questo worker può anche utilizzare l'API di Pokémon TCG per recuperare immagini delle carte se non sono disponibili su CardTrader.

1.  **Crea un Account**: Vai su [pokemontcg.io](https://pokemontcg.io/) e crea un account.
2.  **Genera la tua Chiave API**:
    -   Dopo aver effettuato l'accesso, vai alla tua dashboard/profilo.
    -   Dovresti trovare una sezione per generare una chiave API.
    -   Copia la chiave API generata.

### 2.3. TCGdex (Fonte Terziaria)
Questo worker integra anche [TCGdex](https://tcgdex.dev/), un'API pubblica e open-source per i dati del Pokémon TCG che supporta l'importazione di set in più lingue.
- **Chiave API**: Non richiesta. L'API è aperta e non richiede autenticazione.

## 3. Distribuzione del Cloudflare Worker

1.  **Crea un Worker**:
    -   Accedi alla tua dashboard di Cloudflare.
    -   Vai su `Workers e Pages` > `Panoramica`.
    -   Clicca su "Crea applicazione", quindi seleziona "Crea Worker".
    -   Dai al tuo worker un nome univoco (es. `mycollector-data-enrichment`) e clicca su "Distribuisci".

2.  **Modifica il Codice del Worker**:
    -   Dopo la distribuzione, clicca su "Modifica codice".
    -   Si aprirà un editor nel browser. Cancella il codice predefinito.
    -   Copia l'intero contenuto del file `data-enrichment-worker.js` da questo progetto e incollalo nell'editor.
    -   Clicca su **"Salva e distribuisci"**.

3.  **Configura le Secrets**:
    -   Il tuo worker necessita dei token API e delle credenziali per autenticarsi.
    -   Torna alla dashboard del tuo worker. Clicca sulla scheda "Impostazioni", quindi su "Variabili".
    -   Sotto "Variabili di ambiente", clicca su "Aggiungi variabile" per aggiungere i seguenti segreti:
        -   **`CARDTRADER_API_TOKEN`**: Incolla qui il token API che hai copiato dal tuo profilo di CardTrader. Clicca su "Crittografa".
        -   **`POKEMONTCG_API_KEY`**: (Opzionale ma raccomandato) Incolla qui la chiave API che hai ottenuto da pokemontcg.io. Clicca su "Crittografa".
        -   **`ALLOWED_ORIGIN`**: L'URL completo dell'applicazione frontend.
        -   **`JWT_SECRET`**: La stessa stringa segreta lunga e casuale che hai configurato nel **Login Worker**. È fondamentale che sia identica per permettere a questo worker di verificare le sessioni.
        -   **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Questo worker ha bisogno di accedere a Firestore per salvare i set nel catalogo. Segui i passaggi nella [guida del worker per le collezioni](./collections-worker-setup.md) per generare il file JSON del service account e incollane qui l'intero contenuto. Clicca su "Crittografa".

## 4. Endpoint di Amministrazione per l'Importazione dei Set

Questo worker espone un endpoint protetto per popolare la collection `catalog_collections` su Firestore, rendendolo disponibile a tutti gli utenti dell'app.

-   **Endpoint**: `POST /api/admin/import-set`
-   **Autenticazione**: Richiede un cookie di sessione (`auth_session`) valido con un claim `isAdmin: true`.
-   **Utilizzo**: Questo endpoint è pensato per essere chiamato dall'interfaccia del **Pannello Admin** nel frontend, che è visibile solo agli utenti amministratori.
-   **Corpo della Richiesta**: Un oggetto JSON che specifica la fonte e l'ID del set. Esempio: `{ "source": "pokemontcg", "id": "sv3" }`.

Una volta completati questi passaggi, il frontend sarà in grado di comunicare in modo sicuro con le API esterne e potrai popolare il catalogo usando il nuovo pannello di amministrazione.