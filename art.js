/* Super Agente NBA — grafica: aspetto dei giocatori, avatar e illustrazione della Home (SVG). */
'use strict';

const SKINS = ['#f1c7a0', '#e0ac7e', '#c68642', '#a0662f', '#7a4a2a', '#5c3920'];
const HAIR_COLORS = ['#1a1a1a', '#1a1a1a', '#2b1d14', '#4a3020', '#c8862f', '#8a3b12'];
const NUMBERS = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 32, 33, 34, 35, 41, 44, 55, 77];

function genLook() {
  const r = Math.random();
  return {
    skin: SKINS[Math.floor(Math.random() * SKINS.length)],
    hair: r < .3 ? 'short' : r < .5 ? 'buzz' : r < .65 ? 'afro' : r < .78 ? 'braids' : r < .9 ? 'bald' : 'short',
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    beard: Math.random() < .3 ? 'short' : Math.random() < .06 ? 'long' : null,
    headband: Math.random() < .1,
  };
}

// Colore leggibile sopra un altro (per il numero di maglia)
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
}
function contrastOn(bg, pref) {
  const a = lum(bg), b = lum(pref);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  return ratio >= 2.2 ? pref : a > .35 ? '#111111' : '#ffffff';
}
function kitOf(p) {
  const t = p && p.team != null && typeof S !== 'undefined' && S ? S.teams[p.team] : null;
  const main = t ? t.color : '#ff7a1a', second = t ? t.color2 : '#ffffff';
  return { main, num: contrastOn(main, second), shorts: second === '#ffffff' || second === '#c4ced4' ? main : second };
}

