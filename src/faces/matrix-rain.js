/**
 * Face: Matrix Rain
 *
 * Digital rain of glowing green Katakana and numerals cascading down
 * the screen, with a crisp time display burning through the center.
 * Inspired by The Matrix (1999).
 */

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

export default {
  name: 'Matrix Rain',

  create(el) {
    el.style.cssText = 'background:#000;position:relative;overflow:hidden;';

    // Rain columns
    const colCount = 22;
    const colWidth = 100 / colCount;

    for (let i = 0; i < colCount; i++) {
      const col = document.createElement('div');
      const charCount = 10 + Math.floor(Math.random() * 10);
      const fontSize = 2.5 + Math.random() * 1;
      const duration = 3 + Math.random() * 7;
      const delay = -(Math.random() * 10); // negative = already mid-fall
      const opacity = 0.25 + Math.random() * 0.55;

      let html = '';
      for (let j = 0; j < charCount; j++) {
        const c = CHARS[Math.floor(Math.random() * CHARS.length)];
        const o = j === 0 ? 1 : Math.max(0.05, 1 - j * 0.07);
        html += `<div style="opacity:${o.toFixed(2)}">${c}</div>`;
      }

      col.className = 'mx-col';
      col.style.cssText = `
        position:absolute;
        left:${(i * colWidth).toFixed(1)}%;
        top:0;
        width:${colWidth.toFixed(1)}%;
        text-align:center;
        font-family:'Courier New',monospace;
        font-size:${fontSize.toFixed(1)}vmin;
        color:#00ff41;
        opacity:${opacity.toFixed(2)};
        animation:mx-fall ${duration.toFixed(1)}s ${delay.toFixed(1)}s linear infinite;
        line-height:1.4;
        will-change:transform;
      `;
      col.innerHTML = html;
      el.appendChild(col);
    }

    // Vignette overlay so center time pops
    const vig = document.createElement('div');
    vig.style.cssText = `
      position:absolute;inset:0;
      background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 70%);
      pointer-events:none;z-index:1;
    `;
    el.appendChild(vig);

    // Time
    const timeEl = document.createElement('div');
    timeEl.id = 'mx-time';
    timeEl.style.cssText = `
      position:absolute;top:46%;left:50%;
      transform:translate(-50%,-50%);
      font-family:'Courier New',monospace;
      font-size:17vmin;font-weight:bold;
      color:#00ff41;
      text-shadow:0 0 15px #00ff41,0 0 40px #00ff41,0 0 80px rgba(0,255,65,0.25);
      z-index:2;letter-spacing:0.06em;line-height:1;
    `;
    el.appendChild(timeEl);

    // Date
    const dateEl = document.createElement('div');
    dateEl.id = 'mx-date';
    dateEl.style.cssText = `
      position:absolute;top:58%;left:50%;
      transform:translate(-50%,-50%);
      font-family:'Courier New',monospace;
      font-size:3.2vmin;color:#00ff41;opacity:0.45;
      text-shadow:0 0 8px #00ff41;
      z-index:2;letter-spacing:0.2em;
    `;
    el.appendChild(dateEl);

    // Keyframes
    if (!document.getElementById('mx-keyframes')) {
      const style = document.createElement('style');
      style.id = 'mx-keyframes';
      style.textContent = `
        @keyframes mx-fall {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(calc(100vh + 100%)); }
        }
      `;
      document.head.appendChild(style);
    }
  },

  update(el) {
    const now = new Date();

    const timeEl = document.getElementById('mx-time');
    if (timeEl) timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const dateEl = document.getElementById('mx-date');
    if (dateEl) dateEl.textContent = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

    // Randomly mutate a few characters each frame
    if (Math.random() < 0.15) {
      const cols = el.querySelectorAll('.mx-col');
      const col = cols[Math.floor(Math.random() * cols.length)];
      if (col && col.children.length) {
        const idx = Math.floor(Math.random() * col.children.length);
        col.children[idx].textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }
  },
};

function pad(n) { return n.toString().padStart(2, '0'); }
