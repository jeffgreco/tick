/**
 * Face: Tourbillon
 *
 * A mechanical watch movement visible through a display caseback.
 * Multiple gears mesh and rotate, with a spinning tourbillon cage
 * at 6 o'clock housing an oscillating balance wheel.
 * All rendered in SVG with metallic gradients.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 200;
const CY = 200;

export default {
  name: 'Tourbillon',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    const defs = document.createElementNS(SVG_NS, 'defs');

    // Brass gradient
    const brass = document.createElementNS(SVG_NS, 'linearGradient');
    brass.id = 'tb-brass';
    brass.setAttribute('x1', '0'); brass.setAttribute('y1', '0');
    brass.setAttribute('x2', '1'); brass.setAttribute('y2', '1');
    addStop(brass, '0%', '#c9a84c');
    addStop(brass, '50%', '#dfc072');
    addStop(brass, '100%', '#a08030');
    defs.appendChild(brass);

    // Steel gradient
    const steel = document.createElementNS(SVG_NS, 'linearGradient');
    steel.id = 'tb-steel';
    steel.setAttribute('x1', '0'); steel.setAttribute('y1', '0');
    steel.setAttribute('x2', '1'); steel.setAttribute('y2', '1');
    addStop(steel, '0%', '#b0b8c0');
    addStop(steel, '50%', '#d0d8e0');
    addStop(steel, '100%', '#8890a0');
    defs.appendChild(steel);

    // Rhodium (dark) gradient
    const rhodium = document.createElementNS(SVG_NS, 'linearGradient');
    rhodium.id = 'tb-rhodium';
    addStop(rhodium, '0%', '#3a3a44');
    addStop(rhodium, '50%', '#52525c');
    addStop(rhodium, '100%', '#2a2a34');
    defs.appendChild(rhodium);

    svg.appendChild(defs);

    // ── Base plate ──
    svg.appendChild(makeCircle(CX, CY, 195, '#1a1a20'));
    svg.appendChild(makeCircle(CX, CY, 190, 'url(#tb-rhodium)'));

    // Geneva stripes (côtes de Genève)
    const stripes = document.createElementNS(SVG_NS, 'g');
    stripes.setAttribute('opacity', '0.08');
    for (let i = -15; i <= 15; i++) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', CX - 200);
      line.setAttribute('y1', CY + i * 12);
      line.setAttribute('x2', CX + 200);
      line.setAttribute('y2', CY + i * 12 - 40);
      line.setAttribute('stroke', '#fff');
      line.setAttribute('stroke-width', '5');
      stripes.appendChild(line);
    }
    // Clip stripes to movement
    const moveClip = document.createElementNS(SVG_NS, 'clipPath');
    moveClip.id = 'tb-move-clip';
    moveClip.appendChild(makeCircle(CX, CY, 188, '#000'));
    defs.appendChild(moveClip);
    stripes.setAttribute('clip-path', 'url(#tb-move-clip)');
    svg.appendChild(stripes);

    // ── Main barrel (hour gear, top-left) ──
    const barrel = document.createElementNS(SVG_NS, 'g');
    barrel.id = 'tb-barrel';
    const barrelPath = gearPath(0, 0, 24, 58, 50);
    const barrelEl = makePath(barrelPath, 'url(#tb-brass)');
    barrelEl.setAttribute('stroke', '#8a6820');
    barrelEl.setAttribute('stroke-width', '0.5');
    barrel.appendChild(barrelEl);
    barrel.appendChild(makeCircle(0, 0, 40, 'url(#tb-rhodium)'));
    // Mainspring spiral hint
    for (let i = 0; i < 5; i++) {
      const arc = document.createElementNS(SVG_NS, 'circle');
      arc.setAttribute('cx', 0);
      arc.setAttribute('cy', 0);
      arc.setAttribute('r', 10 + i * 6);
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      arc.setAttribute('stroke-width', '0.5');
      barrel.appendChild(arc);
    }
    barrel.setAttribute('transform', `translate(130, 130)`);
    svg.appendChild(barrel);

    // ── Center wheel (minute gear) ──
    const center = document.createElementNS(SVG_NS, 'g');
    center.id = 'tb-center';
    const centerPath = gearPath(0, 0, 20, 45, 38);
    const centerEl = makePath(centerPath, 'url(#tb-brass)');
    centerEl.setAttribute('stroke', '#8a6820');
    centerEl.setAttribute('stroke-width', '0.5');
    center.appendChild(centerEl);
    center.appendChild(makeCircle(0, 0, 28, 'url(#tb-rhodium)'));
    center.appendChild(jewel(0, 0, 3));
    center.setAttribute('transform', `translate(${CX}, ${CY})`);
    svg.appendChild(center);

    // ── Third wheel (upper-right) ──
    const third = document.createElementNS(SVG_NS, 'g');
    third.id = 'tb-third';
    const thirdPath = gearPath(0, 0, 16, 32, 26);
    const thirdEl = makePath(thirdPath, 'url(#tb-steel)');
    thirdEl.setAttribute('stroke', '#6a7080');
    thirdEl.setAttribute('stroke-width', '0.5');
    third.appendChild(thirdEl);
    third.appendChild(makeCircle(0, 0, 18, 'url(#tb-rhodium)'));
    third.appendChild(jewel(0, 0, 2));
    third.setAttribute('transform', `translate(270, 140)`);
    svg.appendChild(third);

    // ── Fourth wheel (right) ──
    const fourth = document.createElementNS(SVG_NS, 'g');
    fourth.id = 'tb-fourth';
    const fourthPath = gearPath(0, 0, 12, 22, 17);
    const fourthEl = makePath(fourthPath, 'url(#tb-steel)');
    fourthEl.setAttribute('stroke', '#6a7080');
    fourthEl.setAttribute('stroke-width', '0.5');
    fourth.appendChild(fourthEl);
    fourth.appendChild(makeCircle(0, 0, 11, 'url(#tb-rhodium)'));
    fourth.appendChild(jewel(0, 0, 1.5));
    fourth.setAttribute('transform', `translate(290, 230)`);
    svg.appendChild(fourth);

    // ── Tourbillon cage (bottom center, 6 o'clock) ──
    const tourbillon = document.createElementNS(SVG_NS, 'g');
    tourbillon.id = 'tb-tourbillon';

    // Cage frame
    const cage = document.createElementNS(SVG_NS, 'g');
    cage.id = 'tb-cage';

    // Outer ring
    const outerRing = makeCircle(0, 0, 35, 'none');
    outerRing.setAttribute('stroke', 'url(#tb-steel)');
    outerRing.setAttribute('stroke-width', '2');
    cage.appendChild(outerRing);

    // Cage arms (3 spokes)
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120) * Math.PI / 180;
      const arm = document.createElementNS(SVG_NS, 'line');
      arm.setAttribute('x1', 0);
      arm.setAttribute('y1', 0);
      arm.setAttribute('x2', Math.cos(angle) * 34);
      arm.setAttribute('y2', Math.sin(angle) * 34);
      arm.setAttribute('stroke', 'url(#tb-steel)');
      arm.setAttribute('stroke-width', '1.5');
      arm.setAttribute('stroke-linecap', 'round');
      cage.appendChild(arm);
    }

    // Escape wheel (inside cage)
    const escapePath = escapeWheelPath(0, 0, 10, 20, 15);
    const escapeEl = makePath(escapePath, 'url(#tb-brass)');
    escapeEl.setAttribute('stroke', '#8a6820');
    escapeEl.setAttribute('stroke-width', '0.3');
    escapeEl.id = 'tb-escape';
    cage.appendChild(escapeEl);

    // Balance wheel
    const balance = document.createElementNS(SVG_NS, 'g');
    balance.id = 'tb-balance';
    const bRing = makeCircle(0, 0, 26, 'none');
    bRing.setAttribute('stroke', 'url(#tb-brass)');
    bRing.setAttribute('stroke-width', '1.5');
    balance.appendChild(bRing);
    // Spoke
    const spoke = document.createElementNS(SVG_NS, 'line');
    spoke.setAttribute('x1', -26); spoke.setAttribute('y1', 0);
    spoke.setAttribute('x2', 26); spoke.setAttribute('y2', 0);
    spoke.setAttribute('stroke', 'url(#tb-brass)');
    spoke.setAttribute('stroke-width', '1');
    balance.appendChild(spoke);
    // Impulse pin
    balance.appendChild(jewel(0, -26, 1.5));
    balance.appendChild(jewel(0, 26, 1.5));
    cage.appendChild(balance);

    // Center jewel
    cage.appendChild(jewel(0, 0, 2));

    tourbillon.appendChild(cage);
    tourbillon.setAttribute('transform', `translate(${CX}, 300)`);
    svg.appendChild(tourbillon);

    // ── Jewel bearings on main bridges ──
    [[130, 130], [CX, CY], [270, 140], [290, 230]].forEach(([jx, jy]) => {
      // Already have center jewels on gears, skip
    });

    // ── Small subdial decorations ──
    // Hour markers ring
    const markerG = document.createElementNS(SVG_NS, 'g');
    markerG.setAttribute('opacity', '0.3');
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const outerR = 188;
      const innerR = i % 3 === 0 ? 178 : 183;
      const mk = document.createElementNS(SVG_NS, 'line');
      mk.setAttribute('x1', CX + Math.cos(angle) * innerR);
      mk.setAttribute('y1', CY + Math.sin(angle) * innerR);
      mk.setAttribute('x2', CX + Math.cos(angle) * outerR);
      mk.setAttribute('y2', CY + Math.sin(angle) * outerR);
      mk.setAttribute('stroke', '#c9a84c');
      mk.setAttribute('stroke-width', i % 3 === 0 ? 2 : 0.8);
      mk.setAttribute('stroke-linecap', 'round');
      markerG.appendChild(mk);
    }
    svg.appendChild(markerG);

    // ── Time text ──
    const time = document.createElementNS(SVG_NS, 'text');
    time.id = 'tb-time';
    time.setAttribute('x', CX);
    time.setAttribute('y', 82);
    time.setAttribute('text-anchor', 'middle');
    time.setAttribute('fill', '#c9a84c');
    time.setAttribute('font-size', '18');
    time.setAttribute('font-family', "'SF Pro Display',-apple-system,Helvetica,sans-serif");
    time.setAttribute('letter-spacing', '4');
    time.setAttribute('opacity', '0.8');
    svg.appendChild(time);

    // ── Seconds text ──
    const secText = document.createElementNS(SVG_NS, 'text');
    secText.id = 'tb-sec';
    secText.setAttribute('x', CX);
    secText.setAttribute('y', 345);
    secText.setAttribute('text-anchor', 'middle');
    secText.setAttribute('fill', '#c9a84c');
    secText.setAttribute('font-size', '10');
    secText.setAttribute('font-family', "'Courier New',monospace");
    secText.setAttribute('letter-spacing', '2');
    secText.setAttribute('opacity', '0.5');
    svg.appendChild(secText);

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;

    const totalSec = s + ms / 1000;

    // Barrel: 1 rev per 12 hours (very slow)
    const barrelDeg = ((h * 3600 + m * 60 + totalSec) / 43200) * 360;
    setRotate('tb-barrel', barrelDeg, 130, 130);

    // Center wheel: 1 rev per hour
    const centerDeg = ((m * 60 + totalSec) / 3600) * 360;
    setRotate('tb-center', -centerDeg, CX, CY);

    // Third wheel: 1 rev per 8 minutes
    const thirdDeg = ((m * 60 + totalSec) / 480) * 360;
    setRotate('tb-third', thirdDeg, 270, 140);

    // Fourth wheel: 1 rev per 2 minutes
    const fourthDeg = (totalSec / 120) * 360;
    setRotate('tb-fourth', -fourthDeg, 290, 230);

    // Tourbillon cage: 1 revolution per 60 seconds
    const cageDeg = (totalSec / 60) * 360;
    const cageEl = document.getElementById('tb-cage');
    if (cageEl) cageEl.setAttribute('transform', `rotate(${cageDeg})`);

    // Escape wheel: fast rotation (6 rev per 60 seconds)
    const escapeDeg = (totalSec / 10) * 360;
    const escapeEl = document.getElementById('tb-escape');
    if (escapeEl) escapeEl.setAttribute('transform', `rotate(${escapeDeg})`);

    // Balance wheel: oscillation (4Hz tick-tock)
    const balanceDeg = Math.sin(totalSec * Math.PI * 8) * 270;
    const balanceEl = document.getElementById('tb-balance');
    if (balanceEl) balanceEl.setAttribute('transform', `rotate(${balanceDeg})`);

    // Time
    const timeEl = document.getElementById('tb-time');
    if (timeEl) {
      timeEl.textContent = `${pad(now.getHours())}:${pad(m)}`;
    }

    const secEl = document.getElementById('tb-sec');
    if (secEl) secEl.textContent = pad(s);
  },
};

// ── Helpers ──

function makeCircle(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

function makePath(d, fill) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', fill);
  return p;
}

function jewel(cx, cy, r) {
  const c = makeCircle(cx, cy, r, '#cc2244');
  c.setAttribute('opacity', '0.7');
  return c;
}

function setRotate(id, deg, cx, cy) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('transform', `translate(${cx},${cy}) rotate(${deg})`);
}

function gearPath(cx, cy, teeth, outerR, innerR) {
  const points = [];
  for (let i = 0; i < teeth; i++) {
    const base = (i / teeth) * Math.PI * 2;
    const half = (1 / teeth) * Math.PI * 2 / 4;

    points.push([cx + Math.cos(base - half) * innerR, cy + Math.sin(base - half) * innerR]);
    points.push([cx + Math.cos(base - half * 0.5) * outerR, cy + Math.sin(base - half * 0.5) * outerR]);
    points.push([cx + Math.cos(base + half * 0.5) * outerR, cy + Math.sin(base + half * 0.5) * outerR]);
    points.push([cx + Math.cos(base + half) * innerR, cy + Math.sin(base + half) * innerR]);
  }
  return 'M ' + points.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + ' Z';
}

function escapeWheelPath(cx, cy, teeth, outerR, innerR) {
  // Pointed teeth for escape wheel
  const points = [];
  for (let i = 0; i < teeth; i++) {
    const base = (i / teeth) * Math.PI * 2;
    const gap = (1 / teeth) * Math.PI * 2;

    // Tooth point
    points.push([cx + Math.cos(base) * outerR, cy + Math.sin(base) * outerR]);
    // Inner notch
    points.push([cx + Math.cos(base + gap * 0.3) * innerR, cy + Math.sin(base + gap * 0.3) * innerR]);
    points.push([cx + Math.cos(base + gap * 0.7) * innerR, cy + Math.sin(base + gap * 0.7) * innerR]);
  }
  return 'M ' + points.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + ' Z';
}

function addStop(grad, offset, color) {
  const stop = document.createElementNS(SVG_NS, 'stop');
  stop.setAttribute('offset', offset);
  stop.setAttribute('stop-color', color);
  grad.appendChild(stop);
}

function pad(n) { return n.toString().padStart(2, '0'); }
