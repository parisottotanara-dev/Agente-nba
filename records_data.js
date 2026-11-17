/* Super Agente NBA — record reali della NBA (fino alla stagione 2024-25), con i nomi storpiati del gioco.
   I valori sono quelli reali, arrotondati dove serve. */
'use strict';

// Record di una singola partita e di una stagione
const REAL_RECORDS = {
  game: {
    pts: { v: 100, name: 'Wilt Ciambellano', team: 'PHW', season: '1961-62' },
    reb: { v: 55, name: 'Wilt Ciambellano', team: 'PHW', season: '1960-61' },
    ast: { v: 30, name: 'Scott Sciatore', team: 'ORL', season: '1990-91' },
  },
  season: {
    ppg: { v: 50.4, name: 'Wilt Ciambellano', team: 'PHW', season: '1961-62' },
    rpg: { v: 27.2, name: 'Wilt Ciambellano', team: 'PHW', season: '1960-61' },
    apg: { v: 14.5, name: 'John Stoccafisso', team: 'UTA', season: '1989-90' },
  },
};

// Leggende ritirate: i loro numeri in carriera restano nelle classifiche di sempre
const REAL_LEGENDS = [
  { name: 'Kareem Abdul-Gabbiano', until: '1989', pts: 38387, reb: 17440, ast: 5660, gp: 1560, titles: 6, mvp: 6, allstar: 19 },
  { name: 'Karl Melone', until: '2004', pts: 36928, reb: 14968, ast: 5248, gp: 1476, titles: 0, mvp: 2, allstar: 14 },
  { name: 'Kobe Manzo', until: '2016', pts: 33643, reb: 7047, ast: 6306, gp: 1346, titles: 5, mvp: 1, allstar: 18 },
  { name: 'Michael Giordano', until: '2003', pts: 32292, reb: 6672, ast: 5633, gp: 1072, titles: 6, mvp: 5, allstar: 14 },
  { name: 'Dirk Novità', until: '2019', pts: 31560, reb: 11489, ast: 3651, gp: 1522, titles: 1, mvp: 1, allstar: 14 },
  { name: 'Wilt Ciambellano', until: '1973', pts: 31419, reb: 23924, ast: 4643, gp: 1045, titles: 2, mvp: 4, allstar: 13 },
  { name: 'Shaquille O\'Nil', until: '2011', pts: 28596, reb: 13099, ast: 3026, gp: 1207, titles: 4, mvp: 1, allstar: 15 },
  { name: 'Caramello Anthony', until: '2022', pts: 28289, reb: 7808, ast: 2785, gp: 1260, titles: 0, mvp: 0, allstar: 10 },
  { name: 'Mosè Malone', until: '1995', pts: 27409, reb: 16212, ast: 1796, gp: 1329, titles: 1, mvp: 3, allstar: 12 },
  { name: 'Elvin Fieno', until: '1984', pts: 27313, reb: 16279, ast: 2398, gp: 1303, titles: 1, mvp: 0, allstar: 12 },
  { name: 'Hakeem Olé-Juwon', until: '2002', pts: 26946, reb: 13748, ast: 3058, gp: 1238, titles: 2, mvp: 1, allstar: 12 },
  { name: 'Oscar Sonnambulo', until: '1974', pts: 26710, reb: 7804, ast: 9887, gp: 1040, titles: 1, mvp: 1, allstar: 12 },
  { name: 'Tim Donut', until: '2016', pts: 26496, reb: 15091, ast: 4225, gp: 1392, titles: 5, mvp: 2, allstar: 15 },
  { name: 'Bill Ruscello', until: '1969', pts: 14522, reb: 21620, ast: 4100, gp: 963, titles: 11, mvp: 5, allstar: 12 },
  { name: 'Robert Parigi', until: '1997', pts: 23334, reb: 14715, ast: 2180, gp: 1611, titles: 4, mvp: 0, allstar: 9 },
  { name: 'Kevin Granata', until: '2016', pts: 26071, reb: 14662, ast: 5445, gp: 1462, titles: 1, mvp: 1, allstar: 15 },
  { name: 'Dwight Hovercraft', until: '2022', pts: 19485, reb: 14627, ast: 1937, gp: 1242, titles: 1, mvp: 0, allstar: 8 },
  { name: 'John Stoccafisso', until: '2003', pts: 19711, reb: 4051, ast: 15806, gp: 1504, titles: 0, mvp: 0, allstar: 10 },
  { name: 'Jason Kidding', until: '2013', pts: 17529, reb: 8725, ast: 12091, gp: 1391, titles: 1, mvp: 0, allstar: 10 },
  { name: 'Steve Nachos', until: '2014', pts: 17387, reb: 3642, ast: 10335, gp: 1217, titles: 0, mvp: 2, allstar: 8 },
  { name: 'Mark Jacuzzi', until: '2004', pts: 9369, reb: 3906, ast: 10334, gp: 1296, titles: 0, mvp: 0, allstar: 1 },
  { name: 'Magic Johnsong', until: '1996', pts: 17707, reb: 6559, ast: 10141, gp: 906, titles: 5, mvp: 3, allstar: 12 },
  { name: 'Isiah Tommaso', until: '1994', pts: 18822, reb: 3478, ast: 9061, gp: 979, titles: 2, mvp: 0, allstar: 12 },
  { name: 'Vince Cartoon', until: '2020', pts: 25728, reb: 5403, ast: 3326, gp: 1541, titles: 0, mvp: 0, allstar: 8 },
  { name: 'Sam Jeans', until: '1969', pts: 15411, reb: 4305, ast: 2209, gp: 871, titles: 10, mvp: 0, allstar: 5 },
  { name: 'Tom Heineken', until: '1965', pts: 12194, reb: 5749, ast: 1318, gp: 654, titles: 8, mvp: 0, allstar: 6 },
  { name: 'Larry Uccello', until: '1992', pts: 21791, reb: 8974, ast: 5695, gp: 897, titles: 3, mvp: 3, allstar: 12 },
];

