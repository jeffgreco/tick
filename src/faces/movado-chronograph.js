/**
 * Face: Movado Chronograph
 *
 * Detailed recreation of a vintage Movado chronograph with pulsation
 * scale (Base 30), two sub-dials, blued-steel feuille hands, and
 * an aged cream dial. Retailer-signed "Grandin Le Prince – Le Havre".
 */

const NS = 'http://www.w3.org/2000/svg';
const CX = 200, CY = 200;

/* ── Design tokens ─────────────────────────────── */
const BLUE       = '#1a3a6e';
const BLUE_SEC   = '#5a8ab8';
const BLACK      = '#1a1a1a';

/* ── Radii (viewBox 400 × 400) ─────────────────── */
const R_CASE       = 197;
const R_BEZEL      = 190;
const R_DIAL       = 178;
const R_PULSE_OUT  = 177;   // pulsation tick outer
const R_PULSE_NUM  = 165;   // pulsation number centre
const R_SEP        = 160;   // separator ring
const R_MIN_OUT    = 158;   // minute tick outer
const R_MIN_NUM    = 146;   // minute number centre
const R_INNER      = 137;   // inner ring
const R_HOUR       = 113;   // hour numeral centre
const R_SUB_DIST   = 72;    // sub-dial distance from CX
const R_SUB        = 29;    // sub-dial radius

/* ── Pulsation scale values (Base 30) ──────────── */
const PULSE = [
  200,190,180,170,160,150,140,130,120,110,
  100,90,85,80,75,70,65,60,
  58,56,54,52,50,48,46,45,44,43,42,41,
  40,39,38,37,36,35,
];

/* ── Helpers ───────────────────────────────────── */

function toRad(clockDeg) { return (clockDeg - 90) * Math.PI / 180; }

function polar(r, deg) {
  const rad = toRad(deg);
  return [CX + Math.cos(rad) * r, CY + Math.sin(rad) * r];
}

function polarAt(cx, cy, r, deg) {
  const rad = toRad(deg);
  return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
}

function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

function circ(cx, cy, r, fill, parent) {
  return svgEl('circle', { cx, cy, r, fill }, parent);
}

function textEl(parent, str, x, y, size, attrs = {}) {
  const t = svgEl('text', {
    x, y,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': size,
    ...attrs,
  }, parent);
  t.textContent = str;
  return t;
}

/** Keep scale text readable – flip in lower half */
function tangentRot(a) {
  const n = ((a % 360) + 360) % 360;
  return n >= 180 ? n + 180 : n;
}

function rotAt(id, deg, cx, cy) {
  const e = document.getElementById(id);
  if (e) e.setAttribute('transform', `rotate(${deg} ${cx} ${cy})`);
}

/**
 * Build grouped tick-mark paths at three hierarchy levels.
 * Returns three <path> elements appended to `parent`.
 */
