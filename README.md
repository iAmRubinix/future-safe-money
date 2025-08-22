# 💰 Future Safe Money

**Gestione Finanziaria Personale e Domestica**

Un'applicazione web completa per la gestione delle finanze personali e domestiche, con funzionalità avanzate per il monitoraggio delle spese, la definizione di obiettivi finanziari e l'analisi delle tendenze di spesa.

## 🚀 Funzionalità Principali

### 📊 **Dashboard Principale**
- **Panoramica Finanziaria**: Visualizzazione rapida di entrate, uscite e saldo corrente
- **Statistiche Mensili**: Spese totali, personali e domestiche del mese corrente
- **Obiettivi Finanziari**: Monitoraggio del progresso verso gli obiettivi di risparmio
- **Transazioni Recenti**: Lista delle ultime transazioni con possibilità di modifica/eliminazione

### 💳 **Gestione Transazioni**
- **Aggiunta Transazioni**: Inserimento di nuove spese o entrate con categoria e descrizione
- **Modifica Transazioni**: Possibilità di modificare transazioni esistenti
- **Eliminazione Transazioni**: Rimozione sicura con conferma
- **Transazioni Ricorrenti**: Configurazione di spese/entrate automatiche (settimanali, mensili, trimestrali, annuali)
- **Tipo di Spesa**: Distinzione tra spese personali e domestiche per la gestione condivisa
- **Categorie Personalizzabili**: Sistema di categorie flessibile e personalizzabile

### 🎯 **Obiettivi Finanziari**
- **Creazione Obiettivi**: Definizione di obiettivi di risparmio con importo target
- **Monitoraggio Progresso**: Visualizzazione del progresso con barre di avanzamento
- **Modifica Obiettivi**: Possibilità di aggiornare importi e categorie
- **Eliminazione Obiettivi**: Rimozione di obiettivi completati o non più necessari
- **Calcolo Automatico**: Aggiornamento automatico del progresso basato sulle transazioni

### 📈 **Limiti di Spesa**
- **Limiti per Categoria**: Impostazione di limiti mensili per ogni categoria di spesa
- **Monitoraggio in Tempo Reale**: Visualizzazione del consumo rispetto ai limiti
- **Avvisi Intelligenti**: Notifiche quando si avvicina o supera un limite
- **Esclusione Transazioni Ricorrenti**: I limiti considerano solo spese una tantum
- **Progress Bar Colorate**: Indicatori visivi per lo stato dei limiti (verde, giallo, rosso)

### 🏷️ **Gestione Categorie**
- **Categorie Predefinite**: Set iniziale di categorie comuni (Alimentari, Trasporti, ecc.)
- **Categorie Personalizzate**: Creazione di nuove categorie con icone e colori
- **Modifica Categorie**: Aggiornamento di nomi, icone e colori
- **Eliminazione Categorie**: Rimozione di categorie non più utilizzate
- **Sincronizzazione**: Aggiornamento automatico in tutti i modali e componenti

### 📊 **Pagina Statistiche**
- **Selezione Periodo**: Analisi per mese corrente o anno corrente
- **Ripartizione Categorie**: Visualizzazione delle spese per categoria con divisione personale/domestica
- **Grafico Andamento Giornaliero**: Grafico lineare delle spese giornaliere
- **Confronto Personale vs Domestico**: Analisi della distribuzione delle spese
- **Indicatori Limiti**: Visualizzazione dei limiti di spesa per categoria
- **Statistiche Dettagliate**: Importi, percentuali e trend temporali

### 🔄 **Transazioni Ricorrenti**
- **Gestione Completa**: Visualizzazione, modifica ed eliminazione di transazioni ricorrenti
- **Aggiunta al Corrente**: Creazione di transazioni una tantum basate su quelle ricorrenti
- **Esclusione dai Totali**: Le transazioni ricorrenti non influenzano i totali mensili
- **Descrizioni Opzionali**: Supporto per note e descrizioni dettagliate
- **Periodi Flessibili**: Settimanale, mensile, trimestrale, annuale

## 🛠️ Tecnologie Utilizzate

### **Frontend**
- **React 18**: Framework principale per l'interfaccia utente
- **TypeScript**: Tipizzazione statica per maggiore robustezza
- **Vite**: Build tool veloce per lo sviluppo
- **React Router DOM**: Navigazione tra le pagine

