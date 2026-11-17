/* Super Agente NBA — gioco manageriale: sei un procuratore sportivo nel basket americano.
   Squadre e giocatori sono inventati. Tutto gira nel browser, salvataggio in localStorage. */
'use strict';

/* ================================================================== */
/* Utilità                                                             */
/* ================================================================== */
const SAVE_KEY = 'superAgenteNBA.save.v2';
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const chance = p => Math.random() < p;
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtM = m => '$' + r1(m).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
function fmt$(d) {
  const s = d < 0 ? '-' : ''; d = Math.abs(d);
  if (d >= 1e6) return s + '$' + (d / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 2 }) + 'M';
  if (d >= 1e3) return s + '$' + Math.round(d / 1e3).toLocaleString('it-IT') + 'k';
  return s + '$' + Math.round(d);
}

/* ================================================================== */
/* Costanti di gioco                                                   */
/* ================================================================== */
const CAP = 140;          // salary cap (milioni)
const MIN_SAL = 1.2;      // contratto minimo
const MID_LEVEL = 12;     // eccezione per squadre sopra il cap
const MAX_SAL = 50;
const REG_WEEKS = 20, FA_WEEKS = 3;
const TURNS_PER_YEAR = FA_WEEKS + REG_WEEKS + 2;
const SPONSOR_CUT = 0.15; // percentuale dell'agente sugli sponsor
const POS = ['PG', 'SG', 'SF', 'PF', 'C'];
const POS_IT = { PG: 'Playmaker', SG: 'Guardia', SF: 'Ala piccola', PF: 'Ala grande', C: 'Centro' };

const RIVALS = ['Apex Sports Group', 'Stellar Management', 'Prime Hoops Agency', 'Northline Talent'];
// TEAMS, BRANDS, CELEBS, STARS e VIP_PLAYERS sono in names.js; EVENTS in events.js; grafica in art.js
const COLLEGES = ['Univ. Bluewater', 'State Tech', 'Riverside College', 'Northern Pines', 'Coastal Univ.',
  'Lakeshore', 'Desert State', 'Mountain View U.', 'Ironwood College', 'Real Madrid B (Spagna)',
  'Olimpia Juniores (Italia)', 'Partizan Youth (Serbia)', 'ASVEL Espoirs (Francia)', 'G-League Ignite', 'Liceo Oak Ridge'];
const FIRST = ['Jalen', 'Marcus', 'Tyrese', 'DeShawn', 'Malik', 'Jordan', 'Caleb', 'Isaiah', 'Andre', 'Darius',
  'Trey', 'Kobe', 'Luca', 'Matteo', 'Nikola', 'Marko', 'Theo', 'Elijah', 'Cameron', 'Xavier', 'Brandon', 'Devin',
  'Zion', 'Amir', 'Jaylen', 'Omar', 'Tariq', 'Reggie', 'Kevin', 'Chris', 'Mason', 'Noah', 'Gabriel', 'Ousmane',
  'Lorenzo', 'Dante', 'Victor', 'Kai', 'Miles', 'Jamal', 'Terrence', 'Rashad', 'Quentin', 'Hugo', 'Aleksej', 'Pau'];
const LAST = ['Johnson', 'Williams', 'Carter', 'Brooks', 'Bennett', 'Harris', 'Coleman', 'Walker', 'Mitchell',
  'Rossi', 'Bianchi', 'Jovic', 'Petrovic', 'Diallo', 'Moreau', 'Okafor', 'Simmons', 'Hayes', 'Freeman', 'Reed',
  'Barnes', 'Fontana', 'Greene', 'Thompson', 'Wallace', 'Price', 'Holloway', 'Banks', 'Dalton', 'Ivanov', 'Silva',
  'Ndiaye', 'Morgan', 'Bryant', 'Kowalski', 'Ramirez', 'Lindqvist', 'Fischer', 'Okoro', 'Sullivan', 'Gatti', 'Marino'];

/* ================================================================== */
/* Stato                                                               */
/* ================================================================== */
let S = null; // stato di gioco

const P = id => S.players[id];
const clients = () => S.clients.map(P).filter(Boolean);
const teamOf = p => (p && p.team != null ? S.teams[p.team] : null);
const teamName = t => t ? `${t.city} ${t.name}` : '—';
const rosterOf = tid => Object.values(S.players).filter(p => p.team === tid && !p.retired);
const payroll = tid => rosterOf(tid).reduce((s, p) => s + p.salary, 0);
const isClient = p => S.clients.includes(p.id);
const seasonLabel = () => `${S.season}-${String((S.season + 1) % 100).padStart(2, '0')}`;
const capacity = () => 4 + S.staff.office * 3;

function newPlayer(kind) {
  const age = kind === 'prospect' ? randi(18, 22) : randi(21, 34);
  const p = {
    id: S.nextId++, name: `${pick(FIRST)} ${pick(LAST)}`, pos: pick(POS), age,
    ovr: 60, pot: 70, team: null, salary: 0, years: 0, comm: 3, morale: 70, hype: 10,
    agency: null, noise: gauss(), noise2: gauss(), teamNoise: gauss(), scouted: false,
    injury: 0, sponsors: [], refusals: 0, lockedUntil: 0, lastPitch: -1, lastContact: -1,
    gp: 0, pts: 0, reb: 0, ast: 0, school: null, rookieSeason: null,
    career: { titles: 0, allstar: 0, mvp: 0, roy: 0, seasons: 0 },
    num: pick(NUMBERS), look: genLook(), traits: genTraits(),
  };
  genBody(p);
  return p;
}
function growPot(p) {
  const room = Math.max(0, 27 - p.age);
  p.pot = clamp(Math.round(p.ovr + room * rand(0.6, 3.2)), p.ovr, 99);
}

/* Valore di mercato (stipendio annuo "giusto", in milioni) */
function marketValue(p) {
  let o = p.ovr;
  if (p.age < 25) o += (p.pot - p.ovr) * 0.15;
  if (p.age > 31) o -= (p.age - 31) * 1.3;
  const x = clamp((o - 58) / 37, 0, 1.15);
  return clamp(r1(MIN_SAL + 54 * Math.pow(x, 2.1)), MIN_SAL, MAX_SAL);
}

function scoutSD() { return Math.max(1.5, 9 - S.staff.scout * 1.5); }
function shownOvr(p) {
  if (p.team != null || isClient(p) || p.scouted || !p.school) return p.ovr;
  return clamp(Math.round(p.ovr + p.noise2 * scoutSD() * 0.5), 30, 99);
}
function shownPot(p) {
  if (!p.school) return p.pot;
  const k = isClient(p) || p.scouted ? 0.25 : 1;
  // se l'informatore ne sa più dello scout, vale la sua stima
  if (!isClient(p) && p.intelPot != null && p.intelSd < scoutSD() * k) return clamp(p.intelPot, shownOvr(p), 99);
  return clamp(Math.round(p.pot + p.noise * scoutSD() * k), shownOvr(p), 99);
}
const exact = p => isClient(p) || p.scouted || !p.school;
// valore come lo percepisci tu (per i prospetti si basa sulle stime dello scout)
const shownValue = p => exact(p) ? marketValue(p) : marketValue({ ...p, ovr: shownOvr(p), pot: shownPot(p) });

function newGame(agencyName, agentName) {
  S = {
    v: 2, namesV: 2, agency: agencyName || 'Hoop Dreams Agency', agent: agentName || 'Agente',
    cash: 300000, rep: 15, season: 2026, phase: 'fa', week: 1, turn: 0,
    staff: { scout: 0, legal: 0, marketing: 0, office: 0, informer: 0, hq: 0, academy: 0 }, intel: [],
    teams: TEAMS.map((t, i) => ({ id: i, city: t[0], name: t[1], abbr: t[2], market: t[3], color: t[4], color2: t[5], w: 0, l: 0 })),
    players: {}, clients: [], offers: [], inbox: [], news: [], nextId: 1, nextEv: 1,
    goals: {}, debtWeeks: 0, history: [], lastChampion: null, over: false,
    seasonIncome: 0, seasonExpense: 0, recentEv: [], tutorialDone: false, teamRel: {}, brandRel: {}, talks: {},
  };
  // squadre: prima le star (nomi parodia, nella loro squadra), poi giocatori inventati
  const slots = [84, 79, 76, 73, 71, 69, 67, 65, 63, 61, 59, 57, 55];
  for (const t of S.teams) {
    const boost = gauss() * 2.5;
    const stars = STARS.filter(x => x[1] === t.abbr);
    for (const [name, , pos, age, ovr, num] of stars) {
      const p = newPlayer('pro');
      Object.assign(p, { name, pos, age, ovr, num, team: t.id, star: true }); genBody(p);
      growPot(p);
      p.salary = clamp(r1(marketValue(p) * rand(0.9, 1.1)), MIN_SAL, MAX_SAL);
      p.years = randi(1, 4);
      p.agency = pick(RIVALS);
      p.hype = clamp(Math.round((ovr - 70) * 2.5), 10, 80);
      p.career.seasons = Math.max(0, age - 20);
      S.players[p.id] = p;
    }
    for (const base of slots.slice(stars.length)) {
      const p = newPlayer('pro');
      p.ovr = clamp(Math.round(base + boost + gauss() * 4), 45, 97);
      growPot(p);
      p.team = t.id;
      p.salary = clamp(r1(marketValue(p) * rand(0.75, 1.15)), MIN_SAL, MAX_SAL);
      p.years = randi(1, 4);
      p.agency = chance(0.85) ? pick(RIVALS) : null;
      p.career.seasons = Math.max(0, p.age - 21);
      S.players[p.id] = p;
    }
  }
  // free agent iniziali
  for (let i = 0; i < 45; i++) {
    const p = newPlayer('pro');
    p.ovr = clamp(Math.round(62 + gauss() * 6), 48, 82);
    growPot(p);
    p.agency = chance(0.6) ? pick(RIVALS) : null;
    p.career.seasons = Math.max(0, p.age - 21);
    S.players[p.id] = p;
  }
  // personaggi famosi che giocano: metà free agent, metà prospetti
  const vips = shuffle([...VIP_PLAYERS]);
  const kidName = vips.pop();
  vips.forEach((name, i) => {
    const p = newPlayer(i % 2 ? 'prospect' : 'pro');
    p.name = name; p.vip = true; p.hype = 35;
    if (i % 2) { p.ovr = randi(52, 66); p.pot = clamp(p.ovr + randi(8, 25), p.ovr + 3, 95); p.school = pick(COLLEGES); }
    else { p.ovr = randi(58, 74); growPot(p); p.career.seasons = Math.max(0, p.age - 21); }
    p.agency = chance(0.4) ? pick(RIVALS) : null;
    S.players[p.id] = p;
  });
  genDraftClass();
  // clienti iniziali
  const vet = newPlayer('pro');
  Object.assign(vet, { age: 26, ovr: 71, team: randi(0, 29), years: 2, comm: 3, morale: 75 });
  growPot(vet); vet.salary = r1(marketValue(vet)); vet.career.seasons = 4;
  S.players[vet.id] = vet; S.clients.push(vet.id);
  const kid = newPlayer('prospect');
  Object.assign(kid, { name: kidName, vip: true, hype: 35, age: 19, ovr: 56, pot: 78, comm: 3, morale: 80, school: pick(COLLEGES) });
  S.players[kid.id] = kid; S.clients.push(kid.id);

  addNews(`🏢 Nasce <b>${esc(S.agency)}</b>! Primi clienti: ${esc(vet.name)} e il giovane ${esc(kid.name)}.`, 'gold');
  addNews('📋 È iniziata la Free Agency: sfoglia il <b>Mercato</b> per firmare nuovi assistiti.');
  makeOffersForClientFAs();
  newChallenges();
  recInit();
  save();
}

function genDraftClass() {
  for (let i = 0; i < 72; i++) {
    const p = newPlayer('prospect');
    const tier = Math.random();
    p.ovr = clamp(Math.round((tier < 0.08 ? 66 : tier < 0.3 ? 60 : 54) + gauss() * 4), 42, 74);
    p.pot = clamp(Math.round(p.ovr + rand(6, 28) - (p.age - 19) * 2), p.ovr + 3, 99);
    p.school = pick(COLLEGES);
    p.agency = chance(0.3) ? pick(RIVALS) : null;
    S.players[p.id] = p;
  }
}

/* ================================================================== */
/* Notizie, eventi, salvataggio                                        */
/* ================================================================== */
function phaseLabel() {
  return { fa: `Free Agency · sett. ${S.week}/${FA_WEEKS}`, reg: `Stagione regolare · sett. ${S.week}/${REG_WEEKS}`,
    po: 'Playoff', draft: 'Draft' }[S.phase];
}
function addNews(text, cls = '') {
  S.news.unshift({ when: `${seasonLabel()} · ${phaseLabel()}`, text, cls });
  if (S.news.length > 80) S.news.length = 80;
}
function save() {
  if (!S) return;
  S.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage pieno o bloccato */ }
  Cloud.schedule();
}
// salvataggi vecchi: aggiorna i nomi parodia che sono stati cambiati
function fixNames() {
  if (!S || S.namesV >= 2) return;
  const fix = n => RENAMED[n] || n;
  for (const p of Object.values(S.players || {})) p.name = fix(p.name);
  const R = S.records;
  if (R) {
    for (const g of [R.game, R.season, R.era && R.era.game, R.era && R.era.season]) for (const r of Object.values(g || {})) if (r) r.name = fix(r.name);
    for (const r of R.retired || []) r.name = fix(r.name);
  }
  const re = new RegExp(Object.keys(RENAMED).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  for (const n of S.news || []) n.text = n.text.replace(re, m => RENAMED[m]);
  S.namesV = 2;
}
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { S = JSON.parse(raw); fixNames(); return true; } } catch (e) { /* ignora */ }
  return false;
}
function hasLocalSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

/* Salvataggio sul proprio account claude.ai, quando il gioco è aperto come Artifact.
   Fuori da claude.ai window.claude non esiste e resta solo il salvataggio locale. */
