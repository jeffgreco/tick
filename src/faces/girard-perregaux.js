/**
 * Face: Girard-Perregaux Bamford
 *
 * A detailed recreation of the Girard-Perregaux Sea Hawk Bamford edition.
 * Retro 1970s diver aesthetic: orange center dial, white sunburst chapter ring
 * with radiating lines, dark outer bezel with blocky Orbitron numerals,
 * and chunky silver hands with orange lume plots.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 200, CY = 200;

// ── Design tokens ──
const ORANGE       = '#E87830';
const ORANGE_LIGHT = '#F09040';
const ORANGE_DARK  = '#C86018';
const DARK         = '#1c1c1e';
const DARK_SUBTLE  = '#2a2a2c';
const CREAM        = '#f0ede6';
const SILVER       = '#c0c0c0';
const SILVER_DARK  = '#909090';

// ── Radii (viewBox 400×400) ──
const R_BEZEL      = 198;   // outermost chrome ring
const R_OUTER      = 194;   // outer edge of chapter ring
const R_CHAPTER_IN = 157;   // inner edge of chapter ring
const R_REHAUT     = 152;   // inner bezel transition blocks
const R_CENTER     = 90;    // orange center radius

// ── Minute numbers for chapter ring ──
const MINUTE_NUMS = [60, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default {
  name: 'GP Bamford',

  create(el) {
    // Load Google Font
    if (!document.getElementById('gp-font')) {
      const link = document.createElement('link');
      link.id = 'gp-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }

    const svg = makeSvg();
    const defs = document.createElementNS(SVG_NS, 'defs');

    // Radial gradient for metallic bezel
    defs.appendChild(radialGrad('gp-bezel', [
      ['0%', '#666'], ['70%', '#999'], ['85%', '#bbb'],
      ['92%', '#888'], ['100%', '#555'],
    ]));

    // Subtle orange gradient for depth on center dial
    defs.appendChild(radialGrad('gp-center', [
      ['0%', '#F09848'], ['40%', '#E88038'],
      ['80%', ORANGE], ['100%', '#D06818'],
    ]));

    // Shadow filter for hands
    const shadow = document.createElementNS(SVG_NS, 'filter');
    shadow.setAttribute('id', 'gp-hand-shadow');
    shadow.setAttribute('x', '-20%'); shadow.setAttribute('y', '-20%');
    shadow.setAttribute('width', '140%'); shadow.setAttribute('height', '140%');
    const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceAlpha'); blur.setAttribute('stdDeviation', '2');
    const offset = document.createElementNS(SVG_NS, 'feOffset');
    offset.setAttribute('dx', '1'); offset.setAttribute('dy', '2');
    const merge = document.createElementNS(SVG_NS, 'feMerge');
    const mn1 = document.createElementNS(SVG_NS, 'feMergeNode');
    const mn2 = document.createElementNS(SVG_NS, 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1); merge.appendChild(mn2);
    shadow.appendChild(blur); shadow.appendChild(offset); shadow.appendChild(merge);
    defs.appendChild(shadow);

    svg.appendChild(defs);

    // ════════════════════════════════════════════
    //  LAYER 1 — Background
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, 200, '#000'));

    // ════════════════════════════════════════════
    //  LAYER 2 — Metallic bezel ring
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, R_BEZEL, 'url(#gp-bezel)'));

    // ════════════════════════════════════════════
    //  LAYER 3 — Chapter ring (dark outer ring)
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, R_OUTER, DARK));

    // Thin bright ring at outer edge of chapter ring
    const outerAccent = circ(CX, CY, R_OUTER, 'none');
    outerAccent.setAttribute('stroke', '#444');
    outerAccent.setAttribute('stroke-width', '0.5');
    svg.appendChild(outerAccent);

    // Minute tick marks on chapter ring
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue; // skip 5-min positions (numbers go there)
      const a = i * 6;
      const rad = toRad(a);
      const r1 = R_CHAPTER_IN + 3;
      const r2 = R_CHAPTER_IN + 12;
      svg.appendChild(line(
        CX + Math.cos(rad) * r1, CY + Math.sin(rad) * r1,
        CX + Math.cos(rad) * r2, CY + Math.sin(rad) * r2,
        '#555', 0.8
      ));
    }

    // Minute numbers
    const R_NUM = (R_OUTER + R_CHAPTER_IN) / 2 + 1;
    MINUTE_NUMS.forEach((num, i) => {
      const a = (num % 60) * 6;          // 60→0°, 5→30°, etc.
      const rad = toRad(a);
      const x = CX + Math.cos(rad) * R_NUM;
      const y = CY + Math.sin(rad) * R_NUM;

      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('fill', '#ddd');
      t.setAttribute('font-family', 'Orbitron, sans-serif');
      t.setAttribute('font-weight', '900');
      t.setAttribute('font-size', '18');
      t.setAttribute('letter-spacing', '-1');
      t.setAttribute('transform', `rotate(${a} ${x} ${y})`);
      t.textContent = num === 60 ? '60' : String(num).padStart(2, '0');
      svg.appendChild(t);
    });

    // "SWISS" and "MADE" text flanking 6 o'clock
    [{ text: 'SWISS', a: 202 }, { text: 'MADE', a: 158 }].forEach(({ text, a }) => {
      const rad = toRad(a);
      const x = CX + Math.cos(rad) * R_NUM;
      const y = CY + Math.sin(rad) * R_NUM;
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('fill', '#777');
      t.setAttribute('font-family', 'Orbitron, sans-serif');
      t.setAttribute('font-weight', '500');
      t.setAttribute('font-size', '6');
      t.setAttribute('letter-spacing', '0.8');
      t.setAttribute('transform', `rotate(${a} ${x} ${y})`);
      t.textContent = text;
      svg.appendChild(t);
    });

    // ════════════════════════════════════════════
    //  LAYER 4 — White / cream dial ring
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, R_CHAPTER_IN, CREAM));

    // ════════════════════════════════════════════
    //  LAYER 5 — Sunburst radial lines (piano key pattern)
    // ════════════════════════════════════════════
    // Dense radiating lines creating the iconic sunburst dial texture.
    // Every 2° for a tight "piano key" fan effect.
    for (let i = 0; i < 180; i++) {
      const a = i * 2;
      const rad = toRad(a);
      const r1 = R_CENTER + 2;
      const r2 = R_CHAPTER_IN - 8;
      svg.appendChild(line(
        CX + Math.cos(rad) * r1, CY + Math.sin(rad) * r1,
        CX + Math.cos(rad) * r2, CY + Math.sin(rad) * r2,
        'rgba(0,0,0,0.16)', 1.0
      ));
    }

    // Stronger lines at minute positions
    for (let i = 0; i < 60; i++) {
      const a = i * 6;
      const rad = toRad(a);
      const r1 = R_CENTER + 2;
      const r2 = R_CHAPTER_IN - 5;
      const isHour = i % 5 === 0;
      svg.appendChild(line(
        CX + Math.cos(rad) * r1, CY + Math.sin(rad) * r1,
        CX + Math.cos(rad) * r2, CY + Math.sin(rad) * r2,
        isHour ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)', isHour ? 2.0 : 1.2
      ));
    }

    // ════════════════════════════════════════════
    //  LAYER 6 — Rehaut blocks (inner bezel)
    // ════════════════════════════════════════════
    // Dark ring behind rehaut blocks for contrast
    const rehautRing = circ(CX, CY, R_CHAPTER_IN - 4, 'none');
    rehautRing.setAttribute('stroke', DARK);
    rehautRing.setAttribute('stroke-width', '8');
    svg.appendChild(rehautRing);

    for (let i = 0; i < 60; i++) {
      const a = i * 6;
      const isHour = i % 5 === 0;
      const bw = isHour ? 6 : 3.5;
      const bh = isHour ? 11 : 7;
      const r = R_CHAPTER_IN - 1;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', CX - bw / 2);
      rect.setAttribute('y', CY - r);
      rect.setAttribute('width', bw);
      rect.setAttribute('height', bh);
      rect.setAttribute('rx', 0.5);
      rect.setAttribute('fill', isHour ? ORANGE : '#444');
      rect.setAttribute('transform', `rotate(${a} ${CX} ${CY})`);
      svg.appendChild(rect);
    }

    // ════════════════════════════════════════════
    //  LAYER 7 — Orange hour markers
    // ════════════════════════════════════════════
    const R_MARKER = (R_REHAUT + R_CENTER) / 2 + 2;
    for (let i = 0; i < 12; i++) {
      const a = i * 30;
      const mw = 9;
      const mh = 24;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', CX - mw / 2);
      rect.setAttribute('y', CY - R_MARKER - mh / 2);
      rect.setAttribute('width', mw);
      rect.setAttribute('height', mh);
      rect.setAttribute('rx', 1.5);
      rect.setAttribute('fill', ORANGE);
      rect.setAttribute('stroke', 'rgba(0,0,0,0.2)');
      rect.setAttribute('stroke-width', '0.5');
      rect.setAttribute('transform', `rotate(${a} ${CX} ${CY})`);
      svg.appendChild(rect);
    }

    // ════════════════════════════════════════════
    //  LAYER 8 — Orange center circle
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, R_CENTER, 'url(#gp-center)'));

    // Subtle edge ring on orange center
    const edgeRing = circ(CX, CY, R_CENTER, 'none');
    edgeRing.setAttribute('stroke', ORANGE_DARK);
    edgeRing.setAttribute('stroke-width', '1.2');
    svg.appendChild(edgeRing);

    // ════════════════════════════════════════════
    //  LAYER 9 — Brand text
    // ════════════════════════════════════════════

    // "GIRARD-PERREGAUX" bordered box
    const gpY = CY - 56;
    const gpW = 104, gpH = 14;
    const gpBox = document.createElementNS(SVG_NS, 'rect');
    gpBox.setAttribute('x', CX - gpW / 2);
    gpBox.setAttribute('y', gpY - gpH / 2);
    gpBox.setAttribute('width', gpW);
    gpBox.setAttribute('height', gpH);
    gpBox.setAttribute('rx', 1.5);
    gpBox.setAttribute('fill', 'rgba(100,50,10,0.12)');
    gpBox.setAttribute('stroke', '#8B4513');
    gpBox.setAttribute('stroke-width', '0.8');
    svg.appendChild(gpBox);

    const gpText = document.createElementNS(SVG_NS, 'text');
    gpText.setAttribute('x', CX);
    gpText.setAttribute('y', gpY + 0.5);
    gpText.setAttribute('text-anchor', 'middle');
    gpText.setAttribute('dominant-baseline', 'central');
    gpText.setAttribute('fill', '#5a2d0c');
    gpText.setAttribute('font-family', 'Orbitron, sans-serif');
    gpText.setAttribute('font-weight', '600');
    gpText.setAttribute('font-size', '7');
    gpText.setAttribute('letter-spacing', '0.3');
    gpText.textContent = 'GIRARD-PERREGAUX';
    svg.appendChild(gpText);

    // "BAMFORD" below center
    const bamText = document.createElementNS(SVG_NS, 'text');
    bamText.setAttribute('x', CX);
    bamText.setAttribute('y', CY + 42);
    bamText.setAttribute('text-anchor', 'middle');
    bamText.setAttribute('dominant-baseline', 'central');
    bamText.setAttribute('fill', '#7a3a10');
    bamText.setAttribute('font-family', 'Orbitron, sans-serif');
    bamText.setAttribute('font-weight', '500');
    bamText.setAttribute('font-size', '7');
    bamText.setAttribute('letter-spacing', '2');
    bamText.textContent = 'BAMFORD';
    svg.appendChild(bamText);

    // ════════════════════════════════════════════
    //  LAYER 10 — Hands
    // ════════════════════════════════════════════

    // Hour hand — broad diver style with orange lume
    const hourG = document.createElementNS(SVG_NS, 'g');
    hourG.id = 'gp-hour';
    hourG.setAttribute('filter', 'url(#gp-hand-shadow)');
    hourG.setAttribute('transform', 'rotate(0 200 200)');

    const hourBody = document.createElementNS(SVG_NS, 'path');
    hourBody.setAttribute('d', [
      'M 196 210',     // counterweight left
      'L 196 155',     // stem left
      'L 192 151',     // step out left
      'L 192 112',     // paddle left
      'L 200 100',     // tip
      'L 208 112',     // paddle right
      'L 208 151',     // step back right
      'L 204 155',     // stem right
      'L 204 210',     // counterweight right
      'Z',
    ].join(' '));
    hourBody.setAttribute('fill', SILVER);
    hourBody.setAttribute('stroke', SILVER_DARK);
    hourBody.setAttribute('stroke-width', '0.6');
    hourBody.setAttribute('stroke-linejoin', 'round');
    hourG.appendChild(hourBody);

    // Orange lume on hour hand
    const hourLume = document.createElementNS(SVG_NS, 'rect');
    hourLume.setAttribute('x', 193.5);
    hourLume.setAttribute('y', 117);
    hourLume.setAttribute('width', 13);
    hourLume.setAttribute('height', 30);
    hourLume.setAttribute('rx', 1.5);
    hourLume.setAttribute('fill', ORANGE_LIGHT);
    hourG.appendChild(hourLume);

    svg.appendChild(hourG);

    // Minute hand — longer, narrower diver style
    const minG = document.createElementNS(SVG_NS, 'g');
    minG.id = 'gp-minute';
    minG.setAttribute('filter', 'url(#gp-hand-shadow)');
    minG.setAttribute('transform', 'rotate(0 200 200)');

    const minBody = document.createElementNS(SVG_NS, 'path');
    minBody.setAttribute('d', [
      'M 197 214',     // counterweight left
      'L 197 120',     // stem left
      'L 194 117',     // step out left
      'L 194 68',      // paddle left
      'L 200 58',      // tip
      'L 206 68',      // paddle right
      'L 206 117',     // step back right
      'L 203 120',     // stem right
      'L 203 214',     // counterweight right
      'Z',
    ].join(' '));
    minBody.setAttribute('fill', SILVER);
    minBody.setAttribute('stroke', SILVER_DARK);
    minBody.setAttribute('stroke-width', '0.5');
    minBody.setAttribute('stroke-linejoin', 'round');
    minG.appendChild(minBody);

    // Orange lume on minute hand
    const minLume = document.createElementNS(SVG_NS, 'rect');
    minLume.setAttribute('x', 195.5);
    minLume.setAttribute('y', 73);
    minLume.setAttribute('width', 9);
    minLume.setAttribute('height', 40);
    minLume.setAttribute('rx', 1);
    minLume.setAttribute('fill', ORANGE_LIGHT);
    minG.appendChild(minLume);

    svg.appendChild(minG);

    // Seconds hand — thin silver
    const secG = document.createElementNS(SVG_NS, 'g');
    secG.id = 'gp-second';
    secG.setAttribute('transform', 'rotate(0 200 200)');

    secG.appendChild(line(200, 220, 200, 52, SILVER, 1));
    // Small counterweight circle
    secG.appendChild(circ(200, 215, 2.5, SILVER));
    svg.appendChild(secG);

    // ════════════════════════════════════════════
    //  LAYER 11 — Center cap
    // ════════════════════════════════════════════
    svg.appendChild(circ(CX, CY, 8, '#888'));
    svg.appendChild(circ(CX, CY, 5, '#aaa'));
    svg.appendChild(circ(CX, CY, 2.5, '#777'));

    el.appendChild(svg);
  },

  update() {
    const now = new Date();
    const h  = now.getHours() % 12;
    const m  = now.getMinutes();
    const s  = now.getSeconds();
    const ms = now.getMilliseconds();

    const sDeg = (s + ms / 1000) * 6;
    const mDeg = (m + s / 60) * 6;
    const hDeg = (h + m / 60) * 30;

    rot('gp-hour',   hDeg);
    rot('gp-minute', mDeg);
    rot('gp-second', sDeg);
  },
};

// ── Helpers ────────────────────────────────────

function makeSvg() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  return svg;
}

function circ(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

function line(x1, y1, x2, y2, stroke, w) {
  const l = document.createElementNS(SVG_NS, 'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('stroke', stroke);
  l.setAttribute('stroke-width', w);
  return l;
}

function radialGrad(id, stops) {
  const g = document.createElementNS(SVG_NS, 'radialGradient');
  g.setAttribute('id', id);
  stops.forEach(([offset, color]) => {
    const s = document.createElementNS(SVG_NS, 'stop');
    s.setAttribute('offset', offset);
    s.setAttribute('stop-color', color);
    g.appendChild(s);
  });
  return g;
}

function toRad(clockDeg) {
  return (clockDeg - 90) * Math.PI / 180;
}

function rot(id, deg) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('transform', `rotate(${deg} ${CX} ${CY})`);
}
