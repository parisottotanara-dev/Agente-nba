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
    num: pick(NUMBERS), look: genLook(),
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
  return clamp(Math.round(p.pot + p.noise * scoutSD() * k), shownOvr(p), 99);
}
const exact = p => isClient(p) || p.scouted || !p.school;
// valore come lo percepisci tu (per i prospetti si basa sulle stime dello scout)
const shownValue = p => exact(p) ? marketValue(p) : marketValue({ ...p, ovr: shownOvr(p), pot: shownPot(p) });

function newGame(agencyName, agentName) {
  S = {
    v: 2, agency: agencyName || 'Hoop Dreams Agency', agent: agentName || 'Agente',
    cash: 300000, rep: 15, season: 2026, phase: 'fa', week: 1, turn: 0,
    staff: { scout: 0, legal: 0, marketing: 0, office: 0 },
    teams: TEAMS.map((t, i) => ({ id: i, city: t[0], name: t[1], abbr: t[2], market: t[3], color: t[4], color2: t[5], w: 0, l: 0 })),
    players: {}, clients: [], offers: [], inbox: [], news: [], nextId: 1, nextEv: 1,
    goals: {}, debtWeeks: 0, history: [], lastChampion: null, over: false,
    seasonIncome: 0, seasonExpense: 0, recentEv: [], tutorialDone: false, teamRel: {}, brandRel: {},
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
};
const upgradeCost = lvl => [60000, 150000, 320000, 650000, 1300000][lvl] ?? Infinity;
const weeklyCost = () => 6000 + 3000 * (S.staff.scout + S.staff.legal + S.staff.marketing) + 4000 * S.staff.office;
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

function simWeekGames() {
  const str = S.teams.map(t => teamStrength(t.id));
  for (let g = 0; g < 4; g++) {
    const ids = shuffle(S.teams.map(t => t.id));
    for (let i = 0; i < ids.length; i += 2) {
      const a = ids[i], b = ids[i + 1];
      if (chance(winProb(str[a] + 1, str[b]))) { S.teams[a].w++; S.teams[b].l++; } else { S.teams[b].w++; S.teams[a].l++; }
    }
  }
  // statistiche individuali
  const MIN = [34, 33, 31, 29, 27, 24, 20, 16, 12, 8, 5, 3, 2, 1, 1];
  for (const t of S.teams) {
    const r = rosterOf(t.id).filter(p => !p.injury).sort((a, b) => b.ovr - a.ovr);
    r.forEach((p, i) => {
      const m = MIN[i] ?? 0; if (!m) return;
      const f = m / 36, q = Math.max(1, p.ovr - 40);
      const rebK = { PG: .07, SG: .09, SF: .13, PF: .2, C: .24 }[p.pos];
      const astK = { PG: .2, SG: .11, SF: .09, PF: .06, C: .05 }[p.pos];
      for (let g = 0; g < 4; g++) {
        const form = 1 + gauss() * 0.22;
        p.gp++;
        p.pts += Math.max(0, q * 0.56 * f * form);
        p.reb += Math.max(0, q * rebK * f * (1 + gauss() * .25));
        p.ast += Math.max(0, q * astK * f * (1 + gauss() * .25));
      }
    });
  }
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
function makeOffersFor(p, n, fromTeam = null) {
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
      max, patience: 3 + (rel >= 70 ? 1 : 0) - (rel < 30 ? 1 : 0), ext: fromTeam != null });
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
function starPower(p) { return p.school ? Math.max(p.ovr, (p.ovr + p.pot) / 2) : p.ovr; }
function pitchCost(p) { return Math.round(Math.max(1500, (starPower(p) - 50) * 450) / 100) * 100; }
function recruitChance(p, comm) {
  let c = 0.5 + (S.rep - (starPower(p) - 55) * 1.6) / 80 + (4 - comm) * 0.1 + S.staff.marketing * 0.03;
  if (p.agency) c -= 0.15;
  c -= p.refusals * 0.12;
  return clamp(c, 0.02, 0.95);
}
function pitch(pid, comm) {
  const p = P(pid);
  if (clients().length >= capacity()) return { msg: 'Hai raggiunto il limite di clienti: amplia gli uffici.' };
  if (p.lastPitch === S.turn) return { msg: 'Lo hai già contattato questa settimana.' };
  if (p.lockedUntil > S.season) return { msg: 'Non vuole più sentirti fino alla prossima stagione.' };
  const cost = pitchCost(p);
  if (S.cash < cost) return { msg: 'Non hai abbastanza contanti per la presentazione.' };
  spend(cost); p.lastPitch = S.turn;
  if (chance(recruitChance(p, comm))) {
    p.comm = comm; p.agency = S.agency; p.morale = randi(65, 85); p.scouted = true;
    S.clients.push(p.id);
    changeRep(clamp((p.ovr - 60) / 15, 0.1, 2));
    addNews(`🤝 <b>${esc(p.name)}</b> (${p.pos}, ${p.ovr}) è il tuo nuovo assistito! Commissione ${comm}%.`, 'good');
    if (p.team == null && !p.school && S.phase === 'fa') {
      const n = makeOffersFor(p, offersCountFor(p));
      if (n) addNews(`📨 Già ${n} offert${n > 1 ? 'e' : 'a'} per ${esc(p.name)}!`);
    }
    checkGoals();
    return { ok: true, msg: `${p.name} ha firmato con la tua agenzia!` };
  }
  p.refusals++;
  if (p.refusals >= 3) p.lockedUntil = S.season + 1;
  return { msg: `${p.name} ha rifiutato. ${p.refusals >= 3 ? 'Non vuole più sentirti per un po\'.' : 'Puoi riprovare la prossima settimana.'}` };
}
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
    .replace(/\{age\}/g, d.age ?? '').replace(/\{num\}/g, d.num ?? '');
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
  const celebs = CELEBS.filter(c => !leagueNames.has(c) && (!p || c !== p.name));
  const d = {
    p: p ? p.name : '', t: p && teamOf(p) ? teamName(teamOf(p)) : '', c: pick(celebs.length ? celebs : CELEBS), r: pick(RIVALS),
    n: others.length ? pick(others).name : 'un avversario', age: p ? p.age : '', num: p ? p.num : '',
    b: pick(BRANDS.filter(b => !p || !p.sponsors.some(s => s.brand === b))), mult: r1(fameMult(p)),
  };
  if (e.cond && e.cond.sponsor && p) d.b = pick(p.sponsors).brand;
  // il valore dello sponsor dipende dal livello del giocatore e dal rapporto col marchio
  if (p) { d.value = r1(sponsorValue(p) * (0.8 + brandRel(d.b) / 250)); d.years = randi(1, 3); }
  S.inbox.push({ id: S.nextEv++, ev: e.id, pid: p ? p.id : null, ico: e.ico, title: fillText(e.title, d), text: fillText(e.text, d), data: d });
  S.recentEv.push(e.id);
  if (S.recentEv.length > 45) S.recentEv.shift();
  if (p) p.lastEv = S.turn;
}
function genWeeklyEvents() {
  const k = clients().filter(p => !p.retired).length;
  const active = S.phase === 'reg' || S.phase === 'fa';
  const p1 = active ? 0.55 + Math.min(k, 12) * 0.025 : 0.25;         // 2 clienti ≈ 60%, 12 clienti ≈ 85%
  const p2 = active && k >= 4 ? 0.05 + Math.min(k, 15) * 0.015 : 0;  // 10 clienti ≈ 20%
  const p3 = active && k >= 10 ? 0.08 : 0;
  const n = chance(p1) ? 1 + (chance(p2) ? 1 : 0) + (chance(p3) ? 1 : 0) : 0;
  for (let i = 0; i < n; i++) {
    // chi ha appena avuto un imprevisto aspetta qualche settimana
    const free = clients().filter(p => !p.retired && !S.inbox.some(x => x.pid === p.id) && S.turn - (p.lastEv ?? -99) >= 3);
    let p = null, pool = [];
    for (let tries = 0; tries < 6 && !pool.length; tries++) {
      p = free.length && !chance(0.1) ? pick(free) : null;
      if (p && p.morale < 35 && chance(0.5)) pool = EVENTS.filter(e => e.id === 'rivale');
      else pool = EVENTS.filter(e => condOk(e, p) && !S.recentEv.includes(e.id));
    }
    if (pool.length) createEvent(pick(pool), p);
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
  for (const x of targets) if (f.mor) x.morale = clamp(Math.round(x.morale + f.mor), 0, 100);
  if (f.br) changeBrandRel(inst.data.b, f.br);
  if (!p) { if (f.gem) findGem(); return; }
  if (f.tr) changeTeamRel(p.team, f.tr);
  if (f.hype) p.hype = clamp(p.hype + f.hype, 0, 100);
  if (f.ovr) { p.ovr = clamp(p.ovr + f.ovr, 35, 99); p.pot = Math.max(p.pot, p.ovr); }
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
function tradePlayer(p, toContender) {
  const cur = p.team;
  let pool = S.teams.filter(t => t.id !== cur);
  if (toContender) pool = standings().filter(t => t.id !== cur).slice(0, 12);
  const to = pick(pool);
  // contropartita: un giocatore di valore simile fa il viaggio opposto
  const back = rosterOf(to.id).filter(x => !isClient(x)).sort((a, b) => Math.abs(a.salary - p.salary) - Math.abs(b.salary - p.salary))[0];
  if (back) back.team = cur;
  p.team = to.id;
  return to;
}

/* ================================================================== */
/* Avanzamento                                                         */
/* ================================================================== */
function advance() {
  if (S.over) return;
  if (S.inbox.length) { toast('Prima scegli cosa fare con gli imprevisti della settimana (Home).'); UI.tab = 'home'; UI.render(); return; }
  S.turn++;
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
    simWeekGames();
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
    runDraft();
    offseason();
    S.phase = 'fa'; S.week = 1;
    makeOffersForClientFAs();
  }

  if (!S.over) genWeeklyEvents();

  // bancarotta
  if (S.cash < 0) {
    S.debtWeeks++;
    if (S.debtWeeks >= 4) { S.over = true; addNews('☠️ Licenza revocata per insolvenza. Fine della carriera.', 'bad'); }
    else addNews(`⚠️ Conto in rosso! Hai ${4 - S.debtWeeks} settiman${4 - S.debtWeeks > 1 ? 'e' : 'a'} per rientrare.`, 'bad');
  } else S.debtWeeks = 0;

  checkGoals();
  save(); UI.render();
  if (S.over) UI.gameOver();
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
  const pros = Object.values(S.players).filter(p => p.school && !p.retired)
    .sort((a, b) => (b.ovr * 0.55 + b.pot * 0.45 + b.teamNoise * 3) - (a.ovr * 0.55 + a.pot * 0.45 + a.teamNoise * 3));
  let n = 0;
  const mine = [];
  for (let round = 1; round <= 2; round++) {
    for (const tid of draftOrder) {
      const p = pros[n]; if (!p) break;
      n++;
      const sal = round === 1 ? r1(Math.max(2.2, 11 - (n - 1) * 0.3)) : MIN_SAL;
      p.school = null; p.team = tid; p.salary = sal; p.years = round === 1 ? 4 : 2; p.rookieSeason = S.season + 1;
      p.draftPick = n;
      if (isClient(p)) { mine.push(p); changeRep(round === 1 ? Math.max(0.5, (31 - n) / 5) : 0.3); p.morale = clamp(p.morale + (round === 1 ? 15 : 0), 0, 100); }
    }
  }
  const first = pros[0];
  if (first) addNews(`🎓 Draft ${S.season + 1}: prima scelta assoluta <b>${esc(first.name)}</b> ai ${esc(teamName(teamOf(first)))}.`, 'gold');
  for (const p of mine) addNews(`🎓 Il tuo cliente <b>${esc(p.name)}</b> scelto con la #${p.draftPick} dai ${esc(teamName(teamOf(p)))} (${fmtM(p.salary)} × ${p.years}).`, 'good');
  if (mine.some(p => p.draftPick <= 5)) checkGoal('top5', true);
  // non scelti → free agent
  for (const p of Object.values(S.players)) if (p.school && !p.retired) {
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
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
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
          <button class="btn primary big" id="t-adv" onclick="advance()" ${S.over ? 'disabled' : ''}>${advLabel}</button>
        </div>
        <nav class="tabs">
          ${[['home', '🏠 Home', inbox], ['clients', '⭐ Clienti', nOffers], ['market', '🔎 Mercato', 0], ['league', '🏆 Lega', 0], ['staff', '🏢 Staff', 0]]
            .map(([k, l, b]) => `<button id="tab-${k}" class="${this.tab === k ? 'on' : ''}" onclick="UI.go('${k}')">${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('')}
        </nav>
      </header>
      <main>${this['v_' + this.tab]()}</main>`;
  },
  go(t) { this.tab = t; this.render(); window.scrollTo(0, 0); },

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
      ${S.inbox.length ? `<div class="evs">${S.inbox.map(e => this.eventCard(e)).join('')}</div>`
        : `<div class="ev calm"><div class="ev-top"><div class="ev-ico">😌</div><div><h3>Settimana tranquilla</h3><p>Nessun imprevisto da gestire. Premi <b>${{ fa: 'Avanza settimana', reg: 'Gioca settimana', po: 'Gioca i playoff', draft: 'Vai al Draft' }[S.phase]}</b> per andare avanti.</p></div></div></div>`}
      </div>

      ${S.offers.length ? `<div class="sec"><h2>📨 Trattative aperte</h2></div><div class="feed">${[...new Set(S.offers.map(o => o.pid))].map(pid => {
        const p = P(pid), n = S.offers.filter(o => o.pid === pid).length;
        return `<button class="item deal" onclick="UI.negotiation(${pid})">${avatarSVG(p, 40)}<div><b>${esc(p.name)}</b><small>${n} offert${n > 1 ? 'e' : 'a'}${S.offers.some(o => o.pid === pid && o.ext) ? ' · rinnovo' : ''}</small></div><span class="go">Negozia ›</span></button>`;
      }).join('')}</div>` : ''}

      <div class="sec"><h2>⭐ I tuoi campioni</h2><a href="#" onclick="UI.go('clients');return false">Vedi tutti</a></div>
      <div class="cards">
        ${cl.sort((a, b) => b.ovr - a.ovr).map(p => {
          const t = teamOf(p);
          return `<button class="fig" onclick="UI.player(${p.id})"><span class="ov ${this.ovrClass(p.ovr)}">${p.ovr}</span>${avatarSVG(p, 64)}
            <b>${esc(p.name)}</b><span>${p.pos} · ${t ? esc(t.name) : p.school ? 'prospetto Draft' : 'free agent'}</span>
            ${p.injury ? '<span class="tag inj">infortunato</span>' : ''}</button>`;
        }).join('')}
        ${cl.length < capacity() ? `<button class="fig add" onclick="UI.go('market')"><div class="plus">＋</div><span>Trova un nuovo cliente</span></button>` : ''}
      </div>

      <div class="sec"><h2>📰 Dalla lega</h2></div>
      <div class="feed">${feed}</div>

      <div class="sec"><h2>🏅 Obiettivi</h2><span class="muted small">${Object.keys(S.goals).length}/${GOALS.length}</span></div>
      <div class="goals">${GOALS.map(([k, l]) => `<div class="goal ${S.goals[k] ? 'done' : ''}">${S.goals[k] ? '✅' : '⬜'} ${esc(l)}</div>`).join('')}</div>

      ${S.history.length ? `<div class="sec"><h2>📊 Storico stagioni</h2></div><div class="tbl-wrap"><table><tr><th>Stagione</th><th class="num">Entrate</th><th class="num">Spese</th><th class="num">Clienti</th><th class="num">Reputazione</th></tr>
        ${S.history.map(h => `<tr><td>${h.season}</td><td class="num good">${fmt$(h.income)}</td><td class="num bad">${fmt$(h.expense)}</td><td class="num">${h.clients}</td><td class="num">${h.rep.toFixed(1)}</td></tr>`).join('')}</table></div>` : ''}
      <p style="margin-top:28px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="Tutorial.start()">❓ Rivedi il tutorial</button><button class="btn bad sm" onclick="UI.reset()">Ricomincia da capo</button></p>`;
  },
  eventCard(e) {
    const def = EVENTS.find(x => x.id === e.ev);
    const p = e.pid != null ? P(e.pid) : null;
    if (!def) return '';
    return `<div class="ev">
      <div class="ev-top">${p ? `<div class="ev-av">${avatarSVG(p, 54)}<span>${e.ico}</span></div>` : `<div class="ev-ico">${e.ico}</div>`}
        <div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div></div>
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
    const total = list.length; list = list.slice(0, 80);
    const full = clients().length >= capacity();
    return `
      <h2>Mercato</h2>
      <div class="filters">
        <div class="seg">${[['prospect', 'Prospetti Draft'], ['fa', 'Free agent'], ['pro', 'Sotto contratto']].map(([k, l]) =>
          `<button class="${this.mkt === k ? 'on' : ''}" onclick="UI.mkt='${k}';UI.render()">${l}</button>`).join('')}</div>
        <select onchange="UI.pos=this.value;UI.render()"><option value="">Tutti i ruoli</option>${POS.map(x => `<option ${this.pos === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <select onchange="UI.sort=this.value;UI.render()">${[['ovr', 'Ordina: OVR'], ['pot', 'Ordina: potenziale'], ['age', 'Ordina: più giovani'], ['val', 'Ordina: valore']].map(([k, l]) => `<option value="${k}" ${this.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input placeholder="Cerca nome…" value="${esc(this.q)}" onchange="UI.q=this.value;UI.render()">
      </div>
      ${full ? '<p class="warn small">Hai raggiunto il limite di clienti: amplia gli uffici nella scheda Staff.</p>' : ''}
      <p class="small muted">${this.mkt === 'prospect' ? 'Le valutazioni dei prospetti sono stime (~): osservali per vederli meglio. Al Draft finiscono in squadra con un contratto da rookie.' :
        this.mkt === 'fa' ? 'I free agent firmati in Free Agency ricevono subito offerte dalle squadre.' : 'Strappare un giocatore a un\'agenzia rivale è più difficile.'}
        ${total > 80 ? ` Mostrati 80 di ${total}.` : ''}</p>
      <div class="tbl-wrap"><table>
        <tr><th>Giocatore</th><th>Ruolo</th><th class="num">Età</th><th class="num">OVR</th><th class="num">POT</th><th>${this.mkt === 'prospect' ? 'Provenienza' : 'Squadra'}</th><th>Agenzia</th><th class="num">Valore</th><th></th></tr>
        ${list.map(p => {
          const ex = exact(p);
          return `<tr><td><a class="pname" href="#" onclick="UI.player(${p.id});return false">${avatarSVG(p, 28)}${esc(p.name)}${p.star || p.vip ? ' ⭐' : ''}</a></td><td>${p.pos}</td><td class="num">${p.age}</td>
          <td class="num"><b>${ex ? '' : '~'}${shownOvr(p)}</b></td><td class="num">${ex ? '' : '~'}${shownPot(p)}</td>
          <td>${p.school ? esc(p.school) : p.team != null ? esc(teamOf(p).abbr) : '—'}</td>
          <td class="small ${p.agency ? '' : 'good'}">${p.agency ? esc(p.agency) : 'Nessuna'}</td>
          <td class="num">${ex ? '' : '~'}${fmtM(shownValue(p))}</td>
          <td>${!ex && p.school ? `<button class="btn sm" title="Manda uno scout a osservarlo" onclick="UI.doScout(${p.id})">🔭</button> ` : ''}<button class="btn primary sm" onclick="UI.pitchModal(${p.id})" ${full ? 'disabled' : ''}>Proponi</button></td></tr>`;
        }).join('')}
      </table></div>`;
  },
  doScout(pid) { toast(scout(pid)); save(); this.render(); },

  pitchModal(pid, comm = 3) {
    const p = P(pid);
    this.pitchComm = comm;
    const c = recruitChance(p, comm), cost = pitchCost(p);
    const blocked = p.lockedUntil > S.season ? 'Non vuole parlarti fino alla prossima stagione.' : p.lastPitch === S.turn ? 'Già contattato questa settimana.' : '';
    this.openModal(`
      <h3>Proposta a ${esc(p.name)}</h3>
      <p class="muted small">${p.pos} · ${p.age} anni · OVR ${exact(p) ? '' : '~'}${shownOvr(p)} · POT ${exact(p) ? '' : '~'}${shownPot(p)} · ${p.agency ? 'assistito da ' + esc(p.agency) : 'senza agente'}</p>
      <label class="small muted">Commissione richiesta: <b id="cm">${comm}%</b></label>
      <input type="range" min="1" max="4" step="1" value="${comm}" oninput="UI.updPitch(${pid}, +this.value)">
      <p>Probabilità di successo: <span id="pc" class="chance ${this.chCls(c)}">${Math.round(c * 100)}%</span></p>
      <p class="small muted">Costo della presentazione: ${fmt$(cost)}. Commissione più bassa = più facile convincerlo, ma guadagni meno.
        ${p.team != null ? `Guadagno stimato: <b id="pg">${fmt$(p.salary * 1e6 * comm / 100)}</b>/anno.` : ''}</p>
      ${blocked ? `<p class="bad">${blocked}</p>` : ''}
      <div class="actions"><button class="btn primary" onclick="UI.doPitch(${pid}, UI.pitchComm)" ${blocked ? 'disabled' : ''}>Presenta l'agenzia — ${fmt$(cost)}</button>
      <button class="btn" onclick="UI.closeModal()">Annulla</button></div>`);
  },
  chCls: c => c > .6 ? 'good' : c > .3 ? 'warn' : 'bad',
  updPitch(pid, comm) {
    const p = P(pid), c = recruitChance(p, comm);
    this.pitchComm = comm;
    document.getElementById('cm').textContent = comm + '%';
    const pc = document.getElementById('pc'); pc.textContent = Math.round(c * 100) + '%'; pc.className = 'chance ' + this.chCls(c);
    const pg = document.getElementById('pg'); if (pg) pg.textContent = fmt$(p.salary * 1e6 * comm / 100);
  },
  doPitch(pid, comm) {
    const r = pitch(pid, comm);
    save(); this.closeModal(); this.render(); toast(r.msg);
  },

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
  doAccept(oid) { acceptOffer(oid); save(); this.closeModal(); this.render(); toast('Contratto firmato!'); },
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
          <button class="btn bad sm" onclick="UI.release(${p.id})">Interrompi rapporto</button>`
          : `<button class="btn primary sm" onclick="UI.pitchModal(${p.id})">Proponi agenzia</button>
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
        const lvl = S.staff[k], cost = upgradeCost(lvl);
        return `<div class="card"><h3>${s.icon} ${s.name}</h3><div class="muted small">${s.desc}</div>
          <p>Livello <b>${lvl}</b> / 5 ${'★'.repeat(lvl)}${'☆'.repeat(5 - lvl)}</p>
          ${lvl < 5 ? `<button class="btn primary sm" onclick="UI.upgrade('${k}')" ${S.cash < cost ? 'disabled' : ''}>Potenzia — ${fmt$(cost)}</button>` : '<span class="good">Al massimo!</span>'}</div>`;
      }).join('')}</div>`;
  },
  upgrade(k) {
    const cost = upgradeCost(S.staff[k]);
    if (S.cash < cost) return toast('Fondi insufficienti.');
    spend(cost); S.staff[k]++;
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
    { t: 't-adv', h: 'Avanza settimana', x: 'Ogni tocco fa passare una settimana: si giocano le partite, incassi le commissioni, paghi lo staff e succedono gli imprevisti. La stagione è: Free Agency → stagione regolare → playoff → Draft.' },
    { t: 't-cash', h: 'La tua cassa', x: 'Qui vedi i soldi e quanto guadagni o perdi in media a settimana. Ci paghi lo staff e le presentazioni ai giocatori. <b>Se resti in rosso per 4 settimane perdi la licenza!</b>' },
    { t: 't-rep', h: 'La reputazione', x: 'Più è alta, più è facile convincere i campioni a firmare con te. Sale con i contratti ricchi, i premi e le scelte azzeccate; scende con figuracce e clienti persi.' },
    { t: 't-cl', h: 'I posti in agenzia', x: 'Puoi seguire un numero limitato di clienti. Per averne di più, amplia gli <b>Uffici</b> nella scheda Staff.' },
    { t: 't-ev', h: 'Gli imprevisti', x: 'Spesso succede qualcosa: videoclip, tatuaggi, sponsor, litigi col coach… Sotto ogni scelta vedi cosa succede e con che probabilità. <b>Devi decidere prima di avanzare.</b> Alcune scelte cambiano anche l\'aspetto del giocatore!' },
    { t: null, h: 'I rapporti', x: 'Giocatori, squadre e sponsor si ricordano di te. Se li tratti bene accettano più volentieri le tue richieste, ti pagano di più e hanno più pazienza nelle trattative. Se tiri troppo la corda… si chiudono le porte. Trovi i rapporti nelle schede dei clienti e nella scheda Lega.' },
    { t: 'tab-clients', h: 'Clienti', x: 'Qui ci sono le schede dei tuoi assistiti: contratto, morale, statistiche. Quando una squadra fa un\'offerta compare il pulsante <b>Offerte</b>: lì negozi stipendio e anni. Chiedi troppo e il GM perde la pazienza. Usa <b>📞 Contatta</b> ogni settimana per tenerli contenti.' },
    { t: 'tab-market', h: 'Mercato', x: 'Qui trovi i nuovi clienti: <b>prospetti</b> del college (vanno al Draft), <b>free agent</b> (senza squadra) e giocatori di altre agenzie. Usa 🔭 per osservare un prospetto e <b>Proponi</b> per convincerlo: una commissione più bassa lo convince più facilmente.' },
    { t: 'tab-league', h: 'Lega', x: 'Classifica delle 30 squadre, migliori giocatori e la classifica delle agenzie. Le prime 16 vanno ai playoff.' },
    { t: 'tab-staff', h: 'Staff', x: 'Investi in scout, avvocati, marketing e uffici. Ogni livello costa e aumenta le spese settimanali, ma ti fa guadagnare di più.' },
    { t: 't-help', h: 'Tocca a te!', x: 'Puoi rivedere questo tutorial quando vuoi dal pulsante <b>?</b>. Primo consiglio: vai nel <b>Mercato</b>, firma un free agent e chiudi la sua trattativa. In bocca al lupo!' },
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
    if (tg && tg.closest('main')) {
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
    Object.assign(spot.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: h + pad * 2 + 'px' });
    coach.className = 'coach ' + (innerHeight - (r.top + h) >= bh + 24 || above < bh + 24 ? 'bottom' : 'top');
  },
  go(d) { this.i += d; if (this.i >= this.steps.length) return this.end(); this.i = Math.max(0, this.i); this.show(); },
  end() { if (this.el) this.el.hidden = true; if (S) { S.tutorialDone = true; save(); } },
};

load();
if (S) { S.recentEv = S.recentEv || []; S.teamRel = S.teamRel || {}; S.brandRel = S.brandRel || {}; S.inbox = (S.inbox || []).filter(e => e.ev && e.data && e.data.mult); }
UI.render();
Cloud.init();
