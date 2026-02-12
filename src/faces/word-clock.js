/**
 * Face: Word Clock
 *
 * Classic QLOCKTWO-style word clock: a grid of letters where
 * the current time is spelled out in English. Active letters
 * glow white; inactive letters are nearly invisible.
 */

// 10 rows × 11 columns
const GRID = [
  'ITLISASAMPM',
  'ACQUARTERDC',
  'TWENTYFIVEX',
  'HALFBTENETO',
  'PASTERUNINE',
  'ONESIXTHREE',
  'FOURFIVETWO',
  'EIGHTELEVEN',
  'SEVENTWELVE',
  'TENSEOCLOCK',
];

// Word → array of [row, col] positions
const W = {
  IT:        pos(0, 0, 2),
  IS:        pos(0, 3, 2),
  AM:        pos(0, 7, 2),
  PM:        pos(0, 9, 2),
  A:         [[1, 0]],
  QUARTER:   pos(1, 2, 7),
  TWENTY:    pos(2, 0, 6),
  M_FIVE:    pos(2, 6, 4),    // "FIVE" for minutes
  HALF:      pos(3, 0, 4),
  M_TEN:     pos(3, 5, 3),    // "TEN" for minutes
  TO:        pos(3, 9, 2),
  PAST:      pos(4, 0, 4),
  NINE:      pos(4, 7, 4),
  ONE:       pos(5, 0, 3),
  SIX:       pos(5, 3, 3),
  THREE:     pos(5, 6, 5),
  FOUR:      pos(6, 0, 4),
  H_FIVE:    pos(6, 4, 4),    // "FIVE" for hours
  TWO:       pos(6, 8, 3),
  EIGHT:     pos(7, 0, 5),
  ELEVEN:    pos(7, 5, 6),
  SEVEN:     pos(8, 0, 5),
  TWELVE:    pos(8, 5, 6),
  H_TEN:     pos(9, 0, 3),    // "TEN" for hours
  OCLOCK:    pos(9, 5, 6),
};

function pos(row, colStart, len) {
  const arr = [];
  for (let c = colStart; c < colStart + len; c++) arr.push([row, c]);
  return arr;
}

const HOUR_WORDS = [
  'TWELVE', 'ONE', 'TWO', 'THREE', 'FOUR', 'H_FIVE',
  'SIX', 'SEVEN', 'EIGHT', 'NINE', 'H_TEN', 'ELEVEN',
];

export default {
  name: 'Word Clock',

  /** @type {HTMLElement[]} */
  _cells: [],
  _lastKey: '',

  create(el) {
    el.style.cssText = `
      background:#080808;
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
    `;

    const table = document.createElement('div');
    table.style.cssText = `
      display:grid;
      grid-template-columns:repeat(11,1fr);
      gap:0.6vmin;
      width:72%;
      aspect-ratio:11/10;
    `;

    this._cells = [];

    GRID.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const cell = document.createElement('div');
        cell.textContent = row[c];
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.style.cssText = `
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:'SF Pro Display',-apple-system,Helvetica,sans-serif;
          font-size:3.8vmin;
          font-weight:600;
          color:rgba(255,255,255,0.06);
          transition:color 0.6s,text-shadow 0.6s;
          line-height:1;
          aspect-ratio:1;
        `;
        table.appendChild(cell);
        this._cells.push(cell);
      }
    });

    el.appendChild(table);
  },

  update(el) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    const active = getActiveWords(h, m);

    // Build a key to skip redundant DOM updates
    const key = active.join(',');
    if (key === this._lastKey) return;
    this._lastKey = key;

    // Collect active cell positions into a Set for fast lookup
    const lit = new Set();
    active.forEach(word => {
      (W[word] || []).forEach(([r, c]) => lit.add(r * 11 + c));
    });

    // Apply styles
    this._cells.forEach((cell, idx) => {
      if (lit.has(idx)) {
        cell.style.color = '#fff';
        cell.style.textShadow = '0 0 8px rgba(255,255,255,0.6),0 0 20px rgba(255,255,255,0.15)';
      } else {
        cell.style.color = 'rgba(255,255,255,0.06)';
        cell.style.textShadow = 'none';
      }
    });
  },
};

function getActiveWords(h24, m) {
  const words = ['IT', 'IS'];

  // Round to nearest 5
  const bucket = Math.round(m / 5) * 5;

  let h = h24 % 12;

  // "TO" uses the next hour
  if (bucket > 30) h = (h + 1) % 12;

  // Minute phrase
  switch (bucket % 60) {
    case 0:  words.push('OCLOCK'); break;
    case 5:  words.push('M_FIVE', 'PAST'); break;
    case 10: words.push('M_TEN', 'PAST'); break;
    case 15: words.push('A', 'QUARTER', 'PAST'); break;
    case 20: words.push('TWENTY', 'PAST'); break;
    case 25: words.push('TWENTY', 'M_FIVE', 'PAST'); break;
    case 30: words.push('HALF', 'PAST'); break;
    case 35: words.push('TWENTY', 'M_FIVE', 'TO'); break;
    case 40: words.push('TWENTY', 'TO'); break;
    case 45: words.push('A', 'QUARTER', 'TO'); break;
    case 50: words.push('M_TEN', 'TO'); break;
    case 55: words.push('M_FIVE', 'TO'); break;
  }

  // AM/PM
  words.push(h24 < 12 ? 'AM' : 'PM');

  // Hour word
  words.push(HOUR_WORDS[h]);

  return words;
}