const Cloud = {
  doc: null, timer: null,
  async init() {
    if (!window.claude || !window.claude.use || typeof CompressionStream === 'undefined') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id();
      this.doc = db.collection('data/users/' + id).doc('partita2');
      const snap = await this.doc.get();
      const d = snap && snap.exists ? snap.data() : null;
      if (d && d.data && (!S || (d.savedAt || 0) > (S.savedAt || 0))) {
        S = JSON.parse(await gunzip(d.data)); fixNames();
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignora */ }
        UI.render();
      } else if (S) this.schedule();
    } catch (e) { this.doc = null; }
  },
  schedule() {
    if (!this.doc) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), 1500);
  },
  async push() {
    if (!this.doc || !S) return;
    try { await this.doc.set({ data: await gzip(JSON.stringify(S)), savedAt: S.savedAt, v: 1 }); } catch (e) { /* riprova al prossimo salvataggio */ }
  },
  async clear() { clearTimeout(this.timer); if (this.doc) try { await this.doc.delete(); } catch (e) { /* ignora */ } },
};
async function gzip(str) {
  const buf = new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gunzip(b64) {
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

/* ================================================================== */
/* Economia agenzia                                                    */
/* ================================================================== */
const STAFF = {
  scout: { name: 'Rete di scout', icon: '🔭', desc: 'Stime più precise sul potenziale dei prospetti e sconto sulle osservazioni.' },
  legal: { name: 'Ufficio legale', icon: '⚖️', desc: '+3% sul tetto massimo che le squadre sono disposte a pagare.' },
  marketing: { name: 'Marketing', icon: '📣', desc: '+10% valore sponsor e +3% probabilità di convincere nuovi clienti.' },
  office: { name: 'Uffici', icon: '🏢', desc: '+3 posti cliente per livello.' },
  hq: { name: 'Sede', icon: '🏙️', desc: 'Una sede più prestigiosa: +4% di probabilità che i giocatori accettino di incontrarti, e la tua reputazione cala più lentamente.' },
  academy: { name: 'Accademia giovanile', icon: '🎓', desc: 'Ogni estate forma dei ragazzi che arrivano al Draft già legati a te. Più è grande, più ne escono e più sono forti, e più spesso nasce un 💎 talento generazionale da trasformare in campione.' },
  informer: { name: 'Informatore', icon: '🕵️', desc: 'Ti passa soffiate sui prospetti del prossimo Draft: potenziale, chi vuole essere seguito, chi sta per firmare con un rivale. All\'inizio è scarso e a volte sbaglia.' },
};
const UPGRADE_COSTS = { hq: [250000, 700000, 1800000, 4500000, 10000000], academy: [400000, 1000000, 2500000, 5000000, 9000000] };
const upgradeCost = (lvl, k) => (UPGRADE_COSTS[k] || [60000, 150000, 320000, 650000, 1300000])[lvl] ?? Infinity;
// costi fissi: staff, sede, accademia e gestione dei clienti (dal quarto in poi)
// quanto aumentano le spese settimanali con un livello in più
const staffStep = k => ({ office: 4000, hq: 6000, academy: 5000 })[k] || 3000;
const weeklyCost = () => 6000 + 3000 * (S.staff.scout + S.staff.legal + S.staff.marketing + (S.staff.informer || 0)) + 4000 * S.staff.office
  + 6000 * (S.staff.hq || 0) + 5000 * (S.staff.academy || 0) + 1200 * Math.max(0, S.clients.length - 3);
function weeklyIncomeEstimate() {
  let inc = 0;
  for (const p of clients()) {
    if (p.team != null) inc += p.salary * 1e6 * p.comm / 100 / REG_WEEKS * (REG_WEEKS / TURNS_PER_YEAR);
    for (const sp of p.sponsors) inc += sp.value * 1e6 * SPONSOR_CUT / TURNS_PER_YEAR;
  }
  return inc;
}
function earn(amount, why) { S.cash += amount; S.seasonIncome += amount; }
function spend(amount) { S.cash -= amount; S.seasonExpense += amount; }
function changeRep(d) {
  if (d > 0) d *= Math.max(0.3, 1.2 - S.rep / 100); // più sei famoso, più è difficile crescere
  S.rep = clamp(r1(S.rep + d), 0, 100);
}

/* ================================================================== */
/* Squadre e partite                                                   */
/* ================================================================== */
function teamStrength(tid) {
  const r = rosterOf(tid).filter(p => !p.injury).map(p => p.ovr).sort((a, b) => b - a).slice(0, 8);
  if (!r.length) return 50;
  const w = [1.5, 1.35, 1.2, 1.05, 0.95, 0.75, 0.6, 0.5];
  let s = 0, ws = 0; r.forEach((o, i) => { s += o * w[i]; ws += w[i]; });
  return s / ws;
}
const winProb = (a, b) => 1 / (1 + Math.exp(-(a - b) / 3.2));

function pairRound() {
  const ids = shuffle(S.teams.map(t => t.id)), m = {};
  for (let i = 0; i < ids.length; i += 2) { m[ids[i]] = { opp: ids[i + 1], home: true }; m[ids[i + 1]] = { opp: ids[i], home: false }; }
  return m;
}
// Voto di una partita: punti, rimbalzi e assist pesati, più un bonus se si vince.
function gameGrade(pts, reb, ast, win) {
  const gs = pts + reb * 0.5 + ast * 0.7 + (win ? 3 : 0);
  const T = [[46, 'A+'], [39, 'A'], [34, 'A-'], [29, 'B+'], [24, 'B'], [20, 'B-'], [16, 'C+'], [12, 'C'], [9, 'C-'], [6, 'D']];
  for (const [v, g] of T) if (gs >= v) return g;
  return 'F';
}
const gradeClass = g => g[0] === 'A' ? 'ga' : g[0] === 'B' ? 'gb' : g[0] === 'C' ? 'gc' : 'gd';
function simWeekGames() {
  const str = S.teams.map(t => teamStrength(t.id));
  if (!S.nextRound) S.nextRound = pairRound();
  const rounds = [S.nextRound, pairRound(), pairRound(), pairRound()];
  const results = []; // per ogni giornata: { teamId: { opp, home, win, us, them } }
  for (const rd of rounds) {
    const res = {};
    for (const [a, g] of Object.entries(rd)) {
      if (!g.home) continue;
      const b = g.opp, ai = +a;
      const win = chance(winProb(str[ai] + 1, str[b]));
      const base = randi(98, 116), diff = randi(1, 18);
      const sa = win ? base + diff : base, sb = win ? base : base + diff;
      if (win) { S.teams[ai].w++; S.teams[b].l++; } else { S.teams[b].w++; S.teams[ai].l++; }
      res[ai] = { opp: b, home: true, win, us: sa, them: sb };
      res[b] = { opp: ai, home: false, win: !win, us: sb, them: sa };
    }
    results.push(res);
  }
  S.nextRound = pairRound(); // il primo avversario della prossima settimana
  // statistiche individuali
  recInit();
  for (const p of clients()) p.week = null;
  const MIN = [34, 33, 31, 29, 27, 24, 20, 16, 12, 8, 5, 3, 2, 1, 1];
  for (const t of S.teams) {
    const r = rosterOf(t.id).filter(p => !p.injury).sort((a, b) => b.ovr - a.ovr);
    r.forEach((p, i) => {
      const m = MIN[i] ?? 0; if (!m) return;
      const f = m / 36, q = Math.max(1, p.ovr - 40);
      const rebK = { PG: .07, SG: .09, SF: .13, PF: .2, C: .24 }[p.pos];
      const astK = { PG: .2, SG: .11, SF: .09, PF: .06, C: .05 }[p.pos];
      const mine = isClient(p);
      if (mine) p.week = [];
      for (let g = 0; g < 4; g++) {
        const g2 = results[g][t.id];
        // minuti: variano partita per partita (falli, partite già decise, supplementari)
        const blow = Math.abs(g2.us - g2.them) >= 18;
        const mins = clamp(Math.round(m * (1 + gauss() * 0.12) * (blow ? (i < 5 ? 0.85 : 1.6) : 1) + (chance(0.04) ? 5 : 0)), 0, 48);
        if (!mins) continue;
        if (chance(p.age >= 31 ? 0.12 : 0.07)) continue; // riposo o acciacco: salta la partita
        const fg = mins / 36;
        let form = 1 + gauss() * 0.22;
        if (i < 3 && chance(0.012)) form *= rand(1.4, 1.9); // serata di grazia: può nascere un record
        const pts = Math.max(0, Math.round(q * 0.53 * fg * form));
        const reb = Math.max(0, Math.round(q * rebK * fg * (1 + gauss() * .25)));
        const ast = Math.max(0, Math.round(q * astK * fg * (1 + gauss() * .25)));
        p.gp++; p.min = (p.min || 0) + mins; p.pts += pts; p.reb += reb; p.ast += ast;
        p.cgp = (p.cgp || 0) + 1; p.cpts = (p.cpts || 0) + pts; p.creb = (p.creb || 0) + reb; p.cast = (p.cast || 0) + ast;
        recGame(p, t, pts, reb, ast);
        if (mine) p.week.push({ opp: g2.opp, home: g2.home, win: g2.win, us: g2.us, them: g2.them, min: mins, pts, reb, ast, grade: gameGrade(pts, reb, ast, g2.win) });
      }
      if (mine && !p.week.length) p.week = null;
      if (mine && p.week) p.last = p.week[p.week.length - 1];
    });
  }
}
const teamRank = tid => standings().findIndex(t => t.id === tid) + 1;
function nextGameTxt(p) {
  if (p.team == null || !S.nextRound || S.phase !== 'reg') return null;
  const g = S.nextRound[p.team]; if (!g) return null;
  return `${g.home ? 'vs' : '@'} ${S.teams[g.opp].name}`;
}
const avg = (p, k) => p.gp ? p[k] / p.gp : 0;
const statLine = p => p.gp ? `${r1(avg(p, 'min'))} min · ${r1(avg(p, 'pts'))} pt · ${r1(avg(p, 'reb'))} rb · ${r1(avg(p, 'ast'))} as` : 'nessuna partita';
const winPct = t => (t.w + t.l) ? t.w / (t.w + t.l) : 0.5;
const standings = () => [...S.teams].sort((a, b) => winPct(b) - winPct(a) || b.w - a.w);
const playerScore = p => p.ovr + avg(p, 'pts') * 0.45 + (teamOf(p) ? winPct(teamOf(p)) * 12 : 0);

/* ================================================================== */
/* Free agency e offerte                                               */
/* ================================================================== */
function affordable(tid) {
  const pr = payroll(tid), room = CAP - pr;
  if (room >= MIN_SAL) return room;
  return pr < CAP + 25 ? MID_LEVEL : MIN_SAL;
}
function preferredYears(p) {
  return p.age <= 24 ? randi(3, 5) : p.age <= 29 ? randi(2, 4) : p.age <= 32 ? randi(1, 3) : randi(1, 2);
}
function makeOffersFor(p, n, fromTeam = null, ext = fromTeam != null) {
  const val = marketValue(p);
  const existing = new Set(S.offers.filter(o => o.pid === p.id).map(o => o.teamId));
  let teams = fromTeam != null ? [S.teams[fromTeam]] :
    shuffle(S.teams.filter(t => rosterOf(t.id).length < 15 && !existing.has(t.id))).sort((a, b) => stakeOf(b.id) - stakeOf(a.id));
  let made = 0;
  for (const t of teams) {
    if (made >= n) break;
    // solo i rinnovi possono superare il tetto salariale (come i "diritti Bird"); le altre offerte lo rispettano
    // soglia massima: per rinnovare si può superare il tetto salariale, ma non oltre $180M di monte ingaggi
    const APRON = CAP + 40;
    const room = fromTeam != null && ext
      ? Math.max(affordable(t.id), Math.min(p.salary * 1.3, APRON - (payroll(t.id) - (p.team === t.id ? p.salary : 0))))
      : affordable(t.id) - pendingOffers(t.id); // conta anche i soldi già promessi in altre offerte
    const rel = teamRel(t.id);
    if (fromTeam == null && rel < 25 && chance(0.6)) continue; // con te non vogliono trattare
    const max = r1(Math.min(val * rand(0.95, 1.22) * (1 + S.staff.legal * 0.03) * (1 + (rel - 50) / 500) * (1 + stakeOf(t.id) / 400), room, MAX_SAL));
    if (max < MIN_SAL) continue;
    const salary = r1(Math.max(MIN_SAL, max * rand(0.68, 0.9)));
    S.offers.push({ id: S.nextEv++, pid: p.id, teamId: t.id, salary, years: preferredYears(p),
      max, patience: 3 + (rel >= 70 ? 1 : 0) - (rel < 30 ? 1 : 0), ext, expires: S.turn + (ext ? 4 : randi(1, 3)) });
    made++;
  }
  return made;
}
function offersCountFor(p) {
  const o = p.ovr;
  return o >= 82 ? randi(3, 5) : o >= 74 ? randi(2, 4) : o >= 66 ? randi(1, 3) : randi(0, 2);
}
function makeOffersForClientFAs() {
  for (const p of clients()) {
    if (p.team != null || p.school || p.retired) continue;
    const n = makeOffersFor(p, offersCountFor(p));
    if (n) addNews(`📨 ${n} nuov${n > 1 ? 'e offerte' : 'a offerta'} per <b>${esc(p.name)}</b>. Vai a negoziare dalla scheda Clienti.`);
  }
}

function signContract(p, teamId, salary, years) {
  // rinnovo: gli anni nuovi partono dopo quello in corso
  if (p.team === teamId && p.years > 0) years += p.years;
  const newcomer = p.team !== teamId;
  p.team = teamId; p.salary = clamp(r1(salary), MIN_SAL, MAX_SAL); p.years = years; p.school = null;
  // rosa piena: la squadra taglia il giocatore più debole (mai un tuo cliente)
  if (newcomer) {
    const r = rosterOf(teamId);
    if (r.length > 15) {
      const cut = r.filter(x => x.id !== p.id && !isClient(x)).sort((a, b) => a.ovr - b.ovr)[0];
      if (cut) { cut.team = null; cut.years = 0; }
    }
  }
  S.offers = S.offers.filter(o => o.pid !== p.id);
  if (isClient(p)) {
    const val = marketValue(p);
    const [fit, why] = teamFit(p, teamId, salary);
    let yrsNote = '';
    if (p.age >= 30 && years <= 1) { p.morale -= 6; yrsNote = ' Avrebbe voluto più sicurezza.'; }
    if (hasTrait(p, 'ambizioso') && p.age <= 25 && years >= 4) { p.morale -= 4; yrsNote = ' Avrebbe preferito un contratto corto per guadagnare di più dopo.'; }
    p.morale = clamp(Math.round(p.morale + 10 + (salary / val - 1) * 40 + fit * 12), 0, 100);
    p.signMood = `${PREFS[prefOf(p)][0]} ${fit >= 0.6 ? 'Felice' : fit >= 0 ? 'Abbastanza contento' : 'Non è contento'}: ${why}.${yrsNote}`;
    changeRep(clamp(salary / 12, 0.2, 3));
    changeTeamRel(teamId, 4);
    addNews(`✍️ <b>${esc(p.name)}</b> firma con i ${esc(teamName(S.teams[teamId]))}: ${fmtM(salary)} × ${years} ann${years > 1 ? 'i' : 'o'}. ` +
      `Commissione: ${fmt$(salary * 1e6 * p.comm / 100)}/anno. ${esc(p.signMood)}`, 'good');
    checkGoal('bigdeal', salary >= 30);
  }
}

function negotiate(offerId, ask, years) {
  const o = S.offers.find(x => x.id === offerId); if (!o) return { msg: 'Offerta non più disponibile.' };
  const p = P(o.pid);
  if (o.final && ask > o.salary) return { msg: 'È la loro offerta finale: prendere o lasciare.' };
  const eff = o.max * (1 - Math.abs(years - o.years) * 0.04);
  if (ask <= eff) { if (!offerAffordable(o, ask)) return budgetGone(o); signContract(p, o.teamId, ask, years); return { done: true, msg: `Accordo raggiunto a ${fmtM(ask)} × ${years}!` }; }
  if (ask <= eff * 1.12) {
    o.salary = r1(Math.min(eff, Math.max(o.salary + 0.1, (o.salary + eff) / 2 + rand(-0.3, 0.3))));
    o.years = years; o.patience--; changeTeamRel(o.teamId, -1);
    if (o.patience <= 0) return withdraw(o);
    return { msg: `La squadra rilancia: ${fmtM(o.salary)} × ${o.years}. Pazienza in calo.` };
  }
  o.patience -= 2; changeTeamRel(o.teamId, -3);
  if (o.patience <= 0) return withdraw(o);
  return { msg: 'Richiesta fuori mercato: il GM si irrigidisce.' };
}
function withdraw(o) {
  S.offers = S.offers.filter(x => x.id !== o.id);
  const p = P(o.pid);
  p.morale = clamp(p.morale - 6, 0, 100);
  changeTeamRel(o.teamId, -5);
  addNews(`🚪 I ${esc(teamName(S.teams[o.teamId]))} ritirano l'offerta per ${esc(p.name)}.`, 'bad');
  return { done: true, msg: 'La squadra ha abbandonato la trattativa.' };
}
// Soldi già promessi da una squadra in offerte ancora aperte (rinnovi esclusi)
const pendingOffers = (tid, except = null) => S.offers.filter(o => o.teamId === tid && !o.ext && o.id !== except).reduce((s, o) => s + o.salary, 0);
// Al momento della firma la squadra ricontrolla di avere ancora spazio salariale
function offerAffordable(o, salary) {
  if (o.ext) return true;
  return salary <= Math.max(affordable(o.teamId), MIN_SAL) + 0.05;
}
function budgetGone(o) {
  S.offers = S.offers.filter(x => x.id !== o.id);
  const t = S.teams[o.teamId];
  addNews(`💸 I ${esc(teamName(t))} hanno speso il budget con altre firme e ritirano l'offerta per ${esc(P(o.pid).name)}.`, 'warn');
  return { done: true, msg: `I ${t.name} non hanno più spazio salariale: offerta ritirata.` };
}
function acceptOffer(offerId) {
  const o = S.offers.find(x => x.id === offerId); if (!o) return;
  if (!offerAffordable(o, o.salary)) return budgetGone(o);
  signContract(P(o.pid), o.teamId, o.salary, o.years);
  return { done: true };
}

function aiFreeAgency(prob) {
  const fas = Object.values(S.players).filter(p => p.team == null && !p.school && !p.retired && !isClient(p))
    .sort((a, b) => b.ovr - a.ovr);
  for (const p of fas) {
    if (!chance(prob)) continue;
    const val = marketValue(p);
    const cands = S.teams.map(t => ({ t, room: affordable(t.id), n: rosterOf(t.id).length }))
      .filter(c => c.n < 15 && c.room >= Math.min(val * 0.8, MID_LEVEL) || (c.n < 13 && c.room >= MIN_SAL));
    if (!cands.length) continue;
    cands.sort((a, b) => a.n - b.n + rand(-2, 2));
    const c = cands[0];
    signContract(p, c.t.id, Math.max(MIN_SAL, Math.min(val * rand(0.85, 1.05), c.room)), preferredYears(p));
  }
}
function fillRosters() {
  for (const t of S.teams) {
    let n = rosterOf(t.id).length;
    while (n < 13) {
      const fa = Object.values(S.players).filter(p => p.team == null && !p.school && !p.retired && !isClient(p))
        .sort((a, b) => b.ovr - a.ovr)[0];
      if (fa) signContract(fa, t.id, MIN_SAL, 1);
      else {
        const p = newPlayer('pro'); p.ovr = randi(50, 60); growPot(p);
        p.team = t.id; p.salary = MIN_SAL; p.years = 1; p.agency = pick(RIVALS); S.players[p.id] = p;
      }
      n++;
    }
  }
}

/* ================================================================== */
/* Reclutamento                                                        */
/* ================================================================== */
/* ================================================================== */
/* Trattativa con un giocatore per diventare il suo agente             */
/* 1) gli chiedi un incontro: accetta solo se pensa che tu possa       */
/*    rappresentarlo; 2) offri commissione e bonus alla firma, lui     */
/*    risponde con una controfferta; 3) se tiri troppo perde pazienza. */
/* ================================================================== */
function starPower(p) { return p.school ? Math.max(p.ovr, (p.ovr + p.pot) / 2) : p.ovr; }
function pitchCost(p) { return Math.round(Math.max(1500, (starPower(p) - 50) * 450) / 100) * 100; }
// Probabilità che accetti di sedersi al tavolo: è qui che i campioni sono difficili
function openChance(p) {
  let c = 0.55 + (S.rep - (starPower(p) - 55) * 1.6) / 80 + S.staff.marketing * 0.03 + (S.staff.hq || 0) * 0.04 + (p.bond || 0) / 150;
  if (p.agency) c -= 0.15;
  c -= p.refusals * 0.12;
  return clamp(c, 0.03, 0.97);
}
const roundHalf = v => Math.round(v * 2) / 2;
const r5 = v => Math.round(v / 5) * 5;
// Cosa vuole davvero (segreto). Tutti stanno nella norma (2-4%): i campioni trattano un po' più duro e
// chiedono un bonus alla firma più alto; contano reputazione, legame e carattere, più un po' di umore del giorno.
function talkWants(p) {
  const st = starPower(p), bond = p.bond || 0, greedy = hasTrait(p, 'avido');
  const comm = clamp(roundHalf(3 - Math.max(0, st - 75) / 25 + (S.rep - 40) / 80 + bond / 100 - (greedy ? 0.5 : 0) + pick([-0.5, 0, 0, 0.5])), 2, 4);
  const bonus = Math.max(0, r5(Math.max(0, st - 62) * 9 * (1 - bond / 150) * (p.agency ? 1.3 : 1) * (greedy ? 1.3 : 1)));
  return { comm, bonus };
}
// Promesse: valgono come moneta in trattativa, ma vanno mantenute entro fine stagione regolare
const PROMISES = {
  sponsor: { label: 'Gli trovo uno sponsor entro fine stagione', value: 14, likes: ['avido', 'vanitoso', 'festaiolo'] },
  contender: { label: 'Lo porto in una squadra da playoff', value: 14, likes: ['ambizioso', 'leader', 'professionista'] },
  camp: { label: 'Gli pago un camp con una leggenda quest\'anno', value: 10, likes: ['professionista', 'ambizioso'] },
};
// Si può davvero mantenere? Un ragazzo del college non può giocare in una squadra da playoff prima del Draft,
// e nessun marchio sponsorizza un giocatore troppo debole o ancora al college.
const promiseFeasible = (p, k) => k === 'camp' || (!p.school && (k === 'contender' || p.ovr >= 62));
const promiseValue = (p, keys) => keys.reduce((s, k) => s + PROMISES[k].value * (PROMISES[k].likes.some(t => hasTrait(p, t)) ? 1.6 : 1), 0);
function startTalk(pid) {
  const p = P(pid);
  if (clients().length >= capacity()) return { msg: 'Hai raggiunto il limite di clienti: amplia gli uffici.', type: 'bad' };
  if (S.talks[pid]) return { ok: true };
  if (p.lastPitch === S.turn) return { msg: 'Ti ha già detto di no questa settimana. Riprova la prossima.', type: 'warn' };
  if (p.lockedUntil > S.season) return { msg: 'Non vuole più sentirti fino alla prossima stagione.', type: 'bad' };
  const cost = pitchCost(p);
  if (S.cash < cost) return { msg: `Per organizzare l'incontro servono ${fmt$(cost)}.`, type: 'bad' };
  spend(cost); p.lastPitch = S.turn;
  if (!chance(openChance(p))) {
    p.refusals++;
    if (p.refusals >= 3) p.lockedUntil = S.season + 1;
    return { msg: `${p.name} non crede che tu possa rappresentarlo. ${p.refusals >= 3 ? 'Per un po\' non vuole più sentirti.' : 'Riprova più avanti.'}`, type: 'bad' };
  }
  const w = talkWants(p);
  const patience = clamp(3 + Math.floor((p.bond || 0) / 35) + (S.rep >= 60 ? 1 : 0) - (p.agency ? 1 : 0), 2, 5);
  // la prima richiesta è più dura di quello che accetterebbe davvero
  // quanto parte basso è imprevedibile: così non si può indovinare il suo limite a colpo sicuro
  const ask = { comm: Math.max(1.5, w.comm - pick([0.5, 1, 1, 1.5])), bonus: r5(w.bonus * rand(1.2, 1.5)) };
  S.talks[pid] = { want: w, ask, patience, max: patience, turn: S.turn, log: [`🤝 Ha accettato di incontrarti. Chiede ${talkTxt(ask)}.`] };
  return { ok: true };
}
const talkTxt = o => `${o.comm}% di commissione${o.bonus ? ` + $${o.bonus}k alla firma` : ''}`;
// Probabilità che un'agenzia rivale si intrometta a ogni giro di trattativa
const rivalCut = p => 0.12 + (p.agency ? 0.08 : 0) + (starPower(p) >= 80 ? 0.08 : 0);
function talkOffer(pid, comm, bonus, promises = []) {
  const p = P(pid), t = S.talks[pid]; if (!t) return;
  promises = promises.filter(k => promiseFeasible(p, k));
  comm = clamp(roundHalf(comm), 1, 4); bonus = Math.max(0, Math.round(bonus));
  if (bonus * 1000 > S.cash) return { msg: `Non hai $${bonus}k da dare alla firma.`, type: 'bad' };
  t.log.push(`➡️ Offri ${talkTxt({ comm, bonus })}${promises.length ? ` e prometti: ${promises.map(k => PROMISES[k].label.toLowerCase()).join(', ')}` : ''}.`);
  // quanto è lontana l'offerta da ciò che vuole davvero (le promesse accorciano la distanza)
  const gap = Math.max(0, comm - t.want.comm) * 30 + Math.max(0, t.want.bonus - bonus) / Math.max(20, t.want.bonus) * 30 - promiseValue(p, promises);
  if (gap <= 0) return talkSign(pid, comm, bonus, promises);
  t.patience -= gap > 30 ? 2 : 1;
  // se superi il suo limite può alzarsi e andarsene: più lo superi, più è probabile
  const walk = clamp(Math.max(0, comm - t.want.comm) / 0.5 * 0.2 + (bonus < t.want.bonus ? 0.05 : 0), 0, 0.6);
  if (t.patience > 0 && chance(walk)) t.patience = 0;
  if (t.patience <= 0) {
    delete S.talks[pid];
    p.refusals++; p.bond = Math.max(0, (p.bond || 0) - 10);
    if (p.refusals >= 3) p.lockedUntil = S.season + 1;
    addNews(`🚪 ${esc(p.name)} ha chiuso la trattativa con te.`, 'bad');
    return { msg: `${p.name} si è stancato e ha chiuso la trattativa.`, type: 'bad', done: true };
  }
  let mood;
  if (gap > 30) {
    // tirare troppo la corda lo irrigidisce: ora chiede di più
    t.ask = { comm: Math.max(1.5, t.ask.comm - 0.5), bonus: r5(t.ask.bonus * 1.1) };
    t.want = { comm: Math.max(1.5, t.want.comm - 0.5), bonus: r5(t.want.bonus * 1.1) };
    mood = '😠 L\'offerta lo ha offeso: ora chiede di più.';
  } else {
    // si avvicina a te, ma mai oltre quello che vuole davvero
    t.ask = { comm: Math.max(t.ask.comm, Math.min(t.want.comm, roundHalf((t.ask.comm + comm) / 2))), bonus: Math.min(t.ask.bonus, Math.max(t.want.bonus, r5((t.ask.bonus + bonus) / 2))) };
    mood = '🤔 Ci pensa.';
  }
  // un'agenzia rivale si intromette
  if (chance(rivalCut(p))) {
    const r = pick(RIVALS);
    t.ask = { comm: Math.max(1.5, t.ask.comm - 0.5), bonus: t.ask.bonus };
    t.want = { comm: Math.max(1.5, t.want.comm - 0.5), bonus: t.want.bonus };
    t.log.push(`🦈 ${r} gli ha offerto condizioni migliori. Ora vuole pagare meno commissione.`);
  }
  t.log.push(`⬅️ ${mood} Controfferta: ${talkTxt(t.ask)}.`);
  return { msg: `Controfferta: ${talkTxt(t.ask)}`, type: gap > 30 ? 'warn' : 'info' };
}
function talkAcceptAsk(pid) { const t = S.talks[pid]; if (!t) return; if (t.ask.bonus * 1000 > S.cash) return { msg: `Non hai $${t.ask.bonus}k da dare alla firma.`, type: 'bad' }; return talkSign(pid, t.ask.comm, t.ask.bonus, []); }
function talkSign(pid, comm, bonus, promises = []) {
  const p = P(pid);
  delete S.talks[pid];
  if (clients().length >= capacity()) return { msg: 'Non hai più posti in agenzia.', type: 'bad', done: true };
  if (bonus) spend(bonus * 1000);
  p.comm = comm; p.agency = S.agency; p.morale = clamp(60 + Math.round((p.bond || 0) / 4) + (bonus ? 8 : 0), 0, 100); p.scouted = true;
  S.clients.push(p.id);
  changeRep(clamp((p.ovr - 60) / 15, 0.1, 2));
  // promesse da mantenere entro fine stagione regolare
  // promessa fatta tardi (dopo metà stagione regolare): c'è tempo fino alla fine della prossima
  const pSeason = S.phase === 'po' || S.phase === 'draft' || (S.phase === 'reg' && S.week > REG_WEEKS / 2) ? S.season + 1 : S.season;
  p.promises = promises.map(k => ({ k, season: pSeason, base: p.sponsorCount || 0 }));
  chalUpdate('sign', p.ovr, 'max');
  addNews(`🤝 <b>${esc(p.name)}</b> (${p.pos}, ${p.ovr}) è il tuo nuovo assistito! Commissione ${comm}%${bonus ? `, bonus alla firma $${bonus}k` : ''}${promises.length ? `. Gli hai promesso: ${promises.map(k => PROMISES[k].label.toLowerCase()).join(', ')}` : ''}.`, 'good');
  if (p.team == null && !p.school && S.phase === 'fa') {
    const n = makeOffersFor(p, offersCountFor(p));
    if (n) addNews(`📨 Già ${n} offert${n > 1 ? 'e' : 'a'} per ${esc(p.name)}!`);
  }
  checkGoals();
  return { msg: `${p.name} ha firmato con la tua agenzia: ${comm}%${bonus ? ` e $${bonus}k alla firma` : ''}.`, type: 'good', done: true };
}
function talkQuit(pid) { delete S.talks[pid]; }
function scout(pid) {
  const p = P(pid), cost = Math.max(1000, 3000 - S.staff.scout * 400);
  if (S.cash < cost) return 'Fondi insufficienti.';
  spend(cost); p.scouted = true;
  return `Rapporto dello scout su ${p.name}: OVR ${shownOvr(p)}, potenziale ~${shownPot(p)}.`;
}
function releaseClient(pid) {
  const p = P(pid);
  S.clients = S.clients.filter(id => id !== pid);
  S.offers = S.offers.filter(o => o.pid !== pid);
  S.inbox = S.inbox.filter(e => e.pid !== pid);
  p.agency = pick(RIVALS); p.refusals = 3; p.lockedUntil = S.season + 2;
  changeRep(-1);
  addNews(`👋 Hai lasciato andare ${esc(p.name)}.`, 'bad');
}
function contact(pid) {
  const p = P(pid);
  if (p.lastContact === S.turn) return 'Lo hai già sentito questa settimana.';
  p.lastContact = S.turn; p.morale = clamp(p.morale + randi(4, 9), 0, 100);
  return pick([`Cena con ${p.name}: è di ottimo umore.`, `Lunga telefonata con ${p.name}. Si sente seguito.`,
    `Hai assistito all'allenamento di ${p.name}.`, `Hai portato ${p.name} a un evento benefico.`]);
}

/* ================================================================== */
/* Eventi settimanali dei clienti                                      */
/* ================================================================== */
function sponsorChance(p) { return clamp(0.2 + (p.ovr - 62) / 40 + p.hype / 200 + S.staff.marketing * 0.06, 0.1, 0.9); }
function seekSponsor(pid) {
  const p = P(pid);
  if (p.school || p.ovr < 62) return { msg: 'I marchi non sono ancora interessati a lui: deve crescere (almeno 62 di valutazione).', type: 'warn' };
  if (p.sponsors.length >= 4) return { msg: 'Ha già 4 sponsor.', type: 'warn' };
  if (S.turn - (p.lastSponsorTry ?? -99) < 4) return { msg: `Hai già bussato alle porte dei marchi per lui: riprova tra ${4 - (S.turn - p.lastSponsorTry)} settimane.`, type: 'warn' };
  if (S.cash < 10000) return { msg: 'Servono $10k per le presentazioni.', type: 'bad' };
  spend(10000); p.lastSponsorTry = S.turn;
  if (!chance(sponsorChance(p))) return { msg: `Nessun marchio ha detto sì per ${p.name}, per ora.`, type: 'bad' };
  const brand = pick(BRANDS.filter(b => !p.sponsors.some(x => x.brand === b)));
  const value = r1(sponsorValue(p) * (0.8 + brandRel(brand) / 250) * rand(0.8, 1));
  p.sponsors.push({ brand, value, years: randi(1, 3) }); p.sponsorCount = (p.sponsorCount || 0) + 1;
  changeBrandRel(brand, 3); checkGoal('sponsor', true); chalUpdate('sponsors', 1);
  addNews(`💼 Hai trovato uno sponsor a ${esc(p.name)}: ${esc(brand)}, ${fmtM(value)} l'anno.`, 'good');
  return { msg: `${brand} sponsorizza ${p.name}: ${fmtM(value)} l'anno (tua quota ${fmt$(value * 1e6 * SPONSOR_CUT)}).`, type: 'good' };
}
function sponsorValue(p) {
  const t = teamOf(p), mkt = t ? t.market : 0.3;
  const base = Math.pow(clamp((p.ovr - 60) / 33, 0.03, 1.2), 2) * 5;
  return r1(Math.max(0.1, base * (0.7 + mkt * 0.6) * (1 + p.hype / 100) * (1 + S.staff.marketing * 0.08)));
}
function moraleDrift() {
  for (const p of clients()) {
    let d = 0;
    const t = teamOf(p);
    if (t) {
      d += (winPct(t) - 0.5) * 3;
      const ratio = p.salary / marketValue(p);
      if (ratio < 0.7) d -= 1.5;
      if (ratio > 1.1) d += 0.5;
    } else if (!p.school && S.phase === 'reg') d -= 3; // disoccupato
    d += (65 - p.morale) * 0.03; // ritorno verso la media
    p.morale = clamp(Math.round(p.morale + d), 0, 100);
  }
}

/* Imprevisti: non ogni settimana, e mai uno per ogni cliente. Più clienti hai, più è probabile che succeda qualcosa. */
function condOk(e, p) {
  const c = e.cond || {}, t = p ? teamOf(p) : null;
  if (!p) return !!e.any;
  if (e.any) return false;
  if (p.school ? !(e.college || COLLEGE_OK.has(e.id)) : e.college) return false; // al college solo imprevisti da college
  if (c.minAge && p.age < c.minAge) return false;
  if (c.maxAge && p.age > c.maxAge) return false;
  if (c.invented && (p.vip || p.star)) return false; // i fatti più pesanti solo per giocatori inventati
  if (c.team && !t) return false;
  if (c.healthy && p.injury) return false;
  if (c.inj && !p.injury) return false;
  if (c.ovr && p.ovr < c.ovr) return false;
  if (c.max && p.ovr > c.max) return false;
  if (c.star && p.ovr < 80) return false;
  if (c.young && p.age > 23) return false;
  if (c.vet && p.age < 31) return false;
  if (c.losing && (!t || t.w + t.l < 8 || winPct(t) >= 0.4)) return false;
  if (c.winning && (!t || t.w + t.l < 8 || winPct(t) <= 0.6)) return false;
  if (c.lowMor && p.morale >= 40) return false;
  if (c.sponsor && !p.sponsors.length) return false;
  const fxs = e.choices.map(ch => ch.fx);
  const has = k => fxs.some(f => f[k] || (f.odds && (f.odds[1][k] || f.odds[2][k])));
  if (has('sponsor') && (p.ovr < 60 || p.sponsors.length >= 4)) return false;
  return true;
}
function fillText(t, d) {
  return t.replace(/\{P\}/g, d.p || '').replace(/\{P1\}/g, (d.p || '').split(' ').pop()).replace(/\{T\}/g, d.t || '')
    .replace(/\{C\}/g, d.c).replace(/\{B\}/g, d.b).replace(/\{R\}/g, d.r).replace(/\{N\}/g, d.n)
    .replace(/\{age\}/g, d.age ?? '').replace(/\{num\}/g, d.num ?? '').replace(/\{TD\}/g, d.td || '');
}
// Quanto vale un giocatore per media e marchi: i guadagni degli imprevisti si adattano al suo livello.
function fameMult(p) { return p ? clamp(0.3 + (p.ovr - 60) / 22 + p.hype / 110, 0.25, 3) : 1; }

/* ---------- Rapporti ---------- */
const teamRel = tid => tid == null ? 50 : (S.teamRel[tid] ?? 50);
const brandRel = b => S.brandRel[b] ?? 50;
function changeTeamRel(tid, d) { if (tid == null || !d) return; S.teamRel[tid] = clamp(Math.round(teamRel(tid) + d), 0, 100); }
function changeBrandRel(b, d) { if (!b || !d) return; S.brandRel[b] = clamp(Math.round(brandRel(b) + d), 0, 100); }
function relLabel(v) { return v >= 75 ? '😄 ottimo' : v >= 60 ? '🙂 buono' : v >= 40 ? '😐 neutro' : v >= 25 ? '😒 freddo' : '😠 pessimo'; }
function relOf(who, inst, p) {
  if (who === 'player') return p ? p.morale : 50;
  if (who === 'team') return p ? teamRel(p.team) : 50;
  if (who === 'brand') return brandRel(inst.data.b);
  return clamp(30 + S.rep * 0.6, 0, 100); // personaggi esterni: conta la tua reputazione
}
const WHO_TXT = { player: 'il giocatore', team: 'la squadra', brand: 'lo sponsor', other: 'loro' };
// Probabilità che la controparte accetti: base della scelta, corretta dal rapporto (±35 punti).
function askProb(base, who, inst, p) { return clamp(base + (relOf(who, inst, p) - 50) / 100 * 0.7, 0.05, 0.95); }

function createEvent(e, p) {
  const leagueNames = new Set(Object.values(S.players).map(x => x.name));
  const others = Object.values(S.players).filter(x => x.team != null && !isClient(x) && x.ovr >= 80 && (!p || x.id !== p.id));
  // un personaggio famoso non compare mai nell'imprevisto di sé stesso, né se gioca nella lega
  const pool = e.celeb && CELEB_KIND[e.celeb] ? CELEB_KIND[e.celeb] : CELEBS;
  const celebs = pool.filter(c => !leagueNames.has(c) && (!p || c !== p.name));
  const d = {
    p: p ? p.name : '', t: p && teamOf(p) ? teamName(teamOf(p)) : '', c: pick(celebs.length ? celebs : CELEBS.filter(c => !leagueNames.has(c))), r: pick(RIVALS),
    n: others.length ? pick(others).name : 'un avversario', age: p ? p.age : '', num: p ? p.num : '',
    b: pick(BRANDS.filter(b => !p || !p.sponsors.some(s => s.brand === b))), mult: r1(fameMult(p)), td: teamName(pick(S.teams)),
  };
  if (e.cond && e.cond.sponsor && p) d.b = pick(p.sponsors).brand;
  // il valore dello sponsor dipende dal livello del giocatore e dal rapporto col marchio
  if (p) { d.value = r1(sponsorValue(p) * (0.8 + brandRel(d.b) / 250)); d.years = randi(1, 3); }
  S.inbox.push({ id: S.nextEv++, ev: e.id, rare: !!e.rare, pid: p ? p.id : null, ico: e.ico, title: fillText(e.title, d), text: fillText(e.text, d), data: d });
  S.recentEv.push(e.id);
  if (S.recentEv.length > 45) S.recentEv.shift();
  if (p) p.lastEv = S.turn;
}
// Il carattere pesa sulla scelta: imprevisti "suoi" molto più probabili, altri più o meno probabili
function pickByTrait(pool, p) {
  const w = pool.map(e => {
    let x = e.trait ? 9 : 1;
    for (const t of (p && p.traits) || []) {
      if (TRAITS[t].boost.includes(e.id)) x *= 3;
      if (TRAITS[t].dampen.includes(e.id)) x *= 0.3;
    }
    return x;
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
function genWeeklyEvents() {
  const k = clients().filter(p => !p.retired).length;
  const active = S.phase === 'reg' || S.phase === 'fa';
  const p1 = active ? 0.36 + Math.min(k, 12) * 0.02 : 0.2;           // 2 clienti ≈ 40%, 12 clienti ≈ 60%
  const p2 = active && k >= 5 ? 0.03 + Math.min(k, 15) * 0.01 : 0;   // 10 clienti ≈ 13%
  const p3 = active && k >= 12 ? 0.04 : 0;
  const n = chance(p1) ? 1 + (chance(p2) ? 1 : 0) + (chance(p3) ? 1 : 0) : 0;
  // colpo di scena: raro, una volta sola per giocatore e per tipo
  if (active && k && chance(0.008 + 0.002 * Math.min(k, 12))) {
    const cand = shuffle(clients().filter(p => !p.retired && !S.inbox.some(x => x.pid === p.id)));
    for (const p of cand) {
      const pool = EVENTS.filter(e => e.rare && condOk(e, p) && !(p.rareSeen || []).includes(e.id));
      if (pool.length) { const e = pick(pool); p.rareSeen = [...(p.rareSeen || []), e.id]; createEvent(e, p); break; }
    }
  }
  for (let i = 0; i < n; i++) {
    // chi ha appena avuto un imprevisto aspetta qualche settimana
    const free = clients().filter(p => !p.retired && !S.inbox.some(x => x.pid === p.id) && S.turn - (p.lastEv ?? -99) >= 4);
    let p = null, pool = [];
    for (let tries = 0; tries < 6 && !pool.length; tries++) {
      p = free.length && !chance(0.1) ? pick(free) : null;
      if (p && p.morale < 35 && chance(hasTrait(p, 'leale') ? 0.15 : 0.5)) pool = EVENTS.filter(e => e.id === 'rivale');
      else pool = EVENTS.filter(e => !e.rare && (!e.trait || hasTrait(p, e.trait)) && condOk(e, p) && !S.recentEv.includes(e.id));
    }
    if (pool.length) createEvent(pickByTrait(pool, p), p);
  }
}

const LOOK_TXT = {
  tattoo: v => v === 'face' ? 'tatuaggio sul viso' : 'tatuaggio sul braccio', hairColor: () => 'capelli colorati',
  hair: v => ({ mohawk: 'cresta', short: 'capelli corti', bald: 'testa rasata', braids: 'treccine' })[v],
  beard: v => v === 'long' ? 'barbone' : v === 'mustache' ? 'baffi' : 'barba', glasses: v => v === 'sun' ? 'occhiali da sole' : 'occhialoni',
  mask: () => 'maschera protettiva', headband: () => 'fascia in testa', number: v => 'maglia numero ' + v,
  chain: () => 'catena d\'oro', tooth: () => 'dente scheggiato',
};
const gain = (f, inst) => f.cash > 0 ? Math.round(f.cash * (inst ? inst.data.mult || 1 : 1)) : f.cash;
// Testo breve degli effetti di una scelta, mostrato sotto il pulsante e nel risultato.
function fxText(f, inst) {
  const o = [];
  if (f.cash) { const c = gain(f, inst); o.push(`${c > 0 ? '+' : '−'}$${Math.abs(c)}k`); }
  if (f.rep) o.push(`reputazione ${f.rep > 0 ? '+' : ''}${f.rep}`);
  if (f.mor) o.push(`rapporto col giocatore ${f.mor > 0 ? '+' : ''}${f.mor}${f.all ? ' (tutti i clienti)' : ''}`);
  if (f.tr) o.push(`rapporto con la squadra ${f.tr > 0 ? '+' : ''}${f.tr}`);
  if (f.br) o.push(`rapporto con lo sponsor ${f.br > 0 ? '+' : ''}${f.br}`);
  if (f.hype) o.push(`popolarità ${f.hype > 0 ? '+' : ''}${f.hype}`);
  if (f.ovr) o.push(`valutazione ${f.ovr > 0 ? '+' : ''}${f.ovr}`);
  if (f.raise) o.push(`stipendio +${Math.round(f.raise * 100)}%`);
  if (f.height) o.push(`+${f.height} cm`);
  if (f.weight) o.push(`${f.weight > 0 ? '+' : ''}${f.weight} kg`);
  if (f.pot) o.push(`potenziale ${f.pot > 0 ? '+' : ''}${f.pot}`);
  if (f.draftBoost) o.push(f.draftBoost > 0 ? 'sale nelle previsioni del Draft' : 'scende nelle previsioni del Draft');
  if (f.stayCollege) o.push('salta questo Draft');
  if (f.inj) o.push(`fermo ${f.inj} sett.`);
  if (f.comm) o.push(`commissione ${f.comm > 0 ? '+' : ''}${f.comm}%`);
  if (f.leave) o.push('lascia l\'agenzia');
  if (f.trade) o.push('ceduto a una big');
  if (f.sponsor && inst && inst.data.value) {
    const v = r1(inst.data.value * f.sponsor);
    o.push(`sponsor ${fmtM(v)}/anno (tua quota ${fmt$(v * 1e6 * SPONSOR_CUT)})`);
  }
  if (f.sponsorCut) o.push('sponsor ridotto del 30%');
  if (f.dropSponsor) o.push('perde lo sponsor');
  if (f.gem) o.push('scopri un talento nascosto');
  if (f.look) o.push('👤 ' + Object.entries(f.look).map(([k, v]) => LOOK_TXT[k](v)).join(', '));
  if (f.odds) o.push(`${Math.round(f.odds[0] * 100)}%: ${fxText(f.odds[1], inst) || 'niente'} · altrimenti: ${fxText(f.odds[2], inst) || 'niente'}`);
  return o.join(' · ');
}
function applyFx(f, inst, p) {
  if (f.cash) { const c = gain(f, inst); c > 0 ? earn(c * 1000) : spend(-c * 1000); }
  if (f.rep) changeRep(f.rep);
  const targets = f.all ? clients() : p ? [p] : [];
  for (const x of targets) if (f.mor) x.morale = clamp(Math.round(x.morale + (f.mor < 0 && hasTrait(x, 'permaloso') ? f.mor * 1.4 : f.mor)), 0, 100);
  if (f.height && p) { if (!p.h) genBody(p); p.h += f.height; }
  if (f.weight && p) { if (!p.h) genBody(p); p.w += f.weight; }
  if (f.raise && p && p.team != null) p.salary = Math.min(MAX_SAL, r1(p.salary * (1 + f.raise)));
  if (f.br) changeBrandRel(inst.data.b, f.br);
  if (!p) { if (f.gem) findGem(); return; }
  if (f.tr) changeTeamRel(p.team, f.tr);
  if (f.hype) p.hype = clamp(p.hype + f.hype, 0, 100);
  if (f.ovr) { p.ovr = clamp(p.ovr + f.ovr, 35, 99); p.pot = Math.max(p.pot, p.ovr); }
  if (f.pot) p.pot = clamp(p.pot + f.pot, p.ovr, 99);
  if (f.pot || f.ovr) capPot(p);
  if (f.draftBoost) p.draftBoost = (p.draftBoost || 0) + f.draftBoost;
  if (f.stayCollege && p.school) p.skipDraft = S.season;
  if (f.inj) { p.injury = Math.max(p.injury, f.inj); injuryHit(p, f.inj); }
  if (f.comm) p.comm = clamp(p.comm + f.comm, 1, 4);
  if (f.look) { p.look = { ...(p.look || {}), ...f.look }; if (f.look.number != null) p.num = f.look.number; }
  if (f.sponsor && inst.data.value) {
    if (p.sponsors.length >= 4) p.sponsors.sort((a, b) => a.value - b.value).shift();
    p.sponsors.push({ brand: inst.data.b, value: r1(inst.data.value * f.sponsor), years: inst.data.years });
    p.sponsorCount = (p.sponsorCount || 0) + 1;
    checkGoal('sponsor', true);
    chalUpdate('sponsors', 1);
  }
  if (f.sponsorCut) { const s = p.sponsors.find(x => x.brand === inst.data.b) || p.sponsors[0]; if (s) { s.value = r1(s.value * 0.7); } }
  if (f.dropSponsor && p.sponsors.length) {
    const i = Math.max(0, p.sponsors.findIndex(x => x.brand === inst.data.b));
    changeBrandRel(p.sponsors[i].brand, -8);
    p.sponsors.splice(i, 1);
  }
  if (f.trade && p.team != null) { const to = tradePlayer(p, true); addNews(`🔁 ${esc(p.name)} passa ai ${esc(teamName(to))}.`); }
  if (f.gem) findGem();
  if (f.leave && isClient(p)) lose(p);
}
function findGem() {
  const g = newPlayer('prospect');
  Object.assign(g, { age: randi(17, 19), ovr: randi(56, 63), school: 'Liceo di Akron (Ohio)', scouted: true, agency: null });
  g.pot = randi(86, 96);
  S.players[g.id] = g;
  addNews(`🔭 Il tuo scout ha trovato <b>${esc(g.name)}</b>, talento del liceo con potenziale ~${g.pot}. Lo trovi nel Mercato, tra i prospetti.`, 'good');
}
// Probabilità mostrata e usata per una scelta (null se non c'è nulla di incerto).
function choiceProb(ch, inst, p) {
  if (ch.fx.odds) return ch.ask ? askProb(ch.fx.odds[0], ch.ask, inst, p) : ch.fx.odds[0];
  if (ch.ask) return askProb(0.7, ch.ask, inst, p);
  return null;
}
function choiceHint(ch, inst, p) {
  const pr = choiceProb(ch, inst, p);
  let h;
  if (ch.fx.odds) {
    const f = { ...ch.fx }; delete f.odds;
    h = [fxText(f, inst), `${Math.round(pr * 100)}%: ${fxText(ch.fx.odds[1], inst) || 'niente'} · altrimenti: ${fxText(ch.fx.odds[2], inst) || 'niente'}`].filter(Boolean).join(' · ');
  } else {
    h = fxText(ch.fx, inst) || 'nessun effetto';
    if (ch.ask) h = `${Math.round(pr * 100)}% che ${WHO_TXT[ch.ask]} accetti: ${h}`;
  }
  const rel = [ch.tr ? `squadra ${ch.tr > 0 ? '+' : ''}${ch.tr}` : '', ch.br ? `sponsor ${ch.br > 0 ? '+' : ''}${ch.br}` : ''].filter(Boolean).join(', ');
  if (rel) h += ` · rapporto ${rel}`;
  if (ch.ask) h += ` · rapporto attuale con ${WHO_TXT[ch.ask]}: ${relLabel(relOf(ch.ask, inst, p))}`;
  if (ch.risk) h += ` · ⚠️ ${Math.round(ch.risk.p * 100)}%: ${ch.risk.note}`;
  return h;
}
function resolveEvent(instId, idx) {
  const inst = S.inbox.find(e => e.id === instId); if (!inst) return;
  const e = EVENTS.find(x => x.id === inst.ev), ch = e && e.choices[idx];
  if (!ch) { S.inbox = S.inbox.filter(x => x.id !== instId); UI.render(); return; }
  const p = inst.pid != null ? P(inst.pid) : null;
  const cost = Math.max(0, -(ch.fx.cash || 0)) * 1000;
  if (cost && S.cash < cost) return toast(`Servono ${fmt$(cost)}: non hai abbastanza contanti.`);
  const f = { ...ch.fx }, pr = choiceProb(ch, inst, p);
  // cambia il rapporto con squadra e sponsor in base alla scelta
  applyFx({ tr: ch.tr, br: ch.br }, inst, p);
  let out;
  if (f.odds) {
    const [, win, bad] = f.odds; delete f.odds;
    const ok = chance(pr), res = ok ? win : bad;
    applyFx(f, inst, p); applyFx(res, inst, p);
    out = (ok ? '✅ È andata bene! ' : '❌ Non è andata come speravi. ') + [fxText(f, inst), fxText(res, inst)].filter(Boolean).join(' · ');
  } else if (ch.ask && !chance(pr)) {
    // la controparte dice di no: paghi comunque i costi e il rapporto peggiora
    const no = { cash: f.cash < 0 ? f.cash : 0 };
    if (ch.ask === 'player') no.mor = -5;
    if (ch.ask === 'team') no.tr = -3;
    if (ch.ask === 'brand') no.br = -3;
    applyFx(no, inst, p);
    out = `❌ ${WHO_TXT[ch.ask].replace(/^./, c => c.toUpperCase())} non ha accettato. ${fxText(no, inst)}`;
  } else {
    applyFx(f, inst, p);
    out = (ch.ask ? '✅ Ha accettato! ' : '') + (fxText(f, inst) || 'Fatto.');
  }
  if (ch.risk && p && chance(ch.risk.p)) {
    applyFx(ch.risk.fx, inst, p);
    out += ` · ⚠️ ${ch.risk.note.replace(/^./, c => c.toUpperCase())}: ${fxText(ch.risk.fx, inst)}`;
  }
  S.inbox = S.inbox.filter(x => x.id !== instId);
  addNews(`${inst.ico} <b>${esc(inst.title)}</b> → ${esc(ch.label)}. ${esc(out)}`);
  save(); UI.render(); toast(`${ch.label}: ${out}`);
}
function lose(p) {
  if (S.chal) for (const c of S.chal.list) if (c.id === 'loyal' && !c.done) c.failed = true;
  S.clients = S.clients.filter(id => id !== p.id);
  S.offers = S.offers.filter(o => o.pid !== p.id);
  p.agency = pick(RIVALS); p.lockedUntil = S.season + 2;
  changeRep(-clamp((p.ovr - 60) / 8, 0.5, 4));
  addNews(`💔 Hai perso ${esc(p.name)}, passato a un'agenzia rivale.`, 'bad');
}
function tradePlayer(p, toContender, dest = null) {
  const cur = p.team;
  let pool = S.teams.filter(t => t.id !== cur);
  if (toContender) pool = standings().filter(t => t.id !== cur).slice(0, 12);
  const to = dest != null ? S.teams[dest] : pick(pool);
  // contropartita: un giocatore di valore simile fa il viaggio opposto
  const back = rosterOf(to.id).filter(x => !isClient(x)).sort((a, b) => Math.abs(a.salary - p.salary) - Math.abs(b.salary - p.salary))[0];
  if (back) back.team = cur;
  p.team = to.id;
  return to;
}


/* ================================================================== */
/* Informatore e legame con i prospetti del prossimo Draft             */
/* ================================================================== */
const INFORMER_LV = ['Non assunto', 'Scarso', 'Discreto', 'Buono', 'Ottimo', 'Leggendario'];
function informerWeek() {
  const lv = S.staff.informer || 0;
  if (!lv || !chance(0.2 + lv * 0.07)) return;
  const pros = Object.values(S.players).filter(p => p.school && !p.retired && !isClient(p));
  if (!pros.length) return;
  // più è bravo, più le sue soffiate riguardano i veri talenti
  const noise = 14 - lv * 2.4;
  const ranked = pros.map(p => [p, p.pot + gauss() * noise]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const p = ranked[randi(0, Math.min(9, ranked.length - 1))];
  const sd = Math.max(1.5, 9 - lv * 1.6);
  const r = Math.random();
  let text;
  if (r < 0.25 && !p.bondTip) {
    p.bondTip = true;
    text = `${p.name} (${p.school}) cerca un agente che lo segua da vicino: se lo coltivi ora, il legame crescerà il doppio.`;
  } else if (r < 0.45 && !p.agency && p.rivalDeadline == null) {
    p.rivalDeadline = S.turn + 3; p.rivalWho = pick(RIVALS);
    text = `${p.rivalWho} sta per far firmare ${p.name} (${p.school}). Hai 3 settimane per convincerlo.`;
  } else {
    let est = Math.round(p.pot + gauss() * sd);
    if (lv <= 2 && chance(0.3 - lv * 0.1)) est += pick([-1, 1]) * randi(5, 10); // l'informatore scarso a volte prende cantonate
    est = clamp(est, p.ovr, 99);
    if (p.intelSd == null || sd <= p.intelSd) { p.intelPot = est; p.intelSd = sd; }
    text = `${p.name} (${p.school}): secondo me il suo potenziale è ~${est}.`;
  }
  S.intel.unshift({ when: `${seasonLabel()} · ${phaseLabel()}`, pid: p.id, text, lv });
  if (S.intel.length > 20) S.intel.length = 20;
  addNews(`🕵️ Soffiata dell'informatore: ${esc(text)}`);
  UI.pendingToast = UI.pendingToast || [text, 'intel'];
}
function rivalDeadlines() {
  for (const p of Object.values(S.players)) {
    if (p.rivalDeadline == null || S.turn < p.rivalDeadline) continue;
    if (!isClient(p) && !p.agency && p.school && (p.bond || 0) < 60) {
      p.agency = p.rivalWho;
      addNews(`🦈 ${esc(p.rivalWho)} ha fatto firmare ${esc(p.name)} prima di te.`, 'bad');
    }
    p.rivalDeadline = null;
  }
}
const cultivateCost = p => Math.round(Math.max(1000, (starPower(p) - 50) * 180) / 100) * 100;
function cultivate(pid) {
  const p = P(pid);
  if (p.lastBond === S.turn) return { msg: 'Lo hai già incontrato questa settimana.', type: 'warn' };
  const cost = cultivateCost(p);
  if (S.cash < cost) return { msg: `Servono ${fmt$(cost)}.`, type: 'bad' };
  spend(cost); p.lastBond = S.turn;
  let gain = randi(6, 12) + (S.staff.informer || 0) * 2;
  const tip = p.bondTip; if (tip) { gain *= 2; p.bondTip = false; }
  p.bond = clamp((p.bond || 0) + gain, 0, 100);
  const what = pick(['Hai visto una sua partita in prima fila', 'Cena con la sua famiglia', 'Gli hai regalato un paio di Naik',
    'Lo hai invitato al tuo camp estivo', 'Lunga chiacchierata dopo l\'allenamento', 'Hai conosciuto il suo allenatore del college']);
  return { msg: `${what}. Legame con ${p.name} ${p.bond}/100 (+${gain}${tip ? ', raddoppiato dalla soffiata' : ''}).`, type: 'good' };
}
// Prima del Draft i prospetti con cui hai un legame forte possono scegliere te
function bondedJoin() {
  const pros = Object.values(S.players).filter(p => p.school && !p.retired && !isClient(p) && (p.bond || 0) >= 70)
    .sort((a, b) => b.bond - a.bond);
  for (const p of pros) {
    if (clients().length >= capacity()) break;
    if (!chance(0.35 + (p.bond - 70) / 60)) continue;
    p.comm = 3; p.agency = S.agency; p.morale = clamp(60 + Math.round(p.bond / 3), 0, 100); p.scouted = true;
    S.clients.push(p.id);
    chalUpdate('sign', p.ovr, 'max');
    addNews(`🤝 <b>${esc(p.name)}</b> ti ha scelto come agente prima del Draft, grazie al legame che avete costruito!`, 'good');
    UI.pendingToast = [`${p.name} ti ha scelto come agente prima del Draft!`, 'good'];
  }
}

/* ================================================================== */
/* Consigliare un giocatore a una squadra                              */
/* ================================================================== */
// Posizione al Draft di ogni squadra se la stagione finisse oggi (le peggiori scelgono prima)
const draftSlot = tid => [...standings()].reverse().findIndex(t => t.id === tid) + 1;
const draftScore = p => p.ovr * 0.55 + p.pot * 0.45 + p.teamNoise * 3 + (p.draftBoost || 0);
// Dove lo sceglierebbero oggi le squadre
function draftProjection(p) {
  if (!p.school) return null;
  const pros = Object.values(S.players).filter(x => x.school && !x.retired && x.skipDraft !== S.season).sort((a, b) => draftScore(b) - draftScore(a));
  return pros.indexOf(p) + 1;
}
function recChance(p, tid) {
  const rel = teamRel(tid);
  let c = (p.school ? 0.25 : p.team == null ? 0.2 : 0.08) + rel / 100 * 0.6;
  if (p.school) { // promettere una scelta molto più alta del suo valore è difficile
    const gap = draftSlot(tid) - (draftProjection(p) || 60);
    if (gap < 0) c -= Math.min(0.4, -gap * 0.03);
  } else if (p.team != null) c *= p.years > 1 ? 1 : 1.3;
  return clamp(c, 0.03, 0.9);
}
function recommend(pid, tid) {
  const p = P(pid), t = S.teams[tid];
  if (p.lastRec === S.turn) return { msg: `Hai già parlato di ${p.name} con una squadra questa settimana.`, type: 'warn' };
  if (p.team === tid) return { msg: `${p.name} gioca già nei ${t.name}.`, type: 'warn' };
  p.lastRec = S.turn;
  const ok = chance(recChance(p, tid));
  if (!ok) {
    changeTeamRel(tid, -2);
    return { msg: `I ${t.name} ti hanno ascoltato, ma non sono convinti. Il rapporto con loro cala un po'.`, type: 'bad' };
  }
  changeTeamRel(tid, 1);
  if (p.school) {
    p.promise = tid; p.draftBoost = (p.draftBoost || 0) + 4;
    if (!isClient(p)) p.bond = clamp((p.bond || 0) + 10, 0, 100);
    addNews(`📣 I ${esc(teamName(t))} hanno messo ${esc(p.name)} nella loro lista: se è libero al loro turno, lo sceglieranno.`, 'good');
    return { msg: `I ${t.name} lo sceglieranno se è ancora libero alla loro scelta (oggi la #${draftSlot(tid)}).`, type: 'good' };
  }
  if (p.team == null) {
    makeOffersFor(p, 1, tid, false);
    return { msg: `I ${t.name} gli hanno fatto un'offerta: la trovi nelle trattative.`, type: 'good' };
  }
  const to = tradePlayer(p, false, tid);
  p.morale = clamp(p.morale + 6, 0, 100);
  addNews(`🔁 Grazie a te ${esc(p.name)} passa ai ${esc(teamName(to))}.`, 'good');
  return { msg: `Scambio fatto: ${p.name} ora gioca nei ${to.name}.`, type: 'good' };
}

/* ================================================================== */
/* Mercato con le squadre: preferenze, valore stimato, asta e bluff    */
/* ================================================================== */
const PREFS = { soldi: ['💰', 'i soldi'], vincere: ['🏆', 'vincere'], citta: ['🌆', 'una grande città'], minuti: ['⏱️', 'giocare tanti minuti'] };
function prefOf(p) {
  if (!p.pref) {
    p.pref = hasTrait(p, 'avido') ? 'soldi' : hasTrait(p, 'ambizioso') || hasTrait(p, 'leader') ? 'vincere'
      : hasTrait(p, 'vanitoso') || hasTrait(p, 'festaiolo') ? 'citta' : hasTrait(p, 'professionista') || hasTrait(p, 'permaloso') ? 'minuti'
        : pick(Object.keys(PREFS));
  }
  return p.pref;
}
// Quanto gli piace una squadra, da -1 a +1, e perché
function teamFit(p, tid, salary) {
  const t = S.teams[tid], pr = prefOf(p);
  if (pr === 'soldi') { const r = salary / marketValue(p); return [clamp((r - 0.9) * 3, -1, 1), r >= 1 ? 'lo pagano bene' : 'lo pagano poco']; }
  if (pr === 'vincere') {
    // a inizio stagione la classifica non dice niente: conta la forza della rosa
    const early = t.w + t.l < 8;
    const k = early ? [...S.teams].sort((a, b) => teamStrength(b.id) - teamStrength(a.id)).findIndex(x => x.id === tid) + 1 : teamRank(tid);
    return [k <= 8 ? 1 : k <= 16 ? 0.3 : k <= 22 ? -0.4 : -1, early ? `${k}ª rosa più forte della lega` : `squadra ${k}ª in classifica`];
  }
  if (pr === 'citta') return [t.market >= 0.75 ? 1 : t.market >= 0.5 ? 0.3 : t.market >= 0.3 ? -0.4 : -1, t.market >= 0.75 ? 'grande città' : t.market >= 0.5 ? 'città media' : 'città piccola'];
  const better = rosterOf(tid).filter(x => x.id !== p.id && x.ovr > p.ovr).length;
  return [better <= 2 ? 1 : better <= 5 ? 0.4 : better <= 8 ? -0.3 : -1, better <= 2 ? 'sarebbe titolare' : better <= 5 ? 'avrebbe tanti minuti' : better <= 8 ? 'avrebbe pochi minuti' : 'starebbe in panchina'];
}
const fitIcon = f => `<i class="dot ${f >= 0.6 ? 'good' : f >= 0 ? 'warn' : 'bad'}"></i>`;
// Il valore di mercato non si conosce con precisione: una forbice che l'ufficio legale restringe
function valRange(p) {
  const v = marketValue(p), e = Math.max(0.05, 0.18 - S.staff.legal * 0.026);
  const f = x => r1(x).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `$${f(v * (1 - e))}–${f(v * (1 + e))}M`;
}
// Asta: dici a una squadra che hai un'offerta migliore. Se bluffi possono scoprirti.
function leverage(offerId, claim) {
  const o = S.offers.find(x => x.id === offerId); if (!o) return { msg: 'Offerta non più disponibile.', type: 'warn', done: true };
  if (o.lev) return { msg: 'Hai già giocato questa carta con loro.', type: 'warn' };
  const p = P(o.pid), t = S.teams[o.teamId];
  claim = r1(claim);
  if (!(claim > o.salary)) return { msg: 'Devi citare una cifra più alta della loro offerta.', type: 'warn' };
  o.lev = true;
  const real = Math.max(0, ...S.offers.filter(x => x.pid === o.pid && x.id !== o.id).map(x => x.salary));
  const bluff = claim > real * 1.03;
  if (bluff && chance(clamp(0.3 + (real ? claim / real - 1 : 0.5), 0.3, 0.85))) {
    S.offers = S.offers.filter(x => x.id !== o.id); changeTeamRel(o.teamId, -6);
    addNews(`🃏 I ${esc(teamName(t))} hanno scoperto il tuo bluff su ${esc(p.name)} e hanno ritirato l'offerta.`, 'bad');
    return { msg: `Hanno scoperto il bluff! I ${t.name} ritirano l'offerta e il rapporto con loro peggiora.`, type: 'bad', done: true };
  }
  if (o.max >= claim) { o.salary = r1(Math.min(o.max, claim * rand(1, 1.04))); return { msg: `I ${t.name} rilanciano: ${fmtM(o.salary)} × ${o.years}.`, type: 'good' }; }
  if (o.max >= claim * 0.9) { o.salary = o.max; o.final = true; return { msg: `"Più di così non possiamo": ${fmtM(o.salary)} è la loro offerta finale.`, type: 'info' }; }
  S.offers = S.offers.filter(x => x.id !== o.id); changeTeamRel(o.teamId, -1);
  return { msg: `"Non possiamo competere": i ${t.name} si ritirano.`, type: 'bad', done: true };
}
function expireOffers() {
  const old = S.offers.filter(o => o.expires != null && o.expires < S.turn);
  if (!old.length) return;
  S.offers = S.offers.filter(o => !old.includes(o));
  for (const o of old) { const p = P(o.pid); if (p && isClient(p)) addNews(`⌛ È scaduta l'offerta dei ${esc(teamName(S.teams[o.teamId]))} per ${esc(p.name)}.`, 'warn'); }
}
const weeksLeft = o => o.expires == null ? null : Math.max(0, o.expires - S.turn + 1);

/* ================================================================== */
/* Sfide della stagione: 3 nuove ogni anno, sempre un po' più difficili */
/* ================================================================== */
const CHAL_TYPES = {
  sign: { t: n => `Porta in agenzia un giocatore da almeno ${n} di valutazione`, n: i => Math.min(88, 72 + i * 2) },
  playoff: { t: n => `Porta ${n} client${n > 1 ? 'i' : 'e'} ai playoff`, n: i => Math.min(4, 1 + Math.floor(i / 2)) },
  sponsors: { t: n => `Chiudi ${n} nuov${n > 1 ? 'i' : 'o'} sponsor`, n: i => Math.min(4, 1 + Math.floor(i / 2)) },
  income: { t: n => `Incassa ${fmt$(n * 1000)} in stagione`, n: () => Math.max(300, Math.round((S.history.length ? S.history[S.history.length - 1].income : 250000) * 1.15 / 50000) * 50) },
  draft: { t: n => `Un tuo cliente scelto tra i primi ${n} al Draft`, n: () => 10 },
  allstar: { t: n => `Porta ${n} client${n > 1 ? 'i' : 'e'} all'All-Star Game`, n: i => Math.min(3, 1 + Math.floor(i / 3)) },
  camp: { t: n => `Fai fare ${n} camp con le leggende`, n: i => Math.min(4, 1 + Math.floor(i / 2)) },
  loyal: { t: () => 'Non perdere nessun cliente per colpa delle agenzie rivali', n: () => 1 },
};
const chalReward = () => { const i = S.season - 2026; return { cash: Math.min(900, 100 + i * 50), rep: 1 }; };
function newChallenges() {
  S.chal = { season: S.season, list: shuffle(Object.keys(CHAL_TYPES)).slice(0, 3).map(id => ({ id, n: CHAL_TYPES[id].n(S.season - 2026), prog: 0, done: false, failed: false })) };
}
function chalUpdate(id, v, mode = 'add') {
  if (!S.chal) return;
  for (const c of S.chal.list) {
    if (c.id !== id || c.done || c.failed) continue;
    if (mode === 'add') c.prog += v; else if (mode === 'max') c.prog = Math.max(c.prog, v); else c.prog = v;
    const ok = id === 'draft' ? c.prog > 0 && c.prog <= c.n : c.prog >= c.n;
    if (ok) completeChal(c);
  }
}
function completeChal(c) {
  c.done = true;
  const r = chalReward();
  earn(r.cash * 1000); changeRep(r.rep);
  const txt = `${CHAL_TYPES[c.id].t(c.n)} · Premio: ${fmt$(r.cash * 1000)} e +${r.rep} reputazione`;
  addNews(`🎯 Sfida completata: <b>${esc(CHAL_TYPES[c.id].t(c.n))}</b>! Premio ${fmt$(r.cash * 1000)}.`, 'gold');
  const msg = [txt, 'goal', 'Sfida vinta!'];
  if (UI.advancing) UI.goalQueue.push(msg); else toast(...msg);
}
function closeChallenges() {
  if (!S.chal) return;
  for (const c of S.chal.list) {
    if (c.id === 'loyal' && !c.failed && !c.done) { completeChal(c); continue; }
    if (!c.done) addNews(`🎯 Sfida mancata: ${esc(CHAL_TYPES[c.id].t(c.n))}.`, 'warn');
  }
}
function chalProgressTxt(c) {
  if (c.done) return 'Completata ✅';
  if (c.failed) return 'Fallita ❌';
  if (c.id === 'draft') return c.prog ? `migliore scelta finora: #${c.prog}` : 'al Draft di fine stagione';
  if (c.id === 'loyal') return 'fino a fine stagione';
  if (c.id === 'income') return `${fmt$(c.prog * 1000)} / ${fmt$(c.n * 1000)}`;
  if (c.id === 'sign') return c.prog ? `migliore finora: ${c.prog}` : 'nessuno ancora';
  return `${c.prog} / ${c.n}`;
}

/* ================================================================== */
/* Accademia giovanile: ragazzi che arrivano al Draft già legati a te  */
/* ================================================================== */
function academyClass() {
  const lv = S.staff.academy || 0; if (!lv) return;
  const n = 1 + Math.floor(lv / 2), names = [];
  for (let i = 0; i < n; i++) {
    const p = newPlayer('prospect');
    Object.assign(p, { age: randi(18, 19), ovr: randi(52, 57) + lv, school: `Accademia ${S.agency}`, scouted: true, agency: null, bond: clamp(55 + lv * 6 + randi(0, 8), 0, 100) });
    p.pot = clamp(66 + lv * 3 + randi(0, 10), p.ovr + 6, 92); // di solito buoni giocatori: al massimo livello potenziale 81-91
    p.academy = true;
    S.players[p.id] = p; names.push(p.name);
  }
  addNews(`🎓 Dalla tua accademia escono ${names.map(n => `<b>${esc(n)}</b>`).join(', ')}: sono nel Mercato tra i prospetti, già legati a te.`, 'good');
  // ogni tanto nasce un talento generazionale: più l'accademia è grande, più è probabile
  if (chance(0.06 * lv)) {
    const g = newPlayer('prospect');
    Object.assign(g, { age: 18, ovr: randi(58, 63) + lv, school: `Accademia ${S.agency}`, scouted: true, agency: null, academy: true, gem: true, bond: clamp(70 + lv * 5, 0, 100), hype: 30 });
    g.pot = randi(92, 98);
    S.players[g.id] = g;
    addNews(`💎 Nella tua accademia è sbocciato un <b>talento generazionale</b>: <b>${esc(g.name)}</b>, 18 anni, potenziale ~${g.pot}. Non fartelo scappare!`, 'gold');
    UI.pendingToast = [`${g.name}, 18 anni, potenziale ~${g.pot}: è nel Mercato tra i prospetti.`, 'goal', 'Talento generazionale!'];
  }
}

/* ================================================================== */
/* Investimenti di lungo periodo: quote di una squadra NBA, fondazione */
/* ================================================================== */
const stakePrice = t => Math.round((10 + t.market * 20) * 1e6); // prezzo di un 5%
const stakeOf = tid => (S.stakes || {})[tid] || 0;
function buyStake(tid) {
  const t = S.teams[tid], cur = stakeOf(tid), price = stakePrice(t);
  if (cur >= 100) return { msg: 'Possiedi già tutta la squadra.', type: 'warn' };
  if (S.cash < price) return { msg: `Servono ${fmt$(price)} per un altro 5%.`, type: 'bad' };
  spend(price); S.stakes = S.stakes || {}; S.stakes[tid] = cur + 5;
  S.teamRel[tid] = Math.max(teamRel(tid), Math.min(100, 60 + S.stakes[tid] / 2));
  addNews(`🏟️ Hai comprato il 5% dei ${esc(teamName(t))}: ora ne possiedi il <b>${S.stakes[tid]}%</b>.`, 'gold');
  checkGoal('owner', true);
  checkGoal('majority', S.stakes[tid] >= 51);
  return { msg: `Ora possiedi il ${S.stakes[tid]}% dei ${t.name}.`, type: 'good' };
}
function payDividends() {
  let tot = 0;
  for (const [tid, pct] of Object.entries(S.stakes || {})) { const v = pct / 5 * stakePrice(S.teams[tid]) * 0.04; tot += v; S.teamRel[tid] = Math.max(teamRel(+tid), Math.min(100, 60 + pct / 2)); }
  if (tot) { earn(tot); addNews(`🏟️ Dividendi dalle tue quote societarie: ${fmt$(tot)}.`, 'good'); }
}
function donate() {
  if (S.donated === S.season) return { msg: 'Hai già fatto una donazione in questa stagione.', type: 'warn' };
  if (S.cash < 1e6) return { msg: 'Servono $1M.', type: 'bad' };
  spend(1e6); S.donated = S.season; changeRep(3);
  for (const b of BRANDS) changeBrandRel(b, 3);
  addNews('💛 La tua fondazione ha donato $1M per i campetti nei quartieri difficili.', 'good');
  return { msg: 'Donazione fatta: +3 reputazione e +3 rapporto con tutti gli sponsor.', type: 'good' };
}

// Promesse fatte in trattativa: si controllano a fine stagione regolare
function promiseStatus(p, pr) {
  const t = teamOf(p);
  if (pr.k === 'sponsor') return (p.sponsorCount || 0) > pr.base ? '✅' : '<i class="dot warn"></i>';
  if (pr.k === 'camp') return p.campSeason === pr.season ? '✅' : '<i class="dot warn"></i>';
  return t && teamRank(t.id) <= 16 ? '<i class="dot good"></i>' : '⚠️';
}
function checkPromises() {
  for (const p of clients()) {
    if (!p.promises || !p.promises.length) continue;
    const keep = [];
    for (const pr of p.promises) {
      if (pr.season > S.season) { keep.push(pr); continue; }
      const t = teamOf(p);
      const ok = pr.k === 'sponsor' ? (p.sponsorCount || 0) > pr.base : pr.k === 'contender' ? !!t && teamRank(t.id) <= 16 : p.campSeason === pr.season;
      if (ok) { p.morale = clamp(p.morale + 10, 0, 100); changeRep(0.5); addNews(`🤝 Promessa mantenuta con ${esc(p.name)}: ${esc(PROMISES[pr.k].label.toLowerCase())}.`, 'good'); }
      else { p.morale = clamp(p.morale - 25, 0, 100); changeRep(-1); addNews(`💔 Promessa mancata con ${esc(p.name)}: ${esc(PROMISES[pr.k].label.toLowerCase())}. Si fida meno di te.`, 'bad'); }
    }
    p.promises = keep;
  }
}

/* ================================================================== */
/* Fisico dei giocatori: altezza e peso realistici per ruolo           */
/* ================================================================== */
const BODY = { PG: [183, 196, 24.2], SG: [190, 201, 24.6], SF: [198, 208, 25.0], PF: [203, 211, 25.6], C: [208, 221, 26.2] };
function genBody(p) {
  const [lo, hi, bmi] = BODY[p.pos] || BODY.SF;
  let h = Math.round(lo + (hi - lo) * Math.min(1, Math.max(0, 0.5 + gauss() * 0.28)));
  if (Math.random() < 0.03) h += randi(3, 6); // ogni tanto un gigante per il suo ruolo
  p.h = h;
  p.w = Math.round((h / 100) ** 2 * (bmi + gauss() * 1.2));
}
function bodyTxt(p) {
  if (!p.h) genBody(p);
  const inch = Math.round(p.h / 2.54), ft = Math.floor(inch / 12);
  return `${p.h} cm (${ft}'${inch % 12}") · ${p.w} kg`;
}

/* ================================================================== */
/* Record della lega: partono da quelli reali della NBA                */
/* ================================================================== */
const REC_LABEL = { pts: 'Punti', reb: 'Rimbalzi', ast: 'Assist', ppg: 'Punti a partita', rpg: 'Rimbalzi a partita', apg: 'Assist a partita',
  gp: 'Partite giocate', titles: 'Titoli', mvp: 'MVP', allstar: 'All-Star' };
const clone = o => JSON.parse(JSON.stringify(o));
// Prepara i record (una volta sola): record reali, leggende ritirate, numeri di carriera delle star in attività
function recInit() {
  if (!S.records) S.records = { game: {}, season: {}, retired: [] };
  const R = S.records;
  if (R.real) return;
  // salvataggi precedenti: quello che era stato registrato diventa "il migliore dal 2026"
  R.era = { game: R.game || {}, season: R.season || {} };
  R.game = clone(REAL_RECORDS.game); R.season = clone(REAL_RECORDS.season);
  for (const sec of ['game', 'season']) for (const [k, r] of Object.entries(R.era[sec])) if (r && r.v > R[sec][k].v) R[sec][k] = clone(r);
  R.retired = [...clone(REAL_LEGENDS), ...(R.retired || [])];
  for (const p of Object.values(S.players)) {
    if (!p.star || p.cgp) continue;
    const real = REAL_ACTIVE[p.name] || {};
    if (real.pts) { p.cpts = real.pts; p.creb = real.reb; p.cast = real.ast; p.cgp = real.gp; }
    else { // stima coerente con età e livello
      const seasons = clamp(p.age - 20, 0, 22), gp = Math.round(seasons * 63), ppg = Math.max(6, (p.ovr - 45) * 0.52);
      p.cgp = gp; p.cpts = Math.round(gp * ppg);
      p.creb = Math.round(gp * ppg * ({ PG: .18, SG: .2, SF: .3, PF: .42, C: .5 }[p.pos]));
      p.cast = Math.round(gp * ppg * ({ PG: .35, SG: .2, SF: .17, PF: .12, C: .1 }[p.pos]));
    }
    for (const k of ['titles', 'mvp', 'allstar']) if (real[k]) p.career[k] = Math.max(p.career[k] || 0, real[k]);
  }
  R.real = true;
}
// record di una singola partita: di sempre e dal 2026
function recGame(p, team, pts, reb, ast) {
  const R = S.records;
  p.hi = p.hi || {};
  for (const [k, v] of [['pts', pts], ['reb', reb], ['ast', ast]]) {
    if (v > (p.hi[k] || 0)) p.hi[k] = v; // il suo massimo in carriera
    const rec = { v, name: p.name, pid: p.id, team: team.abbr, season: seasonLabel() };
    if (!R.era.game[k] || v > R.era.game[k].v) {
      const had = !!R.era.game[k];
      R.era.game[k] = rec;
      if (v > R.game[k].v) { R.game[k] = clone(rec); recNews(p, `${v} ${REC_LABEL[k].toLowerCase()} in una partita`, true); }
      else if (had && v >= (k === 'pts' ? 50 : k === 'reb' ? 22 : 17)) recNews(p, `${v} ${REC_LABEL[k].toLowerCase()} in una partita`, false);
    }
  }
}
// record stagionali: a fine stagione regolare, minimo 40 partite
function recSeason() {
  recInit();
  const R = S.records;
  for (const p of Object.values(S.players)) {
    if (p.retired || p.team == null || p.gp < 40) continue;
    for (const [k, base] of [['ppg', 'pts'], ['rpg', 'reb'], ['apg', 'ast']]) {
      const v = r1(p[base] / p.gp), rec = { v, name: p.name, pid: p.id, team: teamOf(p).abbr, season: seasonLabel() };
      if (!R.era.season[k] || v > R.era.season[k].v) {
        const had = !!R.era.season[k];
        R.era.season[k] = rec;
        if (v > R.season[k].v) { R.season[k] = clone(rec); recNews(p, `${v} ${REC_LABEL[k].toLowerCase()} in una stagione`, true); }
        else if (had) recNews(p, `${v} ${REC_LABEL[k].toLowerCase()} in una stagione`, false);
      }
    }
  }
}
function recNews(p, what, allTime) {
  addNews(allTime ? `📜 <b>RECORD DI SEMPRE!</b> ${esc(p.name)}: ${esc(what)}. Battuto un primato della storia NBA!`
    : `📜 Migliore prestazione dal 2026: ${esc(p.name)}, ${esc(what)}.`, isClient(p) || allTime ? 'gold' : '');
  if (isClient(p)) { const m = [`${p.name}: ${what}${allTime ? ' · record di sempre!' : ' · il migliore dal 2026'}`, 'goal', allTime ? 'Record storico!' : 'Record!']; if (UI.advancing) UI.goalQueue.push(m); else toast(...m); }
}
const careerStat = (p, k) => k === 'titles' || k === 'mvp' || k === 'allstar' ? (p.career ? p.career[k] : p[k]) || 0 : k === 'gp' ? p.cgp || 0 : p['c' + k] || 0;
// classifica di sempre: giocatori in attività + leggende ritirate (reali e della tua era)
function careerBoard(k, n = 10) {
  recInit();
  const act = Object.values(S.players).filter(p => !p.retired && (careerStat(p, k) > 0)).map(p => ({ name: p.name, pid: p.id, v: careerStat(p, k), active: true }));
  const ret = S.records.retired.map(r => ({ name: r.name, v: r[k] || 0, active: false, until: r.until }));
  return [...act, ...ret].filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, n);
}
// quando un giocatore si ritira, i suoi numeri restano nella storia se sono tra i migliori
function recRetire(p) {
  recInit();
  if (!(p.cgp > 0)) return;
  const snap = { name: p.name, until: seasonLabel(), pts: p.cpts || 0, reb: p.creb || 0, ast: p.cast || 0, gp: p.cgp || 0,
    titles: p.career.titles, mvp: p.career.mvp, allstar: p.career.allstar, client: isClient(p) };
  const keys = ['pts', 'reb', 'ast', 'gp', 'titles', 'mvp', 'allstar'];
  const worthy = keys.some(k => { const b = careerBoard(k, 25); return snap[k] > 0 && (b.length < 25 || snap[k] > b[b.length - 1].v); });
  if (!worthy) return;
  S.records.retired.push(snap);
  if (S.records.retired.length > 90) {
    const keep = new Set();
    for (const k of keys) [...S.records.retired].sort((a, b) => (b[k] || 0) - (a[k] || 0)).slice(0, 25).forEach(r => keep.add(r));
    S.records.retired = S.records.retired.filter(r => keep.has(r));
  }
}

/* ================================================================== */
/* Avanzamento                                                         */
/* ================================================================== */
function advance() {
  if (S.over) return;
  if (S.inbox.length) {
    UI.focusEvents(true);
    toast(`Hai ${S.inbox.length === 1 ? 'un imprevisto' : S.inbox.length + ' imprevisti'} da risolvere prima di andare avanti.`, 'warn', 'Prima decidi!');
    return;
  }
  S.turn++;
  UI.advancing = true; UI.goalQueue = [];
  expireOffers();
  let played = false;
  spend(weeklyCost());
  S.rep = r1(S.rep * (0.997 + (S.staff.hq || 0) * 0.0005)); // la fama va mantenuta (una bella sede aiuta)
  for (const p of clients()) for (const sp of p.sponsors) earn(sp.value * 1e6 * SPONSOR_CUT / TURNS_PER_YEAR);

  if (S.phase === 'fa') {
    aiFreeAgency(0.35);
    if (S.week >= FA_WEEKS) {
      const expired = S.offers.filter(o => !o.ext).length;
      S.offers = S.offers.filter(o => o.ext);
      fillRosters();
      if (expired) addNews(`⌛ La Free Agency è chiusa: ${expired} offert${expired > 1 ? 'e scadute' : 'a scaduta'}.`, 'warn');
      for (const p of clients()) if (p.team == null && !p.school) addNews(`⚠️ ${esc(p.name)} è ancora senza squadra.`, 'warn');
      S.phase = 'reg'; S.week = 1;
      addNews(`🏀 Inizia la stagione regolare ${seasonLabel()}!`, 'gold');
    } else { S.week++; makeOffersForClientFAs(); }
  } else if (S.phase === 'reg') {
    simWeekGames(); played = true;
    for (const p of clients()) if (p.team != null) earn(p.salary * 1e6 * p.comm / 100 / REG_WEEKS);
    for (const p of Object.values(S.players)) {
      if (p.injury) p.injury--;
      else if (p.injDebt) { p.injDebt--; p.ovr = Math.min(99, p.ovr + 1); p.pot = Math.max(p.pot, p.ovr); } // torna in forma un punto a settimana
      p.hype = Math.max(0, p.hype * 0.98 + (p.team != null && p.gp ? (avg(p, 'pts') - 12) * 0.05 : 0));
    }
    moraleDrift();
    aiFreeAgency(0.04);
    // offerte a stagione in corso per i clienti senza squadra
    for (const p of clients()) if (p.team == null && !p.school && !S.offers.some(o => o.pid === p.id) && chance(0.3)) {
      if (makeOffersFor(p, 1)) addNews(`📨 Offerta a stagione in corso per ${esc(p.name)}.`);
    }
    if (S.week === 10) allStar();
    if (S.week === 12) extensionOffers();
    if (chance(0.25)) randomLeagueNews();
    if (S.week >= REG_WEEKS) { recSeason(); checkPromises(); S.phase = 'po'; S.week = 1; addNews('🏆 Stagione regolare finita: si va ai playoff!', 'gold'); }
    else S.week++;
  } else if (S.phase === 'po') {
    playoffs();
    S.phase = 'draft'; S.week = 1;
  } else if (S.phase === 'draft') {
    bondedJoin();
    runDraft();
    offseason();
    S.phase = 'fa'; S.week = 1;
    makeOffersForClientFAs();
  }

  chalUpdate('income', Math.round(S.seasonIncome / 1000), 'set');
  if (S.phase === 'fa' || S.phase === 'reg') informerWeek();
  rivalDeadlines();
  if (!S.over) genWeeklyEvents();

  // bancarotta
  if (S.cash < 0) {
    S.debtWeeks++;
    if (S.debtWeeks >= 4) { S.over = true; addNews('☠️ Licenza revocata per insolvenza. Fine della carriera.', 'bad'); }
    else addNews(`⚠️ Conto in rosso! Hai ${4 - S.debtWeeks} settiman${4 - S.debtWeeks > 1 ? 'e' : 'a'} per rientrare.`, 'bad');
  } else S.debtWeeks = 0;

  checkGoals();
  save(); UI.render();
  if (S.over) { UI.advancing = false; return UI.gameOver(); }
  const after = () => {
    UI.advancing = false;
    const goals = UI.goalQueue || []; UI.goalQueue = [];
    const busy = S.inbox.length || UI.pendingToast;
    // gli obiettivi arrivano subito dopo l'avviso degli imprevisti, uno alla volta
    if (goals.length) setTimeout(() => goals.length === 1 ? toast(...goals[0])
      : toast(goals.slice(0, 3).map(a => a[0]).join(' · ') + (goals.length > 3 ? ` e altri ${goals.length - 3}` : ''), 'goal', `${goals.length} traguardi!`), busy ? 3600 : 0);
    if (S.inbox.length) {
      UI.focusEvents(false);
      const rare = S.inbox.find(e => e.rare);
      if (rare) toast(rare.title, 'goal', 'Colpo di scena!');
      else toast(S.inbox.length === 1 ? S.inbox[0].title : `${S.inbox.length} imprevisti questa settimana: scegli cosa fare.`, 'event', 'Imprevisto!');
    } else if (UI.pendingToast) toast(...UI.pendingToast);
    UI.pendingToast = null;
  };
  if (played && S.showGames !== false) UI.showWeek(after); else after();
}

function allStar() {
  const all = Object.values(S.players).filter(p => p.team != null && !p.retired).sort((a, b) => playerScore(b) - playerScore(a)).slice(0, 24);
  const mine = all.filter(isClient);
  for (const p of all) { p.career.allstar++; p.hype = clamp(p.hype + 12, 0, 100); }
  mine.forEach(() => changeRep(1.2));
  chalUpdate('allstar', mine.length, 'set');
  addNews(`⭐ All-Star Game: ${mine.length ? 'tra i convocati i tuoi ' + mine.map(p => '<b>' + esc(p.name) + '</b>').join(', ') : 'nessun tuo cliente convocato'}.`, mine.length ? 'gold' : '');
  if (mine.length) checkGoal('allstar', true);
}
function extensionOffers() {
  for (const p of clients()) {
    if (p.team == null || p.years !== 1 || p.ovr < 62) continue;
    if (chance(0.75) && makeOffersFor(p, 1, p.team))
      addNews(`🖊️ I ${esc(teamName(teamOf(p)))} propongono il rinnovo a ${esc(p.name)}. Trattativa aperta.`);
  }
}
function randomLeagueNews() {
  const p = pick(Object.values(S.players).filter(x => x.team != null && !isClient(x) && x.ovr >= 75));
  if (!p) return;
  const to = tradePlayer(p, false);
  addNews(`🔁 Mercato: ${esc(p.name)} (${p.ovr}) passa ai ${esc(teamName(to))}.`);
}

function playoffs() {
  const seeds = standings().slice(0, 16);
  const str = {}; seeds.forEach(t => str[t.id] = teamStrength(t.id));
  let round = seeds.map(t => t.id);
  const names = ['Primo turno', 'Semifinali di conference', 'Finali di conference', 'Finali'];
  const playoffTeams = new Set(round);
  chalUpdate('playoff', clients().filter(p => playoffTeams.has(p.team)).length, 'set');
  let r = 0, finalTxt = '';
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length / 2; i++) {
      const a = round[i], b = round[round.length - 1 - i];
      let wa = 0, wb = 0;
      while (wa < 4 && wb < 4) chance(winProb(str[a] + 0.8, str[b])) ? wa++ : wb++;
      const w = wa === 4 ? a : b;
      next.push(w);
      if (round.length === 2) finalTxt = `${teamName(S.teams[w])} battono ${teamName(S.teams[w === a ? b : a])} ${Math.max(wa, wb)}-${Math.min(wa, wb)}`;
    }
    round = next; r++;
  }
  const champ = round[0];
  S.lastChampion = champ;
  addNews(`🏆 <b>${esc(names[3])}</b>: i ${esc(finalTxt)}! Campioni ${seasonLabel()}.`, 'gold');
  for (const p of clients()) {
    if (p.team === champ) {
      p.career.titles++; p.hype = clamp(p.hype + 12, 0, 100); p.morale = clamp(p.morale + 15, 0, 100);
      changeRep(4); addNews(`💍 Il tuo cliente <b>${esc(p.name)}</b> è campione!`, 'gold'); checkGoal('ring', true);
    } else if (playoffTeams.has(p.team)) changeRep(0.3);
  }
  // premi
  const pool = Object.values(S.players).filter(p => p.team != null && !p.retired && p.gp > 20);
  const mvp = pool.sort((a, b) => playerScore(b) - playerScore(a))[0];
  if (mvp) {
    mvp.career.mvp++; mvp.hype = clamp(mvp.hype + 30, 0, 100);
    addNews(`🥇 MVP della stagione: <b>${esc(mvp.name)}</b> (${esc(teamName(teamOf(mvp)))}, ${statLine(mvp)}).`, 'gold');
    if (isClient(mvp)) { changeRep(6); checkGoal('mvp', true); }
  }
  const rookies = pool.filter(p => p.rookieSeason === S.season).sort((a, b) => avg(b, 'pts') - avg(a, 'pts'));
  if (rookies[0]) {
    const roy = rookies[0]; roy.career.roy++; roy.hype = clamp(roy.hype + 15, 0, 100);
    addNews(`🌱 Rookie of the Year: <b>${esc(roy.name)}</b> (${statLine(roy)}).`);
    if (isClient(roy)) changeRep(2.5);
  }
  // reputazione di fine stagione in base al portafoglio
  const tot = clients().reduce((s, p) => s + (p.team != null ? p.salary : 0), 0);
  changeRep(tot / 90 - 0.5);
  S.history.push({ season: seasonLabel(), income: S.seasonIncome, expense: S.seasonExpense, rep: S.rep, clients: S.clients.length });
  checkGoal('million', S.seasonIncome >= 1e6);
}

function runDraft() {
  const order = [...standings()].reverse().map(t => t.id);
  // lotteria: rimescola le prime 4 tra le 6 peggiori
  const top = shuffle(order.slice(0, 6));
  const draftOrder = [...top.slice(0, 4), ...order.filter(id => !top.slice(0, 4).includes(id))];
  const pros = Object.values(S.players).filter(p => p.school && !p.retired && p.skipDraft !== S.season)
    .sort((a, b) => draftScore(b) - draftScore(a));
  const avail = [...pros];
  let n = 0;
  const mine = [];
  for (let round = 1; round <= 2; round++) {
    for (const tid of draftOrder) {
      if (!avail.length) break;
      // una squadra mantiene la promessa se il ragazzo non è troppo indietro nella sua lista
      const pi = avail.findIndex(x => x.promise === tid);
      const p = avail.splice(pi >= 0 && pi <= 14 ? pi : 0, 1)[0];
      n++;
      if (pi >= 0 && pi <= 14 && isClient(p)) changeTeamRel(tid, 3);
      const sal = round === 1 ? r1(Math.max(2.2, 11 - (n - 1) * 0.3)) : MIN_SAL;
      p.school = null; p.team = tid; p.salary = sal; p.years = round === 1 ? 4 : 2; p.rookieSeason = S.season + 1;
      p.draftPick = n; p.promise = null; p.draftBoost = 0;
      if (isClient(p)) { mine.push(p); changeRep(round === 1 ? Math.max(0.5, (31 - n) / 5) : 0.3); p.morale = clamp(p.morale + (round === 1 ? 15 : 0), 0, 100); }
    }
  }
  const first = pros[0];
  if (first) addNews(`🎓 Draft ${S.season + 1}: prima scelta assoluta <b>${esc(first.name)}</b> ai ${esc(teamName(teamOf(first)))}.`, 'gold');
  for (const p of mine) addNews(`🎓 Il tuo cliente <b>${esc(p.name)}</b> scelto con la #${p.draftPick} dai ${esc(teamName(teamOf(p)))} (${fmtM(p.salary)} × ${p.years}).`, 'good');
  if (mine.some(p => p.draftPick <= 5)) checkGoal('top5', true);
  if (mine.length) chalUpdate('draft', Math.min(...mine.map(p => p.draftPick)), 'set');
  // non scelti → free agent
  for (const p of Object.values(S.players)) if (p.school && !p.retired) {
    if (p.skipDraft === S.season) { p.promise = null; continue; } // resta un altro anno al college
    p.school = null;
    if (isClient(p)) addNews(`😕 ${esc(p.name)} non è stato scelto: ora è free agent.`, 'warn');
  }
}

/* ================================================================== */
/* Carriera: età, potenziale, carattere, infortuni, camp con leggende  */
/* ================================================================== */
// Quanto può ancora crescere un giocatore in base all'età: da giovane tanto, dai 29 anni il tetto è il livello attuale
const potRoom = age => age <= 20 ? 38 : age <= 21 ? 33 : age <= 22 ? 27 : age <= 23 ? 21 : age <= 24 ? 15 : age <= 25 ? 10 : age <= 26 ? 6 : age <= 27 ? 3 : age <= 28 ? 1 : 0;
function capPot(p) { p.pot = clamp(Math.min(p.pot, p.ovr + potRoom(p.age)), p.ovr, 99); }
function careerPhase(p) {
  if (p.school || p.age <= 22) return p.pot - p.ovr >= 8 ? ['🌱', 'In crescita'] : ['🌱', 'Giovane'];
  if (p.age <= 26) return p.pot - p.ovr >= 4 ? ['📈', 'In ascesa'] : ['💪', 'Nel pieno'];
  if (p.age <= 29) return ['⭐', 'All\'apice'];
  if (p.age <= 32) return ['📉', 'Inizia il declino'];
  return ['🧓', 'Fine carriera'];
}
// Sviluppo di fine stagione (dopo il compleanno)
function developPlayer(p) {
  const pro = hasTrait(p, 'professionista'), amb = hasTrait(p, 'ambizioso'), sat = hasTrait(p, 'appagato');
  let d;
  if (p.age <= 22) d = (p.pot - p.ovr) * rand(0.15, 0.35);
  else if (p.age <= 26) d = (p.pot - p.ovr) * rand(0.15, 0.4) + rand(-1, 1);
  else if (p.age <= 29) d = rand(-1.5, 1.5);
  else if (p.age <= 32) d = rand(-3.5, 0.5);
  else d = rand(-6, -1.5);
  if (pro) d = d < 0 ? d * 0.5 : d + (chance(0.6) ? 1 : 0); // lavora come un matto: cresce di più, cala la metà
  if (amb && p.age <= 30 && chance(0.5)) d += 1;
  if (sat) d = d > 0 ? d * 0.6 : d * 1.3;
  if (hasTrait(p, 'festaiolo') && chance(0.3)) d -= 1;
  if (p.campBoost) { d = d < 0 ? d * 0.5 : d; p.campBoost = false; } // il camp estivo frena il declino
  p.ovr = clamp(Math.round(p.ovr + d), 35, 99);
  p.potNote = null;
  if (amb && p.age <= 29 && chance(0.45)) { p.pot += randi(1, 3); p.potNote = 'up'; }
  if (sat && (p.salary >= 12 || p.career.allstar || p.career.titles) && chance(0.5)) { p.pot -= randi(2, 5); p.potNote = 'down'; }
  capPot(p);
}
// Un infortunio lungo fa perdere un po' di forma, che si recupera piano piano. Lo stakanovista no.
function injuryHit(p, weeks) {
  if (weeks < 3 || hasTrait(p, 'professionista')) return;
  const k = Math.min(4, Math.ceil(weeks / 5));
  p.ovr = Math.max(35, p.ovr - k); p.injDebt = (p.injDebt || 0) + k;
}

/* ---------- Camp estivo con una leggenda ---------- */
const LEGENDS = {
  PG: ['Magic Johnsong', 'Steve Nachos', 'Allen Inverno'], SG: ['Michael Giordano', 'Kobe Manzo', 'Dwyane Guado'],
  SF: ['Larry Uccello', 'Scottie Pipetta', 'Paul Piercing'], PF: ['Tim Donut', 'Dirk Novità', 'Kevin Granata'],
  C: ['Kareem Abdul-Gabbiano', 'Shaquille O\'Nil', 'Hakeem Olé-Juwon'],
};
const CAMPS = [
  { id: 0, label: 'Una settimana', cost: 40, base: 0.5 },
  { id: 1, label: 'Un mese', cost: 90, base: 1 },
  { id: 2, label: 'Tutta l\'estate', cost: 160, base: 2 },
];
const legendFor = p => LEGENDS[p.pos][(p.id + S.season) % 3];
// Stima del camp: stessa formula del risultato vero, senza la parte casuale
function campPreview(p, c) {
  const mod = (hasTrait(p, 'professionista') || hasTrait(p, 'ambizioso') ? 1 : 0) - (hasTrait(p, 'appagato') ? 1 : 0) - (p.age >= 30 ? 1 : 0);
  const lo = Math.round(c.base - 0.5) + mod - (hasTrait(p, 'festaiolo') ? 1 : 0);
  const hi = Math.round(c.base + 1) + mod + (p.age <= 24 ? 1 : 0);
  return [Math.max(0, lo), Math.max(0, hi)];
}
function legendCamp(pid, ci) {
  const p = P(pid), c = CAMPS[ci], cost = c.cost * 1000;
  if (p.campSeason === S.season) return { msg: `${p.name} ha già fatto il camp questa stagione.`, type: 'warn' };
  if (S.cash < cost) return { msg: `Servono ${fmt$(cost)}.`, type: 'bad' };
  spend(cost); p.campSeason = S.season;
  chalUpdate('camp', 1);
  const lg = legendFor(p);
  let gain = Math.round(c.base + rand(-0.5, 1));
  if (p.age <= 24) gain += chance(0.4) ? 1 : 0;
  if (p.age <= 24 && p.pot - p.ovr >= 8 && chance(0.5)) gain += 1; // un vero talento risponde meglio agli allenamenti
  if (p.age >= 30) gain -= 1;
  if (hasTrait(p, 'professionista') || hasTrait(p, 'ambizioso')) gain += 1;
  if (hasTrait(p, 'appagato')) gain -= 1;
  let note = '';
  if (hasTrait(p, 'festaiolo') && chance(0.3)) { gain -= 1; note = ' Ha saltato qualche allenamento per una festa.'; }
  gain = Math.max(0, gain);
  p.ovr = clamp(p.ovr + gain, 35, 99);
  let potUp = 0;
  if (p.age <= 25 && c.id === 2 && chance(0.5)) { potUp = 1; p.pot += potUp; }
  if (p.age >= 29) p.campBoost = true;
  capPot(p);
  p.morale = clamp(p.morale + 5 + c.id * 2, 0, 100);
  const txt = `${c.label} con ${lg}: ${gain ? `+${gain} di valutazione` : 'nessun miglioramento visibile'}${potUp ? `, potenziale +${potUp}` : ''}${p.age >= 29 ? ', il declino rallenterà' : ''}.${note}`;
  addNews(`${ic('dumbbell')} Camp di <b>${esc(p.name)}</b> con la leggenda ${esc(lg)}: ${esc(txt)}`, gain ? 'good' : '');
  return { msg: txt, type: gain ? 'good' : 'info' };
}

function offseason() {
  const retiredNow = [];
  for (const p of Object.values(S.players)) {
    if (p.retired) continue;
    p.age++;
    // sviluppo: età, carattere, camp estivo
    const before = p.ovr;
    developPlayer(p);
    // traguardi dei tuoi giocatori: un campione costruito da te
    if (isClient(p)) for (const lvl of [85, 90, 95]) if (before < lvl && p.ovr >= lvl) {
      addNews(`🌟 <b>${esc(p.name)}</b> è arrivato a <b>${lvl}</b> di valutazione${p.academy ? ', ed è cresciuto nella tua accademia' : ''}!`, 'gold');
      if (p.academy && lvl >= 90) checkGoal('homegrown', true);
    }
    if (isClient(p) && p.potNote === 'up') addNews(`🔥 ${esc(p.name)} vuole sempre migliorare: il suo potenziale è salito a ${p.pot}.`, 'good');
    if (isClient(p) && p.potNote === 'down') addNews(`😴 ${esc(p.name)} si è accontentato: il suo potenziale è sceso a ${p.pot}.`, 'warn');
    if (p.team != null) p.career.seasons++;
    // ritiro
    const ret = (p.age >= 35 && chance(0.35 + (p.age - 35) * 0.2)) || (p.age >= 31 && p.ovr < 54 && chance(0.5)) ||
      (p.team == null && p.age >= 30 && p.ovr < 60 && chance(0.4));
    if (ret) { p.retired = true; p.team = null; retiredNow.push(p); continue; }
    // contratti
    if (p.team != null) { p.years--; if (p.years <= 0) { p.team = null; p.years = 0; } }
    p.gp = p.pts = p.reb = p.ast = p.min = 0; p.injury = 0;
    p.refusals = Math.max(0, p.refusals - 1);
    p.sponsors = p.sponsors.map(s => ({ ...s, years: s.years - 1 })).filter(s => s.years > 0);
    p.hype *= 0.6;
  }
  for (const p of retiredNow) {
    if (isClient(p)) {
      const c = p.career, bonus = c.titles * 2 + c.allstar * 0.8 + c.mvp * 4 + c.seasons * 0.2;
      changeRep(bonus);
      addNews(`🎖️ Il tuo cliente <b>${esc(p.name)}</b> si ritira dopo ${c.seasons} stagioni (${c.titles} titoli, ${c.allstar} All-Star).`, 'gold');
      S.clients = S.clients.filter(id => id !== p.id);
    }
  }
  // i free agent troppo scarsi escono dal giro
  for (const p of Object.values(S.players)) {
    if (p.team == null && !p.school && !p.retired && !isClient(p) && p.ovr < 54) { p.retired = true; retiredNow.push(p); }
  }
  // pulizia: rimuovi i ritirati non clienti per tenere leggero il salvataggio
  for (const p of retiredNow) recRetire(p);
  for (const p of retiredNow) delete S.players[p.id];
  // rose troppo lunghe
  for (const t of S.teams) {
    const r = rosterOf(t.id).sort((a, b) => a.ovr - b.ovr);
    while (r.length > 15) { const cut = r.shift(); cut.team = null; if (isClient(cut)) addNews(`✂️ ${esc(cut.name)} è stato tagliato dai ${esc(t.name)}.`, 'bad'); }
  }
  for (const t of S.teams) { t.w = 0; t.l = 0; if (S.teamRel[t.id] != null) S.teamRel[t.id] = Math.round(S.teamRel[t.id] + (50 - S.teamRel[t.id]) * 0.2); }
  for (const b of Object.keys(S.brandRel)) S.brandRel[b] = Math.round(S.brandRel[b] + (50 - S.brandRel[b]) * 0.2);
  closeChallenges();
  payDividends();
  // i free agent che non trovano squadra da anni si ritirano: la lega non si gonfia
  const fas = Object.values(S.players).filter(p => p.team == null && !p.school && !p.retired && !isClient(p));
  for (const p of fas) if ((p.age >= 28 && p.ovr < 62) || p.ovr < 50) { p.retired = true; delete S.players[p.id]; }
  const rest = Object.values(S.players).filter(p => p.team == null && !p.school && !p.retired && !isClient(p)).sort((a, b) => b.ovr - a.ovr);
  for (const p of rest.slice(140)) delete S.players[p.id];
  S.offers = [];
  S.talks = {};
  S.season++;
  S.seasonIncome = 0; S.seasonExpense = 0;
  genDraftClass();
  academyClass();
  newChallenges();
  const fa = clients().filter(p => p.team == null).length;
  addNews(`📅 Nuova stagione ${seasonLabel()}. ${fa ? `Hai ${fa} client${fa > 1 ? 'i' : 'e'} free agent: è il momento di trattare!` : ''}`, 'gold');
}

/* ================================================================== */
/* Obiettivi                                                           */
/* ================================================================== */
const GOALS = [
  ['five', 'Rappresenta 5 giocatori'],
  ['sponsor', 'Chiudi un contratto di sponsorizzazione'],
  ['allstar', 'Porta un cliente all\'All-Star Game'],
  ['top5', 'Un cliente scelto tra i primi 5 al Draft'],
  ['bigdeal', 'Firma un contratto da almeno $30M l\'anno'],
  ['million', 'Incassa $1M di commissioni in una stagione'],
  ['ring', 'Un cliente vince il titolo'],
  ['mvp', 'Un cliente vince l\'MVP'],
  ['rep50', 'Reputazione 50'],
  ['rich', 'Patrimonio di $10M'],
  ['legend', 'Reputazione 100: agente leggendario'],
  ['owner', 'Diventa socio di una squadra NBA'],
  ['majority', 'Compra il 51% di una squadra: sei il presidente'],
  ['homegrown', 'Crea un campione: un ragazzo della tua accademia arriva a 90'],
];
// Ricompense degli obiettivi: più è difficile, più si vince
const GOAL_REWARDS = {
  five: { cash: 50 },
  sponsor: { cash: 40, brandRel: 5 },
  allstar: { cash: 100, rep: 2 },
  top5: { cash: 100, rep: 2, teamRel: 5 },
  bigdeal: { cash: 250, rep: 1 },
  million: { cash: 300, staff: 'informer' },
  ring: { cash: 500, rep: 5 },
  mvp: { cash: 750, rep: 5 },
  rep50: { cash: 200, staff: 'office' },
  rich: { rep: 3, staff: 'marketing' },
  legend: { cash: 1000, title: true },
  owner: { rep: 3, teamRel: 3 },
  majority: { cash: 2000, badge: true },
  homegrown: { cash: 1500, rep: 5, star: true },
};
function rewardText(r) {
  const o = [];
  if (r.cash) o.push(fmt$(r.cash * 1000));
  if (r.rep) o.push(`+${r.rep} reputazione`);
  if (r.teamRel) o.push(`+${r.teamRel} rapporto con tutte le squadre`);
  if (r.brandRel) o.push(`+${r.brandRel} rapporto con tutti gli sponsor`);
  if (r.staff) o.push(`${STAFF[r.staff].icon} ${STAFF[r.staff].name} +1 livello gratis`);
  if (r.title) o.push('🏆 titolo di Agente leggendario');
  if (r.badge) o.push('👑 titolo di Presidente');
  if (r.star) o.push('🌟 titolo di Scopritore di talenti');
  return o.join(' · ');
}
function giveReward(k) {
  const r = GOAL_REWARDS[k]; if (!r || (S.goalRewards || {})[k]) return '';
  S.goalRewards = S.goalRewards || {};
  S.goalRewards[k] = true;
  if (r.cash) earn(r.cash * 1000);
  if (r.rep) changeRep(r.rep);
  if (r.teamRel) for (const t of S.teams) changeTeamRel(t.id, r.teamRel);
  if (r.brandRel) for (const b of BRANDS) changeBrandRel(b, r.brandRel);
  let txt = rewardText(r);
  if (r.staff) {
    if ((S.staff[r.staff] || 0) < 5) S.staff[r.staff] = (S.staff[r.staff] || 0) + 1;
    else { earn(150000); txt = txt.replace(/[^·]*livello gratis/, ' $150k (staff già al massimo)'); }
  }
  if (r.title) S.legend = true;
  if (r.badge) S.president = true;
  if (r.star) S.talentScout = true;
  return txt;
}
function checkGoal(k, cond) {
  if (!cond || S.goals[k]) return;
  S.goals[k] = seasonLabel();
  const g = GOALS.find(x => x[0] === k);
  const prize = giveReward(k);
  addNews(`🏅 Obiettivo raggiunto: <b>${esc(g[1])}</b>! Ricompensa: ${esc(prize)}.`, 'gold');
  const msg = [`${g[1]} · Ricompensa: ${prize}`, 'goal', 'Obiettivo!'];
  if (UI.advancing) UI.goalQueue.push(msg); else toast(...msg);
}
function checkGoals() {
  checkGoal('five', S.clients.length >= 5);
  checkGoal('rep50', S.rep >= 50);
  checkGoal('rich', S.cash >= 1e7);
  checkGoal('legend', S.rep >= 100);
}

/* ================================================================== */
/* Interfaccia                                                         */
/* ================================================================== */
let toastTimer = null;
function hideToast() { const el = document.getElementById('toast'); if (el && el.classList.contains('show')) el.classList.add('hidden'); }
// un tocco ovunque fa sparire il banner
let toastAt = 0;
document.addEventListener('pointerdown', () => { if (Date.now() - toastAt > 500) hideToast(); }, true);
const TOAST_TITLES = { good: 'Grande!', bad: 'Ops!', warn: 'Attenzione!', goal: 'Obiettivo!', event: 'Imprevisto!', info: 'Info', intel: 'Soffiata!' };
function toast(msg, type, title) {
  const el = document.getElementById('toast');
  msg = String(msg);
  type = type || (/^✅/.test(msg) ? 'good' : /^❌/.test(msg) ? 'bad' : /^🏅/.test(msg) ? 'goal' : /insufficient|Servono|non hai abbastanza/i.test(msg) ? 'bad' : 'info');
  el.className = 'toast arc ' + type;
  el.setAttribute('role', 'status');
  el.innerHTML = `<b>${esc(title || TOAST_TITLES[type])}</b><span>${esc(msg.replace(EMO_RE, ''))}</span>`;
  void el.offsetWidth; el.classList.add('show'); toastAt = Date.now();
  el.onclick = () => el.classList.add('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, type === 'warn' || type === 'event' || type === 'bad' ? 3400 : 2600);
}

const CALM = ['Nessun imprevisto. I tuoi clienti si sono comportati bene, o hanno imparato a nasconderlo meglio.',
  'Il telefono non ha squillato. Hai controllato tre volte che funzionasse.', 'Niente drammi questa settimana. Goditela, non durerà.',
  'Tutto calmo. Persino i paparazzi sono in ferie.', 'Nessuna rissa, nessun tatuaggio, nessuna intervista sbagliata. Strano.',
  'Settimana liscia. Sospetta, ma liscia.'];
const EMO_KEEP = { '✅': 'check', '❌': 'x', '⚠': 'alert', '▶': 'play' };
const EMO_RE = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D|\p{Extended_Pictographic}|\p{Regional_Indicator})*\s?/gu;
function deEmo(html) {
  return String(html).replace(/(^|>)([^<]+)/g, (m, a, t) => a + t.replace(EMO_RE, e => { const k = EMO_KEEP[[...e][0]]; return k ? ic(k, 'in') + (/\s$/.test(e) ? ' ' : '') : ''; }));
}
const UI = {
  tab: 'home', mkt: 'prospect', q: '', pos: '', sort: 'ovr',

  render() {
    const app = document.getElementById('app');
    if (!S) { app.innerHTML = this.startScreen(); return; }
    const inbox = S.inbox.length;
    const nOffers = S.offers.length;
    const advLabel = { fa: 'Avanza settimana ▶', reg: 'Gioca settimana ▶', po: 'Gioca i playoff ▶', draft: 'Vai al Draft ▶' }[S.phase];
    app.innerHTML = deEmo(`
      <header class="top">
        <div class="top-row">
          <div class="brand">${ic('ball', 'logo')} <span>${esc(S.agency)}</span>${S.legend ? ` <span class="legend" title="Agente leggendario">${ic('trophy')}</span>` : ''}${S.president ? ` <span class="legend" title="Presidente">${ic('crown')}</span>` : ''}${S.talentScout ? ` <span class="legend" title="Scopritore di talenti">${ic('star')}</span>` : ''}</div>
          <div class="spacer"></div>
          <div class="cash-pill ${S.cash < 0 ? 'bad' : ''}" id="t-cash2">${fmt$(S.cash)}</div>
          <button class="btn help" id="t-help" onclick="Tutorial.start()" aria-label="Rivedi il tutorial">?</button>
          <button class="btn primary big ${inbox ? 'blocked' : ''}" id="t-adv" onclick="advance()" ${S.over ? 'disabled' : ''}>${inbox ? `Decidi ${inbox === 1 ? 'l\'imprevisto' : 'gli ' + inbox + ' imprevisti'}` : advLabel}</button>
        </div>
        <nav class="tabs">
          ${[['home', 'Home', inbox, 'home'], ['clients', 'Clienti', nOffers, 'users'], ['market', 'Mercato', 0, 'search'], ['league', 'Lega', 0, 'trophy'], ['staff', 'Staff', 0, 'building']]
            .map(([k, l, b, i]) => `<button id="tab-${k}" class="${this.tab === k ? 'on' : ''}" onclick="UI.go('${k}')">${ic(i)}<span>${l}</span>${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('')}
        </nav>
      </header>
      <main>${this['v_' + this.tab]()}</main>`);
  },
  go(t) { hideToast(); this.tab = t; this.render(); window.scrollTo(0, 0); },
  setGames(on) { S.showGames = on; save(); toast(on ? 'Dopo ogni settimana vedrai i risultati delle partite.' : 'I risultati delle partite non verranno più mostrati.', 'info', on ? 'Risultati accesi' : 'Risultati spenti'); },
  focusEvents(blocked) {
    this.closeModal();
    if (this.tab !== 'home') { this.tab = 'home'; this.render(); }
    const el = document.getElementById('t-ev'); if (!el) return;
    const head = document.querySelector('header.top'), hb = head ? head.getBoundingClientRect().bottom : 0;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - hb - 10, behavior: smooth ? 'smooth' : 'auto' });
    el.classList.remove('nudge', 'shake'); void el.offsetWidth;
    el.classList.add('nudge'); if (blocked) el.classList.add('shake');
  },

  startScreen() {
    const has = hasLocalSave();
    return `<div class="start">
      <div class="start-hero">${heroSVG(null)}</div>
      <h1>Super <span>Agente</span> NBA</h1>
      <p>Costruisci l'agenzia di procuratori più potente del basket americano.</p>
      ${UI.installHint()}
      <form onsubmit="event.preventDefault(); UI.start(this)">
        <label>Il tuo nome<input id="f-agent" name="agent" maxlength="30" placeholder="Es. Marco Rossi" required></label>
        <label>Nome dell'agenzia<input id="f-agency" name="agency" maxlength="34" placeholder="Es. Hoop Dreams Agency" required></label>
        <button class="btn primary big">Fonda l'agenzia</button>
      </form>
      <ul class="rules">
        <li>🔭 <b>Scova talenti</b> tra i prospetti del college e i free agent, poi convincili a firmare con te.</li>
        <li>🤝 <b>Negozia i contratti</b> con le squadre: chiedi troppo e il GM si alza dal tavolo.</li>
        <li>🎬 <b>Ogni settimana un imprevisto</b>: videoclip, tatuaggi, sponsor, litigi col coach…</li>
        <li>💰 Guadagni una <b>commissione</b> su stipendi (1-4%) e sponsor (15%). Se resti in rosso 4 settimane, perdi la licenza.</li>
      </ul>
      ${has ? '<p class="small">C\'è una partita salvata: verrà sovrascritta.</p>' : ''}
      <p class="small muted">Squadre, giocatori, sponsor e personaggi famosi sono parodie con nomi storpiati.</p>
    </div>`;
  },
  // Invito a installare l'app: solo nel browser del telefono, non quando è già installata
  installHint() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    let framed = true; try { framed = window.self !== window.top; } catch (e) { /* dentro un'altra pagina */ }
    if (standalone || framed || window.claude || !/^https?:/.test(location.protocol)) return '';
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return `<div class="install"><b>📲 Installa l'app</b><span>${ios
      ? 'In Safari tocca <b>Condividi</b> (il quadrato con la freccia) e poi <b>Aggiungi alla schermata Home</b>.'
      : 'Apri il menu del browser e scegli <b>Installa app</b> o <b>Aggiungi alla schermata Home</b>.'}
      Si aprirà a schermo intero e funzionerà anche senza internet.</span></div>`;
  },
  start(f) { newGame(f.agency.value.trim(), f.agent.value.trim()); this.tab = 'home'; this.render(); window.scrollTo(0, 0); setTimeout(() => Tutorial.start(), 400); },

  /* ---------- Home ---------- */
  heroPlayer() {
    const cl = clients().filter(p => !p.retired);
    return cl.filter(p => p.team != null).sort((a, b) => b.salary - a.salary)[0] || cl.sort((a, b) => b.ovr - a.ovr)[0] || null;
  },
  v_home() {
    const cl = clients();
    const hp = this.heroPlayer();
    const stars = Math.round(S.rep / 20);
    const ranking = this.agencyRanking();
    const myPos = ranking.findIndex(r => r.mine) + 1;
    const net = weeklyIncomeEstimate() - weeklyCost();
    const hpT = hp && teamOf(hp);
    const feed = S.news.slice(0, 12).map(n => {
      const m = n.text.match(/^(\p{Extended_Pictographic}️?)\s*/u);
      return `<div class="item ${n.cls}"><i>${ic(m ? emoIcon(m[1]) : 'ball')}</i><div>${m ? n.text.slice(m[0].length) : n.text}<small>${esc(n.when)}</small></div></div>`;
    }).join('');
    return `
      <div class="hero">
        ${heroSVG(hp)}
        <div class="hero-txt"><h1>${esc(S.agency)}</h1><p>${seasonLabel()} · ${phaseLabel()}</p></div>
        ${hp ? `<button class="hero-tag" onclick="UI.player(${hp.id})">⭐ ${esc(hp.name)} · #${hp.num}${hpT ? ` · ${esc(hpT.name)}` : ''}${hp.team != null ? ` · ${fmtM(hp.salary)}` : ''}</button>` : ''}
      </div>
      <div class="chips">
        <div class="chip" id="t-cash"><small>💰 Cassa</small><b class="${S.cash < 0 ? 'bad' : ''}">${fmt$(S.cash)}</b><span class="${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${fmt$(net)}/sett.</span></div>
        <div class="chip" id="t-rep"><small>Reputazione</small><b>${S.rep.toFixed(0)}</b><span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span></div>
        <div class="chip" id="t-cl"><small>👥 Clienti</small><b>${cl.length} / ${capacity()}</b><span class="muted">${myPos}ª agenzia</span></div>
      </div>

      <div id="t-ev">
      <div class="sec"><h2>Questa settimana</h2>${S.inbox.length ? `<span class="muted small">${S.inbox.length} da decidere</span>` : ''}</div>
      ${S.inbox.length ? `<div class="must" role="note">${ic('alert')} Decidi prima di avanzare</div><div class="evs">${S.inbox.map(e => this.eventCard(e)).join('')}</div>`
        : `<div class="ev calm"><div class="ev-top"><div class="ev-ico">${ic('ball')}</div><div><h3>Settimana tranquilla</h3><p>${CALM[S.turn % CALM.length]} Premi <b>${{ fa: 'Avanza settimana', reg: 'Gioca settimana', po: 'Gioca i playoff', draft: 'Vai al Draft' }[S.phase]}</b> per andare avanti.</p></div></div></div>`}
      </div>

      ${S.offers.length ? `<div class="sec"><h2>Trattative aperte</h2></div><div class="feed">${[...new Set(S.offers.map(o => o.pid))].map(pid => {
        const p = P(pid), n = S.offers.filter(o => o.pid === pid).length;
        return `<button class="item deal" onclick="UI.negotiation(${pid})">${avatarSVG(p, 40)}<div><b>${esc(p.name)}</b><small>${n} offert${n > 1 ? 'e' : 'a'}${S.offers.some(o => o.pid === pid && o.ext) ? ' · rinnovo' : ''}</small></div><span class="go">Negozia ›</span></button>`;
      }).join('')}</div>` : ''}

      <div class="sec"><h2>⭐ I tuoi giocatori</h2><a href="#" onclick="UI.go('clients');return false">Schede complete</a></div>
      <div class="pls" id="t-pls">${[...cl].sort((a, b) => (b.team != null) - (a.team != null) || b.salary - a.salary || b.ovr - a.ovr).map(p => this.clientRow(p)).join('')}
        ${cl.length < capacity() ? `<button class="pl add" onclick="UI.go('market')">＋ Trova un nuovo cliente nel Mercato</button>` : ''}</div>

      <div class="sec"><h2>Dalla lega</h2></div>
      <div class="feed">${feed}</div>

      ${S.chal ? `<div class="sec" id="t-chal"><h2>Sfide della stagione</h2><span class="muted small">premio ${fmt$(chalReward().cash * 1000)} ciascuna</span></div>
      <div class="chals">${S.chal.list.map(c => `<div class="chal ${c.done ? 'done' : c.failed ? 'failed' : ''}"><b>${esc(CHAL_TYPES[c.id].t(c.n))}</b><small>${esc(chalProgressTxt(c))}</small></div>`).join('')}</div>` : ''}

      <div class="sec"><h2>Obiettivi</h2><span class="muted small">${Object.keys(S.goals).length}/${GOALS.length}</span></div>
      <div class="goals">${GOALS.map(([k, l]) => `<div class="goal ${S.goals[k] ? 'done' : ''}"><span class="gi">${S.goals[k] ? ic('check') : '<i class="box"></i>'}</span>
        <span class="gt"><b>${esc(l)}</b><small>${S.goals[k] ? `Ricompensa ottenuta (${S.goals[k]}): ` : '🎁 '}${esc(rewardText(GOAL_REWARDS[k]))}</small></span></div>`).join('')}</div>

      ${S.history.length ? `<div class="sec"><h2>Storico stagioni</h2></div><div class="tbl-wrap"><table><tr><th>Stagione</th><th class="num">Entrate</th><th class="num">Spese</th><th class="num">Clienti</th><th class="num">Reputazione</th></tr>
        ${S.history.map(h => `<tr><td>${h.season}</td><td class="num good">${fmt$(h.income)}</td><td class="num bad">${fmt$(h.expense)}</td><td class="num">${h.clients}</td><td class="num">${h.rep.toFixed(1)}</td></tr>`).join('')}</table></div>` : ''}
      <div class="sec"><h2>Impostazioni</h2></div>
      <div class="settings">
        <label class="switch-row" for="set-games">
          <span><b>Risultati delle partite</b><small>Dopo ogni settimana mostra le partite dei tuoi giocatori, con statistiche e voto.</small></span>
          <input type="checkbox" id="set-games" class="switch" ${S.showGames !== false ? 'checked' : ''} onchange="UI.setGames(this.checked)">
        </label>
      </div>
      <p style="margin-top:28px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="Tutorial.start()">❓ Rivedi il tutorial</button><button class="btn bad sm" onclick="UI.reset()">Ricomincia da capo</button></p>`;
  },
  eventCard(e) {
    const def = EVENTS.find(x => x.id === e.ev);
    const p = e.pid != null ? P(e.pid) : null;
    if (!def) return '';
    return `<div class="ev ${e.rare ? 'rare' : ''}">${e.rare ? '<div class="rare-tag">Colpo di scena · capita di rado</div>' : ''}
      <div class="ev-top">${p ? `<div class="ev-av">${avatarSVG(p, 54)}<span>${ic(emoIcon(e.ico))}</span></div>` : `<div class="ev-ico">${ic(emoIcon(e.ico))}</div>`}
        <div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${def.trait && TRAITS[def.trait] ? `<span class="trait why">Succede perché è ${TRAITS[def.trait].label.toLowerCase()}</span>` : ''}</div></div>
      <div class="choices">${def.choices.map((ch, i) => {
        return `<button onclick="resolveEvent(${e.id}, ${i})">${esc(ch.label)}<small>${esc(choiceHint(ch, e, p))}</small></button>`;
      }).join('')}</div></div>`;
  },
  agencyRanking() {
    const tot = {}; RIVALS.forEach(r => tot[r] = 0);
    let mine = 0;
    for (const p of Object.values(S.players)) {
      if (p.team == null) continue;
      if (isClient(p)) mine += p.salary; else if (p.agency && tot[p.agency] != null) tot[p.agency] += p.salary;
    }
    const rows = RIVALS.map(r => ({ name: r, sal: tot[r] }));
    rows.push({ name: S.agency, sal: mine, mine: true });
    return rows.sort((a, b) => b.sal - a.sal);
  },

  /* ---------- Clienti ---------- */
  v_clients() {
    const cl = clients().sort((a, b) => b.ovr - a.ovr);
    if (!cl.length) return `<div class="card">Non hai clienti. Vai al <a href="#" onclick="UI.go('market');return false">Mercato</a> per reclutarne.</div>`;
    return `<h2>I tuoi assistiti (${cl.length}/${capacity()})</h2><div class="grid">${cl.map(p => this.playerCard(p)).join('')}</div>`;
  },
  ovrClass: o => o >= 85 ? 't1' : o >= 77 ? 't2' : o >= 70 ? 't3' : '',
  playerCard(p) {
    const t = teamOf(p), offers = S.offers.filter(o => o.pid === p.id).length;
    const mc = p.morale >= 65 ? 'var(--good)' : p.morale >= 35 ? 'var(--warn)' : 'var(--bad)';
    return `<div class="card">
      <div class="pc-head">${avatarSVG(p, 56)}<div class="ovr ${this.ovrClass(p.ovr)}">${p.ovr}</div>
        <div><div class="pc-name">${esc(p.name)}</div>
        <div class="pc-sub">${p.pos} · ${p.age} anni · pot. ${shownPot(p)}</div>
        <div class="traits">${traitChips(p)}</div>
        <div>${p.injury ? `<span class="tag inj">infortunato ${p.injury} sett.</span>` : ''}${!t && !p.school ? '<span class="tag fa">free agent</span>' : ''}${p.school ? '<span class="tag">prospetto Draft</span>' : ''}</div></div></div>
      <dl class="rows">
        <dt>Squadra</dt><dd>${t ? esc(teamName(t)) : p.school ? esc(p.school) : '—'}</dd>
        ${t ? `<dt>Contratto</dt><dd>${fmtM(p.salary)} × ${p.years} ann${p.years > 1 ? 'i' : 'o'}</dd>` : ''}
        <dt>Commissione</dt><dd>${p.comm}%${t ? ` · ${fmt$(p.salary * 1e6 * p.comm / 100)}/anno` : ''}</dd>
        <dt>Fisico</dt><dd>${bodyTxt(p)}</dd>
        <dt>Valore di mercato</dt><dd>${fmtM(marketValue(p))}</dd>
        ${t ? `<dt>Statistiche</dt><dd>${statLine(p)}</dd>` : ''}
        ${p.sponsors.length ? `<dt>Sponsor</dt><dd>${p.sponsors.map(s => esc(s.brand)).join(', ')}</dd>` : ''}
        <dt>Rapporto</dt><dd>${p.morale}/100<div class="bar"><i style="width:${p.morale}%;background:${mc}"></i></div></dd>
        ${(p.promises || []).length ? `<dt>Promesse</dt><dd>${p.promises.map(pr => `${promiseStatus(p, pr)} ${esc(PROMISES[pr.k].label)}${pr.season > S.season ? ' (prossima stagione)' : ''}`).join('<br>')}</dd>` : ''}
      </dl>
      <div class="actions">
        ${offers ? `<button class="btn primary sm" onclick="UI.negotiation(${p.id})">Offerte (${offers})</button>` : ''}
        <button class="btn sm" onclick="UI.doContact(${p.id})" ${p.lastContact === S.turn ? 'disabled' : ''}>${ic('phone')} Contatta</button>
        <button class="btn sm" onclick="UI.recModal(${p.id})">${ic('megaphone')} Consiglia</button>
        <button class="btn sm" onclick="UI.campModal(${p.id})" ${p.campSeason === S.season ? 'disabled' : ''}>${ic('dumbbell')} Camp</button>
        ${!p.school && p.ovr >= 62 ? `<button class="btn sm" onclick="UI.doSponsor(${p.id})" ${S.turn - (p.lastSponsorTry ?? -99) < 4 || p.sponsors.length >= 4 ? 'disabled' : ''} title="$10k · ${Math.round(sponsorChance(p) * 100)}%">💼 Cerca sponsor</button>` : ''}
        <button class="btn sm" onclick="UI.player(${p.id})">Scheda</button>
      </div></div>`;
  },
  doContact(pid) { toast(contact(pid)); save(); this.render(); },

  /* ---------- Mercato ---------- */
  v_market() {
    let list = Object.values(S.players).filter(p => !p.retired && !isClient(p));
    if (this.mkt === 'prospect') list = list.filter(p => p.school);
    else if (this.mkt === 'fa') list = list.filter(p => p.team == null && !p.school);
    else list = list.filter(p => p.team != null);
    if (this.pos) list = list.filter(p => p.pos === this.pos);
    if (this.q) { const q = this.q.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q)); }
    const key = { ovr: p => shownOvr(p), pot: p => shownPot(p), age: p => -p.age, val: p => shownValue(p) }[this.sort];
    list.sort((a, b) => key(b) - key(a));
    const full = clients().length >= capacity();
    const pros = this.mkt === 'prospect';
    // gruppi ben separati: i tuoi obiettivi, chi è libero, chi ha già un agente
    const groups = [];
    if (pros) groups.push(['🎯 I tuoi obiettivi', 'Prospetti con cui hai già un legame', list.filter(p => (p.bond || 0) >= 30 && p.agency !== S.agency), 'target']);
    groups.push(['🟢 Senza agente', 'I più facili da convincere', list.filter(p => !p.agency && !(pros && (p.bond || 0) >= 30)), 'free']);
    groups.push(['🔒 Con altre agenzie', 'Più difficili: devi strapparli a un rivale', list.filter(p => p.agency && !(pros && (p.bond || 0) >= 30)), 'rival']);
    return `
      <h2>Mercato</h2>
      <div class="filters">
        <div class="seg">${[['prospect', '🎓 Prospetti'], ['fa', '🆓 Free agent'], ['pro', '📝 Sotto contratto']].map(([k, l]) =>
          `<button class="${this.mkt === k ? 'on' : ''}" onclick="UI.mkt='${k}';UI.render()">${l}</button>`).join('')}</div>
        <select id="f-pos" onchange="UI.pos=this.value;UI.render()" aria-label="Ruolo"><option value="">Tutti i ruoli</option>${POS.map(x => `<option ${this.pos === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <select id="f-sort" onchange="UI.sort=this.value;UI.render()" aria-label="Ordina">${[['ovr', 'Ordina: OVR'], ['pot', 'Ordina: potenziale'], ['age', 'Ordina: più giovani'], ['val', 'Ordina: valore']].map(([k, l]) => `<option value="${k}" ${this.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input id="f-q" placeholder="Cerca nome…" value="${esc(this.q)}" onchange="UI.q=this.value;UI.render()" aria-label="Cerca">
      </div>
      ${full ? '<div class="note warn">Hai raggiunto il limite di clienti: amplia gli <b>Uffici</b> nella scheda Staff.</div>' : ''}
      ${pros ? this.intelBox() : ''}
      <p class="small muted">${pros ? 'Le valutazioni dei prospetti sono stime (~). <b>🔭 Osserva</b> per vederli meglio, <b>🤝 Coltiva</b> per creare un legame prima del Draft: chi ti è legato accetta più facilmente e a volte sceglie te da solo.' :
        this.mkt === 'fa' ? 'I free agent firmati in Free Agency ricevono subito offerte dalle squadre.' : 'Strappare un giocatore a un\'agenzia rivale è più difficile.'}</p>
      ${groups.filter(g => g[2].length).map(([h, sub, g, cls]) => `
        <section class="mk-group">
          <div class="mk-head"><h3>${h} <span>${g.length}</span></h3><small>${sub}</small></div>
          <div class="mk-list">${g.slice(0, 30).map(p => this.mkCard(p, cls, full)).join('')}</div>
          ${g.length > 30 ? `<p class="small muted">Mostrati 30 di ${g.length}: usa filtri e ricerca per gli altri.</p>` : ''}
        </section>`).join('') || '<div class="card muted">Nessun giocatore con questi filtri.</div>'}`;
  },
  mkCard(p, cls, full) {
    const ex = exact(p), t = teamOf(p), bond = p.bond || 0;
    const intel = !ex && p.intelPot != null;
    const deadline = p.rivalDeadline != null && !p.agency ? p.rivalDeadline - S.turn : null;
    return `<article class="mk ${cls}">
      <button class="mk-main" onclick="UI.player(${p.id})">
        ${avatarSVG(p, 48)}
        <span class="mk-info"><b>${esc(p.name)}${p.gem ? ' ' + ic('gem', 'in gem') : p.academy ? ' ' + ic('cap', 'in') : ''}${p.star || p.vip ? ' ' + ic('star', 'in star') : ''}</b>
          <span>${p.pos} · ${p.age} anni · ${p.h || (genBody(p), p.h)} cm · ${p.school ? esc(p.school) : t ? esc(teamName(t)) : 'senza squadra'}</span>
          <span class="${p.agency ? '' : 'good'}">${p.agency ? ic('lock', 'in') + ' ' + esc(p.agency) : '<i class="dot good"></i>nessun agente'}</span>
          <span class="ti">${(p.traits || []).map(t => TRAITS[t].label).join(' · ')}</span></span>
        <span class="mk-rat"><span><small>OVR</small><b>${ex ? '' : '~'}${shownOvr(p)}</b></span><span><small>POT</small><b class="pot">${ex ? '' : '~'}${shownPot(p)}</b></span></span>
      </button>
      ${p.school ? `<div class="mk-bond"><small>Legame</small><div class="bar"><i style="width:${bond}%;background:${bond >= 70 ? 'var(--good)' : bond >= 30 ? 'var(--accent)' : 'var(--muted)'}"></i></div><b>${bond}</b></div>` : ''}
      ${intel || p.bondTip || deadline != null ? `<div class="mk-tags">${intel ? '<span class="tag intel">🕵️ soffiata sul potenziale</span>' : ''}${p.bondTip ? '<span class="tag hot">💬 vuole essere seguito</span>' : ''}${deadline != null ? `<span class="tag inj">⏳ un rivale lo firma tra ${Math.max(0, deadline)} sett.</span>` : ''}</div>` : ''}
      <div class="mk-foot"><span class="val">Valore ${ex ? '' : '~'}${fmtM(shownValue(p))}</span>
        <span class="mk-act">
          ${!ex && p.school ? `<button class="btn sm" onclick="UI.doScout(${p.id})" title="Manda uno scout">${ic('eye')} Osserva</button>` : ''}
          ${p.school ? `<button class="btn sm" onclick="UI.doCultivate(${p.id})" ${p.lastBond === S.turn ? 'disabled' : ''} title="Costa ${fmt$(cultivateCost(p))}">🤝 Coltiva ${fmt$(cultivateCost(p))}</button>` : ''}
          <button class="btn primary sm" onclick="UI.pitchModal(${p.id})" ${full ? 'disabled' : ''}>Proponi</button>
        </span></div>
    </article>`;
  },
  intelBox() {
    const lv = S.staff.informer || 0;
    if (!lv) return `<div class="intel-box"><div class="ib-head"><span>${ic('eye')}</span><div><b>Nessun informatore</b><small>Assumine uno nella scheda Staff: durante l'anno ti passerà soffiate sui prospetti del prossimo Draft.</small></div>
      <button class="btn sm" onclick="UI.go('staff')">Assumi</button></div></div>`;
    return `<div class="intel-box"><div class="ib-head"><span>${ic('eye')}</span><div><b>Il tuo informatore · ${INFORMER_LV[lv]}</b><small>${lv <= 2 ? 'È ancora alle prime armi: a volte sbaglia. Potenzialo nella scheda Staff.' : 'Le sue soffiate sono affidabili.'}</small></div></div>
      ${S.intel.length ? `<ul>${S.intel.slice(0, 4).map(r => `<li><a href="#" onclick="UI.player(${r.pid});return false">${esc(r.text)}</a><small>${esc(r.when)}</small></li>`).join('')}</ul>` : '<p class="small muted">Ancora nessuna soffiata: arriveranno nelle prossime settimane.</p>'}</div>`;
  },
  doCultivate(pid) { const r = cultivate(pid); toast(r.msg, r.type); save(); this.render(); },
  doScout(pid) { toast(scout(pid), 'intel', 'Rapporto scout'); save(); this.render(); },

  /* ---------- Righe dei clienti in Home ---------- */
  clientRow(p) {
    const t = teamOf(p), L = p.last, ng = nextGameTxt(p);
    let meta;
    if (p.injury) meta = `🚑 Fermo ancora ${p.injury} sett.${p.injDebt ? ` · forma −${p.injDebt}` : ''}`;
    else if (p.injDebt) meta = `🩹 Sta tornando in forma (−${p.injDebt} di valutazione per qualche settimana)`;
    else if (p.school) { const pr = draftProjection(p); meta = `🎓 ${esc(p.school)} · proiezione Draft <b>#${pr}</b>${p.promise != null ? ` · 📣 promesso ai ${esc(S.teams[p.promise].name)}` : ''}`; }
    else if (!t) { const n = S.offers.filter(o => o.pid === p.id).length; meta = `🆓 Senza squadra${n ? ` · <b>${n} offert${n > 1 ? 'e' : 'a'}</b>` : ''}`; }
    else meta = `${ng ? `📅 Prossima: <b>${esc(ng)}</b> · ` : ''}🏆 ${teamRank(t.id)}ª in classifica (${t.w}-${t.l})`;
    const stats = t && p.gp ? `<div class="pl-stats"><span><b>${r1(avg(p, 'min'))}</b>MIN</span><span><b>${r1(avg(p, 'pts'))}</b>PTS</span><span><b>${r1(avg(p, 'reb'))}</b>REB</span><span><b>${r1(avg(p, 'ast'))}</b>AST</span></div>` : '';
    return `<button class="pl" onclick="UI.player(${p.id})">
      ${avatarSVG(p, 52)}
      <span class="pl-main"><span class="pl-name"><b>${esc(p.name)}</b><span class="ov ${this.ovrClass(p.ovr)}">${p.ovr}</span></span>
        <span class="pl-sub">${careerPhase(p).join(' ')} · ${p.pos} · ${p.age} anni${t ? ` · ${esc(t.name)} #${p.num}` : ''}${t && p.gp ? ` · ${p.gp} gare` : ''}</span>
        <span class="pl-meta">${meta}</span>${stats}</span>
      ${L && t ? `<span class="pl-last"><span class="grade ${gradeClass(L.grade)}">${L.grade}</span><small>ultima</small></span>` : ''}
    </button>`;
  },

  /* ---------- Risultati della settimana ---------- */
  showWeek(after) {
    const rows = clients().filter(p => p.week && p.week.length).sort((a, b) => b.salary - a.salary);
    if (!rows.length) { after && after(); return; }
    let box = document.getElementById('weekres');
    if (!box) { box = document.createElement('div'); box.id = 'weekres'; document.body.appendChild(box); }
    const best = rows.reduce((m, p) => { const g = p.week.reduce((x, y) => (y.pts + y.reb * .5 + y.ast * .7) > (x.pts + x.reb * .5 + x.ast * .7) ? y : x); return !m || (g.pts + g.reb * .5 + g.ast * .7) > m.s ? { p, g, s: g.pts + g.reb * .5 + g.ast * .7 } : m; }, null);
    box.innerHTML = deEmo(`<div class="wr-panel" role="dialog" aria-label="Risultati della settimana">
      <div class="wr-title">Risultati · settimana ${S.week - 1 || REG_WEEKS}</div>
      ${best && best.g.grade[0] === 'A' ? `<div class="wr-top">Partita top: <b>${esc(best.p.name)}</b> ${best.g.pts} pt · ${best.g.reb} rb · ${best.g.ast} as <span class="grade ${gradeClass(best.g.grade)}">${best.g.grade}</span></div>` : ''}
      <div class="wr-list">${rows.map(p => {
        const L = p.week[p.week.length - 1], w = p.week.filter(g => g.win).length, n = p.week.length;
        return `<div class="wr-row ${L.grade[0] === 'A' ? 'top' : ''}">${avatarSVG(p, 40)}
          <div class="wr-info"><b>${esc(p.name)}</b><span>${L.win ? '<b class="good">V</b>' : '<b class="bad">P</b>'} ${L.us}-${L.them} ${L.home ? 'vs' : '@'} ${esc(S.teams[L.opp].name)} · settimana ${w}-${n - w}${n < 4 ? ` (${4 - n} saltat${4 - n > 1 ? 'e' : 'a'})` : ''}</span>
          <span class="wr-line">${L.min != null ? `${L.min}' · ` : ''}${L.pts} pt · ${L.reb} rb · ${L.ast} as</span></div>
          <span class="grade big ${gradeClass(L.grade)}">${L.grade}</span></div>`;
      }).join('')}</div>
      <div class="wr-foot"><button class="btn primary wr-go" id="wr-go">Continua ▶</button>
      <button class="wr-off" id="wr-off">Non mostrare più i risultati</button></div></div>`);
    box.hidden = false;
    let closed = false;
    const close = () => { if (closed) return; closed = true; box.hidden = true; clearTimeout(this.wrTimer); after && after(); };
    document.getElementById('wr-go').onclick = close;
    document.getElementById('wr-off').onclick = () => { S.showGames = false; save(); close(); this.render(); toast('Non vedrai più i risultati dopo ogni settimana. Puoi riattivarli in Home, sezione Impostazioni.', 'info', 'Risultati spenti'); };
    box.onclick = e => { if (e.target === box) close(); };
    this.wrTimer = setTimeout(close, 6000 + rows.length * 600);
  },

  /* ---------- Trattativa per diventare suo agente ---------- */
  pitchModal(pid) {
    const p = P(pid), t = S.talks[pid];
    if (!t) {
      const c = openChance(p), cost = pitchCost(p);
      const blocked = p.lockedUntil > S.season ? 'Non vuole parlarti fino alla prossima stagione.' : p.lastPitch === S.turn ? 'Ti ha già detto di no questa settimana.' : '';
      return this.openModal(`
        <div class="tk-head">${avatarSVG(p, 64)}<div><h3>${esc(p.name)}</h3><p class="muted small">${p.pos} · ${p.age} anni · OVR ${exact(p) ? '' : '~'}${shownOvr(p)} · POT ${exact(p) ? '' : '~'}${shownPot(p)}<br>${p.agency ? '🔒 assistito da ' + esc(p.agency) : '🟢 senza agente'}${p.school ? ` · legame ${p.bond || 0}/100` : ''}</p></div></div>
        <p>Prima di tutto deve credere che tu possa rappresentarlo. Se accetta l'incontro, si apre una trattativa: tu offri, lui fa la sua controfferta.</p>
        <div class="tk-odds"><span>Probabilità che accetti di incontrarti</span><b class="${c > .6 ? 'good' : c > .3 ? 'warn' : 'bad'}">${Math.round(c * 100)}%</b></div>
        <p class="small muted">Organizzare l'incontro costa ${fmt$(cost)}. Contano la tua reputazione, il legame con lui e se ha già un agente.</p>
        ${blocked ? `<p class="bad">${blocked}</p>` : ''}
        <div class="actions"><button class="btn primary" onclick="UI.doStartTalk(${pid})" ${blocked ? 'disabled' : ''}>Chiedi un incontro — ${fmt$(cost)}</button>
        <button class="btn" onclick="UI.closeModal()">Annulla</button></div>`);
    }
    const hearts = '<i class="pip"></i>'.repeat(Math.max(0, t.patience)) + '<i class="pip off"></i>'.repeat(Math.max(0, t.max - t.patience));
    const sug = { comm: Math.min(4, t.ask.comm + 0.5), bonus: Math.max(0, Math.round(t.ask.bonus * 0.8 / 5) * 5) };
    this.openModal(`
      <div class="tk-head">${avatarSVG(p, 64)}<div><h3>Trattativa con ${esc(p.name)}</h3><p class="muted small">${p.pos} · ${p.age} anni · OVR ${exact(p) ? '' : '~'}${shownOvr(p)}${p.agency ? ' · 🔒 ' + esc(p.agency) : ''}</p></div></div>
      <div class="tk-pat"><span>Pazienza</span><span class="hearts">${hearts}</span></div>
      <div class="tk-ask"><small>La sua richiesta</small><b>${talkTxt(t.ask)}</b></div>
      <ul class="tk-log">${t.log.slice(-5).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="neg-form">
        <label>Commissione che chiedi: <b id="tk-cv">${sug.comm}%</b><input id="tk-c" type="range" min="1" max="4" step="0.5" value="${sug.comm}" oninput="document.getElementById('tk-cv').textContent=this.value+'%'"></label>
        <label>Bonus alla firma (migliaia di $)<input id="tk-b" type="number" min="0" step="5" value="${sug.bonus}"></label>
      </div>
      <div class="promises"><b>🤝 Promesse</b> <span class="small muted">valgono come moneta, ma vanno mantenute entro fine stagione regolare</span>
        ${Object.entries(PROMISES).filter(([k]) => promiseFeasible(p, k)).map(([k, pr]) => `<label class="pr-row"><input type="checkbox" id="tk-pr-${k}"><span>${pr.label}${pr.likes.some(t => hasTrait(p, t)) ? ' <span class="good small">· gli piace molto</span>' : ''}</span></label>`).join('')}</div>
      <p class="small muted">Più commissione chiedi, più guadagni ogni anno, ma più si irrita. Se tiri troppo si offende e chiede di più. Un'agenzia rivale può sempre intromettersi: non tirarla per le lunghe.</p>
      <div class="actions">
        <button class="btn primary" onclick="UI.doTalkOffer(${pid})">Fai l'offerta</button>
        <button class="btn good" onclick="UI.doTalkAccept(${pid})">Accetta la sua richiesta</button>
        <button class="btn bad" onclick="UI.doTalkQuit(${pid})">Lascia perdere</button>
      </div>`);
  },
  doStartTalk(pid) {
    const r = startTalk(pid); save(); this.render();
    if (r.ok) { toast(`${P(pid).name} ha accettato di incontrarti!`, 'good', 'Si tratta!'); this.pitchModal(pid); }
    else { this.closeModal(); toast(r.msg, r.type); }
  },
  doTalkOffer(pid) {
    const c = +document.getElementById('tk-c').value, b = +document.getElementById('tk-b').value || 0;
    const prom = Object.keys(PROMISES).filter(k => { const el = document.getElementById('tk-pr-' + k); return el && el.checked; });
    const r = talkOffer(pid, c, b, prom); save(); this.render();
    if (!r) return;
    if (r.done) { this.closeModal(); toast(r.msg, r.type, r.type === 'good' ? 'Firmato!' : undefined); }
    else { toast(r.msg, r.type); this.pitchModal(pid); }
  },
  doTalkAccept(pid) { const r = talkAcceptAsk(pid); save(); this.render(); if (!r) return; if (r.done) { this.closeModal(); toast(r.msg, r.type, 'Firmato!'); } else toast(r.msg, r.type); },
  doTalkQuit(pid) { talkQuit(pid); save(); this.closeModal(); this.render(); toast('Trattativa chiusa. Potrai riprovare più avanti.', 'info'); },

  /* ---------- Consiglia a una squadra ---------- */
  recModal(pid) {
    const p = P(pid);
    const teams = S.teams.filter(t => t.id !== p.team).map(t => ({ t, c: recChance(p, t.id), slot: draftSlot(t.id), rel: teamRel(t.id) }));
    teams.sort((a, b) => b.c - a.c || a.slot - b.slot);
    const done = p.lastRec === S.turn;
    const intro = p.school
      ? `Consiglia ${esc(p.name)} a una squadra: se ti ascoltano, lo sceglieranno al Draft se è ancora libero al loro turno, e sale nelle classifiche. Oggi è proiettato alla <b>#${draftProjection(p)}</b>.`
      : p.team == null ? `Consiglia ${esc(p.name)} a una squadra: se ti ascoltano, gli fanno un'offerta.`
        : `Proponi ${esc(p.name)} a un'altra squadra: se ti ascoltano, organizzano uno scambio.`;
    this.openModal(`<h3>${ic('megaphone')} Consiglia ${esc(p.name)}</h3><p class="small">${intro}</p>
      <p class="small muted">Più è buono il tuo rapporto con la squadra, più ti danno retta. Se non ti ascoltano, il rapporto cala un po'. Una volta a settimana per giocatore.</p>
      ${done ? '<p class="warn">Ne hai già parlato con una squadra questa settimana.</p>' : ''}
      <div class="rec-list">${teams.map(({ t, c, slot, rel }) => `<div class="rec">
        <span class="rec-t"><b>${esc(teamName(t))}</b><small>${p.school ? `scelta #${slot} · ` : ''}rapporto ${relLabel(rel)}</small></span>
        <span class="rec-c ${c > .6 ? 'good' : c > .3 ? 'warn' : 'bad'}">${Math.round(c * 100)}%</span>
        <button class="btn sm primary" onclick="UI.doRecommend(${pid}, ${t.id})" ${done ? 'disabled' : ''}>Consiglia</button></div>`).join('')}</div>`);
  },
  campModal(pid) {
    const p = P(pid), lg = legendFor(p), done = p.campSeason === S.season;
    this.openModal(`<h3>${ic('dumbbell')} Camp con ${esc(lg)}</h3>
      <p class="small">La leggenda ${esc(lg)} può allenare ${esc(p.name)} (${careerPhase(p).join(' ').toLowerCase()}, ${p.age} anni, OVR ${p.ovr}). I giovani migliorano di più, i veterani rallentano il declino. Contano anche il carattere e la voglia di lavorare.</p>
      ${done ? '<p class="warn">Ha già fatto il camp in questa stagione.</p>' : ''}
      <div class="rec-list">${CAMPS.map(c => { const [lo, hi] = campPreview(p, c); return `<div class="rec">
        <span class="rec-t"><b>${c.label}</b><small>Miglioramento previsto: ${lo === hi ? `+${lo}` : `da +${lo} a +${hi}`} di valutazione${p.age <= 25 && c.id === 2 ? ' · può alzare il potenziale' : ''}</small></span>
        <button class="btn sm primary" onclick="UI.doCamp(${pid}, ${c.id})" ${done || S.cash < c.cost * 1000 ? 'disabled' : ''}>${fmt$(c.cost * 1000)}</button></div>`; }).join('')}</div>`);
  },
  doCamp(pid, ci) { const r = legendCamp(pid, ci); save(); this.closeModal(); this.render(); toast(r.msg, r.type, r.type === 'good' ? 'Allenamento!' : undefined); },
  doSponsor(pid) { const r = seekSponsor(pid); save(); this.render(); toast(r.msg, r.type, r.type === 'good' ? 'Sponsor!' : undefined); },
  doRecommend(pid, tid) { const r = recommend(pid, tid); save(); this.closeModal(); this.render(); toast(r.msg, r.type, r.type === 'good' ? 'Ti hanno ascoltato!' : undefined); },

  /* ---------- Trattative ---------- */
  negotiation(pid, selId = null, msg = '') {
    const p = P(pid);
    const offers = S.offers.filter(o => o.pid === pid);
    if (!offers.length) { this.closeModal(); this.render(); return; }
    const sel = offers.find(o => o.id === selId) || offers[0];
    const pr = PREFS[prefOf(p)];
    const others = offers.filter(o => o.id !== sel.id);
    const best = others.length ? Math.max(...others.map(o => o.salary)) : 0;
    this.openModal(`
      <div class="tk-head">${avatarSVG(p, 56)}<div><h3>Trattative per ${esc(p.name)}</h3>
        <p class="muted small">${p.pos} · ${p.age} anni · OVR ${p.ovr} · valore stimato <b>${valRange(p)}</b> · commissione ${p.comm}%</p></div></div>
      <div class="pref">${pr[0]} Per lui conta soprattutto <b>${pr[1]}</b>. Se firma dove non gli piace, il rapporto con te ne risente.</div>
      ${offers.map(o => { const [f, why] = teamFit(p, o.teamId, o.salary); const wl = weeksLeft(o); return `<div class="offer ${o.id === sel.id ? 'sel' : ''}" onclick="UI.negotiation(${pid}, ${o.id})" style="cursor:pointer">
        <div class="of-top"><b>${esc(teamName(S.teams[o.teamId]))}</b>${o.ext ? '<span class="tag">rinnovo</span>' : ''}${o.final ? '<span class="tag inj">offerta finale</span>' : ''}<span class="fit">${fitIcon(f)} ${esc(why)}</span></div>
        <div>${fmtM(o.salary)} × ${o.years} ann${o.years > 1 ? 'i' : 'o'} · totale ${fmtM(o.salary * o.years)}</div>
        <div class="small muted">Pazienza GM: <span class="patience">${'<i class="pip"></i>'.repeat(Math.max(0, o.patience))}${'<i class="pip off"></i>'.repeat(Math.max(0, 3 - o.patience))}</span> · rapporto ${relLabel(teamRel(o.teamId))}${wl != null ? ` · <span class="${wl <= 1 ? 'warn' : ''}">⏳ ${wl <= 1 ? 'scade questa settimana' : `ancora ${wl} settimane`}</span>` : ''}</div>
      </div>`; }).join('')}
      ${msg ? `<p class="warn">${esc(msg)}</p>` : ''}
      <h3 style="margin-top:14px">Trattativa con ${esc(S.teams[sel.teamId].name)}</h3>
      <div class="neg-form">
        <label>Stipendio richiesto (M$/anno)<input id="ask" type="number" step="0.1" min="${MIN_SAL}" max="${MAX_SAL}" value="${r1(sel.salary * 1.12)}"></label>
        <label>Anni<select id="yrs">${[1, 2, 3, 4, 5].map(y => `<option ${y === sel.years ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>
      <p class="small muted">Chiedere troppo fa perdere pazienza al GM. <b>Contratto corto</b>: se migliora, il prossimo sarà più ricco (e anche la tua commissione), ma rischi se si infortuna o cala. <b>Contratto lungo</b>: soldi sicuri. ${p.age >= 30 ? 'A questa età preferisce la sicurezza.' : hasTrait(p, 'ambizioso') && p.age <= 25 ? 'Da ambizioso preferirebbe un contratto corto.' : ''}</p>
      <div class="actions">
        <button class="btn good" onclick="UI.doAccept(${sel.id})">Accetta ${fmtM(sel.salary)} × ${sel.years}</button>
        <button class="btn primary" onclick="UI.doCounter(${pid}, ${sel.id})" ${sel.final ? 'disabled' : ''}>Controproposta</button>
        <button class="btn bad" onclick="UI.doReject(${pid}, ${sel.id})">Rifiuta</button>
      </div>
      ${sel.lev || sel.final ? '' : `<div class="lev">
        <b>📢 Gioca la carta dell'asta</b>
        <p class="small muted">Dì ai ${esc(S.teams[sel.teamId].name)} che hai un'offerta più alta: possono rilanciare, fermarsi o ritirarsi. ${best ? `La tua offerta migliore vera è <b>${fmtM(best)}</b>.` : 'Non hai altre offerte: sarebbe un bluff.'} Se bluffi e ti scoprono, ritirano l'offerta. Una volta sola per squadra.</p>
        <div class="lev-row"><input id="claim" type="number" step="0.1" value="${r1(best > sel.salary ? best : sel.salary * 1.15)}" aria-label="Offerta che citi (M$)"><button class="btn sm" onclick="UI.doLeverage(${pid}, ${sel.id})">Cita questa offerta</button></div>
      </div>`}`);
  },
  doLeverage(pid, oid) {
    const r = leverage(oid, +document.getElementById('claim').value); save(); this.render();
    toast(r.msg, r.type, r.type === 'good' ? 'Rilancio!' : r.type === 'bad' ? 'Ops!' : undefined);
    if (S.offers.some(o => o.pid === pid)) this.negotiation(pid, r.done ? null : oid); else this.closeModal();
  },
  doAccept(oid) { const r = acceptOffer(oid); save(); this.closeModal(); this.render(); if (r && r.msg) toast(r.msg, 'bad'); else toast('Contratto firmato!', 'good'); },
  doCounter(pid, oid) {
    const ask = r1(+document.getElementById('ask').value), yrs = +document.getElementById('yrs').value;
    if (!(ask >= MIN_SAL)) return toast(`Minimo ${fmtM(MIN_SAL)}.`);
    const r = negotiate(oid, Math.min(ask, MAX_SAL), yrs);
    save();
    if (r.done && !S.offers.some(o => o.pid === pid)) { this.closeModal(); this.render(); toast(r.msg); return; }
    this.render(); this.negotiation(pid, r.done ? null : oid, r.msg);
  },
  doReject(pid, oid) {
    const o = S.offers.find(x => x.id === oid);
    S.offers = S.offers.filter(x => x.id !== oid);
    if (o) changeTeamRel(o.teamId, -2);
    if (o) addNews(`❌ Rifiutata l'offerta dei ${esc(teamName(S.teams[o.teamId]))} per ${esc(P(pid).name)}.`);
    save(); this.render(); this.negotiation(pid);
  },

  /* ---------- Scheda giocatore ---------- */
  player(pid) {
    const p = P(pid), t = teamOf(p), mine = isClient(p), ex = exact(p);
    const c = p.career;
    this.openModal(`
      <div class="pc-head">${avatarSVG(p, 72)}<div class="ovr ${this.ovrClass(p.ovr)}">${ex ? '' : '~'}${shownOvr(p)}</div>
        <div><div class="pc-name">${esc(p.name)} ${mine ? '<span class="tag fa">tuo cliente</span>' : ''}</div>
        <div class="pc-sub">${POS_IT[p.pos]} · ${p.age} anni · potenziale ${ex ? '' : '~'}${shownPot(p)}</div>
        <div class="phase">${careerPhase(p).join(' ')}${p.injDebt ? ` · 🩹 forma −${p.injDebt}` : ''}</div></div></div>
      <div class="traits">${traitChips(p)}</div>
      <p class="story">${esc(storyOf(p))}</p>
      ${(p.traits || []).map(t => `<p class="small muted trait-desc"><b>${TRAITS[t].label}</b>: ${TRAITS[t].desc}</p>`).join('')}
      <dl class="rows">
        <dt>Squadra</dt><dd>${t ? esc(teamName(t)) + ' · #' + p.num : p.school ? esc(p.school) : 'Free agent'}</dd>
        ${t ? `<dt>Contratto</dt><dd>${fmtM(p.salary)} × ${p.years}</dd>` : ''}
        <dt>Fisico</dt><dd>${bodyTxt(p)}</dd>
        <dt>Valore di mercato</dt><dd>${ex ? '' : '~'}${fmtM(shownValue(p))}</dd>
        ${p.cgp ? `<dt>In carriera</dt><dd>${p.cgp} gare · ${(p.cpts || 0).toLocaleString('it-IT')} pt · ${(p.creb || 0).toLocaleString('it-IT')} rb · ${(p.cast || 0).toLocaleString('it-IT')} as</dd>` : ''}
        ${p.hi && p.hi.pts ? `<dt>Massimi in una partita</dt><dd>${p.hi.pts} pt · ${p.hi.reb || 0} rb · ${p.hi.ast || 0} as</dd>` : ''}
        <dt>Agenzia</dt><dd>${mine ? esc(S.agency) : p.agency ? esc(p.agency) : 'Nessuna'}</dd>
        ${t ? `<dt>Stagione</dt><dd>${statLine(p)} (${p.gp} gare)</dd>` : ''}
        <dt>Popolarità</dt><dd>${Math.round(p.hype)}/100</dd>
        ${p.draftPick ? `<dt>Draft</dt><dd>scelta #${p.draftPick}</dd>` : ''}
        <dt>Carriera</dt><dd>${c.seasons} stag. · ${c.titles} titoli · ${c.allstar} All-Star · ${c.mvp} MVP</dd>
        ${mine ? `<dt>Commissione</dt><dd>${p.comm}%</dd><dt>Rapporto</dt><dd>${p.morale}/100</dd>` : ''}
        ${p.sponsors.length ? `<dt>Sponsor</dt><dd>${p.sponsors.map(s => `${esc(s.brand)} ${fmtM(s.value)} (${s.years}a)`).join('<br>')}</dd>` : ''}
      </dl>
      <div class="actions">
        ${mine ? `<button class="btn sm" onclick="UI.doContact(${p.id});UI.player(${p.id})" ${p.lastContact === S.turn ? 'disabled' : ''}>${ic('phone')} Contatta</button>
          <button class="btn sm" onclick="UI.recModal(${p.id})">${ic('megaphone')} Consiglia a una squadra</button>
          <button class="btn sm" onclick="UI.campModal(${p.id})" ${p.campSeason === S.season ? 'disabled' : ''}>${ic('dumbbell')} Camp con una leggenda</button>
          <button class="btn bad sm" onclick="UI.release(${p.id})">Interrompi rapporto</button>`
          : `<button class="btn primary sm" onclick="UI.pitchModal(${p.id})">${S.talks[p.id] ? 'Riprendi la trattativa' : 'Proponi agenzia'}</button>
          ${p.school ? `<button class="btn sm" onclick="UI.recModal(${p.id})">${ic('megaphone')} Consiglia a una squadra</button>` : ''}
          ${!ex && p.school ? `<button class="btn sm" onclick="UI.doScout(${p.id});UI.player(${p.id})">${ic('eye')} Osserva</button>` : ''}`}
      </div>`);
  },

  release(pid) {
    this.ask(`Vuoi davvero interrompere il rapporto con <b>${esc(P(pid).name)}</b>? Perderai un po' di reputazione.`, 'Interrompi',
      () => { releaseClient(pid); save(); this.closeModal(); this.render(); });
  },
  // conferma dentro la pagina (confirm() del browser non funziona dentro claude.ai)
  ask(html, yesLabel, onYes) {
    this._yes = onYes;
    this.openModal(`<p>${html}</p><div class="actions"><button class="btn bad" onclick="UI._yes()">${yesLabel}</button>
      <button class="btn" onclick="UI.closeModal()">Annulla</button></div>`);
  },

  /* ---------- Lega ---------- */
  v_league() {
    const st = standings();
    const myTeams = new Set(clients().map(p => p.team));
    const rk = this.agencyRanking();
    return `
      <h2>Classifica ${seasonLabel()}</h2>
      ${S.lastChampion != null ? `<p class="small muted">Ultimi campioni: <b class="gold">${esc(teamName(S.teams[S.lastChampion]))}</b></p>` : ''}
      <div class="tbl-wrap"><table>
        <tr><th>#</th><th>Squadra</th><th class="num">V</th><th class="num">P</th><th class="num">%</th><th class="num">Forza</th><th class="num">Monte ingaggi</th><th class="num">Spazio cap</th><th>Rapporto</th></tr>
        ${st.map((t, i) => { const pr = payroll(t.id); return `<tr class="${myTeams.has(t.id) ? 'mine' : ''}${i === 16 ? ' cutline' : ''}"><td>${i + 1}</td><td>${esc(teamName(t))}</td><td class="num">${t.w}</td><td class="num">${t.l}</td>
          <td class="num">${winPct(t).toFixed(3).replace(/^0/, '')}</td><td class="num">${teamStrength(t.id).toFixed(1)}</td><td class="num">${fmtM(pr)}</td><td class="num ${CAP - pr > 0 ? 'good' : 'muted'}">${CAP - pr > 0 ? fmtM(CAP - pr) : '—'}</td><td>${relLabel(teamRel(t.id))} <span class="muted">${teamRel(t.id)}</span></td></tr>`; }).join('')}
      </table></div>
      <p class="small muted">Le prime 16 vanno ai playoff. Righe evidenziate: squadre con tuoi clienti. Salary cap: ${fmtM(CAP)}.</p>
      <h2>Classifica agenzie (stipendi gestiti)</h2>
      <div class="tbl-wrap"><table><tr><th>#</th><th>Agenzia</th><th class="num">Stipendi</th></tr>
        ${rk.map((r, i) => `<tr class="${r.mine ? 'mine' : ''}"><td>${i + 1}</td><td>${esc(r.name)}</td><td class="num">${fmtM(r.sal)}</td></tr>`).join('')}</table></div>
      <h2>Rapporti con gli sponsor</h2>
      <p class="small muted">Un buon rapporto porta contratti più ricchi e più probabilità che accettino le tue richieste.</p>
      <div class="rels">${[...BRANDS].sort((a, b) => brandRel(b) - brandRel(a)).map(b => `<span class="rel">${esc(b)} <b>${relLabel(brandRel(b))}</b></span>`).join('')}</div>
      <h2>Migliori giocatori</h2>
      <div class="tbl-wrap"><table><tr><th>Giocatore</th><th>Squadra</th><th class="num">OVR</th><th>Statistiche</th><th class="num">Stipendio</th></tr>
        ${Object.values(S.players).filter(p => p.team != null && !p.retired).sort((a, b) => playerScore(b) - playerScore(a)).slice(0, 15)
          .map(p => `<tr class="${isClient(p) ? 'mine' : ''}"><td><a class="pname" href="#" onclick="UI.player(${p.id});return false">${avatarSVG(p, 28)}${esc(p.name)}${p.star || p.vip ? ' ' + ic('star', 'in star') : ''}</a></td><td>${teamOf(p).abbr}</td><td class="num">${p.ovr}</td><td>${statLine(p)}</td><td class="num">${fmtM(p.salary)}</td></tr>`).join('')}
      </table></div>
      <div id="t-rec">${this.v_records()}</div>`;
  },
  /* ---------- Record della lega ---------- */
  recTab: 'game',
  v_records() {
    recInit();
    const R = S.records, tab = this.recTab;
    const mine = clients().filter(p => !p.retired);
    const tuo = pid => pid != null && S.players[pid] && isClient(S.players[pid]) ? ' <span class="tag fa">tuo</span>' : '';
    let body = '';
    if (tab === 'game' || tab === 'season') {
      const keys = tab === 'game' ? ['pts', 'reb', 'ast'] : ['ppg', 'rpg', 'apg'];
      body = `<div class="grid">${keys.map(k => {
        const r = R[tab][k], era = R.era[tab][k];
        const myv = mine.map(p => ({ name: p.name, v: tab === 'game' ? ((p.hi || {})[k] || 0) : (p.gp >= 10 ? r1(p[{ ppg: 'pts', rpg: 'reb', apg: 'ast' }[k]] / p.gp) : 0) })).sort((a, b) => b.v - a.v)[0];
        const pct = myv ? Math.min(100, Math.round(myv.v / r.v * 100)) : 0;
        return `<div class="card rec-card"><h3>${REC_LABEL[k]} ${tab === 'game' ? 'in una partita' : 'in una stagione'}</h3>
          <div class="rec-main"><b class="gold">${r.v}</b><span><b>${esc(r.name)}</b>${tuo(r.pid)}<small>${esc(r.team || '')} · ${esc(r.season)}</small></span></div>
          <p class="small muted">Migliore dal 2026: ${era ? `<b>${era.v}</b>, ${esc(era.name)}${tuo(era.pid)} (${esc(era.season)})` : 'ancora nessuno'}</p>
          ${myv && myv.v ? `<div class="small">Il tuo migliore: <b>${esc(myv.name)}</b>, ${myv.v} <span class="muted">(${pct}% del record di sempre)</span><div class="bar"><i style="width:${pct}%;background:var(--accent)"></i></div></div>` : ''}</div>`;
      }).join('')}</div>
        <p class="small muted">${tab === 'game' ? '"Il tuo migliore" è il massimo in carriera di un tuo cliente in una partita.' : 'Per la stagione servono almeno 40 partite; "il tuo migliore" è la media attuale di un tuo cliente (almeno 10 gare).'}</p>`;
    } else {
      const keys = tab === 'career' ? ['pts', 'reb', 'ast', 'gp'] : ['titles', 'mvp', 'allstar'];
      body = `<div class="grid">${keys.map(k => {
        const board = careerBoard(k), top = board[0];
        const myBest = mine.map(p => ({ name: p.name, v: careerStat(p, k) })).sort((a, b) => b.v - a.v)[0];
        const pct = myBest && top ? Math.min(100, Math.round(myBest.v / top.v * 100)) : 0;
        return `<div class="card rec-card"><h3>${REC_LABEL[k]} in carriera</h3>
          ${myBest && myBest.v ? `<div class="small">Il tuo migliore: <b>${esc(myBest.name)}</b>, ${myBest.v.toLocaleString('it-IT')} <span class="muted">(${pct}% del record)</span><div class="bar"><i style="width:${pct}%;background:var(--accent)"></i></div></div>` : ''}
          <ol class="rec-list">${board.map(x => { const pl = x.pid != null ? S.players[x.pid] : null, cl = pl && isClient(pl);
            return `<li class="${cl ? 'mine' : ''}"><span>${esc(x.name)}${cl ? ' <span class="tag fa">tuo</span>' : ''}${x.active ? ' <small class="good">in attività</small>' : ` <small class="muted">ritirato ${esc(x.until || '')}</small>`}</span><b>${x.v.toLocaleString('it-IT')}</b></li>`; }).join('')}</ol></div>`;
      }).join('')}</div>`;
    }
    return `<h2>Record della lega</h2>
      <p class="small muted">Sono i record veri della storia NBA, con i nomi del gioco. Le classifiche di carriera mettono insieme le leggende del passato e chi gioca oggi: i tuoi clienti possono scalarle stagione dopo stagione.</p>
      <div class="filters"><div class="seg">${[['game', 'Partita'], ['season', 'Stagione'], ['career', 'Carriera'], ['awards', 'Premi']].map(([k, l]) =>
        `<button class="${tab === k ? 'on' : ''}" onclick="UI.recTab='${k}';UI.tab='league';UI.render();document.getElementById('t-rec').scrollIntoView()">${l}</button>`).join('')}</div></div>
      ${body}`;
  },



  /* ---------- Staff ---------- */
  v_staff() {
    const net = weeklyIncomeEstimate() - weeklyCost();
    return `<h2>Staff e strutture</h2>
      <p class="muted small">Costi fissi attuali: <b>${fmt$(weeklyCost())}</b> a settimana · entrate medie <b>${fmt$(weeklyIncomeEstimate())}</b> · saldo <b class="${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${fmt$(net)}</b>. Ogni livello aumenta le spese settimanali.</p>
      ${net < 0 ? '<div class="note warn">⚠️ Stai spendendo più di quanto incassi: prima di potenziare, trova nuovi clienti o firma contratti più ricchi.</div>' : ''}
      <div class="grid">${Object.entries(STAFF).map(([k, s]) => {
        const lvl = S.staff[k] || 0, cost = upgradeCost(lvl, k);
        return `<div class="card"><h3>${s.icon} ${s.name}</h3><div class="muted small">${s.desc}</div>
          <p>${k === 'informer' ? `<b>${INFORMER_LV[lvl]}</b>` : `Livello <b>${lvl}</b> / 5`} ${'★'.repeat(lvl)}${'☆'.repeat(5 - lvl)}</p>
          ${lvl < 5 && net - staffStep(k) < 0 ? `<p class="small bad">Con questo livello andresti in perdita di ${fmt$(staffStep(k) - net)} a settimana.</p>` : ''}
          ${lvl < 5 ? `<button class="btn primary sm" onclick="UI.upgrade('${k}')" ${S.cash < cost ? 'disabled' : ''}>${k === 'informer' && !lvl ? 'Assumi' : 'Potenzia'} — ${fmt$(cost)}</button>` : '<span class="good">Al massimo!</span>'}</div>`;
      }).join('')}</div>
      <h2>Investimenti</h2>
      <p class="muted small">Quando l'agenzia è grande, i soldi servono a crescere ancora. Ogni 5% di una squadra rende il 4% l'anno in dividendi, migliora il rapporto con lei e le sue offerte ai tuoi clienti. Con il 51% diventi presidente.</p>
      ${Object.keys(S.stakes || {}).length ? `<div class="rels">${Object.entries(S.stakes).map(([tid, pct]) => `<span class="rel">${esc(teamName(S.teams[tid]))} <b>${pct}%</b></span>`).join('')}</div>` : ''}
      <div class="lev-row" style="margin:10px 0">
        <select id="stake-team" aria-label="Squadra">${[...S.teams].sort((a, b) => stakePrice(a) - stakePrice(b)).map(t => `<option value="${t.id}">${esc(teamName(t))} · 5% a ${fmt$(stakePrice(t))}${stakeOf(t.id) ? ` (hai il ${stakeOf(t.id)}%)` : ''}</option>`).join('')}</select>
        <button class="btn primary sm" onclick="UI.doStake()">Compra il 5%</button>
      </div>
      <div class="card"><h3>Fondazione benefica</h3><div class="muted small">Dona $1M una volta a stagione: +3 reputazione e un rapporto migliore con tutti gli sponsor.</div>
        <div class="actions"><button class="btn sm" onclick="UI.doDonate()" ${S.donated === S.season || S.cash < 1e6 ? 'disabled' : ''}>Dona $1M</button></div></div>`;
  },
  doStake() { const r = buyStake(+document.getElementById('stake-team').value); save(); this.render(); toast(r.msg, r.type, r.type === 'good' ? 'Investimento!' : undefined); },
  doDonate() { const r = donate(); save(); this.render(); toast(r.msg, r.type); },
  upgrade(k) {
    const cost = upgradeCost(S.staff[k] || 0, k);
    if (S.cash < cost) return toast('Fondi insufficienti.', 'bad');
    spend(cost); S.staff[k] = (S.staff[k] || 0) + 1;
    toast(k === 'informer' ? (S.staff[k] === 1 ? 'Hai assunto un informatore. È ancora scarso, ma ti passerà le prime soffiate.' : `Il tuo informatore ora è: ${INFORMER_LV[S.staff[k]]}.`) : `${STAFF[k].name}: livello ${S.staff[k]}.`, 'good', 'Upgrade!');
    addNews(`🔧 ${STAFF[k].name} potenziato al livello ${S.staff[k]}.`);
    save(); this.render();
  },

  /* ---------- Modale ---------- */
  openModal(html) { hideToast(); document.getElementById('modal-body').innerHTML = deEmo(html); document.getElementById('modal').classList.remove('hidden'); },
  closeModal() { document.getElementById('modal').classList.add('hidden'); },
  gameOver() {
    this.openModal(`<h3>Licenza revocata</h3><p>La tua agenzia è rimasta in rosso troppo a lungo.</p>
      <p>Hai resistito fino alla stagione ${seasonLabel()} con reputazione ${S.rep.toFixed(1)} e ${Object.keys(S.goals).length} obiettivi raggiunti.</p>
      <div class="actions"><button class="btn primary" onclick="UI.reset(true)">Nuova carriera</button></div>`);
  },
  reset(force) {
    if (!force) return this.ask('Cancellare la partita e ricominciare da capo?', 'Cancella', () => this.reset(true));
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignora */ }
    Cloud.clear();
    S = null; this.closeModal(); this.render();
  },
};

document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') UI.closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeModal(); });

/* ================================================================== */
/* Tutorial con Coach Gigi                                             */
/* ================================================================== */
const Tutorial = {
  i: 0, el: null,
  steps: [
    { t: null, h: 'Benvenuto, agente!', x: 'Sono <b>Coach Gigi</b> e ti spiego come funziona. Sei un procuratore: trovi giocatori, li porti nella tua agenzia e guadagni una percentuale sui loro <b>stipendi</b> (1-4%) e sui loro <b>sponsor</b> (15%).' },
    { t: 't-adv', h: 'Avanza settimana', x: 'Ogni tocco fa passare una settimana: si giocano 4 partite, incassi le commissioni e paghi lo staff. Poi vedi i <b>risultati</b> dei tuoi giocatori con un voto da A+ a F. Se il pulsante diventa <b>giallo</b>, prima devi decidere un imprevisto. La stagione è: Free Agency → stagione regolare → playoff → Draft.' },
    { t: 't-cash', h: 'La tua cassa', x: 'Qui vedi i soldi e quanto guadagni o perdi in media a settimana. Ci paghi lo staff, gli incontri con i giocatori e i bonus alla firma. <b>Se resti in rosso per 4 settimane perdi la licenza!</b>' },
    { t: 't-rep', h: 'La reputazione', x: 'Più è alta, più i campioni accettano di incontrarti. Sale con i contratti ricchi, i premi e le scelte azzeccate; scende con figuracce e clienti persi.' },
    { t: 't-cl', h: 'I posti in agenzia', x: 'Puoi seguire un numero limitato di clienti. Per averne di più, amplia gli <b>Uffici</b> nella scheda Staff.' },
    { t: 't-ev', h: 'Gli imprevisti', x: 'Ogni tanto succede qualcosa: videoclip, tatuaggi, sponsor, litigi col coach… Sotto ogni scelta vedi cosa succede e con che probabilità. Alcune scelte cambiano anche l\'aspetto del giocatore. Più raramente arriva un <b>⚡ colpo di scena</b> che può cambiare una carriera, in bene o in male.' },
    { t: 't-pls', h: 'I tuoi giocatori', x: 'Per ognuno vedi la <b>prossima partita</b>, la posizione in classifica della squadra, le medie di punti, rimbalzi e assist e il <b>voto dell\'ultima gara</b>. Tocca un giocatore per aprire la sua scheda: lì trovi carattere, storia e il pulsante <b>Consiglia</b>.' },
    { t: 't-chal', h: 'Sfide della stagione', x: 'Ogni stagione arrivano 3 sfide nuove, sempre un po\' più difficili, con un premio in soldi e reputazione. Gli <b>obiettivi</b> qui sotto invece sono traguardi di carriera, una volta sola.' },
    { t: null, h: 'Il carattere', x: 'Ogni giocatore ha 1 o 2 tratti e una sua storia. Il carattere decide che imprevisti gli capitano: un 🎉 <b>festaiolo</b> può fare serata prima di una partita, un 😤 <b>aggressivo</b> finire in una rissa, un 💛 <b>gentile</b> fare beneficenza. Cambia anche le regole: un 🤝 leale è difficile da portarti via, un 💰 attaccato ai soldi chiede di più.' },
    { t: null, h: 'I rapporti', x: 'Giocatori, squadre e sponsor si ricordano di te. Se li tratti bene accettano più volentieri le tue richieste, pagano di più e hanno più pazienza nelle trattative. Se tiri troppo la corda… si chiudono le porte. Trovi i rapporti nelle schede dei clienti e nella scheda Lega.' },
    { t: 'tab-clients', h: 'Clienti', x: 'Le schede complete dei tuoi assistiti. Quando una squadra fa un\'offerta compare il pulsante <b>Offerte</b>: tratti stipendio e anni, guardi cosa preferisce il giocatore e puoi giocare la carta dell\'<b>asta</b> (occhio ai bluff). Le offerte scadono! Usa <b>Contatta</b> per tenerli contenti, <b>Camp</b> per farli allenare con una leggenda e <b>Consiglia</b> per proporli a una squadra: un\'offerta per chi è senza contratto, uno scambio per chi ce l\'ha.' },
    { t: 'tab-market', h: 'Mercato', x: 'Qui trovi nuovi clienti: <b>prospetti</b> del college, <b>free agent</b> e giocatori di altre agenzie. Con <b>🔭 Osserva</b> scopri il loro potenziale, con <b>🤝 Coltiva</b> crei un legame prima del Draft. <b>Proponi</b> chiede un incontro: se accetta inizia una vera trattativa. Tu offri commissione, bonus e <b>promesse</b> da mantenere; lui fa una controfferta e ha una pazienza di 2-5 🏀.' },
    { t: null, h: 'Il Draft', x: 'Puoi <b>consigliare</b> un prospetto a una squadra: se ti danno retta, lo sceglieranno al Draft se è ancora libero al loro turno. Più è buono il rapporto con la squadra, più ti ascoltano. E un ragazzo a cui sei molto legato può sceglierti come agente da solo, prima del Draft.' },
    { t: 'tab-league', h: 'Lega', x: 'Classifica delle 30 squadre col tuo rapporto con ognuna, i rapporti con gli sponsor, i migliori giocatori e la classifica delle agenzie. Le prime 16 vanno ai playoff.' },
    { t: 'tab-staff', h: 'Staff', x: 'Investi in scout, avvocati, marketing e uffici. Qui assumi anche l\'<b>🕵️ informatore</b>, ingrandisci la <b>🏙️ sede</b> e apri un\'<b>🎓 accademia</b> che ti porta ogni anno ragazzi già legati a te. Ogni livello aumenta le spese settimanali.' },
    { t: 't-help', h: 'Tocca a te!', x: 'Puoi rivedere questo tutorial quando vuoi dal pulsante <b>?</b>. Primo consiglio: vai nel <b>Mercato</b>, chiedi un incontro a un free agent e chiudi la trattativa. In bocca al lupo!' },
  ],
  start() {
    if (!S) return;
    UI.closeModal();
    if (UI.tab !== 'home') { UI.tab = 'home'; UI.render(); }
    this.i = 0; this.build(); document.documentElement.classList.add('tut-on'); this.show();
  },
  build() {
    if (this.el) return;
    const el = document.createElement('div');
    el.id = 'tut'; el.hidden = true;
    el.innerHTML = `<div class="tut-block"></div><div class="spot" id="tut-spot"></div>
      <div class="coach" id="tut-coach">${COACH_SVG}<div class="bubble" id="tut-bubble" role="dialog" aria-live="polite"></div></div>`;
    document.body.appendChild(el);
    this.el = el;
    // blocca lo scorrimento col dito o con la rotella mentre il tutorial è aperto
    const block = e => { if (!this.el.hidden) e.preventDefault(); };
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('wheel', block, { passive: false });
    window.addEventListener('resize', () => { if (!this.el.hidden) this.place(); });
  },
  show() {
    const st = this.steps[this.i], n = this.steps.length;
    this.el.hidden = false;
    document.getElementById('tut-bubble').innerHTML = deEmo(`<div class="who">Coach Gigi · ${this.i + 1} di ${n}</div><h4>${st.h}</h4><p>${st.x}</p>
      <div class="nav">${this.i < n - 1 ? '<button class="skip" onclick="Tutorial.end()">Salta</button>' : '<span></span>'}
      <span class="btns">${this.i ? '<button class="back" onclick="Tutorial.go(-1)" aria-label="Indietro">‹</button>' : ''}<button class="next" onclick="Tutorial.go(1)">${this.i < n - 1 ? 'Avanti ›' : 'Inizia a giocare!'}</button></span></div>`);
    const tg = st.t && document.getElementById(st.t);
    if (tg && tg.closest('nav')) {
      window.scrollTo(0, 0);
      const nav = tg.closest('nav');
      nav.scrollLeft = tg.offsetLeft - (nav.clientWidth - tg.offsetWidth) / 2;
    } else if (tg && tg.closest('main')) {
      const head = document.querySelector('header.top'), hb = head ? head.getBoundingClientRect().bottom : 0;
      window.scrollTo(0, window.scrollY + tg.getBoundingClientRect().top - hb - 12);
    } else window.scrollTo(0, 0);
    requestAnimationFrame(() => this.place());
  },
  place() {
    const st = this.steps[this.i]; if (!st || !this.el || this.el.hidden) return;
    const spot = document.getElementById('tut-spot'), coach = document.getElementById('tut-coach');
    const tg = st.t && document.getElementById(st.t);
    if (!tg) { Object.assign(spot.style, { left: '50%', top: '40%', width: '0px', height: '0px' }); spot.classList.add('none'); coach.className = 'coach mid'; return; }
    const r = tg.getBoundingClientRect(), pad = 6;
    spot.classList.remove('none');
    const bh = coach.getBoundingClientRect().height || 240;
    const below = innerHeight - r.bottom, above = r.top;
    let h = r.height;
    // se il bersaglio è troppo alto, ne evidenzio solo la parte che lascia spazio al fumetto
    if (below < bh + 24 && above < bh + 24) h = Math.max(60, innerHeight - r.top - bh - 40);
    const L = Math.max(4, r.left - pad), R = Math.min(innerWidth - 4, r.right + pad);
    Object.assign(spot.style, { left: L + 'px', top: r.top - pad + 'px', width: Math.max(0, R - L) + 'px', height: h + pad * 2 + 'px' });
    coach.className = 'coach ' + (innerHeight - (r.top + h) >= bh + 24 || above < bh + 24 ? 'bottom' : 'top');
  },
  go(d) { this.i += d; if (this.i >= this.steps.length) return this.end(); this.i = Math.max(0, this.i); this.show(); },
  end() { document.documentElement.classList.remove('tut-on'); if (this.el) this.el.hidden = true; if (S) { S.tutorialDone = true; save(); } },
};

load();
if (S) { recInit(); S.staff.hq = S.staff.hq || 0; S.staff.academy = S.staff.academy || 0; if (!S.chal || S.chal.season !== S.season) newChallenges(); for (const p of Object.values(S.players)) capPot(p); S.goalRewards = S.goalRewards || {}; for (const k of Object.keys(S.goals || {})) if (!S.goalRewards[k]) { const t = giveReward(k); if (t) addNews(`🎁 Ricompensa per un obiettivo già raggiunto (${esc(GOALS.find(x => x[0] === k)[1])}): ${esc(t)}.`, 'gold'); } for (const p of Object.values(S.players)) if (!p.traits) p.traits = genTraits(); S.talks = S.talks || {}; S.staff.informer = S.staff.informer || 0; S.intel = S.intel || []; S.recentEv = S.recentEv || []; S.teamRel = S.teamRel || {}; S.brandRel = S.brandRel || {}; S.inbox = (S.inbox || []).filter(e => e.ev && e.data && e.data.mult); }
UI.render();
Cloud.init();