// Star ancora in attività: numeri reali (approssimati) per LeBonno e Durante, stime per le altre (calcolate dal gioco)
const REAL_ACTIVE = {
  'LeBonno James': { pts: 42184, reb: 11580, ast: 11584, gp: 1562, titles: 4, mvp: 4, allstar: 21 },
  'Kevin Durante': { pts: 30571, reb: 7900, ast: 4700, gp: 1123, titles: 2, mvp: 1, allstar: 15 }, 'Steph Curri': { titles: 4, mvp: 2, allstar: 11 },
  'James Barbarden': { mvp: 1, allstar: 10 }, 'Giannis Antetokounmpasta': { titles: 1, mvp: 2, allstar: 9 },
  'Nikola Jokerić': { titles: 1, mvp: 3, allstar: 7 }, 'Joel Embidone': { mvp: 1, allstar: 7 },
  'Shai Gilgeous-Alessandro': { mvp: 1, allstar: 3 }, 'Kawhi Leonardo': { titles: 2, allstar: 6 },
  'Anthonyn Deviss': { titles: 1, allstar: 10 }, 'Jayson Tatuaggio': { titles: 1, allstar: 6 }, 'Jaylen Marrone': { titles: 1, allstar: 4 },
  'Draymond Verde': { titles: 4, allstar: 4 }, 'Jrue Vacanza': { titles: 2, allstar: 2 }, 'Jimmy Maggiordomo': { allstar: 6 },
  'Paul Giorgio': { allstar: 9 }, 'Damian Lardo': { allstar: 9 }, 'Kyrie Eleison': { titles: 1, allstar: 9 },
  'DeMar DeRosa': { allstar: 6 }, 'Donovan Michelin': { allstar: 6 }, 'Devin Bucher': { allstar: 4 }, 'Karl-Anthony Towels': { allstar: 5 },
  'Jamal Muraglia': { titles: 1 }, 'Aaron Gordo': { titles: 1 }, 'Trae Giovane': { allstar: 4 }, 'Rudy Gobber': { allstar: 3 },
  'Bam Adebabà': { allstar: 3 }, 'Domantas Sabbionis': { allstar: 3 }, 'Jalen Brunchson': { allstar: 2 }, 'Anthony Edwaffle': { allstar: 3 },
};
