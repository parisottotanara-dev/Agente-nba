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
    v: 2, agency: agencyName || 'Hoop Dreams Agency', agent: agentName || 'Agente',
    cash: 300000, rep: 15, season: 2026, phase: 'fa', week: 1, turn: 0,
    staff: { scout: 0, legal: 0, marketing: 0, office: 0, informer: 0 }, intel: [],
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
      Object.assign(p, { name, pos, age, ovr, num, team: t.id, star: true });
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
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { S = JSON.parse(raw); return true; } } catch (e) { /* ignora */ }
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
        S = JSON.parse(await gunzip(d.data));
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
  informer: { name: 'Informatore', icon: '🕵️', desc: 'Ti passa soffiate sui prospetti del prossimo Draft: potenziale, chi vuole essere seguito, chi sta per firmare con un rivale. All\'inizio è scarso e a volte sbaglia.' },
};
const upgradeCost = lvl => [60000, 150000, 320000, 650000, 1300000][lvl] ?? Infinity;
const weeklyCost = () => 6000 + 3000 * (S.staff.scout + S.staff.legal + S.staff.marketing + (S.staff.informer || 0)) + 4000 * S.staff.office;
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
        const form = 1 + gauss() * 0.22;
        const pts = Math.max(0, Math.round(q * 0.56 * f * form));
        const reb = Math.max(0, Math.round(q * rebK * f * (1 + gauss() * .25)));
        const ast = Math.max(0, Math.round(q * astK * f * (1 + gauss() * .25)));
        p.gp++; p.pts += pts; p.reb += reb; p.ast += ast;
        if (mine) { const g2 = results[g][t.id]; p.week.push({ opp: g2.opp, home: g2.home, win: g2.win, us: g2.us, them: g2.them, pts, reb, ast, grade: gameGrade(pts, reb, ast, g2.win) }); }
      }
      if (mine) p.last = p.week[3];
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
const statLine = p => p.gp ? `${r1(avg(p, 'pts'))} pt · ${r1(avg(p, 'reb'))} rb · ${r1(avg(p, 'ast'))} as` : 'nessuna partita';
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
    shuffle(S.teams.filter(t => rosterOf(t.id).length < 15 && !existing.has(t.id)));
  let made = 0;
  for (const t of teams) {
    if (made >= n) break;
    const room = fromTeam != null ? Math.max(affordable(t.id), p.salary * 1.3) : affordable(t.id);
    const rel = teamRel(t.id);
    if (fromTeam == null && rel < 25 && chance(0.6)) continue; // con te non vogliono trattare
    const max = r1(Math.min(val * rand(0.95, 1.22) * (1 + S.staff.legal * 0.03) * (1 + (rel - 50) / 500), room, MAX_SAL));
    if (max < MIN_SAL) continue;
    const salary = r1(Math.max(MIN_SAL, max * rand(0.68, 0.9)));
    S.offers.push({ id: S.nextEv++, pid: p.id, teamId: t.id, salary, years: preferredYears(p),
      max, patience: 3 + (rel >= 70 ? 1 : 0) - (rel < 30 ? 1 : 0), ext });
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
  p.team = teamId; p.salary = r1(salary); p.years = years; p.school = null;
  S.offers = S.offers.filter(o => o.pid !== p.id);
  if (isClient(p)) {
    const val = marketValue(p);
    p.morale = clamp(Math.round(p.morale + 10 + (salary / val - 1) * 40), 0, 100);
    changeRep(clamp(salary / 12, 0.2, 3));
    changeTeamRel(teamId, 4);
    addNews(`✍️ <b>${esc(p.name)}</b> firma con i ${esc(teamName(S.teams[teamId]))}: ${fmtM(salary)} × ${years} ann${years > 1 ? 'i' : 'o'}. ` +
      `Commissione: ${fmt$(salary * 1e6 * p.comm / 100)}/anno.`, 'good');
    checkGoal('bigdeal', salary >= 30);
  }
}

