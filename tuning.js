/* Super Agente NBA — regolazioni degli imprevisti.
   cond: livello minimo (ovr) o massimo (max) del giocatore perché l'imprevisto abbia senso per la sua carriera.
   ch: per ogni scelta (indice da 0)
     ask: chi deve accettare la richiesta → 'player' (il tuo cliente), 'team' (la sua squadra),
          'brand' (lo sponsor), 'other' (personaggi esterni: conta la reputazione dell'agenzia).
          La probabilità di successo sale o scende col rapporto che hai con loro.
     tr / br: come cambia il rapporto con la squadra / con lo sponsor dopo questa scelta. */
'use strict';

const EVENT_TUNE = {
  videoclip: { celeb: 'music', cond: { ovr: 66 }, ch: { 0: { tr: -2 }, 1: { ask: 'other' } } },
  reality: { cond: { max: 82 } },
  film: { celeb: 'actor', cond: { ovr: 72 }, ch: { 1: { ask: 'other' } } },
  podcast: { cond: { ovr: 65 } },
  talkshow: { cond: { ovr: 72 } },
  intervista: { ch: { 0: { ask: 'player', tr: 3 }, 1: { tr: -3 }, 2: { tr: 1 } } },
  documentario: { cond: { ovr: 78 } },
  sfilata: { cond: { ovr: 70 }, ch: { 0: { tr: -3 } } },
  autobiografia: { cond: { ovr: 74 } },
  gaffe: { ch: { 1: { tr: 3 } } },
  paparazzi: { cond: { ovr: 68 } },
  sponsor: { ch: { 0: { br: 6 }, 1: { ask: 'brand', br: -3 }, 2: { br: -4 } } },
  pizzeria: { ch: { 2: { ask: 'player' } } },
  cripto: { ch: { 0: { ask: 'player' } } },
  scarpa: { ch: { 0: { br: 6 }, 1: { ask: 'brand', br: -5 } } },
  sponsor_ritiro: { ch: { 0: { ask: 'brand', br: 4 }, 1: { ask: 'brand', br: -10 }, 2: { br: -2 } } },
  cerealsi: { ch: { 0: { br: 4 }, 1: { ask: 'brand', br: -2 } } },
  immobili: { cond: { ovr: 70 }, ch: { 0: { ask: 'player' } } },
  auto: { cond: { ovr: 68 } },
  energydrink: { ch: { 0: { br: 4 }, 1: { br: -3 } } },
  pubblicita_flop: { ch: { 0: { br: 5 }, 1: { br: -2 } } },
  abbigliamento: { ch: { 1: { ask: 'player' } } },
  ristorante_chef: { cond: { ovr: 66 } },
  nft: { cond: { ovr: 70 } },
  tatuaggio_faccia: { ch: { 1: { ask: 'player' }, 2: { ask: 'player' } } },
  cresta: { ch: { 1: { ask: 'player' } } },
  treccine: { ch: { 0: { tr: 2 }, 1: { tr: -1 } } },
  occhiali: { ch: { 0: { ask: 'player' } } },
  numero: { ch: { 1: { ask: 'team' } } },
  catena: { ch: { 1: { ask: 'player' } } },
  matrimonio: { ch: { 2: { ask: 'player' } } },
  figlio: { ch: { 0: { ask: 'team' }, 1: { ask: 'player', tr: 2 } } },
  vacanza: { ch: { 1: { ask: 'player' } } },
  animali: { ch: { 0: { ask: 'player' } } },
  coach_lite: { ch: { 0: { ask: 'team', tr: 4 }, 1: { tr: -6 }, 2: { ask: 'player', tr: 3 } } },
  panchina: { cond: { max: 78 }, ch: { 0: { ask: 'team', tr: -2 }, 1: { ask: 'player' } } },
  scambio: { ch: { 0: { ask: 'team', tr: -6 }, 1: { ask: 'player' } } },
  gara_schiacciate: { cond: { ovr: 68 } },
  rivalita: { cond: { ovr: 70 } },
  capitano: { ch: { 0: { ask: 'team', tr: -1 }, 1: { tr: 2 } } },
  spogliatoio: { ch: { 1: { tr: -3 } } },
  tecnico: { ch: { 1: { ask: 'other' } } },
  nazionale: { cond: { ovr: 70 }, ch: { 0: { tr: -2 }, 1: { tr: 2 } } },
  ruolo: { ch: { 0: { ask: 'team' }, 1: { ask: 'player' } } },
  record: { cond: { ovr: 78 } },
  clausola: { ch: { 0: { tr: -2 }, 1: { tr: 2 } } },
  sonno: { ch: { 1: { ask: 'player' } } },
  crio: { cond: { ovr: 70 } },
  rivale: { ch: { 1: { ask: 'player' } } },
  follower: { cond: { ovr: 76 } },
  cartellone: { cond: { ovr: 72 } },
  murale: { cond: { ovr: 76 } },
  fondazione: { cond: { ovr: 74 } },
  asta: { cond: { ovr: 72 } },
  ambiente: { ch: { 0: { ask: 'player' } } },
  alieni: { ch: { 1: { ask: 'player' } } },
  superstizione: { ch: { 0: { ask: 'player' } } },
  mascotte: { ch: { 0: { tr: 2 }, 1: { tr: -2 } } },
  fan_club_italia: { cond: { ovr: 66 } },
  gioco_tavolo: { cond: { ovr: 74 } },
  cartoni: { cond: { ovr: 62 } },
};

// Che tipo di personaggio famoso serve all'imprevisto (gli altri usano chiunque)
const CELEB_KIND = {
  music: ['Taylor Swiffer', 'Snoop Dogsitter', 'Eros Ramazzotto', 'Billie Eyelash', 'Kanye Best', 'Rihanna Banana', 'Shakiro',
    'Bruno Marte', 'Ed Sheerin', 'Harry Stiles', 'Gianni Morandini', 'Lady Gaggia', 'Drago'],
  actor: ['Leo DiCaprino', 'Brad Pitbull', 'Keanu Leaves', 'Morgan Freezer', 'Dwayne "La Roccia" Johnsoni', 'Zendayana',
    'Tom Cruiseship', 'Will Smithers'],
};
CELEB_KIND.music.concat(CELEB_KIND.actor).forEach(n => { if (!CELEBS.includes(n)) console.warn('Personaggio sconosciuto:', n); });

// Applica le regolazioni agli imprevisti
for (const [id, t] of Object.entries(EVENT_TUNE)) {
  const e = EVENTS.find(x => x.id === id);
  if (!e) continue;
  if (t.cond) e.cond = { ...(e.cond || {}), ...t.cond };
  if (t.celeb) e.celeb = t.celeb;
  for (const [i, c] of Object.entries(t.ch || {})) Object.assign(e.choices[i], c);
}