function buildTicks(parent, rOuter, lengths, weights, color, polarFn) {
  const d = ['', '', ''];
  for (let i = 0; i < 300; i++) {
    const a = i * 1.2;
    const lvl = (i % 25 === 0) ? 2 : (i % 5 === 0) ? 1 : 0;
    const [x1, y1] = polarFn(rOuter, a);
    const [x2, y2] = polarFn(rOuter - lengths[lvl], a);
    d[lvl] += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  d.forEach((path, i) => {
    if (path) svgEl('path', { d: path, stroke: color, 'stroke-width': weights[i], fill: 'none' }, parent);
  });
}

/* ── Face module ───────────────────────────────── */

export default {
  name: 'Movado Chrono',

  create(el) {
    /* Load Google Font */
    if (!document.getElementById('mv-font')) {
      const link = document.createElement('link');
      link.id = 'mv-font';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap';
      document.head.appendChild(link);
    }

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    const defs = svgEl('defs', {}, svg);

    /* ── gradients ── */
    const caseG = svgEl('radialGradient', { id: 'mv-case', cx: '38%', cy: '36%', r: '62%' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#e4e4e4' }, caseG);
    svgEl('stop', { offset: '60%', 'stop-color': '#c8c8c8' }, caseG);
    svgEl('stop', { offset: '100%', 'stop-color': '#a0a0a0' }, caseG);

    const dialG = svgEl('radialGradient', { id: 'mv-dial' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#f4ede0' }, dialG);
    svgEl('stop', { offset: '50%', 'stop-color': '#efe6d4' }, dialG);
    svgEl('stop', { offset: '100%', 'stop-color': '#e2d8c2' }, dialG);

    const handG = svgEl('linearGradient', { id: 'mv-hand', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#122a52' }, handG);
    svgEl('stop', { offset: '50%', 'stop-color': '#2a5090' }, handG);
    svgEl('stop', { offset: '100%', 'stop-color': '#122a52' }, handG);

    /* ── bezel text arc ── */
    svgEl('path', {
      id: 'mv-bezel-arc',
      d: `M ${CX - 185} ${CY} A 185 185 0 0 1 ${CX + 185} ${CY}`,
      fill: 'none',
    }, defs);

    /* ── hand shadow filter ── */
    const sf = svgEl('filter', { id: 'mv-shadow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    svgEl('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: '1.2', result: 'blur' }, sf);
    svgEl('feOffset', { in: 'blur', dx: '0.5', dy: '1.5', result: 'off' }, sf);
    const fm = svgEl('feMerge', {}, sf);
    svgEl('feMergeNode', { in: 'off' }, fm);
    const mn2 = svgEl('feMergeNode', {}, fm);
    mn2.setAttribute('in', 'SourceGraphic');

    /* ═════════════════════════════════════════════
       LAYER 1 — Case
       ═════════════════════════════════════════════ */
    circ(CX, CY, R_CASE, 'url(#mv-case)', svg);

    /* Bezel surface */
    const bz = circ(CX, CY, R_BEZEL, '#c4c4c4', svg);
    bz.setAttribute('stroke', '#aaa');
    bz.setAttribute('stroke-width', '0.4');

    /* ═════════════════════════════════════════════
       LAYER 2 — "BASE 30 PULSATIONS" bezel text
       ═════════════════════════════════════════════ */
    const bt = svgEl('text', {
      'font-family': "'Playfair Display', Georgia, serif",
      'font-size': '11',
      'font-weight': '700',
      fill: '#2a3a5a',
      'letter-spacing': '3.5',
    }, svg);
    const tp = svgEl('textPath', {
      href: '#mv-bezel-arc',
      startOffset: '50%',
      'text-anchor': 'middle',
    }, bt);
    tp.textContent = 'BASE 30 PULSATIONS';

    /* ═════════════════════════════════════════════
       LAYER 3 — Dial background
       ═════════════════════════════════════════════ */
    circ(CX, CY, R_DIAL, 'url(#mv-dial)', svg);

    /* Thin outer ring */
    const dr = circ(CX, CY, R_DIAL, 'none', svg);
    dr.setAttribute('stroke', BLUE);
    dr.setAttribute('stroke-width', '0.6');

    /* ═════════════════════════════════════════════
       LAYER 4 — Pulsation scale (outer)
       ═════════════════════════════════════════════ */

    /* Subtle blue band behind pulsation numbers */
    const pBand = circ(CX, CY, (R_PULSE_OUT + R_SEP) / 2, 'none', svg);
    pBand.setAttribute('stroke', 'rgba(26,58,110,0.07)');
    pBand.setAttribute('stroke-width', String(R_PULSE_OUT - R_SEP));

    /* Outer ring at pulsation track edge */
    const pRing = circ(CX, CY, R_PULSE_OUT, 'none', svg);
    pRing.setAttribute('stroke', BLUE);
    pRing.setAttribute('stroke-width', '0.35');

    buildTicks(svg, R_PULSE_OUT, [2.5, 5, 9], [0.25, 0.4, 0.6], BLUE, polar);

    /* Pulsation numbers */
    PULSE.forEach(bpm => {
      const secs  = 1800 / bpm;
      const angle = secs * 6;
      const [x, y] = polar(R_PULSE_NUM, angle);
      const rot = tangentRot(angle);
      textEl(svg, String(bpm), x, y, bpm >= 100 ? 5.8 : 7, {
        'font-family': "Georgia, 'Times New Roman', serif",
        'font-weight': '700',
        fill: BLUE,
        transform: `rotate(${rot} ${x} ${y})`,
      });
    });

    /* ═════════════════════════════════════════════
       LAYER 5 — Separator ring
       ═════════════════════════════════════════════ */
    const sep = circ(CX, CY, R_SEP, 'none', svg);
    sep.setAttribute('stroke', BLUE);
    sep.setAttribute('stroke-width', '0.4');

    /* ═════════════════════════════════════════════
       LAYER 6 — Minute / seconds track
       ═════════════════════════════════════════════ */
    /* Outer edge of minute track */
    const mRing = circ(CX, CY, R_MIN_OUT, 'none', svg);
    mRing.setAttribute('stroke', BLUE);
    mRing.setAttribute('stroke-width', '0.3');

    buildTicks(svg, R_MIN_OUT, [2.5, 5, 8], [0.3, 0.45, 0.65], BLUE, polar);

    /* Minute numbers */
    [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].forEach(num => {
      const angle = (num % 60) * 6;
      const [x, y] = polar(R_MIN_NUM, angle);
      const rot = tangentRot(angle);
      textEl(svg, String(num), x, y, 9, {
        'font-family': "Georgia, 'Times New Roman', serif",
        'font-weight': '700',
        fill: BLUE,
        transform: `rotate(${rot} ${x} ${y})`,
      });
    });

    /* Inner ring */
    const ir = circ(CX, CY, R_INNER, 'none', svg);
    ir.setAttribute('stroke', BLUE);
    ir.setAttribute('stroke-width', '0.3');

    /* ═════════════════════════════════════════════
       LAYER 7 — Sub-dials
       ═════════════════════════════════════════════ */
    const SL = { cx: CX - R_SUB_DIST, cy: CY };   // 9 o'clock – seconds
    const SR = { cx: CX + R_SUB_DIST, cy: CY };   // 3 o'clock – chrono min

    [SL, SR].forEach((s, idx) => {
      /* background */
      circ(s.cx, s.cy, R_SUB, '#ede5d0', svg);
      const ring = circ(s.cx, s.cy, R_SUB, 'none', svg);
      ring.setAttribute('stroke', '#888');
      ring.setAttribute('stroke-width', '0.5');

      const total = 60;
      const nums = idx === 0
        ? [10, 20, 30, 40, 50, 60]
        : [10, 20, 30, 40, 50];

      /* tick marks */
      const dPaths = ['', '', ''];
      for (let i = 0; i < total; i++) {
        const a = (i / total) * 360;
        const is10 = (i % 10 === 0);
        const is5  = (i % 5 === 0);
        const lvl  = is10 ? 2 : is5 ? 1 : 0;
        const len  = [2, 3.5, 5][lvl];
        const [x1, y1] = polarAt(s.cx, s.cy, R_SUB, a);
        const [x2, y2] = polarAt(s.cx, s.cy, R_SUB - len, a);
        dPaths[lvl] += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
      }
      dPaths.forEach((d, i) => {
        if (d) svgEl('path', { d, stroke: '#444', 'stroke-width': [0.25, 0.35, 0.5][i], fill: 'none' }, svg);
      });

      /* numbers */
      nums.forEach(num => {
        const a = (num / total) * 360;
        const [x, y] = polarAt(s.cx, s.cy, R_SUB - 8, a);
        textEl(svg, String(num), x, y, 5.5, {
          'font-family': "Georgia, serif",
          fill: '#333',
        });
      });
    });

    /* ═════════════════════════════════════════════
       LAYER 8 — Hour markers (Arabic numerals)
       ═════════════════════════════════════════════ */
    [12, 1, 2, 4, 5, 6, 7, 8, 10, 11].forEach(h => {
      const angle = (h % 12) * 30;
      const [x, y] = polar(R_HOUR, angle);
      textEl(svg, String(h), x, y, 25, {
        'font-family': "'Playfair Display', Georgia, serif",
        'font-weight': '900',
        fill: BLACK,
      });
    });

    /* ═════════════════════════════════════════════
       LAYER 9 — Text labels
       ═════════════════════════════════════════════ */
    textEl(svg, 'MOVADO', CX, CY - 65, 10, {
      'font-family': "'Playfair Display', Georgia, serif",
      'font-weight': '400',
      'letter-spacing': '5',
      fill: BLACK,
    });

    textEl(svg, 'GRANDIN LE PRINCE', CX, CY + 76, 4.5, {
      'font-family': "Georgia, serif",
      'letter-spacing': '0.8',
      fill: '#444',
    });

    textEl(svg, 'LE HAVRE', CX, CY + 83, 4.5, {
      'font-family': "Georgia, serif",
      'letter-spacing': '0.8',
      fill: '#444',
    });

    /* ═════════════════════════════════════════════
       LAYER 10 — Hands
       ═════════════════════════════════════════════ */

    /* — Sub-dial hands (drawn first, below main) — */

    // Small-seconds hand (9 o'clock)
    const ssG = svgEl('g', { id: 'mv-small-sec' }, svg);
    svgEl('line', {
      x1: SL.cx, y1: SL.cy + 4,
      x2: SL.cx, y2: SL.cy - R_SUB + 5,
      stroke: '#1a1a3a', 'stroke-width': 0.7, 'stroke-linecap': 'round',
    }, ssG);

    // Chrono-minutes hand (3 o'clock)
    const cmG = svgEl('g', { id: 'mv-chrono-min' }, svg);
    svgEl('line', {
      x1: SR.cx, y1: SR.cy + 4,
      x2: SR.cx, y2: SR.cy - R_SUB + 5,
      stroke: BLUE, 'stroke-width': 0.7, 'stroke-linecap': 'round',
    }, cmG);

    // Sub-dial centre caps
    circ(SL.cx, SL.cy, 1.8, '#555', svg);
    circ(SR.cx, SR.cy, 1.8, '#555', svg);

    /* — Hour hand (blued-steel feuille) — */
    const hG = svgEl('g', { id: 'mv-hour', filter: 'url(#mv-shadow)' }, svg);
    svgEl('path', {
      d: [
        `M ${CX} ${CY + 16}`,
        `L ${CX - 7} ${CY - 30}`,
        `Q ${CX - 4} ${CY - 70}  ${CX} ${CY - 100}`,
        `Q ${CX + 4} ${CY - 70}  ${CX + 7} ${CY - 30}`,
        `L ${CX} ${CY + 16}`,
        'Z',
      ].join(' '),
      fill: 'url(#mv-hand)',
      stroke: '#0d1a30',
      'stroke-width': 0.3,
    }, hG);

    /* — Minute hand (longer, thinner feuille) — */
    const mG = svgEl('g', { id: 'mv-minute', filter: 'url(#mv-shadow)' }, svg);
    svgEl('path', {
      d: [
        `M ${CX} ${CY + 18}`,
        `L ${CX - 5.5} ${CY - 40}`,
        `Q ${CX - 3} ${CY - 100}  ${CX} ${CY - 142}`,
        `Q ${CX + 3} ${CY - 100}  ${CX + 5.5} ${CY - 40}`,
        `L ${CX} ${CY + 18}`,
        'Z',
      ].join(' '),
      fill: 'url(#mv-hand)',
      stroke: '#0d1a30',
      'stroke-width': 0.3,
    }, mG);

    /* — Chronograph seconds hand (thin, lighter blue) — */
    const csG = svgEl('g', { id: 'mv-chrono-sec' }, svg);
    svgEl('line', {
      x1: CX, y1: CY + 28,
      x2: CX, y2: CY - R_MIN_OUT + 4,
      stroke: BLUE_SEC, 'stroke-width': 0.6, 'stroke-linecap': 'round',
    }, csG);
    /* small counterweight nub */
    circ(CX, CY + 23, 1.8, BLUE_SEC, csG);

    /* ═════════════════════════════════════════════
       LAYER 11 — Centre cap
       ═════════════════════════════════════════════ */
    circ(CX, CY, 4.5, '#8a7a60', svg);
    circ(CX, CY, 2.8, '#b0a080', svg);
    circ(CX, CY, 1.2, '#706040', svg);

    el.appendChild(svg);
  },

  update() {
    const now  = new Date();
    const h    = now.getHours() % 12;
    const m    = now.getMinutes();
    const s    = now.getSeconds();
    const ms   = now.getMilliseconds();

    const sDeg = (s + ms / 1000) * 6;
    const mDeg = (m + s / 60) * 6;
    const hDeg = (h + m / 60) * 30;

    rotAt('mv-hour',       hDeg, CX, CY);
    rotAt('mv-minute',     mDeg, CX, CY);
    rotAt('mv-chrono-sec', sDeg, CX, CY);

    // Sub-dials: small-seconds mirrors centre seconds,
    // chrono-minutes mirrors minute hand
    const SL_CX = CX - R_SUB_DIST;
    const SR_CX = CX + R_SUB_DIST;
    rotAt('mv-small-sec',  sDeg, SL_CX, CY);
    rotAt('mv-chrono-min', mDeg, SR_CX, CY);
  },
};
