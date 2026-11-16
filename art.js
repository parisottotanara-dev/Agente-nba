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
