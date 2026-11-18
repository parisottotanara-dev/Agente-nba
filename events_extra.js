/* Super Agente NBA — imprevisti speciali.
   rare: true    → capitano raramente, ma possono cambiare una carriera (in bene o in male).
   college: true → solo per i prospetti al college, prima del Draft.
   {TD} = una squadra NBA che segue il prospetto. */
'use strict';

EVENTS.push(
  /* ===================== RARI: CAMBIANO UNA CARRIERA ===================== */
  { id: 'paternita', rare: true, ico: '⚖️', title: 'Causa di paternità contro {P}',
    text: 'Una donna sostiene che {P} sia il padre di suo figlio e lo ha denunciato. I giornalisti sono già sotto casa sua.',
    cond: { invented: true, minAge: 21 },
    choices: [
      { label: 'Test del DNA e massima discrezione ($20k)', fx: { cash: -20, odds: [0.5, { rep: 1, mor: 5 }, { hype: -10, rep: -2, mor: -8 }] } },
      { label: 'Accordo riservato ($150k)', fx: { cash: -150, mor: 4, rep: -1 } },
      { label: 'Riconosca il bambino e se ne prenda cura', fx: { rep: 2, hype: -6, mor: -4, dropSponsor: true }, risk: { p: 0.35, fx: { hype: 15 }, note: 'il pubblico potrebbe apprezzarlo' } },
    ] },
  { id: 'crociato', rare: true, ico: '🦵', title: '{P}: rottura del legamento crociato',
    text: 'Brutta caduta in partita. La diagnosi è la peggiore: stagione finita e carriera a rischio.',
    cond: { team: true, healthy: true },
    choices: [
      { label: 'Il miglior chirurgo del mondo ($120k)', fx: { cash: -120, inj: 22, ovr: -1, mor: 10 } },
      { label: 'Operazione standard', fx: { inj: 30, ovr: -3 } },
      { label: 'Terapia sperimentale in Germania ($60k)', fx: { cash: -60, odds: [0.4, { inj: 14 }, { inj: 34, ovr: -5 }] } },
    ] },
  { id: 'antidoping', rare: true, ico: '🧪', title: '{P} positivo all\'antidoping',
    text: 'Colpa di un integratore contaminato, giura lui. La lega parla di 10 settimane di squalifica.',
    cond: { invented: true, team: true },
    choices: [
      { label: 'Ricorso con i migliori avvocati ($80k)', fx: { cash: -80, odds: [0.5, { rep: 1, mor: 8 }, { inj: 10, rep: -3, dropSponsor: true }] } },
      { label: 'Accetta la squalifica e chiedi scusa', fx: { inj: 10, rep: -1, hype: -12, mor: -5 } },
    ] },
  { id: 'truffa', rare: true, ico: '💸', title: 'Il consulente finanziario di {P} è sparito',
    text: 'Con lui sono spariti quasi tutti i risparmi di {P}. È disperato e pensa di cambiare tutto, agente compreso.',
    cond: { ovr: 65, minAge: 21 },
    choices: [
      { label: 'Prestagli i soldi per ripartire ($200k)', fx: { cash: -200, mor: 30, rep: 1 } },
      { label: 'Pagagli gli avvocati ($50k)', fx: { cash: -50, odds: [0.5, { mor: 20 }, { mor: -5 }] } },
      { label: 'Non è affar tuo', fx: { mor: -25 } },
    ] },
  { id: 'erede', rare: true, ico: '👑', title: 'Una leggenda sceglie {P} come erede',
    text: 'Una leggenda del basket dice in TV che {P} è "il suo erede" e lo allenerà per tutta l\'estate.',
    cond: { young: true, team: true },
    choices: [{ label: 'Accetta con gratitudine', fx: { ovr: 4, pot: 3, hype: 25, mor: 12 } }] },
  { id: 'crescita', rare: true, ico: '📏', title: '{P} è cresciuto di 5 centimetri!',
    text: 'A {age} anni ha avuto un ultimo scatto di crescita. I preparatori non credono ai loro occhi.',
    cond: { maxAge: 21 },
    choices: [
      { label: 'Programma di allenamento su misura ($30k)', fx: { cash: -30, ovr: 4, pot: 7, height: 5 } },
      { label: 'Lascia fare alla natura', fx: { ovr: 2, pot: 5, height: 5 } },
    ] },
  { id: 'contratto_vita', rare: true, ico: '💎', title: '{B} offre un contratto a vita a {P}',
    text: 'Un accordo storico: il marchio vuole legarsi a {P} per sempre, come le grandi leggende.',
    cond: { ovr: 84 },
    choices: [
      { label: 'Firma subito', fx: { sponsor: 4, hype: 20, rep: 3 }, br: 10 },
      { label: 'Fai un\'asta tra i marchi', ask: 'brand', fx: { odds: [0.5, { sponsor: 5.5, hype: 25, rep: 4 }, { sponsor: 2.5 }] }, br: -5 },
    ] },
  { id: 'olimpiadi', rare: true, ico: '🥇', title: '{P} convocato per le Olimpiadi',
    text: 'Il sogno di ogni giocatore: la nazionale lo vuole titolare ai Giochi.',
    cond: { ovr: 78, minAge: 20 },
    choices: [
      { label: 'Vai a prenderti l\'oro', fx: { odds: [0.45, { hype: 30, rep: 5, mor: 15 }, { hype: 10, rep: 1 }] }, risk: { p: 0.12, fx: { inj: 4 }, note: 'infortunio durante il torneo' } },
      { label: 'Rinuncia per riposare', fx: { mor: -10, hype: -5 } },
    ] },
  { id: 'hollywood', rare: true, celeb: 'actor', ico: '🎬', title: '{P} protagonista a Hollywood',
    text: 'Un grande studio vuole {P} come protagonista di un film sul basket, accanto a {C}.',
    cond: { ovr: 76 },
    choices: [
      { label: 'Accetta il ruolo', fx: { cash: 250, hype: 30 }, risk: { p: 0.3, fx: { ovr: -1, mor: -5 }, note: 'le riprese potrebbero distrarlo dal campo' } },
      { label: 'Prima il basket', fx: { rep: 1, mor: -3 } },
    ] },
  { id: 'premio_umanitario', rare: true, ico: '🕊️', title: '{P} premiato per l\'impegno sociale',
    text: 'La lega assegna a {P} il premio per l\'impegno sociale dell\'anno.',
    cond: { team: true, minAge: 22 },
    choices: [{ label: 'Dona il premio in beneficenza', fx: { rep: 5, hype: 12, mor: 10 } }] },

  /* ===================== COLLEGE: PRIMA DEL DRAFT ===================== */
  { id: 'provino', college: true, ico: '🏟️', title: 'Provino privato con i {TD}',
    text: 'I {TD} vogliono vedere {P} in un allenamento privato prima del Draft.',
    choices: [
      { label: 'Accetta il provino', fx: { odds: [0.55, { draftBoost: 5, hype: 6 }, { draftBoost: -3 }] } },
      { label: 'Rifiuta: vuole tenersi libero', fx: { hype: 2 } },
    ] },
  { id: 'final_four', college: true, ico: '🏀', title: '{P} trascina il college alle Final Four',
    text: 'Torneo universitario da sogno: tutti gli osservatori parlano di lui.',
    cond: { ncaa: true },
    choices: [{ label: 'Lascialo godere il momento', fx: { hype: 15, draftBoost: 4, mor: 6 } }] },
  { id: 'college_infortunio', college: true, ico: '🩹', title: 'Infortunio al college',
    text: '{P} si è fatto male alla spalla. Gli osservatori NBA sono preoccupati.',
    choices: [
      { label: 'Visite specialistiche e comunicato ($10k)', fx: { cash: -10, draftBoost: -1 } },
      { label: 'Nascondi tutto', fx: { odds: [0.6, {}, { draftBoost: -6, rep: -1 }] } },
    ] },
  { id: 'resta_college', college: true, ico: '🎓', title: '{P} pensa di restare un altro anno al college',
    text: 'La famiglia vuole che si laurei prima di diventare professionista.',
    cond: { maxAge: 21 },
    choices: [
      { label: 'Convincilo a dichiararsi per il Draft', ask: 'player', fx: { mor: -2 } },
      { label: 'Sostieni la famiglia: resta un anno', fx: { stayCollege: true, mor: 8, pot: 2 } },
    ] },
  { id: 'combine', college: true, ico: '📏', title: '{P} alla Combine',
    text: 'Tre giorni di test davanti a tutte le squadre NBA: salto, velocità, misure e colloqui. Molti prospetti saltano le prove atletiche per non rischiare.',
    cond: { phases: ['po'] },
    choices: [
      { label: 'Fa tutti i test', fx: { odds: [0.55, { draftBoost: 4, hype: 6 }, { draftBoost: -2 }] } },
      { label: 'Solo misure e colloqui', fx: { draftBoost: 1 } },
    ] },
  { id: 'colloquio_gm', college: true, ico: '🗣️', title: 'Colloquio con il GM dei {TD}',
    text: 'Il GM dei {TD} vuole parlare a quattr\'occhi con {P}. Le domande saranno su famiglia, carattere e serate.',
    cond: { phases: ['po', 'draft'] },
    choices: [
      { label: 'Preparalo con un consulente ($8k)', fx: { cash: -8, draftBoost: 3 } },
      { label: 'Che sia se stesso', fx: { odds: [0.6, { draftBoost: 2, hype: 2 }, { draftBoost: -4, hype: -3 }] } },
    ] },
  { id: 'vecchi_post', college: true, ico: '📱', title: 'Tornano a galla vecchi post di {P}',
    text: 'Qualcuno ha ripescato frasi pesanti che {P} scriveva sui social a 15 anni. I giornali sportivi ne parlano.',
    choices: [
      { label: 'Scuse pubbliche, subito', fx: { draftBoost: -1, rep: 0.5, mor: -3 } },
      { label: 'Silenzio e aspetta che passi', fx: { odds: [0.5, {}, { draftBoost: -5, hype: -6 }] } },
    ] },
  { id: 'nil', college: true, ico: '🚗', title: 'Un concessionario vuole {P} in uno spot',
    text: 'Le regole del college ora permettono ai giocatori di guadagnare con la loro immagine. Un concessionario della città offre un contratto.',
    cond: { phases: ['fa', 'reg'], ncaa: true },
    choices: [
      { label: 'Accetta, con la tua commissione', fx: { cash: 4, hype: 5, mor: 4 } },
      { label: 'Rifiuta: prima il basket', fx: { draftBoost: 1, mor: -2 } },
    ] },
  { id: 'trasferimento', college: true, ico: '🔀', title: 'Un college più grande vuole {P}',
    text: 'Un ateneo da prima pagina gli offre un posto da titolare e le partite in TV. Il suo allenatore attuale non la prende bene.',
    cond: { phases: ['fa'], ncaa: true },
    choices: [
      { label: 'Si trasferisce: più visibilità', fx: { odds: [0.6, { hype: 8, draftBoost: 3 }, { draftBoost: -2, mor: -6 }] } },
      { label: 'Resta dov\'è', fx: { mor: 4 } },
    ] },
  { id: 'nuovo_coach', college: true, ico: '📋', title: 'Cambia l\'allenatore di {P}',
    text: 'La sua squadra ha licenziato il coach. Quello nuovo gioca lento e tiene {P} in panchina nei finali.',
    cond: { phases: ['reg'] },
    choices: [
      { label: 'Chiama il nuovo coach', fx: { odds: [0.5, { mor: 6 }, { mor: -4, draftBoost: -2 }] } },
      { label: 'Digli di far parlare il campo', fx: { odds: [0.5, { draftBoost: 2 }, { draftBoost: -2 }] } },
    ] },
  { id: 'partitona_tv', college: true, ico: '📺', title: '{P} contro il numero uno del Draft',
    text: 'Sabato in diretta nazionale c\'è la sfida con il prospetto più atteso del paese. Tutti i GM saranno davanti alla TV.',
    cond: { phases: ['reg'] },
    choices: [
      { label: 'Caricalo: è la sua occasione', fx: { odds: [0.45, { draftBoost: 5, hype: 10 }, { draftBoost: -3, hype: -2 }] } },
      { label: 'Digli di giocare tranquillo', fx: { draftBoost: 1 } },
    ] },
  { id: 'antidoping', college: true, ico: '🧪', title: '{P} positivo a un controllo',
    text: 'Positivo alla cannabis in un controllo a sorpresa: tre partite di squalifica. La notizia è già uscita.',
    cond: { phases: ['reg'], invented: true, minAge: 19 },
    choices: [
      { label: 'Scuse e programma di recupero', fx: { draftBoost: -2, rep: -0.5, mor: -3 } },
      { label: 'Contesta il test', fx: { odds: [0.3, { draftBoost: 1 }, { draftBoost: -6, rep: -1 }] } },
    ] },
  { id: 'booster', college: true, ico: '💸', title: 'Un tifoso ricco offre soldi a {P}',
    text: 'Un sostenitore del college gli ha offerto una macchina "in prestito". È vietato, e se si viene a sapere sono guai per tutti.',
    cond: { ncaa: true },
    choices: [
      { label: 'Fagli rifiutare e avvisa l\'università', fx: { rep: 1, draftBoost: 1, mor: -2 } },
      { label: 'Fai finta di non sapere niente', fx: { mor: 4, odds: [0.65, {}, { draftBoost: -6, rep: -2 }] } },
    ] },
  { id: 'apertura_alare', college: true, ico: '📏', title: 'Le misure di {P} sorprendono tutti',
    text: 'Alla Combine misurano un\'apertura di braccia di 8 centimetri più lunga della sua altezza. Alcune squadre lo rivalutano.',
    cond: { phases: ['po'] },
    choices: [{ label: 'Fai girare il video della misurazione', fx: { draftBoost: 3, hype: 5 } }] },
  { id: 'mock_draft', college: true, ico: '📊', title: '{P} nelle previsioni del Draft',
    text: 'Un famoso esperto lo mette tra i primi 10 della sua lista. Altri non sono d\'accordo.',
    choices: [
      { label: 'Fai girare la notizia', fx: { hype: 8, draftBoost: 2 } },
      { label: 'Tieni un profilo basso', fx: { mor: 2 } },
    ] },
  { id: 'esami', college: true, ico: '📚', title: 'Esami di fine semestre',
    text: 'Se non passa gli esami, il college lo esclude dalle partite per un mese.',
    cond: { ncaa: true },
    choices: [
      { label: 'Paga un tutor ($5k)', fx: { cash: -5, mor: 3 } },
      { label: 'Ce la farà da solo', fx: { odds: [0.6, { mor: 4 }, { draftBoost: -3, mor: -5 }] } },
    ] },
);

