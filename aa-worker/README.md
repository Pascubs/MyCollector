# My Collector - Documentazione dei Worker Backend

Questo documento fornisce una panoramica dell'architettura dei microservizi backend per l'applicazione My Collector, che utilizza i Cloudflare Workers.

## 1. Panoramica dell'Architettura

L'infrastruttura backend di My Collector è costruita su un'architettura di microservizi che utilizzano Cloudflare Workers. Questo approccio garantisce sicurezza, scalabilità e manutenibilità. Ogni worker è un servizio serverless indipendente, responsabile di un compito specifico.

Tutte le richieste dal frontend sono instradate attraverso un unico API gateway (`https://mycollector.it/api`), che poi le dirige al worker appropriato. Questo centralizza la gestione e nasconde la complessità dell'infrastruttura sottostante al client.

## 2. Worker Disponibili

Di seguito è riportato un elenco dei worker attualmente in uso, con una breve descrizione della loro funzione e un link alla documentazione di setup specifica.

### 2.1. Worker di Autenticazione (`login-worker.js`)

- **Scopo**: Gestisce l'intero flusso di autenticazione degli utenti tramite Google OAuth 2.0. Crea e verifica sessioni sicure basate su JWT, impostate come cookie HttpOnly.
- **Documentazione**: [**Guida al Setup del Worker di Autenticazione**](./login-worker-setup.md)

### 2.2. Worker per le Collezioni (`collections-worker.js`)

- **Scopo**: Questo worker gestisce la persistenza sicura dei dati delle collezioni degli utenti. Comunica con un database Google Firestore utilizzando un Service Account per autenticare le richieste in modo sicuro.
- **Documentazione**: [**Guida al Setup del Worker per le Collezioni](./collections-worker-setup.md)**

### 2.3. Worker per l'Arricchimento Dati (`data-enrichment-worker.js`)

- **Scopo**: Agisce come un proxy intelligente e sicuro per API di terze parti. Il suo compito è orchestrare le richieste a più fonti di dati (come CardTrader e l'API di Pokémon TCG) per recuperare informazioni dettagliate sulle carte, come immagini ufficiali e dati di mercato. Combina i risultati per fornire la visione più completa possibile.
- **Documentazione**: [**Guida al Setup del Worker di Arricchimento Dati](./data-enrichment-worker-setup.md)**

### 2.4. Worker per CardTrader (`cardtrader-worker.js`)

- **Scopo**: Questo worker funge da proxy dedicato e sicuro specificamente per l'API di CardTrader. Gestisce l'autenticazione e semplifica le richieste per ottenere dati di base sulle espansioni e le carte.
- **Documentazione**: [**Guida al Setup del Worker per CardTrader](./cardtrader-worker-setup.md)