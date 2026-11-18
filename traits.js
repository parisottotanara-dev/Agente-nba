/* Super Agente NBA — carattere e storia dei giocatori.
   Ogni giocatore ha 1 o 2 tratti. I tratti:
   - rendono più probabili (boost) o meno probabili (dampen) certi imprevisti;
   - sbloccano imprevisti tutti loro (campo "trait" negli eventi qui sotto);
   - cambiano alcune regole (vedi game.js: leale, avido, permaloso, professionista, festaiolo).
   La storia è composta da frammenti: il gioco usa prima quelli mai usati, così le storie non si ripetono. */
'use strict';

const TRAITS = {
  festaiolo: { label: 'Festaiolo', icon: '🎉', desc: 'Conosce il DJ di ogni città NBA. La sveglia, invece, non l\'ha mai conosciuta.',
    boost: ['vacanza', 'paparazzi', 'tiktok', 'auto', 'catena', 'sonno', 'trasferta', 'matrimonio'], dampen: ['scacchi', 'scuola', 'yoga'] },
  aggressivo: { label: 'Aggressivo', icon: '😤', desc: 'Difende forte anche ai videogiochi. Gli arbitri lo chiamano per nome, e non per affetto.',
    boost: ['tecnico', 'rivalita', 'coach_lite', 'maschera', 'dente', 'mascotte'], dampen: ['bambino', 'ospedale', 'yoga'] },
  gentile: { label: 'Gentile', icon: '💛', desc: 'Chiede scusa al ferro quando sbaglia un tiro. Impossibile non volergli bene.',
    boost: ['bambino', 'ospedale', 'fondazione', 'campo_quartiere', 'asta', 'rasato', 'scuola', 'ambiente'], dampen: ['tecnico', 'rivalita', 'coach_lite'] },
  leader: { label: 'Leader', icon: '🧢', desc: 'Quando parla lui, anche il coach prende appunti.',
    boost: ['capitano', 'mentore', 'record', 'partita_40', 'nazionale'], dampen: ['panchina', 'brutta_partita'] },
  timido: { label: 'Timido', icon: '🙈', desc: 'In campo segna 30 punti. Davanti a un microfono, 30 secondi di silenzio.',
    boost: ['gaffe', 'hater', 'intervista'], dampen: ['tiktok', 'talkshow', 'reality', 'podcast', 'documentario', 'sfilata'] },
  vanitoso: { label: 'Vanitoso', icon: '💅', desc: 'Si riscalda davanti allo specchio e gioca davanti alle telecamere. Il pallone viene dopo.',
    boost: ['sfilata', 'capelli_colore', 'cresta', 'catena', 'paparazzi', 'documentario', 'murale', 'cartellone', 'treccine'], dampen: ['rasato'] },
  avido: { label: 'Attaccato ai soldi', icon: '💰', desc: 'Divide il conto della pizza al centesimo, anche quando offri tu. Vuole contratti ricchi.',
    boost: ['pizzeria', 'cripto', 'nft', 'app', 'clausola', 'rivale', 'immobili'], dampen: ['fondazione', 'asta'] },
  leale: { label: 'Leale', icon: '🤝', desc: 'Ha lo stesso barbiere dalle elementari. Se si fida di te, nessuno te lo porta via.',
    boost: ['figlio', 'matrimonio', 'tifosi_casa'], dampen: ['rivale', 'scambio'] },
  professionista: { label: 'Stakanovista', icon: '🏋️', desc: 'Il custode del palazzetto gli ha dato le chiavi, per disperazione.',
    boost: ['allenamento_estivo', 'dieta', 'yoga', 'crio', 'mentore', 'ruolo'], dampen: ['vacanza', 'sonno', 'tiktok'] },
  scaramantico: { label: 'Scaramantico', icon: '🍀', desc: 'I calzini portafortuna sono stati lavati l\'ultima volta nel 2019. Guai a toccarli.',
    boost: ['superstizione', 'fascia', 'numero', 'copertina', 'barba'], dampen: [] },
  permaloso: { label: 'Permaloso', icon: '😾', desc: 'Ricorda ogni critica, con data, ora e nome del giornalista.',
    boost: ['hater', 'rivalita', 'panchina', 'fake_news', 'brutta_partita'], dampen: [] },
  ambizioso: { label: 'Ambizioso', icon: '🔥', desc: 'Ha vinto un torneo e ha chiesto subito qual è il prossimo. Può diventare più forte di quanto dicono gli scout.',
    boost: ['allenamento_estivo', 'rivalita', 'capitano', 'nazionale', 'ruolo', 'mentore'], dampen: ['vacanza', 'sonno'] },
  appagato: { label: 'Si accontenta', icon: '😴', desc: 'Firmato il contratto, ha comprato un divano. Indovina dove passa le estati. Rischia di buttare via il suo talento.',
    boost: ['vacanza', 'immobili', 'auto', 'sonno', 'cucina'], dampen: ['allenamento_estivo', 'dieta', 'yoga'] },
  burlone: { label: 'Burlone', icon: '🤡', desc: 'Lo spogliatoio ride, il coach conta fino a dieci. Spesso fino a cento.',
    boost: ['meme', 'tiktok', 'spogliatoio', 'mascotte', 'robot', 'alieni', 'gemello', 'cane'], dampen: ['scacchi'] },
};
// Tratti che non stanno bene insieme
const TRAIT_CLASH = [['timido', 'vanitoso'], ['gentile', 'aggressivo'], ['leale', 'avido'], ['professionista', 'festaiolo'], ['timido', 'burlone'], ['ambizioso', 'appagato'], ['professionista', 'appagato']];

