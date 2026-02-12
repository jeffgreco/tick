/**
 * Face: MAD 1
 *
 * Homage to the MB&F × MAD Gallery M.A.D.1 watch.
 * Two counter-rotating discs display hours (left) and minutes (right)
 * against a copper guilloché backdrop. Teardrop pointers face inward.
 * Outer dots spin up like a turntable every 15 seconds.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const CX = 200, CY = 200;
const LX = 132, RX = 268, DY = 195;
const DR = 62;   // disc outer radius
const NR = 48;   // number radius from disc center
const IR = 34;   // inner copper radius

// Pointer angles: degrees clockwise from 12-o'clock
// Tip of teardrop faces outward into number ring; at these positions
// the tips point inward toward each other across the watch center.
const LPTR = 90;  // 3 o'clock on left disc (tip points right)
const RPTR = 270; // 9 o'clock on right disc (tip points left)

const HOUR_LABELS = ['12','1','2','3','4','5','6','7','8','9','10','11'];
const MIN_LABELS  = ['00','05','10','15','20','25','30','35','40','45','50','55'];

export default {
  name: 'MAD 1',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    const defs = document.createElementNS(SVG_NS, 'defs');

    // Copper gradient (main disc)
    defs.appendChild(radialGrad('mad-cg', [
      ['0%', '#d4944e'], ['30%', '#cc8040'],
      ['60%', '#b86d2e'], ['100%', '#8a4c18'],
    ]));

    // Copper gradient (disc centers)
    defs.appendChild(radialGrad('mad-cc', [
      ['0%', '#d49050'], ['50%', '#c07838'], ['100%', '#a06028'],
    ]));

    // Pointer metallic gradient
    const ptrGrad = document.createElementNS(SVG_NS, 'linearGradient');
    ptrGrad.id = 'mad-ptr';
    ptrGrad.setAttribute('x1', '0');
    ptrGrad.setAttribute('y1', '0');
    ptrGrad.setAttribute('x2', '1');
    ptrGrad.setAttribute('y2', '0');
    addStop(ptrGrad, '0%', '#b0b0b0');
    addStop(ptrGrad, '40%', '#e8e8e8');
    addStop(ptrGrad, '60%', '#e0e0e0');
    addStop(ptrGrad, '100%', '#a8a8a8');
    defs.appendChild(ptrGrad);

    // Drop shadow for recessed discs
    const shadow = document.createElementNS(SVG_NS, 'filter');
    shadow.id = 'mad-shadow';
    shadow.setAttribute('x', '-20%');
    shadow.setAttribute('y', '-20%');
    shadow.setAttribute('width', '140%');
    shadow.setAttribute('height', '140%');
    const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceAlpha');
    blur.setAttribute('stdDeviation', '3');
    shadow.appendChild(blur);
    const fOff = document.createElementNS(SVG_NS, 'feOffset');
    fOff.setAttribute('dx', '0');
    fOff.setAttribute('dy', '1');
    shadow.appendChild(fOff);
    const merge = document.createElementNS(SVG_NS, 'feMerge');
    const m1 = document.createElementNS(SVG_NS, 'feMergeNode');
    merge.appendChild(m1);
    const m2 = document.createElementNS(SVG_NS, 'feMergeNode');
    m2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(m2);
    shadow.appendChild(merge);
    defs.appendChild(shadow);

    // Clip paths for rotating disc content
    const cl = document.createElementNS(SVG_NS, 'clipPath');
    cl.id = 'mad-cl';
    cl.appendChild(circ(LX, DY, DR));
    defs.appendChild(cl);

    const cr = document.createElementNS(SVG_NS, 'clipPath');
    cr.id = 'mad-cr';
    cr.appendChild(circ(RX, DY, DR));
    defs.appendChild(cr);

    svg.appendChild(defs);

    // ── Dark background ──
    svg.appendChild(circ(CX, CY, 200, '#0e0e0e'));

    // ── Outer ring dots: 6 alternating white/black segments (8 per segment) ──
    const dotG = document.createElementNS(SVG_NS, 'g');
    dotG.id = 'mad-dots';
    const DOT_COUNT = 48;
    for (let i = 0; i < DOT_COUNT; i++) {
      const a = (i * (360 / DOT_COUNT) - 90) * Math.PI / 180;
      const seg = Math.floor(i / 8);
      dotG.appendChild(circ(
        CX + Math.cos(a) * 189,
        CY + Math.sin(a) * 189,
        3.5, seg % 2 === 0 ? '#ddd' : '#222',
      ));
    }
    svg.appendChild(dotG);

    // ── Copper main disc ──
    svg.appendChild(circ(CX, CY, 174, 'url(#mad-cg)'));

    // Guilloché: concentric grooves
    for (let r = 15; r <= 170; r += 5) {
      const ring = circ(CX, CY, r, 'none');
      ring.setAttribute('stroke', r % 10 < 5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)');
      ring.setAttribute('stroke-width', '0.8');
      svg.appendChild(ring);
    }

    // Guilloché: sunburst lines
    for (let i = 0; i < 72; i++) {
      const a = i * 5 * Math.PI / 180;
      const ln = document.createElementNS(SVG_NS, 'line');
      ln.setAttribute('x1', CX + Math.cos(a) * 15);
      ln.setAttribute('y1', CY + Math.sin(a) * 15);
      ln.setAttribute('x2', CX + Math.cos(a) * 170);
      ln.setAttribute('y2', CY + Math.sin(a) * 170);
      ln.setAttribute('stroke', 'rgba(0,0,0,0.04)');
      ln.setAttribute('stroke-width', '0.5');
      svg.appendChild(ln);
    }

    // ── Hour disc (left, counterclockwise) ──
    buildDisc(svg, 'mad-h', LX, DY, HOUR_LABELS, 'mad-cl', -1, LPTR, false);

    // ── Minute disc (right, clockwise, alternating sizes) ──
    buildDisc(svg, 'mad-m', RX, DY, MIN_LABELS, 'mad-cr', 1, RPTR, true);

    // ── Fixed teardrop pointers (face inward toward each other) ──
    svg.appendChild(teardrop(LX, DY, LPTR));
    svg.appendChild(teardrop(RX, DY, RPTR));

    // ── M.A.D'1 label ──
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', CX);
    label.setAttribute('y', 290);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'rgba(60,30,10,0.6)');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', 'Saira, sans-serif');
    label.setAttribute('letter-spacing', '3');
    label.style.fontVariationSettings = "'wdth' 75, 'wght' 500";
    label.textContent = "M.A.D'1";
    svg.appendChild(label);

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    // Hour disc: counterclockwise — rotate current hour to the left pointer
    const hDeg = LPTR + (h + m / 60) * 30;
    const hEl = document.getElementById('mad-h');
    if (hEl) hEl.setAttribute('transform', `rotate(${hDeg} ${LX} ${DY})`);

    // Minute disc: rotate current minute to the right pointer position
    const mDeg = RPTR - (m + (s + ms / 1000) / 60) * 6;
    const mEl = document.getElementById('mad-m');
    if (mEl) mEl.setAttribute('transform', `rotate(${mDeg} ${RX} ${DY})`);

    // Turntable dot spin every 15 seconds, landing at a different position each time
    const dotG = document.getElementById('mad-dots');
    if (dotG) {
      const cycleNum = Math.floor((m * 60 + s) / 15);
      const cycle = (s % 15) + ms / 1000;

      // Each spin lands at a different angle (47° step for variety)
      const restAngle = (cycleNum * 47) % 360;
      const prevRest = (((cycleNum - 1) * 47) % 360 + 360) % 360;

      let rot;
      if (cycle < 2.0) {
        const t = cycle / 2.0;
        const e = 1 - Math.pow(1 - t, 3);
        // Spin from previous rest through ~2 revolutions to new rest
        rot = prevRest + e * (720 + restAngle - prevRest);
      } else {
        rot = restAngle;
      }
      dotG.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`);
    }
  },
};

// ── Helpers ──

function circ(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  if (fill) c.setAttribute('fill', fill);
  return c;
}

function radialGrad(id, stops) {
  const g = document.createElementNS(SVG_NS, 'radialGradient');
  g.id = id;
  stops.forEach(([off, col]) => {
    const s = document.createElementNS(SVG_NS, 'stop');
    s.setAttribute('offset', off);
    s.setAttribute('stop-color', col);
    g.appendChild(s);
  });
  return g;
}

function addStop(grad, off, col) {
  const s = document.createElementNS(SVG_NS, 'stop');
  s.setAttribute('offset', off);
  s.setAttribute('stop-color', col);
  grad.appendChild(s);
}

function buildDisc(svg, id, cx, cy, labels, clipId, dir, ptrAngle, alternate) {
  // Shadow ring for depth
  const shadowRing = circ(cx, cy, DR + 2, 'rgba(0,0,0,0.4)');
  shadowRing.setAttribute('filter', 'url(#mad-shadow)');
  svg.appendChild(shadowRing);

  // Static black border ring
  svg.appendChild(circ(cx, cy, DR, '#111'));

  // Rotating group (clipped to disc area)
  const g = document.createElementNS(SVG_NS, 'g');
  g.id = id;
  g.setAttribute('clip-path', `url(#${clipId})`);

  // Dark ring background
  g.appendChild(circ(cx, cy, DR - 1, '#1a1a1a'));

  // Number labels — placed around disc in dir order, oriented upright at pointer
  const n = labels.length;
  const step = 360 / n;
  labels.forEach((txt, i) => {
    // dir=1 clockwise, dir=-1 counterclockwise placement
    const deg = dir * i * step;
    const a = (deg - 90) * Math.PI / 180;
    const tx = cx + Math.cos(a) * NR;
    const ty = cy + Math.sin(a) * NR;

    // Minutes: alternating large (00,10,20…) / small (05,15,25…). Hours: uniform.
    const isLarge = !alternate || i % 2 === 0;
    const fontSize = isLarge ? 26 : 20;
    const wdth = txt.length > 1 ? 60 : 80;

    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', tx);
    t.setAttribute('y', ty);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('fill', '#fff');
    t.setAttribute('font-size', fontSize);
    t.setAttribute('font-family', 'Saira, sans-serif');
    t.style.fontVariationSettings = `'wdth' ${wdth}, 'wght' 700`;
    // Orient each number so it reads upright when rotated to the pointer position
    t.setAttribute('transform', `rotate(${deg - ptrAngle} ${tx} ${ty})`);
    t.textContent = txt;
    g.appendChild(t);
  });

  // Inner copper center
  g.appendChild(circ(cx, cy, IR, 'url(#mad-cc)'));

  // Subtle inner ring highlight
  const hl = circ(cx, cy, IR, 'none');
  hl.setAttribute('stroke', 'rgba(255,200,120,0.15)');
  hl.setAttribute('stroke-width', '1');
  g.appendChild(hl);

  svg.appendChild(g);
}

function teardrop(cx, cy, angle) {
  // Teardrop pointer: pointed tip faces OUTWARD (toward number ring).
  // Created at 12 o'clock position, then rotated to final angle.
  // At 3 o'clock (left disc): tip points RIGHT = inward toward watch center.
  // At 9 o'clock (right disc): tip points LEFT = inward toward watch center.
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);

  const tip = cy - IR - 3;      // pointed tip extends into number ring
  const bot = cy - IR + 16;     // rounded bottom, inside copper center
  const wide = cy - IR + 8;     // widest point
  const hw = 7;                  // half-width at widest

  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', [
    `M ${cx} ${tip}`,
    // Right side: tip down to widest point
    `C ${cx + 2} ${tip + 3} ${cx + hw} ${wide - 4} ${cx + hw} ${wide}`,
    // Right side: widest point down to bottom
    `C ${cx + hw} ${wide + 5} ${cx + 4} ${bot} ${cx} ${bot}`,
    // Left side: bottom up to widest point
    `C ${cx - 4} ${bot} ${cx - hw} ${wide + 5} ${cx - hw} ${wide}`,
    // Left side: widest point up to tip
    `C ${cx - hw} ${wide - 4} ${cx - 2} ${tip + 3} ${cx} ${tip}`,
    'Z',
  ].join(' '));
  p.setAttribute('fill', 'url(#mad-ptr)');
  p.setAttribute('stroke', '#999');
  p.setAttribute('stroke-width', '0.5');
  g.appendChild(p);

  // Center seam line (brushed metal effect)
  const seam = document.createElementNS(SVG_NS, 'line');
  seam.setAttribute('x1', cx);
  seam.setAttribute('y1', tip + 2);
  seam.setAttribute('x2', cx);
  seam.setAttribute('y2', bot - 2);
  seam.setAttribute('stroke', 'rgba(255,255,255,0.3)');
  seam.setAttribute('stroke-width', '0.8');
  seam.setAttribute('stroke-linecap', 'round');
  g.appendChild(seam);

  return g;
}