/* Testa disegnata in uno spazio con raggio 20 centrato in (0,0). */
function headSVG(look) {
  const L = look || {}, skin = L.skin || '#c68642', hc = L.hairColor || '#1a1a1a';
  let back = '', hair = '', face = '', top = '';
  if (L.hair === 'afro') back = `<circle cx="0" cy="-5" r="27" fill="${hc}"/>`;
  if (L.hair === 'braids') back = [-17, -10, 10, 17].map(x => `<path d="M${x} -8 Q${x * 1.15} 8 ${x * 1.1} 22" stroke="${hc}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
  const ears = `<circle cx="-20" cy="3" r="4.5" fill="${skin}"/><circle cx="20" cy="3" r="4.5" fill="${skin}"/>`;
  const head = `<circle r="20" fill="${skin}"/>`;
  switch (L.hair) {
    case 'short': case 'braids': hair = `<path d="M-20 -3 Q-21 -25 0 -25 Q21 -25 20 -3 Q11 -14 0 -14 Q-11 -14 -20 -3Z" fill="${hc}"/>`; break;
    case 'buzz': hair = `<path d="M-19 -7 Q-16 -22 0 -22 Q16 -22 19 -7 Q0 -15 -19 -7Z" fill="${hc}" opacity=".85"/>`; break;
    case 'afro': hair = `<path d="M-20 -4 Q-20 -22 0 -22 Q20 -22 20 -4 Q10 -12 0 -12 Q-10 -12 -20 -4Z" fill="${hc}"/>`; break;
    case 'mohawk': hair = `<path d="M-5 -17 Q-3 -40 0 -42 Q3 -40 5 -17 Z" fill="${hc}"/>`; break;
    case 'bald': hair = `<ellipse cx="-7" cy="-12" rx="5" ry="3" fill="#fff" opacity=".22"/>`; break;
  }
  if (L.tattoo === 'face') face += `<g stroke="#1b2a4a" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M5 9 l2 3 l2 -3 l2 3"/><path d="M-13 -4 l-2 2 m0 -2 l2 2"/><circle cx="12" cy="13" r="1.2" fill="#1b2a4a"/></g>`;
  face += `<path d="M-11 -5 h7 M4 -5 h7" stroke="${hc}" stroke-width="2" stroke-linecap="round"/>`;
  face += `<circle cx="-7" cy="1" r="2.5" fill="#111"/><circle cx="7" cy="1" r="2.5" fill="#111"/>`;
  if (L.glasses === 'sun') face += `<g fill="#111"><rect x="-14" y="-3" width="11" height="7" rx="2"/><rect x="3" y="-3" width="11" height="7" rx="2"/></g><path d="M-3 0 h6 M-14 0 l-6 -1 M14 0 l6 -1" stroke="#111" stroke-width="1.5"/>`;
  if (L.glasses === 'goggles') face += `<path d="M-20 0 h40" stroke="#222" stroke-width="2.5"/><g fill="rgba(170,215,255,.45)" stroke="#e8eef5" stroke-width="1.6"><rect x="-15" y="-4" width="12" height="9" rx="4"/><rect x="3" y="-4" width="12" height="9" rx="4"/></g>`;
  if (L.mask) face += `<path d="M-15 -3 Q0 -8 15 -3 L13 9 Q0 13 -13 9Z" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.85)" stroke-width="1.2"/>`;
  if (L.beard === 'short') face += `<path d="M-18 5 Q-16 23 0 23 Q16 23 18 5 Q12 15 0 15 Q-12 15 -18 5Z" fill="${hc}" opacity=".92"/>`;
  if (L.beard === 'long') face += `<path d="M-18 4 Q-18 34 0 36 Q18 34 18 4 Q12 15 0 15 Q-12 15 -18 4Z" fill="${hc}"/>`;
  if (L.beard === 'mustache') face += `<path d="M-10 8 Q0 3 10 8 Q5 11 0 9 Q-5 11 -10 8Z" fill="${hc}"/>`;
  face += `<path d="M-7 10 Q0 17 7 10 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/>`;
  if (L.tooth) face += `<rect x="0.5" y="10.4" width="2.6" height="2.8" fill="#111"/>`;
  if (L.headband) top += `<path d="M-20 -8 Q0 -17 20 -8 L20 -2 Q0 -11 -20 -2Z" fill="#fff"/>`;
  return back + ears + head + hair + face + top;
}

/* Avatar (testa e spalle) per carte e liste. */
function avatarSVG(p, size = 64) {
  const k = kitOf(p), L = p.look || {};
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="var(--panel2)"/>
    <clipPath id="ac${p.id}"><circle cx="32" cy="32" r="31"/></clipPath>
    <g clip-path="url(#ac${p.id})">
      <path d="M8 66 Q8 44 32 44 Q56 44 56 66Z" fill="${k.main}"/>
      <path d="M25 44 Q32 52 39 44" fill="${L.skin || '#c68642'}"/>
      ${L.chain ? '<path d="M24 46 Q32 57 40 46" stroke="#f2c94c" stroke-width="2" fill="none"/>' : ''}
      <text x="32" y="62" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9" fill="${k.num}">${p.num ?? ''}</text>
      <g transform="translate(32 27) scale(.68)">${headSVG(L)}</g>
    </g></svg>`;
}

/* Illustrazione della Home: il cliente più pagato che schiaccia nel palazzetto. */
function heroSVG(p) {
  const L = (p && p.look) || { skin: '#7a4a2a', hair: 'short', hairColor: '#1a1a1a', headband: true };
  const k = kitOf(p), skin = L.skin || '#7a4a2a';
  let crowd = '';
  const cc = ['#3b2f6b', '#4a3a80', '#2e2557', '#5a3f8a'];
  for (let r = 0; r < 4; r++) for (let x = (r % 2) * 9; x < 360; x += 18) {
    const c = cc[(x + r) % 4];
    crowd += `<circle cx="${x}" cy="${100 + r * 14}" r="6" fill="${c}"/><rect x="${x - 7}" y="${105 + r * 14}" width="14" height="10" rx="5" fill="${c}"/>`;
  }
  const armTat = L.tattoo === 'arm' ? `<path d="M206 82 l4 -4 m3 -1 l4 -4 m2 0 l3 -3" stroke="#1b2a4a" stroke-width="2"/>` : '';
  return `<svg viewBox="0 -34 360 234" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p ? esc(p.name) : 'Giocatore'} schiaccia a canestro">
  <defs>
    <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1530"/><stop offset="1" stop-color="#22184a"/></linearGradient>
    <linearGradient id="hfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a5b"/><stop offset="1" stop-color="#b8743a"/></linearGradient>
    <radialGradient id="hlight" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect y="-34" width="360" height="234" fill="url(#hsky)"/>
  <g opacity=".9">${crowd}</g>
  <polygon points="120,-34 230,-34 300,165 60,165" fill="url(#hlight)"/>
  <rect y="150" width="360" height="50" fill="url(#hfloor)"/>
  <g stroke="#a8652f" stroke-width="1" opacity=".5"><line x1="0" y1="160" x2="360" y2="160"/><line x1="0" y1="172" x2="360" y2="172"/><line x1="0" y1="186" x2="360" y2="186"/></g>
  <path d="M210 200 Q250 158 360 156" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
  <rect x="282" y="152" width="78" height="48" fill="${k.main}" opacity=".35"/>
  <rect x="318" y="40" width="7" height="125" fill="#58606c"/>
  <rect x="300" y="22" width="8" height="62" rx="2" fill="#f4f7fb" stroke="#c8d0da"/>
  <rect x="301" y="48" width="6" height="18" fill="none" stroke="#ff7a1a" stroke-width="2"/>
  <rect x="306" y="60" width="14" height="5" fill="#58606c"/>
  <path d="M262 74 L268 98 M270 74 L273 98 M279 74 L279 98 M288 74 L285 98 M296 74 L291 98 M268 98 L291 98 M265 86 L294 86" stroke="#f0f0f0" stroke-width="1.4" fill="none"/>
  <ellipse cx="279" cy="73" rx="18" ry="4" fill="none" stroke="#ff5a00" stroke-width="3.5"/>
  <ellipse cx="175" cy="188" rx="40" ry="6" fill="#000" opacity=".25"/>
  <g stroke-linecap="round" stroke-linejoin="round">
    <path d="M168 146 L160 166 L150 176" stroke="${skin}" stroke-width="10" fill="none"/>
    <path d="M184 146 L198 160 L196 176" stroke="${skin}" stroke-width="10" fill="none"/>
    <ellipse cx="146" cy="178" rx="11" ry="6" fill="#fff"/><path d="M137 178 h18" stroke="${k.main}" stroke-width="2"/>
    <ellipse cx="199" cy="179" rx="11" ry="6" fill="#fff"/><path d="M190 179 h18" stroke="${k.main}" stroke-width="2"/>
    <path d="M154 126 h44 l2 24 h-48 z" fill="${k.shorts}" stroke="rgba(0,0,0,.25)"/>
    <path d="M153 88 Q176 80 199 88 L196 130 L156 130 Z" fill="${k.main}" stroke="rgba(0,0,0,.25)"/>
    <path d="M166 88 Q176 98 186 88" fill="${skin}"/>
    ${L.chain ? '<path d="M166 90 Q176 106 186 90" stroke="#f2c94c" stroke-width="2.5" fill="none"/><circle cx="176" cy="104" r="3" fill="#f2c94c"/>' : ''}
    <text x="176" y="122" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="19" fill="${k.num}">${p ? (p.num ?? '') : 0}</text>
    <path d="M196 92 L222 66 L244 72" stroke="${skin}" stroke-width="10" fill="none"/>
    ${armTat}
    <path d="M157 94 L140 80 L132 60" stroke="${skin}" stroke-width="10" fill="none"/>
    <g transform="translate(176 64) scale(1.05)">${headSVG(L)}</g>
  </g>
  <g transform="translate(256 62)">
    <circle r="13" fill="#ff7a1a" stroke="#7a3300" stroke-width="1.5"/>
    <path d="M-13 0 H13 M0 -13 V13 M-9 -9 Q-3 0 -9 9 M9 -9 Q3 0 9 9" stroke="#7a3300" stroke-width="1.3" fill="none"/>
  </g>
  <path d="M232 48 l-8 -6 M236 40 l-6 -9 M244 36 l-2 -10" stroke="#fff" stroke-width="2" opacity=".85" stroke-linecap="round"/>
</svg>`;
}

/* Coach Gigi, la guida del tutorial. */
const COACH_SVG = `<svg width="74" height="90" viewBox="0 0 74 90" aria-hidden="true">
  <path d="M8 90 Q8 62 37 62 Q66 62 66 90Z" fill="#1d2b5c"/><path d="M30 62 L37 76 L44 62" fill="#fff"/>
  <circle cx="37" cy="38" r="20" fill="#f1c7a0"/>
  <path d="M15 32 Q37 6 59 32 Z" fill="#ff7a1a"/><rect x="34" y="28" width="34" height="6" rx="3" fill="#ff7a1a"/>
  <circle cx="30" cy="40" r="2.2"/><circle cx="44" cy="40" r="2.2"/>
  <path d="M27 49 Q37 44 47 49" stroke="#8a5a3a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M30 52 Q37 57 44 52" stroke="#111" stroke-width="1.8" fill="none"/>
  <path d="M37 66 L37 78" stroke="#999"/><rect x="33" y="78" width="9" height="5" rx="2" fill="#c0c0c0"/></svg>`;

/* ---------- Icone del gioco (disegnate a mano, al posto delle emoji) ----------
   Tratto unico, angoli smussati, colore preso dal testo intorno. */
const ICON_PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.6-3.6 3.2-6 6.5-6s5.9 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.6M18.5 14.4c1.7.9 2.8 2.9 3 5.6',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 21 21',
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H3.5c0 3 1.5 4.5 3.8 4.8M17 6h3.5c0 3-1.5 4.5-3.8 4.8M12 14v3.5M8 20.5h8M9.5 17.5h5v3h-5z',
  building: 'M4 20.5V5.5L12 3v17.5M12 8.5l8 2.5v9.5M2.5 20.5h19M7 8h2M7 11.5h2M7 15h2M15 13.5h2M15 17h2',
  ball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3v18M5.6 5.6c2.6 2.4 3.7 4 3.7 6.4s-1.1 4-3.7 6.4M18.4 5.6c-2.6 2.4-3.7 4-3.7 6.4s1.1 4 3.7 6.4',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM14.8 8.6c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 3 5.8 1.6 5.8 4.6 0 1.4-1.3 2.3-3 2.3-1.3 0-2.5-.6-3-1.6M12 5.5v1.7M12 16.2v2',
  alert: 'M12 3.5 21.5 20h-19L12 3.5ZM12 10v4.5M12 17.4v.1',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  x: 'M6 6l12 12M18 6 6 18',
  phone: 'M6.5 3.5h3l1.5 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8l1.4-2.2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z',
  megaphone: 'M3.5 10v4h3l9 5V5l-9 5h-3ZM6.5 14l1.5 6h2.5l-1-5.4M19 9.5c1 .7 1.5 1.5 1.5 2.5s-.5 1.8-1.5 2.5',
  dumbbell: 'M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  deal: 'M3 11.5 7 7.5l3 1.5 3-2 3.5 1L21 11.5M3 11.5l5.5 5.5c.8.8 2 .8 2.8 0M11.5 9l4 4c.8.8.8 2 0 2.8s-2 .8-2.8 0L10 13M16.5 16l1.5 1.5',
  star: 'M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.9L12 16.4 6.6 19.5l1.3-5.9-4.4-4L9.4 9 12 3.5Z',
  lock: 'M5.5 10.5h13v10h-13zM8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5',
  gem: 'M6.5 4h11l4 5.5L12 20.5 2.5 9.5 6.5 4ZM2.5 9.5h19M9.5 4 8 9.5l4 11 4-11L14.5 4',
  cap: 'M2 9.5 12 5l10 4.5-10 4.5L2 9.5ZM6.5 11.5v4.5c1.5 1.5 3.3 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5M21 10v5',
  news: 'M4 5.5h13v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2v-13ZM17 9.5h3v9a2 2 0 0 1-2 2M7.5 9h6M7.5 12.5h6M7.5 16h4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z',
  medal: 'M8 3l4 7 4-7M6.5 3h3M14.5 3h3M12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 13.3l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3 1-2Z',
  chart: 'M3.5 20.5h17M6.5 17v-5M11 17V7M15.5 17v-7.5M20 17V4.5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  calendar: 'M4 6h16v14.5H4zM4 10.5h16M8.5 3.5V8M15.5 3.5V8',
  crown: 'M3.5 18.5h17L21.5 7l-5 4L12 4.5 7.5 11l-5-4 1 11.5Z',
  ring: 'M12 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM9 8.5 7.5 4.5h9L15 8.5M10 4.5 12 8l2-3.5',
  bandage: 'M4.4 14.6 14.6 4.4a3 3 0 0 1 4.2 0l.8.8a3 3 0 0 1 0 4.2L9.4 19.6a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2ZM10 10l4 4M11.5 8.5l1 1M8.5 11.5l1 1',
  spark: 'M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5M5.3 5.3l3.2 3.2M15.5 15.5l3.2 3.2M5.3 18.7l3.2-3.2M15.5 8.5l3.2-3.2',
  mic: 'M9 3.5h6v9a3 3 0 0 1-6 0v-9ZM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7',
  heart: 'M12 20s-8.5-5-8.5-11A4.5 4.5 0 0 1 12 6.6 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11-8.5 11Z',
  party: 'M3.5 20.5 8 7.5l8.5 8.5L3.5 20.5ZM13 3.5c.5 1.5 0 3-1.5 3.5M17 8.5c1.5-1.5 3.5-1.5 4.5-.5M15.5 3.5v1M20.5 12.5h-1M18.5 5.5l.7-.7',
  swap: 'M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4',
  door: 'M5.5 20.5V3.5h10v17M3 20.5h15.5M12.5 12.5v.1M15.5 6h3.5v14.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.8M12 16.8v.1',
  pen: 'M15.5 4.5l4 4L8 20H4v-4L15.5 4.5ZM13 7l4 4',
  flame: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-4.6 4.5-6.3 4.5-11.3 2.5 1.5 4.5 4 4.5 6.5 1-.6 1.5-1.6 1.6-2.7 1.6 1.6 2.4 4 2.4 6.3 0 4-2.7 7.4-6.5 7.4Z',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  chat: 'M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5zM8.5 9.5h7M8.5 12.5h4',
};
function ic(name, cls = '') {
  const d = ICON_PATHS[name] || ICON_PATHS.spark;
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}
// Icone degli imprevisti e delle notizie: le emoji del testo diventano una famiglia di icone
const EMO_CAT = [
  ['mic', '🎤📺🎬🎙🗞🎥📱📸📲🖼🎨📖📢📣🗣🗯🪧©💻📜📰'],
  ['chart', '📈📉📊'],
  ['coin', '💼🪙💸💵🔐🎲🔨🍕💰🏦'],
  ['bandage', '🚑🤒🦴🧊🦷🦵🩹🏥🧪💧🥗🧘🏋😴🥽⏰🍔'],
  ['heart', '💍👶🐶❤🧒💛🤲🕊🎗🏠🏫🌱🧓🎁👨💚'],
  ['party', '🎮🛋😂🐭👗👟🥣🏎🍦🖋🦔🪒🧔💇🦸🥸🔢📿📦🏝♟🍝🪑🚀🥂👽👯🧦🎩🤖🦊🪩🎉🎈🪞😾🦁'],
  ['alert', '😤⚔🥊🟥🟨🚪🤦😬👎🦈🥶🔀⚠☠💔❌😕✂'],
  ['trophy', '🏆🏅🥇🎯🔥🏀🏟🔭🎓📚📏🌍🇮✈👑💎⚡🧢🧑⚖🌟⭐🎖'],
  ['deal', '🤝✍🖊📨📋'],
  ['swap', '🔁'],
  ['calendar', '📅'],
  ['check', '✅'],
];
function emoIcon(e) {
  const ch = [...String(e || '')][0] || '';
  for (const [n, set] of EMO_CAT) if (ch && set.includes(ch)) return n;
  return 'spark';
}
