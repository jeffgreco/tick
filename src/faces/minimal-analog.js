/**
 * Face: Minimal Analog
 *
 * A clean, modern analog clock inspired by Braun / Dieter Rams aesthetics.
 * Thin markers, no numerals, smooth sweeping second hand.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export default {
  name: 'Minimal Analog',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    // Background
    const bg = circle(200, 200, 200, '#0a0a0a');
    svg.appendChild(bg);

    // Hour markers
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const isQuarter = i % 3 === 0;
      const outerR = 185;
      const innerR = isQuarter ? 160 : 170;
      const width = isQuarter ? 3 : 1.5;

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 200 + Math.cos(angle) * innerR);
      line.setAttribute('y1', 200 + Math.sin(angle) * innerR);
      line.setAttribute('x2', 200 + Math.cos(angle) * outerR);
      line.setAttribute('y2', 200 + Math.sin(angle) * outerR);
      line.setAttribute('stroke', '#e0e0e0');
      line.setAttribute('stroke-width', width);
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }

    // Minute tick marks
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue; // skip where hour markers are
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const dot = circle(
        200 + Math.cos(angle) * 185,
        200 + Math.sin(angle) * 185,
        0.8,
        'rgba(255,255,255,0.2)'
      );
      svg.appendChild(dot);
    }

    // Date window
    const dateRect = document.createElementNS(SVG_NS, 'rect');
    dateRect.setAttribute('x', 270);
    dateRect.setAttribute('y', 190);
    dateRect.setAttribute('width', 36);
    dateRect.setAttribute('height', 20);
    dateRect.setAttribute('rx', 3);
    dateRect.setAttribute('fill', '#1a1a1a');
    dateRect.setAttribute('stroke', '#333');
    dateRect.setAttribute('stroke-width', 0.5);
    svg.appendChild(dateRect);

    const dateText = document.createElementNS(SVG_NS, 'text');
    dateText.setAttribute('x', 288);
    dateText.setAttribute('y', 205);
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('fill', '#ccc');
    dateText.setAttribute('font-size', '12');
    dateText.setAttribute('font-family', 'SF Pro Display, -apple-system, Helvetica, sans-serif');
    dateText.id = 'ma-date';
    svg.appendChild(dateText);

    // Hands
    svg.appendChild(makeHand('ma-hour', 3.5, '#e0e0e0', 110));
    svg.appendChild(makeHand('ma-minute', 2.5, '#e0e0e0', 150));
    svg.appendChild(makeHand('ma-second', 1, '#ff3b30', 160));

    // Center cap
    svg.appendChild(circle(200, 200, 6, '#222'));
    svg.appendChild(circle(200, 200, 3, '#ff3b30'));

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    // smooth sweep
    const sDeg = (s + ms / 1000) * 6;
    const mDeg = (m + s / 60) * 6;
    const hDeg = (h + m / 60) * 30;

    rotate('ma-hour', hDeg);
    rotate('ma-minute', mDeg);
    rotate('ma-second', sDeg);

    const dateEl = document.getElementById('ma-date');
    if (dateEl) dateEl.textContent = now.getDate();
  },
};

// ── helpers ──

function circle(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

function makeHand(id, width, color, length) {
  const line = document.createElementNS(SVG_NS, 'line');
  line.id = id;
  line.setAttribute('x1', 200);
  line.setAttribute('y1', 200);
  line.setAttribute('x2', 200);
  line.setAttribute('y2', 200 - length);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', width);
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('transform', 'rotate(0 200 200)');
  return line;
}

function rotate(id, deg) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('transform', `rotate(${deg} 200 200)`);
}