function genTraits() {
  const ids = Object.keys(TRAITS);
  const a = ids[Math.floor(Math.random() * ids.length)];
  if (Math.random() < 0.45) return [a];
  const ok = ids.filter(b => b !== a && !TRAIT_CLASH.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
  return [a, ok[Math.floor(Math.random() * ok.length)]];
}

/* ---------- Frammenti della storia ---------- */
const STORY = {
  // l'origine si compone da luogo + famiglia: oltre 2.000 combinazioni diverse
  place: ['nel South Side di Chicago', 'in una fattoria dell\'Iowa', 'a Lagos, in Nigeria', 'a Bologna', 'in una roulotte in Arizona',
    'in un paesino del Montenegro', 'a Boston', 'a Brooklyn, a due isolati da Rucker Park', 'a San Juan, a Porto Rico', 'nelle banlieue di Parigi',
    'in un ranch del Texas', 'su una piccola isola delle Hawaii', 'a Detroit', 'a Melbourne', 'a Kaunas, in Lituania', 'a Oakland',
    'in un villaggio del Senegal', 'in un paesino della Sardegna', 'a Toronto', 'ad Atlanta', 'tra le colline del Kentucky', 'a Madrid',
    'a Seattle, dove piove sempre', 'a Belgrado', 'a New Orleans', 'a Baltimora', 'a Città del Messico', 'in un sobborgo di Los Angeles',
    'a Napoli', 'ad Anchorage, in Alaska', 'in un quartiere popolare di Memphis', 'a Kingston, in Giamaica'],
  family: ['figlio di un\'infermiera e di un tassista', 'il più piccolo di nove fratelli', 'cresciuto dalla nonna', 'in una famiglia di musicisti',
    'figlio di due professori che lo volevano violinista', 'con un papà ex giocatore di Serie A', 'in una famiglia di pescatori',
    'figlio unico di una mamma poliziotta', 'con quattro sorelle maggiori, tutte cestiste', 'figlio del custode della palestra della scuola',
    'in una famiglia di circensi', 'figlio di un pastore protestante', 'con un gemello che gioca a calcio', 'in una famiglia che cambiava città ogni anno',
    'figlio del cuoco di un ristorante italiano', 'con una mamma ex campionessa di atletica', 'figlio di un meccanico', 'cresciuto da uno zio',
    'figlio di due medici sempre di turno', 'in una famiglia numerosissima e rumorosa', 'figlio di un allenatore di football del liceo',
    'con un papà camionista sempre in viaggio', 'figlio di immigrati arrivati senza niente', 'in una famiglia di agricoltori',
    'figlio di una giudice severissima', 'con un nonno che era stato pugile', 'figlio di un tecnico della NASA'],
  originVerb: ['È cresciuto', 'È nato e cresciuto', 'Ha passato l\'infanzia'],
  start: [
    'Ha iniziato a giocare tardi, a 15 anni, dopo essere stato scartato dalla squadra di football.',
    'Il nonno gli costruì un canestro con una cassetta della frutta inchiodata al garage.',
    'Ha imparato a tirare guardando di nascosto gli allenamenti della squadra del liceo.',
    'Da bambino passava le estati a sfidare gli adulti al campetto, perdendo sempre.',
    'Un allenatore lo notò mentre prendeva un autobus: "Con quelle braccia devi giocare".',
    'Ha giocato il primo torneo con le scarpe del fratello maggiore, tre numeri più grandi.',
    'Per anni si è allenato da solo alle 5 del mattino, prima di andare a lavorare in un fast food.',
    'Ha scoperto il basket in ospedale, guardando le partite durante una lunga convalescenza.',
    'Sua madre era una stella del basket femminile e gli ha insegnato tutto.',
    'Ha vinto una borsa di studio grazie a un video amatoriale diventato virale.',
    'Ha iniziato come portaborracce della squadra del college, poi un giorno mancavano giocatori.',
    'È stato espulso da tre squadre giovanili prima di trovare un coach che credesse in lui.',
    'Ha imparato il palleggio in un corridoio stretto, schivando la mamma che passava l\'aspirapolvere.',
    'Al liceo era il più basso della squadra; poi, in un\'estate, è cresciuto di 18 centimetri.',
    'Ha imparato a giocare con i videogiochi prima che con un pallone vero.',
    'Il suo primo coach era un prete che organizzava tornei per tenere i ragazzi lontani dalla strada.',
    'Ha giocato il primo anno con una mano sola, l\'altra era ingessata. Così ha imparato a usare la sinistra.',
    'Faceva atletica: lo hanno convinto a provare il basket solo perché saltava più in alto di tutti.',
    'Un vicino, ex giocatore di college, gli ha regalato il suo primo pallone e mille consigli.',
    'Ha imparato a giocare in carcere minorile, dove un volontario ha cambiato la sua vita.',
    'Il primo pallone lo ha trovato in un cassonetto, sgonfio. Lo ha rattoppato con il nastro adesivo.',
    'Giocava a pallavolo finché un coach non gli ha detto: "Tu devi schiacciare in un canestro, non su una rete".',
    'Ha perso la sua prima partita 104 a 12. Il giorno dopo era di nuovo in palestra.',
    'Si allenava di notte sotto un lampione, con un canestro senza retina.',
    'Ha iniziato perché alla mensa della scuola il cestista più bravo mangiava gratis.',
    'Il suo primo allenatore era un ex giocatore italiano che urlava solo in dialetto.',
    'A 10 anni ha scritto una lettera al suo idolo NBA. Gli ha risposto, e da lì non ha più smesso.',
    'Ha imparato il tiro in sospensione da un tutorial guardato duecento volte.',
    'Faceva il raccattapalle per la squadra della città e di nascosto tirava durante l\'intervallo.',
    'Ha giocato la prima partita ufficiale in pigiama: aveva dimenticato la divisa.',
  ],
  quirk: [
    'Colleziona francobolli e ne porta sempre uno in tasca come portafortuna.',
    'Ha un pappagallo che si chiama Canestro e che dice solo "Air ball".',
    'Viaggia ovunque con un ukulele che non sa suonare.',
    'Mangia esattamente 14 pancake prima di ogni partita in casa.',
    'Scrive poesie che nessuno ha mai letto.',
    'È un campione segreto di scacchi online.',
    'Parla cinque lingue, ma litiga solo in una.',
    'Ha paura dei piccioni, e i palazzetti ne sono pieni.',
    'Guarda ogni sera lo stesso film d\'animazione per addormentarsi.',
    'Ha un tatuaggio con il nome del suo primo cane, Polpetta.',
    'Coltiva pomodori sul balcone e li regala ai compagni.',
    'Non ha mai preso un aereo senza le sue ciabatte pelose.',
    'Sa a memoria tutte le sigle dei cartoni degli anni \'90.',
    'Fa i puzzle da 5000 pezzi per rilassarsi.',
    'Chiama la nonna dopo ogni partita, anche alle tre di notte.',
    'Ha un canale segreto di ricette di cucina con 40 iscritti.',
    'Porta sempre calzini spaiati: dice che "confonde la difesa".',
    'Sta imparando a fare il barista e prepara caffè a tutta la squadra.',
    'Ha letto tutti i libri di Harry Potter sette volte.',
    'Gira con una macchina fotografica a pellicola e fotografa i tifosi.',
  ],
  dream: [
    'Il suo sogno è vincere un anello. Il secondo è aprire una gelateria con 40 gusti, tutti al cioccolato.',
    'Sogna di vincere l\'MVP e di essere ricordato. Possibilmente non per le scarpe che indossa.',
    'Vuole una statua davanti al palazzetto. Ha già scelto la posa e ha chiesto che sia più alta di lui.',
    'Vuole entrare nella Hall of Fame e fare il discorso più corto della storia: "Grazie, ciao".',
    'Sogna di battere un record NBA. Uno qualsiasi, dice. Anche quello dei falli tecnici.',
    'Vuole giocare finché ha 40 anni. Il suo ginocchio sinistro non è d\'accordo.',
    'Sogna di comprare una casa ai genitori. Loro vorrebbero solo che rispondesse al telefono.',
    'Vuole diventare attore dopo il ritiro. Ha già girato un film: 12 visualizzazioni, 10 sono sue.',
    'Vuole la maglia ritirata dalla sua squadra. Intanto ha ritirato quella del liceo, da solo, nell\'armadio.',
    'Sogna di schiacciare in testa al suo idolo d\'infanzia, e poi chiedergli un autografo.',
  ],
  // come lo descrive qualcuno che lo conosce bene
  said: [
    ['lo scout che lo ha visto per primo', 'Braccia lunghe, mani buone, gusti musicali discutibili.'],
    ['sua madre', 'Bravo, bravo. Ma quando ti trovi un lavoro vero?'],
    ['il suo allenatore del liceo', 'Non ho mai visto nessuno sbagliare così tanti tiri con così tanta fiducia.'],
    ['sua nonna', 'Mangia poco. Scrivetelo.'],
    ['il suo compagno di stanza al college', 'Russa in tre lingue.'],
    ['uno scout rivale', 'Tra cinque anni sarà una star, oppure venderà assicurazioni. Non c\'è una via di mezzo.'],
    ['il suo primo coach', 'Il talento c\'era. La puntualità l\'abbiamo aspettata quattro anni.'],
    ['suo fratello maggiore', 'Gli ho insegnato tutto io. Poi ha iniziato a battermi e ho smesso di insegnare.'],
    ['un ex compagno di squadra', 'Passa la palla solo a chi gli sta simpatico. Per fortuna gli stanno simpatici quasi tutti.'],
    ['il preside della sua scuola', 'Bravissimo ragazzo. Il canestro della palestra lo paghiamo ancora a rate.'],
    ['il suo preparatore', 'Ha un fisico da statua greca e la disciplina di un gatto.'],
    ['il suo vicino di casa', 'Palleggia alle sei di mattina da quando ha otto anni. Gli auguro tutto il successo del mondo, lontano da qui.'],
  ],
};
// Una riga legata al carattere, così la storia "spiega" il tratto
const TRAIT_LINES = {
  festaiolo: ['Conosce per nome ogni buttafuori della città.', 'Una volta ha festeggiato una vittoria per tre giorni di fila.', 'Il suo compleanno dura una settimana.', 'Ha un DJ di fiducia che lo segue in trasferta.', 'Si è presentato a un allenamento ancora in smoking.', 'Il suo motto è: \"Si dorme da ritirati\".'],
  aggressivo: ['Al liceo ha preso più falli tecnici che punti, almeno il primo anno.', 'Non ha mai perso una sfida uno contro uno senza chiedere la rivincita.', 'I compagni dicono che in allenamento difende come se fosse una finale.', 'Da ragazzo è stato espulso da una partita di beneficenza.', 'Si allena facendo boxe tre volte a settimana.', 'Non stringe mai la mano agli avversari prima della palla a due.'],
  gentile: ['Ogni Natale porta regali in un ospedale pediatrico, senza dirlo a nessuno.', 'Dà sempre il suo pasto a chi ne ha bisogno durante le trasferte.', 'Saluta per nome tutti i custodi del palazzetto.', 'Ha adottato tre cani da un canile e li porta ai campi estivi per bambini.', 'Firma autografi finché l\'ultimo tifoso non se ne va.', 'Cucina la cena per i compagni nuovi appena arrivati in squadra.'],
  leader: ['Era capitano in ogni squadra in cui ha giocato, anche a 12 anni.', 'Dopo una sconfitta è sempre il primo a parlare nello spogliatoio.', 'Gli allenatori lo chiamano "un coach in campo".', 'Organizza da solo le cene di squadra in trasferta.', 'Ha convinto un compagno a non ritirarsi con un discorso di dieci minuti.', 'Al college gli allenatori gli facevano preparare gli schemi.'],
  timido: ['Alla prima intervista ha risposto solo "grazie" a ogni domanda.', 'Arrossisce quando i tifosi gridano il suo nome.', 'Ha imparato a parlare in pubblico con un corso online, ancora a metà.', 'Ha festeggiato la sua prima schiacciata in partita chiedendo scusa all\'avversario.', 'Ha scritto il suo primo discorso su un tovagliolo e non l\'ha mai letto.', 'Ai compagni nuovi si presenta via messaggio, anche se sono nella stessa stanza.'],
  vanitoso: ['Si cambia scarpe tre volte a partita "per le foto".', 'Ha un fotografo personale che lo segue anche al supermercato.', 'Non entra in campo senza essersi sistemato i capelli.', 'Ha 200 paia di scarpe, tutte ancora nella scatola.', 'Ha un profumo con il suo nome che nessuno ha mai comprato.', 'Si porta il parrucchiere anche ai ritiri estivi.'],
  avido: ['Ha negoziato da solo la paghetta fino a 18 anni.', 'Tiene un quaderno con ogni dollaro che ha guadagnato.', 'Ha venduto i biglietti per vedere i suoi allenamenti al liceo.', 'Ha chiesto un rimborso spese per un panino offerto a un compagno.', 'Vende online le magliette sudate delle partite.', 'Ha un consulente finanziario per ogni continente.'],
  leale: ['È ancora amico di tutti i suoi compagni delle elementari.', 'Ha rifiutato college più ricchi per restare vicino al suo primo coach.', 'Non ha mai cambiato barbiere in vita sua.', 'Telefona ogni domenica al suo allenatore delle elementari.', 'Porta ancora la fascia della sua prima squadra sotto la divisa.', 'Ha scelto il suo agente stringendogli la mano, senza contratto.'],
  professionista: ['Si allena anche il giorno di Natale.', 'Pesa ogni grammo di quello che mangia.', 'Guarda i video degli avversari fino a notte fonda.', 'Dorme con una mascherina che misura le ore di sonno.', 'Ha una palestra in casa più grande di quella della squadra.', 'Non mangia dolci da quando aveva 15 anni.'],
  scaramantico: ['Entra in campo sempre col piede sinistro.', 'Indossa gli stessi calzini da quando ha vinto il titolo del liceo.', 'Prima di ogni tiro libero fa lo stesso rito, in sette movimenti.', 'Gira con un cornetto rosso regalato dalla nonna napoletana.', 'Non si taglia i capelli durante i playoff.', 'Siede sempre allo stesso posto sul pullman della squadra.'],
  permaloso: ['Si ricorda ogni critica ricevuta, con data e ora.', 'Una volta ha tolto il saluto a un compagno per una battuta sulle sue scarpe.', 'Legge tutti i commenti su di lui. Proprio tutti.', 'Ha cambiato numero di maglia dopo una battuta di un telecronista.', 'Tiene una lista di chi non lo ha passato in partita.', 'Una volta ha smesso di parlare al cugino per un anno, per un tiro sbagliato a una grigliata.'],
  ambizioso: ['Ha appeso in camera la foto del giocatore che lo ha battuto al liceo, per non dimenticarlo.', 'Dopo ogni vittoria si chiede cosa poteva fare meglio.',
    'Ha chiesto al suo allenatore del college una lista dei suoi difetti. Di cinque pagine.', 'Si è promesso di migliorare un fondamentale nuovo ogni estate.',
    'Non festeggia mai: pensa già alla partita dopo.', 'Studia le partite delle leggende anni \'90 per rubare i loro movimenti.'],
  appagato: ['Dopo il primo stipendio si è comprato un divano massaggiante e non si è più alzato.', 'Dice che "il talento basta e avanza".',
    'Salta gli allenamenti facoltativi: "facoltativo vuol dire facoltativo".', 'Si allena al massimo solo nell\'anno del rinnovo del contratto.',
    'Ha un tatuaggio con scritto "Già arrivato".', 'Preferisce la playstation alla palestra, e non lo nasconde.'],
  burlone: ['Ha nascosto una gallina nello spogliatoio della squadra avversaria.', 'Imita alla perfezione la voce del suo allenatore.', 'Nessun compagno ha mai trovato le scarpe dove le aveva lasciate.', 'Ha sostituito lo shampoo del capitano con la maionese.', 'Si è travestito da mascotte e ha fatto il tifo per gli avversari.', 'Ha fatto credere a tutta la squadra che l\'allenamento fosse alle 4 del mattino.'],
};

function pickFresh(cat, arr) {
  S.storyUsed = S.storyUsed || {};
  const used = S.storyUsed[cat] = S.storyUsed[cat] || [];
  let free = arr.map((_, i) => i).filter(i => !used.includes(i));
  if (!free.length) { used.length = 0; free = arr.map((_, i) => i); } // finiti tutti: si ricomincia
  const i = free[Math.floor(Math.random() * free.length)];
  used.push(i);
  return arr[i];
}
function storyOf(p) {
  if (!p.traits) p.traits = genTraits();
  if (!p.story) {
    const tl = () => pickFresh('t_' + p.traits[0], TRAIT_LINES[p.traits[0]]);
    const origin = () => `${STORY.originVerb[Math.floor(Math.random() * 3)]} ${pickFresh('place', STORY.place)}, ${pickFresh('family', STORY.family)}.`;
    const said = () => { const [who, q] = pickFresh('said', STORY.said); return `Secondo ${who}: "${q}"`; };
    const r = Math.random();
    let parts;
    if (r < 0.3) parts = [origin(), pickFresh('start', STORY.start), tl()];
    else if (r < 0.55) parts = [said(), tl(), pickFresh('quirk', STORY.quirk)];
    else if (r < 0.75) parts = [pickFresh('start', STORY.start), said()];
    else if (r < 0.9) parts = [tl(), `Segno particolare: ${pickFresh('quirk', STORY.quirk).replace(/^./, c => c.toLowerCase())}`];
    else parts = [origin(), tl(), pickFresh('dream', STORY.dream)];
    p.story = parts.join(' ');
  }
  return p.story;
}
const hasTrait = (p, t) => !!(p && p.traits && p.traits.includes(t));
const traitChips = p => (p.traits || []).map(t => `<span class="trait t-${t}" title="${TRAITS[t].desc}">${TRAITS[t].label}</span>`).join('');

/* ---------- Imprevisti legati al carattere ---------- */
EVENTS.push(
  { id: 'serata_prepartita', trait: 'festaiolo', ico: '🪩', title: '{P} in discoteca la notte prima della partita',
    text: 'Le foto di {P} alle 4 del mattino in un locale sono già sui social. Stasera si gioca.', cond: { team: true, minAge: 19 },
    choices: [
      { label: 'Multa interna e lunga predica', fx: { mor: -6 }, tr: 2 },
      { label: 'Copri tutto con un comunicato ($8k)', fx: { cash: -8, odds: [0.6, {}, { rep: -2, hype: -4 }] }, tr: -1 },
      { label: 'Lascia correre', fx: { mor: 4, odds: [0.5, { hype: 6 }, { hype: -6, ovr: -1 }] }, tr: -4 },
    ] },
  { id: 'festa_villa', trait: 'festaiolo', ico: '🎉', title: '{P} organizza una festa da 300 invitati',
    text: 'Nella sua villa, a metà settimana. I vicini hanno già chiamato due volte la polizia per il volume.', cond: { minAge: 21 },
    choices: [
      { label: 'Convincilo ad annullarla', ask: 'player', fx: { mor: -3 }, tr: 2 },
      { label: 'Vai anche tu, così controlli', fx: { cash: -5, mor: 10 }, risk: { p: 0.3, fx: { rep: -2 }, note: 'potresti finire nelle foto' } },
      { label: 'Fatti suoi', fx: { mor: 5 }, risk: { p: 0.25, fx: { inj: 1, tr: -3 }, note: 'potrebbe saltare l\'allenamento' } },
    ] },
  { id: 'rissa_campo', trait: 'aggressivo', ico: '🥊', title: 'Rissa in campo: {P} espulso',
    text: 'Una spinta di troppo e sono volati pugni. La lega valuta la squalifica.', cond: { team: true },
    choices: [
      { label: 'Difendilo pubblicamente', fx: { mor: 8, rep: -2, inj: 3 }, tr: -3 },
      { label: 'Scuse e corso di gestione della rabbia ($15k)', fx: { cash: -15, inj: 1, rep: 1, mor: -3 }, tr: 3 },
      { label: 'Silenzio stampa', fx: { inj: 2, rep: -1 } },
    ] },
  { id: 'arbitro', trait: 'aggressivo', ico: '🟥', title: '{P} contro l\'arbitro',
    text: 'A fine partita {P} ha inseguito l\'arbitro fino al tunnel. La multa sarà salata.', cond: { team: true },
    choices: [
      { label: 'Paga tu la multa ($25k)', fx: { cash: -25, mor: 6 } },
      { label: 'Che la paghi lui, e impari', fx: { mor: -6, rep: 0.5 }, tr: 1 },
    ] },
  { id: 'beneficenza_segreta', trait: 'gentile', ico: '💛', title: 'La beneficenza segreta di {P}',
    text: 'Un giornalista ha scoperto che {P} paga da anni le rette scolastiche di 30 ragazzi del suo quartiere.',
    choices: [
      { label: 'Rendilo pubblico', fx: { rep: 3, hype: 12, mor: -2 } },
      { label: 'Rispetta la sua riservatezza', fx: { rep: 1, mor: 8 } },
    ] },
  { id: 'aiuta_rivale', trait: 'gentile', ico: '🤲', title: '{P} aiuta un avversario infortunato',
    text: '{P} ha accompagnato in ospedale {N}, che si era fatto male in partita contro di lui.', cond: { team: true },
    choices: [{ label: 'Che bel gesto', fx: { rep: 2, hype: 8, mor: 4 } }] },
  { id: 'discorso_spogliatoio', trait: 'leader', ico: '🗣️', title: 'Il discorso di {P} nello spogliatoio',
    text: 'Dopo una brutta serie di sconfitte, {P} ha preso la parola davanti a tutta la squadra.', cond: { team: true },
    choices: [
      { label: 'Sostienilo con la dirigenza', fx: { mor: 6, hype: 4 }, tr: 4 },
      { label: 'Consiglia più diplomazia', fx: { mor: -3 }, tr: 1 },
    ] },
  { id: 'panico_microfono', trait: 'timido', ico: '🎤', title: '{P} va in panico in diretta TV',
    text: 'All\'intervista dopo partita {P} si è bloccato per dieci secondi, poi è scappato via.', cond: { team: true },
    choices: [
      { label: 'Assumi un media coach ($8k)', fx: { cash: -8, mor: 6, hype: 2 } },
      { label: 'Niente più interviste per un po\'', fx: { mor: 4, hype: -4 } },
      { label: 'Trasformalo in un meme simpatico', fx: { hype: 8, mor: -6 } },
    ] },
  { id: 'specchio', trait: 'vanitoso', ico: '🪞', title: 'Le pretese di {P}',
    text: '{P} vuole uno specchio a figura intera nello spogliatoio e un fotografo personale alle partite.', cond: { team: true },
    choices: [
      { label: 'Paga tu il fotografo ($10k)', fx: { cash: -10, mor: 8, hype: 6 } },
      { label: 'Chiedi alla squadra lo specchio', ask: 'team', fx: { mor: 5 } },
      { label: 'Riportalo sulla Terra', ask: 'player', fx: { mor: -4 } },
    ] },
  { id: 'rinegozia', trait: 'avido', ico: '💵', title: '{P} si sente sottopagato',
    text: 'Vuole che tu vada dalla squadra a chiedere un aumento, subito, a contratto in corso.', cond: { team: true },
    choices: [
      { label: 'Chiedi l\'aumento ai {T}', ask: 'team', fx: { raise: 0.1, mor: 10 }, tr: -4 },
      { label: 'Abbassa la tua commissione di mezzo punto', fx: { comm: -0.5, mor: 12 } },
      { label: 'Spiegagli che non si può', ask: 'player', fx: { mor: -4 } },
    ] },
  { id: 'fedelta', trait: 'leale', ico: '🤝', title: '{P} rifiuta {R}',
    text: '{R} ha offerto a {P} di cambiare agenzia. Lui ha risposto in pubblico: "Il mio agente è il migliore".',
    choices: [{ label: 'Ringrazialo', fx: { rep: 2, mor: 6 } }] },
  { id: 'allenamento_extra', trait: 'professionista', ico: '⏰', title: '{P} si allena alle 5 del mattino',
    text: 'Anche nei giorni di riposo. I preparatori temono che esageri.', cond: { team: true },
    choices: [
      { label: 'Preparatore personale ($20k)', fx: { cash: -20, ovr: 1, pot: 1 } },
      { label: 'Lascialo fare', fx: { odds: [0.7, { ovr: 1 }, { inj: 2 }] } },
      { label: 'Imponigli il riposo', ask: 'player', fx: { mor: -3 } },
    ] },
  { id: 'rito_spaghetti', trait: 'scaramantico', ico: '🍝', title: 'Il rito degli spaghetti è in pericolo',
    text: '{P} mangia gli stessi spaghetti dallo stesso ristorante prima di ogni partita. Stasera il ristorante è chiuso.', cond: { team: true },
    choices: [
      { label: 'Fai aprire il ristorante solo per lui ($3k)', fx: { cash: -3, mor: 6 } },
      { label: 'Convincilo che non serve', ask: 'player', fx: { mor: -2 } },
      { label: 'Cucinali tu', fx: { odds: [0.5, { mor: 8, hype: 4 }, { mor: -6 }] } },
    ] },
  { id: 'offeso', trait: 'permaloso', ico: '😾', title: '{P} si è offeso',
    text: '{N} ha fatto una battuta su di lui in TV. {P} ha risposto con 12 post di fila, sempre più arrabbiati.', cond: { team: true },
    choices: [
      { label: 'Convincilo a cancellarli', ask: 'player', fx: { rep: 0.5 } },
      { label: 'Lascia che si sfoghi', fx: { hype: 6, rep: -1, mor: 3 } },
    ] },
  { id: 'scherzo_coach', trait: 'burlone', ico: '🎈', title: 'Lo scherzo di {P} al coach',
    text: '{P} ha riempito l\'auto del coach dei {T} con mille palloncini. Il video ha fatto il giro del mondo.', cond: { team: true },
    choices: [
      { label: 'Ridici sopra con la squadra', fx: { mor: 5, hype: 6 }, tr: -1 },
      { label: 'Scuse ufficiali', fx: { mor: -2 }, tr: 2 },
    ] },

  { id: 'chiede_camp', trait: 'ambizioso', ico: '🔥', title: '{P} vuole allenarsi con i migliori',
    text: '{P} ti chiede di organizzargli degli allenamenti con una leggenda: "Voglio diventare il numero uno".', cond: { team: true, maxAge: 30 },
    choices: [
      { label: 'Organizza tutto tu ($60k)', fx: { cash: -60, ovr: 2, pot: 1, mor: 8 } },
      { label: 'Più avanti, ora c\'è la stagione', fx: { mor: -5 } },
    ] },
  { id: 'fuori_forma', trait: 'appagato', ico: '🍔', title: '{P} si è presentato fuori forma',
    text: 'Dopo il nuovo contratto {P} ha preso 6 chili. Lo staff dei {T} è preoccupato.', cond: { team: true },
    choices: [
      { label: 'Nutrizionista e preparatore ($15k)', fx: { cash: -15, odds: [0.6, { mor: -2, weight: -4 }, { ovr: -1, weight: 3 }] } },
      { label: 'Discorso motivazionale', ask: 'player', fx: { pot: 1, mor: -3, weight: -2 } },
      { label: 'Lascia stare', fx: { ovr: -2, pot: -2, weight: 6 }, tr: -3 },
    ] },
);