// Imprevisti "normali" che hanno senso anche per un ragazzo al college
const COLLEGE_OK = new Set(['tiktok', 'meme', 'tatuaggio_faccia', 'capelli_colore', 'cresta', 'rasato', 'treccine', 'fascia',
  'cane', 'scacchi', 'cucina', 'fan_tatuaggio', 'bambino', 'hater', 'hackerato', 'fake_news', 'gemello', 'alieni',
  'superstizione', 'robot', 'dieta', 'sonno', 'yoga', 'scuola', 'abbigliamento', 'baffi', 'catena', 'paparazzi', 'podcast']);

// Età minime perché un imprevisto sia credibile
const AGE_RULES = { matrimonio: 23, figlio: 22, immobili: 21, auto: 21, pizzeria: 22, autobiografia: 25, fondazione: 23,
  ambiente: 21, asta: 21, documentario: 21, capitano: 22, mentore: 0, cripto: 20, app: 20 };
for (const [id, a] of Object.entries(AGE_RULES)) {
  const e = EVENTS.find(x => x.id === id);
  if (e && a) e.cond = { ...(e.cond || {}), minAge: a };
}
// Imprevisti che hanno senso solo per chi gioca in una squadra
for (const id of ['vacanza', 'trasferta', 'immobili', 'allenamento_estivo', 'gara_schiacciate', 'tiro_da_tre', 'copertina']) {
  const e = EVENTS.find(x => x.id === id);
  if (e) e.cond = { ...(e.cond || {}), team: true };
}