### **UI/UX**
- **Shadcn UI**: Componenti UI moderni e accessibili
- **Tailwind CSS**: Framework CSS utility-first
- **Lucide React**: Icone moderne e coerenti
- **Recharts**: Libreria per grafici e visualizzazioni dati

### **Backend & Database**
- **Supabase**: Backend-as-a-Service con PostgreSQL
- **Row Level Security (RLS)**: Sicurezza a livello di riga
- **Autenticazione**: Sistema di login/logout sicuro
- **Real-time Updates**: Aggiornamenti in tempo reale

### **Gestione Stato**
- **React Hooks**: useState, useEffect, useCallback
- **Custom Hooks**: useAuth, useCategories, useToast
- **Context API**: Gestione dello stato globale

## 🚀 Installazione e Avvio

### **Prerequisiti**
- Node.js (versione 18 o superiore)
- npm o yarn
- Account Supabase

### **Setup Locale**
```bash
# Clona il repository
git clone <repository-url>
cd future-safe-money

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env.local
# Modifica .env.local con le tue credenziali Supabase ad esempio
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL="https://.supabase.co"

# Avvia il server di sviluppo
npm run dev
```

### **Configurazione Supabase**
1. Crea un nuovo progetto su Supabase
2. Configura le tabelle necessarie (transactions, goals, spending_limits, user_categories)
3. Imposta le policy RLS per la sicurezza
4. Copia le credenziali nel file .env.local

## 📱 Funzionalità Avanzate

### **Responsive Design**
- **Mobile First**: Ottimizzato per dispositivi mobili
- **Desktop**: Interfaccia completa per schermi grandi
- **Tablet**: Layout adattivo per dispositivi intermedi

### **Sicurezza**
- **Autenticazione Utente**: Login/logout sicuro
- **Isolamento Dati**: Ogni utente vede solo i propri dati
- **Validazione Input**: Controlli sui dati inseriti
- **Conferme Azioni**: Dialoghi di conferma per azioni distruttive

### **Performance**
- **Lazy Loading**: Caricamento ottimizzato dei componenti
- **Caching**: Memorizzazione locale dei dati frequenti
- **Debouncing**: Ottimizzazione delle ricerche e filtri
- **Virtual Scrolling**: Gestione efficiente di liste lunghe

### **Accessibilità**
- **Keyboard Navigation**: Navigazione completa da tastiera
- **Screen Reader**: Supporto per lettori di schermo
- **Contrasti**: Colori ad alto contrasto
- **Focus Management**: Gestione corretta del focus

## 📊 Struttura Database

### **Tabelle Principali**
- **transactions**: Transazioni (spese/entrate)
- **goals**: Obiettivi finanziari
- **spending_limits**: Limiti di spesa per categoria
- **user_categories**: Categorie personalizzate degli utenti

### **Relazioni**
- Tutte le tabelle sono collegate all'utente tramite `user_id`
- Le transazioni possono essere associate a obiettivi tramite `goal_id`
- Le categorie sono gestite tramite la tabella `user_categories`

## 🔧 Personalizzazione

### **Temi e Stili**
- **Tema Chiaro/Scuro**: Supporto per temi personalizzati
- **Colori Personalizzabili**: Palette colori configurabile
- **Font Personalizzabili**: Tipografia adattabile

### **Configurazioni**
- **Valuta**: Supporto per diverse valute
- **Formato Date**: Personalizzazione del formato delle date
- **Lingua**: Supporto multilingua (attualmente italiano)

## 📈 Roadmap

### **Funzionalità Future**
- [ ] **Esportazione Dati**: PDF, Excel, CSV
- [ ] **Backup Automatico**: Sincronizzazione cloud
- [ ] **Notifiche Push**: Avvisi per limiti e obiettivi
- [ ] **Budget Annuali**: Pianificazione finanziaria a lungo termine
- [ ] **Analisi Predittive**: IA per previsioni di spesa
- [ ] **Condivisione Famiglia**: Gestione condivisa delle spese domestiche
- [ ] **Integrazione Banche**: Importazione automatica transazioni
- [ ] **App Mobile**: Versione nativa per iOS/Android

## 🤝 Contributi

Le contribuzioni sono benvenute! Per contribuire:

1. Fork del repository
2. Crea un branch per la tua feature
3. Committa le modifiche
4. Push al branch
5. Crea una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 📞 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta il team di sviluppo
- Consulta la documentazione tecnica

---

**Future Safe Money** - Gestisci le tue finanze in modo intelligente e sicuro! 💰✨
