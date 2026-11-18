# 🏀 Hoop Agent

Gioco manageriale: sei un **procuratore sportivo** in una NBA parodia. Squadre, star, sponsor e personaggi famosi hanno nomi storpiati (LeBonno James, Los Angeles Fakers, Naik…); gli altri giocatori sono inventati.

## Novità
- **Tutorial** con Coach Gigi alla prima partita (rivedibile col pulsante ?).
- **110 imprevisti** (`events.js`): quasi ogni settimana una scelta da fare; alcuni cambiano l'aspetto del giocatore (tatuaggi, capelli, occhiali...).
- **Rapporti** con giocatori, squadre e sponsor: le tue scelte li cambiano, e da loro dipende la probabilità che accettino le tue richieste (`tuning.js`).
- **Trattative più vere**: con le squadre valore stimato a forbice, preferenze del giocatore (soldi, vincere, grande città, minuti), offerte che scadono, asta con le altre offerte e bluff; per diventare agente commissioni normali (2-4%), limite segreto da indovinare, agenzie rivali che si intromettono e promesse da mantenere.
- **Statistiche e record**: altezza e peso realistici per ruolo, minuti giocati in ogni partita (punti proporzionati ai minuti), record della lega che partono da quelli reali della NBA (partita, stagione, carriera, premi), con le leggende del passato e il migliore della tua epoca (`records_data.js`).
- **Crea i tuoi campioni**: l'accademia forma buoni giocatori e ogni tanto un 💎 talento generazionale; i camp rendono di più sui giovani di talento; obiettivo "Crea un campione" con il titolo 🌟 Scopritore di talenti.
- **Gioco lungo**: 3 sfide nuove ogni stagione, sede e accademia giovanile, quote di una squadra NBA fino a diventarne presidente, fondazione benefica, costi che crescono con l'agenzia.
- **Carriera realistica**: potenziale legato all'età (giovani in crescita, apice verso i 28 anni, poi declino), tratti 🔥 Ambizioso e 😴 Si accontenta che alzano o abbassano il potenziale, infortuni che tolgono forma per un periodo (non allo stakanovista), camp estivi con le leggende.
- **Obiettivi con ricompense**: soldi, reputazione, livelli di staff gratis, rapporti migliori e il titolo di Agente leggendario 🏆.
- **Carattere e storia**: ogni giocatore ha 1-2 tratti (festaiolo, aggressivo, gentile, leader…) e una piccola storia inventata che non si ripete; il carattere decide che imprevisti gli capitano (`traits.js`).
- **Partite settimana per settimana**: in Home prossima partita, posizione in classifica e medie; dopo ogni settimana i risultati con il voto (A+…F) di ogni tuo giocatore.
- **Trattative vere per diventare agente**: il giocatore accetta di incontrarti, tu offri commissione e bonus, lui fa controfferte e ha una pazienza.
- **Consiglia ai club** i tuoi giocatori e i prospetti: promessa di scelta al Draft, offerte o scambi; conta il rapporto con la squadra.
- **Imprevisti rari** che cambiano la carriera e imprevisti dedicati al college (`events_extra.js`).
- **Informatore** (Staff): soffiate sui prospetti del prossimo Draft; all'inizio è scarso e a volte sbaglia.
- **Legame con i prospetti**: coltivalo prima del Draft; chi ti è molto legato può sceglierti da solo.
- **Notifiche in stile arcade**; se c'è un imprevisto la visuale si sposta lì e non puoi avanzare finché non decidi.
- **Home illustrata**: il cliente più pagato schiaccia con la maglia, il numero e il look veri.

## 📲 Installare l'app sull'iPhone
1. Apri **https://parisottotanara-dev.github.io/Agente-nba/** con **Safari**.
2. Tocca **Condividi** (il quadrato con la freccia) → **Aggiungi alla schermata Home** → **Aggiungi**.
3. Apri il gioco dall'icona: parte a schermo intero e funziona anche senza internet.

Gli aggiornamenti arrivano da soli: quando c'è internet l'app scarica sempre l'ultima versione.

## Come si gioca
Apri `index.html` nel browser, oppure pubblica il repository con GitHub Pages e su iPhone usa Safari → Condividi → **Aggiungi alla schermata Home**.
Funziona offline e salva da solo la partita nel browser.

- **Mercato** – scova prospetti del college, free agent e giocatori di altre agenzie. Manda gli scout 🔭 per stimare meglio il potenziale, poi presenta l'agenzia scegliendo la commissione (1-4%): più bassa = più facile convincerli.
- **Clienti** – negozia i contratti con le squadre (accetta, controproposta, rifiuta: se chiedi troppo il GM perde la pazienza), tieni alto il morale con le chiamate.
- **Agenzia** – decisioni in sospeso (sponsor, infortuni, scandali, richieste di cessione, agenti rivali), notizie, obiettivi e storico.
- **Lega** – classifica, playoff, classifica delle agenzie, migliori giocatori.
- **Staff** – scout, ufficio legale, marketing e uffici (più posti cliente).

Ogni stagione: Free Agency (3 settimane) → stagione regolare (20, con All-Star e rinnovi) → playoff e premi (MVP, Rookie dell'anno) → Draft → invecchiamento, crescita e ritiri.

Guadagni il 1-4% degli stipendi dei clienti e il 15% degli sponsor. Se la cassa resta in rosso per 4 settimane perdi la licenza.
