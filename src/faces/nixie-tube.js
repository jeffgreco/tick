/**
 * Face: Nixie Tube
 *
 * Warm, glowing vacuum-tube digits in glass housings.
 * Inspired by vintage Nixie tube clocks with their distinctive
 * orange-amber cathode glow.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GLOW = '#ff6a00';
const WARM = '#ff9933';
const GLASS = 'rgba(40,25,15,0.6)';

export default {
  name: 'Nixie Tube',

  create(el) {
    el.style.cssText = `
      background: #0c0806;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;

    // Subtle warm ambient glow on the background
    const ambient = document.createElement('div');
    ambient.style.cssText = `
      position:absolute;inset:0;
      background:radial-gradient(ellipse at 50% 50%, rgba(255,106,0,0.06) 0%, transparent 70%);
      pointer-events:none;
    `;
    el.appendChild(ambient);

    // Tube container
    const row = document.createElement('div');
    row.style.cssText = `
      display:flex;
      align-items:center;
      gap:1vmin;
      position:relative;
      z-index:1;
    `;

    // Create 4 digit tubes + separator
    const ids = ['nx-h1', 'nx-h2', null, 'nx-m1', 'nx-m2'];
    ids.forEach(id => {
      if (id === null) {
        // Colon separator
        const sep = document.createElement('div');
        sep.id = 'nx-colon';
        sep.style.cssText = `
          display:flex;flex-direction:column;gap:3vmin;
          padding:0 0.5vmin;
        `;
        for (let i = 0; i < 2; i++) {
          const dot = document.createElement('div');
          dot.style.cssText = `
            width:2vmin;height:2vmin;border-radius:50%;
            background:${GLOW};
            box-shadow:0 0 8px ${GLOW},0 0 16px rgba(255,106,0,0.4);
          `;
          sep.appendChild(dot);
        }
        row.appendChild(sep);
        return;
      }

      const tube = document.createElement('div');
      tube.style.cssText = `
        width:14vmin;height:22vmin;
        border-radius:3vmin 3vmin 2vmin 2vmin;
        background:linear-gradient(180deg, rgba(60,40,20,0.3) 0%, rgba(30,20,10,0.5) 100%);
        border:1px solid rgba(255,150,50,0.08);
        box-shadow:
          inset 0 0 20px rgba(0,0,0,0.5),
          0 0 15px rgba(255,106,0,0.05);
        display:flex;align-items:center;justify-content:center;
        position:relative;
        overflow:hidden;
      `;

      // Wire mesh hint (horizontal lines)
      const mesh = document.createElement('div');
      mesh.style.cssText = `
        position:absolute;inset:10% 15%;
        background:repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 4px,
          rgba(255,150,50,0.03) 4px,
          rgba(255,150,50,0.03) 5px
        );
        pointer-events:none;
      `;
      tube.appendChild(mesh);

      // Ghost digits (dim cathode stack)
      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position:absolute;
        font-family:'Courier New',monospace;
        font-size:15vmin;font-weight:bold;
        color:rgba(255,106,0,0.04);
        line-height:1;
      `;
      ghost.textContent = '8';
      tube.appendChild(ghost);

      // Active digit
      const digit = document.createElement('div');
      digit.id = id;
      digit.style.cssText = `
        font-family:'Courier New',monospace;
        font-size:15vmin;font-weight:bold;
        color:${WARM};
        text-shadow:
          0 0 6px ${GLOW},
          0 0 15px ${GLOW},
          0 0 30px rgba(255,106,0,0.5),
          0 0 60px rgba(255,106,0,0.2);
        line-height:1;
        position:relative;
        z-index:1;
      `;
      digit.textContent = '0';
      tube.appendChild(digit);

      // Glass highlight
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position:absolute;
        top:5%;left:15%;
        width:30%;height:25%;
        border-radius:50%;
        background:radial-gradient(ellipse, rgba(255,200,150,0.06), transparent);
        pointer-events:none;
      `;
      tube.appendChild(highlight);

      row.appendChild(tube);
    });

    el.appendChild(row);

    // Seconds display below
    const secRow = document.createElement('div');
    secRow.id = 'nx-sec';
    secRow.style.cssText = `
      position:absolute;
      bottom:22%;left:50%;
      transform:translateX(-50%);
      font-family:'Courier New',monospace;
      font-size:4vmin;
      color:rgba(255,106,0,0.35);
      text-shadow:0 0 6px rgba(255,106,0,0.2);
      letter-spacing:0.3em;
      z-index:1;
    `;
    el.appendChild(secRow);

    // Date above
    const dateRow = document.createElement('div');
    dateRow.id = 'nx-date';
    dateRow.style.cssText = `
      position:absolute;
      top:22%;left:50%;
      transform:translateX(-50%);
      font-family:'Courier New',monospace;
      font-size:3vmin;
      color:rgba(255,106,0,0.25);
      text-shadow:0 0 4px rgba(255,106,0,0.15);
      letter-spacing:0.2em;
      z-index:1;
    `;
    el.appendChild(dateRow);
  },

  update(el) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    setText('nx-h1', Math.floor(h / 10));
    setText('nx-h2', h % 10);
    setText('nx-m1', Math.floor(m / 10));
    setText('nx-m2', m % 10);

    const secEl = document.getElementById('nx-sec');
    if (secEl) secEl.textContent = pad(s);

    const dateEl = document.getElementById('nx-date');
    if (dateEl) {
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Colon blink
    const colon = document.getElementById('nx-colon');
    if (colon) colon.style.opacity = s % 2 === 0 ? '1' : '0.3';
  },
};

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function pad(n) { return n.toString().padStart(2, '0'); }