function negotiate(offerId, ask, years) {
  const o = S.offers.find(x => x.id === offerId); if (!o) return { msg: 'Offerta non più disponibile.' };
  const p = P(o.pid);
  const eff = o.max * (1 - Math.abs(years - o.years) * 0.04);
  if (ask <= eff) { signContract(p, o.teamId, ask, years); return { done: true, msg: `Accordo raggiunto a ${fmtM(ask)} × ${years}!` }; }
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
function acceptOffer(offerId) {
  const o = S.offers.find(x => x.id === offerId); if (!o) return;
  signContract(P(o.pid), o.teamId, o.salary, o.years);
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
// Probabilità che accetti di sedersi al tavolo
function openChance(p) {
  let c = 0.55 + (S.rep - (starPower(p) - 55) * 1.6) / 80 + S.staff.marketing * 0.03 + (p.bond || 0) / 150;
  if (p.agency) c -= 0.15;
  c -= p.refusals * 0.12;
  return clamp(c, 0.04, 0.97);
}
const roundHalf = v => Math.round(v * 2) / 2;
// Cosa vuole davvero (segreto): più è forte, meno commissione accetta e più bonus pretende
function talkWants(p) {
  const st = starPower(p), bond = p.bond || 0;
  const greedy = hasTrait(p, 'avido');
  const comm = clamp(roundHalf(4 - (st - 58) / 11 + (S.rep - 30) / 50 + bond / 80 - (greedy ? 0.5 : 0)), 1, 4);
  const bonus = Math.max(0, Math.round((Math.max(0, st - 64) * 7 + (greedy ? 20 : 0)) * (1 - bond / 150) * (p.agency ? 1.3 : 1) / 5) * 5);
  return { comm, bonus };
}
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
  // la sua prima richiesta è più alta di quello che accetterebbe davvero
  const ask = { comm: clamp(w.comm - 1, 1, 4), bonus: Math.round(w.bonus * 1.4 / 5) * 5 };
  S.talks[pid] = { want: w, ask, patience, max: patience, turn: S.turn, log: [`🤝 Ha accettato di incontrarti. Chiede ${talkTxt(ask)}.`] };
  return { ok: true };
}
const talkTxt = o => `${o.comm}% di commissione${o.bonus ? ` + $${o.bonus}k alla firma` : ''}`;
// Offerta del giocatore all'agente: commissione che vuoi tu e bonus che gli dai
function talkOffer(pid, comm, bonus) {
  const p = P(pid), t = S.talks[pid]; if (!t) return;
  comm = clamp(roundHalf(comm), 1, 4); bonus = Math.max(0, Math.round(bonus));
  if (bonus * 1000 > S.cash) return { msg: `Non hai $${bonus}k da dare alla firma.`, type: 'bad' };
  t.log.push(`➡️ Offri ${talkTxt({ comm, bonus })}.`);
  // quanto è lontana l'offerta da ciò che vuole davvero
  const gap = Math.max(0, comm - t.want.comm) * 30 + Math.max(0, t.want.bonus - bonus) / Math.max(20, t.want.bonus) * 30;
  if (gap <= 0) return talkSign(pid, comm, bonus);
  t.patience -= gap > 30 ? 2 : 1;
  if (t.patience <= 0) {
    delete S.talks[pid];
    p.refusals++; p.bond = Math.max(0, (p.bond || 0) - 10);
    if (p.refusals >= 3) p.lockedUntil = S.season + 1;
    addNews(`🚪 ${esc(p.name)} ha chiuso la trattativa con te.`, 'bad');
    return { msg: `${p.name} si è stancato e ha chiuso la trattativa.`, type: 'bad', done: true };
  }
  // controfferta: se l'offerta non l'ha irritato si avvicina a te, ma mai oltre quello che vuole davvero
  if (gap <= 30) {
    const r5 = v => Math.round(v / 5) * 5;
    t.ask = {
      comm: Math.max(t.ask.comm, Math.min(t.want.comm, roundHalf((t.ask.comm + comm) / 2))),
      bonus: Math.min(t.ask.bonus, Math.max(t.want.bonus, r5((t.ask.bonus + bonus) / 2))),
    };
  }
  const mood = gap > 30 ? '😠 L\'offerta lo ha irritato.' : '🤔 Ci pensa.';
  t.log.push(`⬅️ ${mood} Controfferta: ${talkTxt(t.ask)}.`);
  return { msg: `Controfferta: ${talkTxt(t.ask)}`, type: gap > 30 ? 'warn' : 'info' };
}
function talkAcceptAsk(pid) { const t = S.talks[pid]; if (!t) return; if (t.ask.bonus * 1000 > S.cash) return { msg: `Non hai $${t.ask.bonus}k da dare alla firma.`, type: 'bad' }; return talkSign(pid, t.ask.comm, t.ask.bonus); }
function talkSign(pid, comm, bonus) {
  const p = P(pid);
  delete S.talks[pid];
  if (clients().length >= capacity()) return { msg: 'Non hai più posti in agenzia.', type: 'bad', done: true };
  if (bonus) spend(bonus * 1000);
  p.comm = comm; p.agency = S.agency; p.morale = clamp(60 + Math.round((p.bond || 0) / 4) + (bonus ? 8 : 0), 0, 100); p.scouted = true;
  S.clients.push(p.id);
  changeRep(clamp((p.ovr - 60) / 15, 0.1, 2));
  addNews(`🤝 <b>${esc(p.name)}</b> (${p.pos}, ${p.ovr}) è il tuo nuovo assistito! Commissione ${comm}%${bonus ? `, bonus alla firma $${bonus}k` : ''}.`, 'good');
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
  if (f.raise && p && p.team != null) p.salary = r1(p.salary * (1 + f.raise));
  if (f.br) changeBrandRel(inst.data.b, f.br);
  if (!p) { if (f.gem) findGem(); return; }
  if (f.tr) changeTeamRel(p.team, f.tr);
  if (f.hype) p.hype = clamp(p.hype + f.hype, 0, 100);
  if (f.ovr) { p.ovr = clamp(p.ovr + f.ovr, 35, 99); p.pot = Math.max(p.pot, p.ovr); }
  if (f.pot) p.pot = clamp(p.pot + f.pot, p.ovr, 99);
  if (f.draftBoost) p.draftBoost = (p.draftBoost || 0) + f.draftBoost;
  if (f.stayCollege && p.school) p.skipDraft = S.season;
  if (f.inj) p.injury = Math.max(p.injury, f.inj);
  if (f.comm) p.comm = clamp(p.comm + f.comm, 1, 4);
  if (f.look) { p.look = { ...(p.look || {}), ...f.look }; if (f.look.number != null) p.num = f.look.number; }
  if (f.sponsor && inst.data.value) {
    if (p.sponsors.length >= 4) p.sponsors.sort((a, b) => a.value - b.value).shift();
    p.sponsors.push({ brand: inst.data.b, value: r1(inst.data.value * f.sponsor), years: inst.data.years });
    checkGoal('sponsor', true);
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
  let played = false;
  spend(weeklyCost());
  S.rep = r1(S.rep * 0.997); // la fama va mantenuta
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
    if (S.week >= REG_WEEKS) { S.phase = 'po'; S.week = 1; addNews('🏆 Stagione regolare finita: si va ai playoff!', 'gold'); }
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
  if (S.over) return UI.gameOver();
  const after = () => {
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
  // non scelti → free agent
  for (const p of Object.values(S.players)) if (p.school && !p.retired) {
    if (p.skipDraft === S.season) { p.promise = null; continue; } // resta un altro anno al college
    p.school = null;
    if (isClient(p)) addNews(`😕 ${esc(p.name)} non è stato scelto: ora è free agent.`, 'warn');
  }
}

function offseason() {
  const retiredNow = [];
  for (const p of Object.values(S.players)) {
    if (p.retired) continue;
    p.age++;
    // sviluppo
    let d;
    if (p.age <= 24) d = (p.pot - p.ovr) * rand(0.12, 0.38);
    else if (p.age <= 28) d = rand(-1, 2.5);
    else if (p.age <= 31) d = rand(-3, 1);
    else d = rand(-6, -1);
    if (hasTrait(p, 'professionista') && p.age <= 30 && chance(0.6)) d += 1; // si allena più di tutti
    if (hasTrait(p, 'festaiolo') && chance(0.3)) d -= 1;
    p.ovr = clamp(Math.round(p.ovr + d), 35, 99);
    p.pot = Math.max(p.pot, p.ovr);
    if (p.age > 27) p.pot = Math.max(p.ovr, p.pot - 1);
    if (p.team != null) p.career.seasons++;
    // ritiro
    const ret = (p.age >= 35 && chance(0.35 + (p.age - 35) * 0.2)) || (p.age >= 31 && p.ovr < 54 && chance(0.5)) ||
      (p.team == null && p.age >= 30 && p.ovr < 60 && chance(0.4));
    if (ret) { p.retired = true; p.team = null; retiredNow.push(p); continue; }
    // contratti
    if (p.team != null) { p.years--; if (p.years <= 0) { p.team = null; p.years = 0; } }
    p.gp = p.pts = p.reb = p.ast = 0; p.injury = 0;
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
  for (const p of retiredNow) delete S.players[p.id];
  // rose troppo lunghe
  for (const t of S.teams) {
    const r = rosterOf(t.id).sort((a, b) => a.ovr - b.ovr);
    while (r.length > 15) { const cut = r.shift(); cut.team = null; if (isClient(cut)) addNews(`✂️ ${esc(cut.name)} è stato tagliato dai ${esc(t.name)}.`, 'bad'); }
  }
  for (const t of S.teams) { t.w = 0; t.l = 0; if (S.teamRel[t.id] != null) S.teamRel[t.id] = Math.round(S.teamRel[t.id] + (50 - S.teamRel[t.id]) * 0.2); }
  for (const b of Object.keys(S.brandRel)) S.brandRel[b] = Math.round(S.brandRel[b] + (50 - S.brandRel[b]) * 0.2);
  S.offers = [];
  S.talks = {};
  S.season++;
  S.seasonIncome = 0; S.seasonExpense = 0;
  genDraftClass();
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
];
function checkGoal(k, cond) {
  if (!cond || S.goals[k]) return;
  S.goals[k] = seasonLabel();
  const g = GOALS.find(x => x[0] === k);
  addNews(`🏅 Obiettivo raggiunto: <b>${esc(g[1])}</b>!`, 'gold');
  toast(`🏅 ${g[1]}!`);
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
const TOAST_TITLES = { good: 'Grande!', bad: 'Ops!', warn: 'Attenzione!', goal: 'Obiettivo!', event: 'Imprevisto!', info: 'Info', intel: 'Soffiata!' };
function toast(msg, type, title) {
  const el = document.getElementById('toast');
  msg = String(msg);
  type = type || (/^✅/.test(msg) ? 'good' : /^❌/.test(msg) ? 'bad' : /^🏅/.test(msg) ? 'goal' : /insufficient|Servono|non hai abbastanza/i.test(msg) ? 'bad' : 'info');
  el.className = 'toast arc ' + type;
  el.setAttribute('role', 'status');
  el.innerHTML = `<b>${esc(title || TOAST_TITLES[type])}</b><span>${esc(msg.replace(/^(✅|❌|🏅)\s*/u, ''))}</span>`;
  void el.offsetWidth; el.classList.add('show');
  el.onclick = () => el.classList.add('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), type === 'warn' || type === 'event' ? 4200 : 3600);
}

const UI = {
  tab: 'home', mkt: 'prospect', q: '', pos: '', sort: 'ovr',

  render() {
    const app = document.getElementById('app');
    if (!S) { app.innerHTML = this.startScreen(); return; }
    const inbox = S.inbox.length;
    const nOffers = S.offers.length;
    const advLabel = { fa: 'Avanza settimana ▶', reg: 'Gioca settimana ▶', po: 'Gioca i playoff ▶', draft: 'Vai al Draft ▶' }[S.phase];
    app.innerHTML = `
      <header class="top">
        <div class="top-row">
          <div class="brand">🏀 <span>${esc(S.agency)}</span></div>
          <div class="spacer"></div>
          <div class="cash-pill ${S.cash < 0 ? 'bad' : ''}" id="t-cash2">💰 ${fmt$(S.cash)}</div>
          <button class="btn help" id="t-help" onclick="Tutorial.start()" aria-label="Rivedi il tutorial">?</button>
          <button class="btn primary big ${inbox ? 'blocked' : ''}" id="t-adv" onclick="advance()" ${S.over ? 'disabled' : ''}>${inbox ? `⚠ Decidi ${inbox === 1 ? 'l\'imprevisto' : 'gli ' + inbox + ' imprevisti'}` : advLabel}</button>
        </div>
        <nav class="tabs">
          ${[['home', '🏠 Home', inbox], ['clients', '⭐ Clienti', nOffers], ['market', '🔎 Mercato', 0], ['league', '🏆 Lega', 0], ['staff', '🏢 Staff', 0]]
            .map(([k, l, b]) => `<button id="tab-${k}" class="${this.tab === k ? 'on' : ''}" onclick="UI.go('${k}')">${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('')}
        </nav>
      </header>
      <main>${this['v_' + this.tab]()}</main>`;
  },
  go(t) { this.tab = t; this.render(); window.scrollTo(0, 0); },
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
      return `<div class="item ${n.cls}"><i>${m ? m[1] : '🏀'}</i><div>${m ? n.text.slice(m[0].length) : n.text}<small>${esc(n.when)}</small></div></div>`;
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
      <div class="sec"><h2>📣 Questa settimana</h2>${S.inbox.length ? `<span class="muted small">${S.inbox.length} da decidere</span>` : ''}</div>
      ${S.inbox.length ? `<div class="must" role="note"><span>⚠</span> Decidi prima di avanzare</div><div class="evs">${S.inbox.map(e => this.eventCard(e)).join('')}</div>`
        : `<div class="ev calm"><div class="ev-top"><div class="ev-ico">😌</div><div><h3>Settimana tranquilla</h3><p>Nessun imprevisto da gestire. Premi <b>${{ fa: 'Avanza settimana', reg: 'Gioca settimana', po: 'Gioca i playoff', draft: 'Vai al Draft' }[S.phase]}</b> per andare avanti.</p></div></div></div>`}
      </div>

      ${S.offers.length ? `<div class="sec"><h2>📨 Trattative aperte</h2></div><div class="feed">${[...new Set(S.offers.map(o => o.pid))].map(pid => {
        const p = P(pid), n = S.offers.filter(o => o.pid === pid).length;
        return `<button class="item deal" onclick="UI.negotiation(${pid})">${avatarSVG(p, 40)}<div><b>${esc(p.name)}</b><small>${n} offert${n > 1 ? 'e' : 'a'}${S.offers.some(o => o.pid === pid && o.ext) ? ' · rinnovo' : ''}</small></div><span class="go">Negozia ›</span></button>`;
      }).join('')}</div>` : ''}

      <div class="sec"><h2>⭐ I tuoi giocatori</h2><a href="#" onclick="UI.go('clients');return false">Schede complete</a></div>
      <div class="pls" id="t-pls">${[...cl].sort((a, b) => (b.team != null) - (a.team != null) || b.salary - a.salary || b.ovr - a.ovr).map(p => this.clientRow(p)).join('')}
        ${cl.length < capacity() ? `<button class="pl add" onclick="UI.go('market')">＋ Trova un nuovo cliente nel Mercato</button>` : ''}</div>

      <div class="sec"><h2>📰 Dalla lega</h2></div>
      <div class="feed">${feed}</div>

      <div class="sec"><h2>🏅 Obiettivi</h2><span class="muted small">${Object.keys(S.goals).length}/${GOALS.length}</span></div>
      <div class="goals">${GOALS.map(([k, l]) => `<div class="goal ${S.goals[k] ? 'done' : ''}">${S.goals[k] ? '✅' : '⬜'} ${esc(l)}</div>`).join('')}</div>

      ${S.history.length ? `<div class="sec"><h2>📊 Storico stagioni</h2></div><div class="tbl-wrap"><table><tr><th>Stagione</th><th class="num">Entrate</th><th class="num">Spese</th><th class="num">Clienti</th><th class="num">Reputazione</th></tr>
        ${S.history.map(h => `<tr><td>${h.season}</td><td class="num good">${fmt$(h.income)}</td><td class="num bad">${fmt$(h.expense)}</td><td class="num">${h.clients}</td><td class="num">${h.rep.toFixed(1)}</td></tr>`).join('')}</table></div>` : ''}
      <div class="sec"><h2>⚙️ Impostazioni</h2></div>
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
    return `<div class="ev ${e.rare ? 'rare' : ''}">${e.rare ? '<div class="rare-tag">⚡ Colpo di scena · capita di rado</div>' : ''}
      <div class="ev-top">${p ? `<div class="ev-av">${avatarSVG(p, 54)}<span>${e.ico}</span></div>` : `<div class="ev-ico">${e.ico}</div>`}
        <div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${def.trait && TRAITS[def.trait] ? `<span class="trait why">${TRAITS[def.trait].icon} Succede perché è ${TRAITS[def.trait].label.toLowerCase()}</span>` : ''}</div></div>
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
        <dt>Valore di mercato</dt><dd>${fmtM(marketValue(p))}</dd>
        ${t ? `<dt>Statistiche</dt><dd>${statLine(p)}</dd>` : ''}
        ${p.sponsors.length ? `<dt>Sponsor</dt><dd>${p.sponsors.map(s => esc(s.brand)).join(', ')}</dd>` : ''}
        <dt>Rapporto</dt><dd>${p.morale}/100<div class="bar"><i style="width:${p.morale}%;background:${mc}"></i></div></dd>
      </dl>
      <div class="actions">
        ${offers ? `<button class="btn primary sm" onclick="UI.negotiation(${p.id})">Offerte (${offers})</button>` : ''}
        <button class="btn sm" onclick="UI.doContact(${p.id})" ${p.lastContact === S.turn ? 'disabled' : ''}>📞 Contatta</button>
        <button class="btn sm" onclick="UI.recModal(${p.id})">📣 Consiglia</button>
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
        <span class="mk-info"><b>${esc(p.name)}${p.star || p.vip ? ' ⭐' : ''}</b>
          <span>${p.pos} · ${p.age} anni · ${p.school ? esc(p.school) : t ? esc(teamName(t)) : 'senza squadra'}</span>
          <span class="${p.agency ? '' : 'good'}">${p.agency ? '🔒 ' + esc(p.agency) : '🟢 nessun agente'}</span>
          <span class="ti">${(p.traits || []).map(t => TRAITS[t].icon + ' ' + TRAITS[t].label).join(' · ')}</span></span>
        <span class="mk-rat"><span><small>OVR</small><b>${ex ? '' : '~'}${shownOvr(p)}</b></span><span><small>POT</small><b class="pot">${ex ? '' : '~'}${shownPot(p)}</b></span></span>
      </button>
      ${p.school ? `<div class="mk-bond"><small>Legame</small><div class="bar"><i style="width:${bond}%;background:${bond >= 70 ? 'var(--good)' : bond >= 30 ? 'var(--accent)' : 'var(--muted)'}"></i></div><b>${bond}</b></div>` : ''}
      ${intel || p.bondTip || deadline != null ? `<div class="mk-tags">${intel ? '<span class="tag intel">🕵️ soffiata sul potenziale</span>' : ''}${p.bondTip ? '<span class="tag hot">💬 vuole essere seguito</span>' : ''}${deadline != null ? `<span class="tag inj">⏳ un rivale lo firma tra ${Math.max(0, deadline)} sett.</span>` : ''}</div>` : ''}
      <div class="mk-foot"><span class="val">Valore ${ex ? '' : '~'}${fmtM(shownValue(p))}</span>
        <span class="mk-act">
          ${!ex && p.school ? `<button class="btn sm" onclick="UI.doScout(${p.id})" title="Manda uno scout">🔭 Osserva</button>` : ''}
          ${p.school ? `<button class="btn sm" onclick="UI.doCultivate(${p.id})" ${p.lastBond === S.turn ? 'disabled' : ''} title="Costa ${fmt$(cultivateCost(p))}">🤝 Coltiva ${fmt$(cultivateCost(p))}</button>` : ''}
          <button class="btn primary sm" onclick="UI.pitchModal(${p.id})" ${full ? 'disabled' : ''}>Proponi</button>
        </span></div>
    </article>`;
  },
  intelBox() {
    const lv = S.staff.informer || 0;
    if (!lv) return `<div class="intel-box"><div class="ib-head"><span>🕵️</span><div><b>Nessun informatore</b><small>Assumine uno nella scheda Staff: durante l'anno ti passerà soffiate sui prospetti del prossimo Draft.</small></div>
      <button class="btn sm" onclick="UI.go('staff')">Assumi</button></div></div>`;
    return `<div class="intel-box"><div class="ib-head"><span>🕵️</span><div><b>Il tuo informatore · ${INFORMER_LV[lv]}</b><small>${lv <= 2 ? 'È ancora alle prime armi: a volte sbaglia. Potenzialo nella scheda Staff.' : 'Le sue soffiate sono affidabili.'}</small></div></div>
      ${S.intel.length ? `<ul>${S.intel.slice(0, 4).map(r => `<li><a href="#" onclick="UI.player(${r.pid});return false">${esc(r.text)}</a><small>${esc(r.when)}</small></li>`).join('')}</ul>` : '<p class="small muted">Ancora nessuna soffiata: arriveranno nelle prossime settimane.</p>'}</div>`;
  },
  doCultivate(pid) { const r = cultivate(pid); toast(r.msg, r.type); save(); this.render(); },
  doScout(pid) { toast(scout(pid), 'intel', 'Rapporto scout'); save(); this.render(); },

  /* ---------- Righe dei clienti in Home ---------- */
  clientRow(p) {
    const t = teamOf(p), L = p.last, ng = nextGameTxt(p);
    let meta;
    if (p.injury) meta = `🚑 Fermo ancora ${p.injury} sett.`;
    else if (p.school) { const pr = draftProjection(p); meta = `🎓 ${esc(p.school)} · proiezione Draft <b>#${pr}</b>${p.promise != null ? ` · 📣 promesso ai ${esc(S.teams[p.promise].name)}` : ''}`; }
    else if (!t) { const n = S.offers.filter(o => o.pid === p.id).length; meta = `🆓 Senza squadra${n ? ` · <b>${n} offert${n > 1 ? 'e' : 'a'}</b>` : ''}`; }
    else meta = `${ng ? `📅 Prossima: <b>${esc(ng)}</b> · ` : ''}🏆 ${teamRank(t.id)}ª in classifica (${t.w}-${t.l})`;
    const stats = t && p.gp ? `<div class="pl-stats"><span><b>${r1(avg(p, 'pts'))}</b>PTS</span><span><b>${r1(avg(p, 'reb'))}</b>REB</span><span><b>${r1(avg(p, 'ast'))}</b>AST</span></div>` : '';
    return `<button class="pl" onclick="UI.player(${p.id})">
      ${avatarSVG(p, 52)}
      <span class="pl-main"><span class="pl-name"><b>${esc(p.name)}</b><span class="ti">${(p.traits || []).map(t => TRAITS[t].icon).join('')}</span><span class="ov ${this.ovrClass(p.ovr)}">${p.ovr}</span></span>
        <span class="pl-sub">${p.pos} · ${p.age} anni${t ? ` · ${esc(t.name)} #${p.num}` : ''}${t && p.gp ? ` · ${p.gp} gare` : ''}</span>
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
    box.innerHTML = `<div class="wr-panel" role="dialog" aria-label="Risultati della settimana">
      <div class="wr-title">Risultati · settimana ${S.week - 1 || REG_WEEKS}</div>
      ${best && best.g.grade[0] === 'A' ? `<div class="wr-top">🔥 Partita top: <b>${esc(best.p.name)}</b> ${best.g.pts} pt · ${best.g.reb} rb · ${best.g.ast} as <span class="grade ${gradeClass(best.g.grade)}">${best.g.grade}</span></div>` : ''}
      <div class="wr-list">${rows.map(p => {
        const L = p.week[3], w = p.week.filter(g => g.win).length;
        return `<div class="wr-row ${L.grade[0] === 'A' ? 'top' : ''}">${avatarSVG(p, 40)}
          <div class="wr-info"><b>${esc(p.name)}</b><span>${L.win ? '✅ V' : '❌ P'} ${L.us}-${L.them} ${L.home ? 'vs' : '@'} ${esc(S.teams[L.opp].name)} · settimana ${w}-${4 - w}</span>
          <span class="wr-line">${L.pts} pt · ${L.reb} rb · ${L.ast} as</span></div>
          <span class="grade big ${gradeClass(L.grade)}">${L.grade}</span></div>`;
      }).join('')}</div>
      <div class="wr-foot"><button class="btn primary wr-go" id="wr-go">Continua ▶</button>
      <button class="wr-off" id="wr-off">Non mostrare più i risultati</button></div></div>`;
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
    const hearts = '🏀'.repeat(Math.max(0, t.patience)) + '<span class="off">' + '🏀'.repeat(Math.max(0, t.max - t.patience)) + '</span>';
    const sug = { comm: Math.min(4, t.ask.comm + 0.5), bonus: Math.max(0, Math.round(t.ask.bonus * 0.75 / 5) * 5) };
    this.openModal(`
      <div class="tk-head">${avatarSVG(p, 64)}<div><h3>Trattativa con ${esc(p.name)}</h3><p class="muted small">${p.pos} · ${p.age} anni · OVR ${exact(p) ? '' : '~'}${shownOvr(p)}${p.agency ? ' · 🔒 ' + esc(p.agency) : ''}</p></div></div>
      <div class="tk-pat"><span>Pazienza</span><span class="hearts">${hearts}</span></div>
      <div class="tk-ask"><small>La sua richiesta</small><b>${talkTxt(t.ask)}</b></div>
      <ul class="tk-log">${t.log.slice(-5).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="neg-form">
        <label>Commissione che chiedi: <b id="tk-cv">${sug.comm}%</b><input id="tk-c" type="range" min="1" max="4" step="0.5" value="${sug.comm}" oninput="document.getElementById('tk-cv').textContent=this.value+'%'"></label>
        <label>Bonus alla firma (migliaia di $)<input id="tk-b" type="number" min="0" step="5" value="${sug.bonus}"></label>
      </div>
      <p class="small muted">Più commissione chiedi, più guadagni ogni anno, ma più si irrita. Un bonus alla firma lo ammorbidisce. Un'offerta troppo lontana gli fa perdere due 🏀 di pazienza.</p>
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
    const r = talkOffer(pid, c, b); save(); this.render();
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
    this.openModal(`<h3>📣 Consiglia ${esc(p.name)}</h3><p class="small">${intro}</p>
      <p class="small muted">Più è buono il tuo rapporto con la squadra, più ti danno retta. Se non ti ascoltano, il rapporto cala un po'. Una volta a settimana per giocatore.</p>
      ${done ? '<p class="warn">Ne hai già parlato con una squadra questa settimana.</p>' : ''}
      <div class="rec-list">${teams.map(({ t, c, slot, rel }) => `<div class="rec">
        <span class="rec-t"><b>${esc(teamName(t))}</b><small>${p.school ? `scelta #${slot} · ` : ''}rapporto ${relLabel(rel)}</small></span>
        <span class="rec-c ${c > .6 ? 'good' : c > .3 ? 'warn' : 'bad'}">${Math.round(c * 100)}%</span>
        <button class="btn sm primary" onclick="UI.doRecommend(${pid}, ${t.id})" ${done ? 'disabled' : ''}>Consiglia</button></div>`).join('')}</div>`);
  },
  doRecommend(pid, tid) { const r = recommend(pid, tid); save(); this.closeModal(); this.render(); toast(r.msg, r.type, r.type === 'good' ? 'Ti hanno ascoltato!' : undefined); },

  /* ---------- Trattative ---------- */
  negotiation(pid, selId = null, msg = '') {
    const p = P(pid);
    const offers = S.offers.filter(o => o.pid === pid);
    if (!offers.length) { this.closeModal(); this.render(); return; }
    const sel = offers.find(o => o.id === selId) || offers[0];
    const val = marketValue(p);
    this.openModal(`
      <h3>Trattative per ${esc(p.name)}</h3>
      <p class="muted small">${p.pos} · ${p.age} anni · OVR ${p.ovr} · valore di mercato stimato <b>${fmtM(val)}</b> · commissione ${p.comm}%</p>
      ${offers.map(o => `<div class="offer ${o.id === sel.id ? 'sel' : ''}" onclick="UI.negotiation(${pid}, ${o.id})" style="cursor:pointer">
        <b>${esc(teamName(S.teams[o.teamId]))}</b> ${o.ext ? '<span class="tag">rinnovo</span>' : ''}
        <div>${fmtM(o.salary)} × ${o.years} ann${o.years > 1 ? 'i' : 'o'} · totale ${fmtM(o.salary * o.years)}</div>
        <div class="small muted">Pazienza GM: <span class="patience">${'🟢'.repeat(Math.max(0, o.patience))}${'⚫'.repeat(Math.max(0, 3 - o.patience))}</span> · record ${S.teams[o.teamId].w}-${S.teams[o.teamId].l} · rapporto ${relLabel(teamRel(o.teamId))}</div>
      </div>`).join('')}
      ${msg ? `<p class="warn">${esc(msg)}</p>` : ''}
      <h3 style="margin-top:14px">Trattativa con ${esc(S.teams[sel.teamId].name)}</h3>
      <div class="neg-form">
        <label>Stipendio richiesto (M$/anno)<input id="ask" type="number" step="0.1" min="${MIN_SAL}" max="${MAX_SAL}" value="${r1(Math.max(sel.salary + 0.5, val))}"></label>
        <label>Anni<select id="yrs">${[1, 2, 3, 4, 5].map(y => `<option ${y === sel.years ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>
      <p class="small muted">Chiedere troppo fa perdere pazienza al GM; cambiare la durata rispetto alla sua proposta riduce un po' il budget.</p>
      <div class="actions">
        <button class="btn good" onclick="UI.doAccept(${sel.id})">Accetta ${fmtM(sel.salary)} × ${sel.years}</button>
        <button class="btn primary" onclick="UI.doCounter(${pid}, ${sel.id})">Controproposta</button>
        <button class="btn bad" onclick="UI.doReject(${pid}, ${sel.id})">Rifiuta</button>
      </div>`);
  },
  doAccept(oid) { acceptOffer(oid); save(); this.closeModal(); this.render(); toast('Contratto firmato!', 'good'); },
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
        <div class="pc-sub">${POS_IT[p.pos]} · ${p.age} anni · potenziale ${ex ? '' : '~'}${shownPot(p)}</div></div></div>
      <div class="traits">${traitChips(p)}</div>
      <p class="story">${esc(storyOf(p))}</p>
      ${(p.traits || []).map(t => `<p class="small muted trait-desc">${TRAITS[t].icon} <b>${TRAITS[t].label}</b>: ${TRAITS[t].desc}</p>`).join('')}
      <dl class="rows">
        <dt>Squadra</dt><dd>${t ? esc(teamName(t)) + ' · #' + p.num : p.school ? esc(p.school) : 'Free agent'}</dd>
        ${t ? `<dt>Contratto</dt><dd>${fmtM(p.salary)} × ${p.years}</dd>` : ''}
        <dt>Valore di mercato</dt><dd>${ex ? '' : '~'}${fmtM(shownValue(p))}</dd>
        <dt>Agenzia</dt><dd>${mine ? esc(S.agency) : p.agency ? esc(p.agency) : 'Nessuna'}</dd>
        ${t ? `<dt>Stagione</dt><dd>${statLine(p)} (${p.gp} gare)</dd>` : ''}
        <dt>Popolarità</dt><dd>${Math.round(p.hype)}/100</dd>
        ${p.draftPick ? `<dt>Draft</dt><dd>scelta #${p.draftPick}</dd>` : ''}
        <dt>Carriera</dt><dd>${c.seasons} stag. · ${c.titles} 💍 · ${c.allstar} ⭐ · ${c.mvp} MVP</dd>
        ${mine ? `<dt>Commissione</dt><dd>${p.comm}%</dd><dt>Rapporto</dt><dd>${p.morale}/100</dd>` : ''}
        ${p.sponsors.length ? `<dt>Sponsor</dt><dd>${p.sponsors.map(s => `${esc(s.brand)} ${fmtM(s.value)} (${s.years}a)`).join('<br>')}</dd>` : ''}
      </dl>
      <div class="actions">
        ${mine ? `<button class="btn sm" onclick="UI.doContact(${p.id});UI.player(${p.id})" ${p.lastContact === S.turn ? 'disabled' : ''}>📞 Contatta</button>
          <button class="btn sm" onclick="UI.recModal(${p.id})">📣 Consiglia a una squadra</button>
          <button class="btn bad sm" onclick="UI.release(${p.id})">Interrompi rapporto</button>`
          : `<button class="btn primary sm" onclick="UI.pitchModal(${p.id})">${S.talks[p.id] ? 'Riprendi la trattativa' : 'Proponi agenzia'}</button>
          ${p.school ? `<button class="btn sm" onclick="UI.recModal(${p.id})">📣 Consiglia a una squadra</button>` : ''}
          ${!ex && p.school ? `<button class="btn sm" onclick="UI.doScout(${p.id});UI.player(${p.id})">🔭 Osserva</button>` : ''}`}
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
        ${st.map((t, i) => { const pr = payroll(t.id); return `<tr class="${myTeams.has(t.id) ? 'mine' : ''}"><td>${i + 1}${i === 15 ? ' ✂️' : ''}</td><td>${esc(teamName(t))}</td><td class="num">${t.w}</td><td class="num">${t.l}</td>
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
          .map(p => `<tr class="${isClient(p) ? 'mine' : ''}"><td><a class="pname" href="#" onclick="UI.player(${p.id});return false">${avatarSVG(p, 28)}${esc(p.name)}${p.star || p.vip ? ' ⭐' : ''}</a></td><td>${teamOf(p).abbr}</td><td class="num">${p.ovr}</td><td>${statLine(p)}</td><td class="num">${fmtM(p.salary)}</td></tr>`).join('')}
      </table></div>`;
  },

  /* ---------- Staff ---------- */
  v_staff() {
    return `<h2>Staff e strutture</h2>
      <p class="muted small">Costi fissi attuali: <b>${fmt$(weeklyCost())}</b> a settimana. Ogni livello aumenta le spese settimanali.</p>
      <div class="grid">${Object.entries(STAFF).map(([k, s]) => {
        const lvl = S.staff[k] || 0, cost = upgradeCost(lvl);
        return `<div class="card"><h3>${s.icon} ${s.name}</h3><div class="muted small">${s.desc}</div>
          <p>${k === 'informer' ? `<b>${INFORMER_LV[lvl]}</b>` : `Livello <b>${lvl}</b> / 5`} ${'★'.repeat(lvl)}${'☆'.repeat(5 - lvl)}</p>
          ${lvl < 5 ? `<button class="btn primary sm" onclick="UI.upgrade('${k}')" ${S.cash < cost ? 'disabled' : ''}>${k === 'informer' && !lvl ? 'Assumi' : 'Potenzia'} — ${fmt$(cost)}</button>` : '<span class="good">Al massimo!</span>'}</div>`;
      }).join('')}</div>`;
  },
  upgrade(k) {
    const cost = upgradeCost(S.staff[k] || 0);
    if (S.cash < cost) return toast('Fondi insufficienti.', 'bad');
    spend(cost); S.staff[k] = (S.staff[k] || 0) + 1;
    toast(k === 'informer' ? (S.staff[k] === 1 ? 'Hai assunto un informatore. È ancora scarso, ma ti passerà le prime soffiate.' : `Il tuo informatore ora è: ${INFORMER_LV[S.staff[k]]}.`) : `${STAFF[k].name}: livello ${S.staff[k]}.`, 'good', 'Upgrade!');
    addNews(`🔧 ${STAFF[k].name} potenziato al livello ${S.staff[k]}.`);
    save(); this.render();
  },

  /* ---------- Modale ---------- */
  openModal(html) { document.getElementById('modal-body').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); },
  closeModal() { document.getElementById('modal').classList.add('hidden'); },
  gameOver() {
    this.openModal(`<h3>☠️ Licenza revocata</h3><p>La tua agenzia è rimasta in rosso troppo a lungo.</p>
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
    { t: 't-pls', h: 'I tuoi giocatori', x: 'Per ognuno vedi la <b>prossima partita</b>, la posizione in classifica della squadra, le medie di punti, rimbalzi e assist e il <b>voto dell\'ultima gara</b>. Tocca un giocatore per aprire la sua scheda: lì trovi carattere, storia e il pulsante <b>📣 Consiglia</b>.' },
    { t: null, h: 'Il carattere', x: 'Ogni giocatore ha 1 o 2 tratti e una sua storia. Il carattere decide che imprevisti gli capitano: un 🎉 <b>festaiolo</b> può fare serata prima di una partita, un 😤 <b>aggressivo</b> finire in una rissa, un 💛 <b>gentile</b> fare beneficenza. Cambia anche le regole: un 🤝 leale è difficile da portarti via, un 💰 attaccato ai soldi chiede di più.' },
    { t: null, h: 'I rapporti', x: 'Giocatori, squadre e sponsor si ricordano di te. Se li tratti bene accettano più volentieri le tue richieste, pagano di più e hanno più pazienza nelle trattative. Se tiri troppo la corda… si chiudono le porte. Trovi i rapporti nelle schede dei clienti e nella scheda Lega.' },
    { t: 'tab-clients', h: 'Clienti', x: 'Le schede complete dei tuoi assistiti. Quando una squadra fa un\'offerta compare il pulsante <b>Offerte</b>: lì tratti stipendio e anni, ma se chiedi troppo il GM perde la pazienza. Usa <b>📞 Contatta</b> per tenerli contenti e <b>📣 Consiglia</b> per proporli a una squadra: un\'offerta per chi è senza contratto, uno scambio per chi ce l\'ha.' },
    { t: 'tab-market', h: 'Mercato', x: 'Qui trovi nuovi clienti: <b>prospetti</b> del college, <b>free agent</b> e giocatori di altre agenzie. Con <b>🔭 Osserva</b> scopri il loro potenziale, con <b>🤝 Coltiva</b> crei un legame prima del Draft. <b>Proponi</b> chiede un incontro: se accetta inizia una vera trattativa. Tu offri commissione e bonus alla firma, lui fa una controfferta e ha una pazienza di 2-5 🏀.' },
    { t: null, h: 'Il Draft', x: 'Puoi <b>consigliare</b> un prospetto a una squadra: se ti danno retta, lo sceglieranno al Draft se è ancora libero al loro turno. Più è buono il rapporto con la squadra, più ti ascoltano. E un ragazzo a cui sei molto legato può sceglierti come agente da solo, prima del Draft.' },
    { t: 'tab-league', h: 'Lega', x: 'Classifica delle 30 squadre col tuo rapporto con ognuna, i rapporti con gli sponsor, i migliori giocatori e la classifica delle agenzie. Le prime 16 vanno ai playoff.' },
    { t: 'tab-staff', h: 'Staff', x: 'Investi in scout, avvocati, marketing e uffici. Qui puoi anche assumere un <b>🕵️ informatore</b>: all\'inizio è scarso e a volte sbaglia, ma ti passa soffiate sui prospetti del prossimo Draft. Ogni livello aumenta le spese settimanali.' },
    { t: 't-help', h: 'Tocca a te!', x: 'Puoi rivedere questo tutorial quando vuoi dal pulsante <b>?</b>. Primo consiglio: vai nel <b>Mercato</b>, chiedi un incontro a un free agent e chiudi la trattativa. In bocca al lupo!' },
  ],
  start() {
    if (!S) return;
    UI.closeModal();
    if (UI.tab !== 'home') { UI.tab = 'home'; UI.render(); }
    this.i = 0; this.build(); this.show();
  },
  build() {
    if (this.el) return;
    const el = document.createElement('div');
    el.id = 'tut'; el.hidden = true;
    el.innerHTML = `<div class="tut-block"></div><div class="spot" id="tut-spot"></div>
      <div class="coach" id="tut-coach">${COACH_SVG}<div class="bubble" id="tut-bubble" role="dialog" aria-live="polite"></div></div>`;
    document.body.appendChild(el);
    this.el = el;
    window.addEventListener('resize', () => { if (!this.el.hidden) this.place(); });
  },
  show() {
    const st = this.steps[this.i], n = this.steps.length;
    this.el.hidden = false;
    document.getElementById('tut-bubble').innerHTML = `<div class="who">Coach Gigi · ${this.i + 1} di ${n}</div><h4>${st.h}</h4><p>${st.x}</p>
      <div class="nav">${this.i < n - 1 ? '<button class="skip" onclick="Tutorial.end()">Salta</button>' : '<span></span>'}
      <span class="btns">${this.i ? '<button class="back" onclick="Tutorial.go(-1)" aria-label="Indietro">‹</button>' : ''}<button class="next" onclick="Tutorial.go(1)">${this.i < n - 1 ? 'Avanti ›' : 'Inizia a giocare!'}</button></span></div>`;
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
    const st = this.steps[this.i], spot = document.getElementById('tut-spot'), coach = document.getElementById('tut-coach');
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
  end() { if (this.el) this.el.hidden = true; if (S) { S.tutorialDone = true; save(); } },
};

load();
if (S) { for (const p of Object.values(S.players)) if (!p.traits) p.traits = genTraits(); S.talks = S.talks || {}; S.staff.informer = S.staff.informer || 0; S.intel = S.intel || []; S.recentEv = S.recentEv || []; S.teamRel = S.teamRel || {}; S.brandRel = S.brandRel || {}; S.inbox = (S.inbox || []).filter(e => e.ev && e.data && e.data.mult); }
UI.render();
Cloud.init();
