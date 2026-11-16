/* Super Agente NBA — nomi parodia. Tutto è caricatura: squadre, sponsor, star e personaggi famosi
   sono storpiati apposta. Rose basate sulla stagione 2025-26 (possono esserci scambi recenti mancanti). */
'use strict';

// [città, nome, sigla, popolarità del mercato 0-1, colore maglia, colore secondario]
const TEAMS = [
  ['Atlanta', 'Hocks', 'ATL', .5, '#c8102e', '#fdb927'],
  ['Boston', 'Celtrix', 'BOS', .8, '#007a33', '#ffffff'],
  ['Brooklyn', 'Nuts', 'BKN', .85, '#111111', '#ffffff'],
  ['Charlotte', 'Cornets', 'CHA', .3, '#00788c', '#1d1160'],
  ['Chicago', 'Bulli', 'CHI', .85, '#ce1141', '#000000'],
  ['Cleveland', 'Cavolieri', 'CLE', .3, '#6f263d', '#ffb81c'],
  ['Dallas', 'Mavericchi', 'DAL', .7, '#00538c', '#b8c4ca'],
  ['Denver', 'Nuggetti', 'DEN', .45, '#0e2240', '#fec524'],
  ['Detroit', 'Pistoni', 'DET', .4, '#c8102e', '#1d42ba'],
  ['Golden State', 'Worriers', 'GSW', .85, '#1d428a', '#ffc72c'],
  ['Houston', 'Rocchetti', 'HOU', .7, '#ce1141', '#c4ced4'],
  ['Indiana', 'Pacemaker', 'IND', .25, '#002d62', '#fdbb30'],
  ['Los Angeles', 'Zippers', 'LAC', .9, '#c8102e', '#1d428a'],
  ['Los Angeles', 'Fakers', 'LAL', 1, '#552583', '#fdb927'],
  ['Memphis', 'Grizzlini', 'MEM', .2, '#5d76a9', '#12173f'],
  ['Miami', 'Wheat', 'MIA', .75, '#98002e', '#f9a01b'],
  ['Milwaukee', 'Bucce', 'MIL', .2, '#00471b', '#eee1c6'],
  ['Minnesota', 'Timberwoofs', 'MIN', .3, '#0c2340', '#78be20'],
  ['New Orleans', 'Pelli-Cani', 'NOP', .25, '#0c2340', '#c8102e'],
  ['New York', 'Knickers', 'NYK', 1, '#006bb6', '#f58426'],
  ['Oklahoma City', 'Blunder', 'OKC', .2, '#007ac1', '#ef3b24'],
  ['Orlando', 'Tragic', 'ORL', .35, '#0077c0', '#c4ced4'],
  ['Philadelphia', '75ers', 'PHI', .7, '#006bb6', '#ed174c'],
  ['Phoenix', 'Sonni', 'PHX', .5, '#1d1160', '#e56020'],
  ['Portland', 'Trail Blazé', 'POR', .3, '#e03a3e', '#000000'],
  ['Sacramento', 'Kongs', 'SAC', .25, '#5a2d81', '#63727a'],
  ['San Antonio', 'Spuntini', 'SAS', .3, '#c4ced4', '#000000'],
  ['Toronto', 'Rapper', 'TOR', .6, '#ce1141', '#000000'],
  ['Utah', 'Jazzmine', 'UTA', .2, '#002b5c', '#f9a01b'],
  ['Washington', 'Lizards', 'WAS', .55, '#002b5c', '#e31837'],
];

// Sponsor storpiati
const BRANDS = ['Naik', 'Adidaz', 'Pumba', 'Under Armadio', 'Gatorado', 'Red Mucca', 'Coca-Colla', 'Pepsy',
  'McDonaldo', 'Burger Re', 'Mela Inc.', 'Samsong', 'PlaiStazione', 'Nintenda', 'Rolux', 'Gucchi', 'Teslo',
  'Spotifai', 'State Farma', 'Bitz by Dre', 'Ferrara', 'Barillo', 'Nutello', 'Lavazzo', 'Kappa Cereali'];

// Personaggi famosi storpiati (compaiono negli imprevisti e alcuni come giocatori "vip")
const CELEBS = ['Taylor Swiffer', 'Leo DiCaprino', 'Brad Pitbull', 'Keanu Leaves', 'Morgan Freezer', 'Elon Muskolo',
  'Snoop Doggo', 'Eros Ramazzotto', 'Billie Eyelash', 'Kanye Best', 'Dwayne "La Roccia" Johnsoni', 'Rihanna Banana',
  'Shakiro', 'Zendayana', 'Tom Cruiseship', 'Will Smithers', 'Bruno Marte', 'Ed Sheerin', 'Harry Stiles',
  'Kim Kardashino', 'Mark Zuckerbergo', 'Jeff Bezoss', 'Gianni Morandini', 'Lady Gagà', 'Oprah Winfreddy',
  'Mr. Bestia', 'Lionel Messy', 'Cristiano Ronaldone', 'Chiara Ferragnoni', 'Drakko'];

// Star della lega storpiate, nella loro squadra attuale. [nome, sigla squadra, ruolo, età, ovr, numero]
const STARS = [
  ['Trae Giovane', 'ATL', 'PG', 27, 84, 11], ['Jalen Jonsone', 'ATL', 'SF', 24, 82, 1], ['Kristaps Porzingisss', 'ATL', 'C', 30, 81, 8],
  ['Jaylen Marrone', 'BOS', 'SG', 29, 87, 7], ['Jayson Tatuum', 'BOS', 'SF', 27, 89, 0], ['Derrick Bianco', 'BOS', 'SG', 31, 80, 9],
  ['Michael Porta Jr.', 'BKN', 'SF', 27, 81, 17], ['Cam Tommaso', 'BKN', 'SG', 24, 78, 24],
  ['LaMelo Palla', 'CHA', 'PG', 24, 84, 1], ['Brandon Mugnaio', 'CHA', 'SF', 23, 80, 24],
  ['Josh Giddy', 'CHI', 'PG', 23, 80, 3], ['Coby Bianchi', 'CHI', 'SG', 25, 79, 0], ['Nikola Vucevicc', 'CHI', 'C', 35, 77, 9],
  ['Donovan Mitchello', 'CLE', 'SG', 29, 88, 45], ['Darius Ghirlanda', 'CLE', 'PG', 25, 82, 10], ['Evan Mobile', 'CLE', 'PF', 24, 86, 4],
  ['Anthonyn Deviss', 'DAL', 'PF', 32, 88, 3], ['Kyrie Irvingo', 'DAL', 'PG', 33, 84, 11], ['Cooper Bandiera', 'DAL', 'SF', 19, 79, 32],
  ['Nikola Jokicc', 'DEN', 'C', 30, 97, 15], ['Jamal Murrei', 'DEN', 'PG', 28, 84, 27], ['Aaron Gordo', 'DEN', 'PF', 30, 79, 32],
  ['Cade Cunningam', 'DET', 'PG', 24, 88, 2], ['Jalen Durèn', 'DET', 'C', 22, 79, 0],
  ['Steph Curri', 'GSW', 'PG', 37, 90, 30], ['Jimmy Maggiordomo', 'GSW', 'SF', 36, 84, 10], ['Draymond Verde', 'GSW', 'PF', 35, 77, 23],
  ['Kevin Durante', 'HOU', 'SF', 37, 88, 7], ['Alperen Sengunn', 'HOU', 'C', 23, 85, 28], ['Amen Tomson', 'HOU', 'SG', 22, 82, 1],
  ['Tyrese Haliburtone', 'IND', 'PG', 25, 85, 0], ['Pascal Siakamm', 'IND', 'PF', 31, 83, 43],
  ['Kawhi Leonardo', 'LAC', 'SF', 34, 87, 2], ['James Ardèn', 'LAC', 'PG', 36, 85, 1],
  ['LeBonno James', 'LAL', 'SF', 40, 88, 23], ['Luka Dincic', 'LAL', 'PG', 26, 94, 77], ['Austin Reavs', 'LAL', 'SG', 27, 81, 15],
  ['Ja Moranto', 'MEM', 'PG', 26, 84, 12], ['Jaren Jacksoni Jr.', 'MEM', 'PF', 26, 83, 13],
  ['Bam Adebayoo', 'MIA', 'C', 28, 83, 13], ['Tyler Eroe', 'MIA', 'SG', 25, 82, 14],
  ['Giannis Antetokounmpasta', 'MIL', 'PF', 30, 95, 34], ['Myles Turnèr', 'MIL', 'C', 29, 80, 3],
  ['Anthony Edwardo', 'MIN', 'SG', 24, 91, 5], ['Julius Randello', 'MIN', 'PF', 30, 81, 30], ['Rudy Gobber', 'MIN', 'C', 33, 80, 27],
  ['Zion Williamsone', 'NOP', 'PF', 25, 83, 1], ['Trey Murphy Terzo', 'NOP', 'SF', 25, 80, 25],
  ['Jalen Brunsone', 'NYK', 'PG', 29, 89, 11], ['Karl-Anthony Towels', 'NYK', 'C', 29, 87, 32], ['Mikal Ponti', 'NYK', 'SF', 29, 81, 25], ['OG Anunobyy', 'NYK', 'SF', 28, 81, 8],
  ['Shai Gilgeous-Alessandro', 'OKC', 'PG', 27, 97, 2], ['Jalen Williamss', 'OKC', 'SF', 24, 86, 8], ['Chet Holmgrin', 'OKC', 'C', 23, 84, 7],
  ['Paolo Bancone', 'ORL', 'PF', 22, 86, 5], ['Franz Vagone', 'ORL', 'SF', 24, 84, 22], ['Desmond Banee', 'ORL', 'SG', 27, 81, 3],
  ['Joel Embè', 'PHI', 'C', 31, 86, 21], ['Tyrese Maxi', 'PHI', 'PG', 25, 86, 0], ['Paul Giorgio', 'PHI', 'SF', 35, 79, 8],
  ['Devin Bucher', 'PHX', 'SG', 28, 87, 1], ['Jalen Verdi', 'PHX', 'SG', 23, 79, 4],
  ['Damian Lillardo', 'POR', 'PG', 35, 82, 0], ['Deni Avdijaa', 'POR', 'SF', 24, 80, 8], ['Jrue Vacanza', 'POR', 'PG', 35, 78, 5],
  ['Domantas Sabbonis', 'SAC', 'C', 29, 84, 10], ['Zach LaVigna', 'SAC', 'SG', 30, 82, 8], ['DeMar DeRosa', 'SAC', 'SF', 36, 80, 10],
  ['Victor Wembanyamma', 'SAS', 'C', 21, 93, 1], ['De\'Aaron Volpe', 'SAS', 'PG', 27, 83, 4], ['Stephon Castello', 'SAS', 'SG', 21, 79, 5],
  ['Scottie Barnesi', 'TOR', 'PF', 24, 85, 4], ['Brandon Ingrammo', 'TOR', 'SF', 28, 81, 3],
  ['Lauri Markkanenn', 'UTA', 'PF', 28, 83, 23],
  ['CJ McCollo', 'WAS', 'SG', 34, 78, 3], ['Alex Sarrr', 'WAS', 'C', 20, 76, 20],
];

// Giocatori "vip": personaggi famosi che, nel gioco, giocano a basket (prospetti e free agent iniziali)
const VIP_PLAYERS = ['Leo DiCaprino', 'Brad Pitbull', 'Keanu Leaves', 'Morgan Freezer', 'Snoop Doggo', 'Bruno Marte',
  'Harry Stiles', 'Ed Sheerin', 'Tom Cruiseship', 'Will Smithers', 'Eros Ramazzotto', 'Gianni Morandini'];
