/**
 * Face: Radar Sweep
 *
 * Military-grade PPI radar display with a phosphor sweep beam
 * that completes one revolution per 60 seconds.
 * Targets glow as the beam passes and slowly fade.
 * Perfect for the round display.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GREEN = '#00ff41';
const DIM = 'rgba(0,255,65,0.12)';
const CX = 200;
const CY = 200;
const R = 180;

// Pre-generated random targets (angle in deg, distance 0-1)
const TARGETS = [
  { a: 35, d: 0.6 }, { a: 92, d: 0.38 }, { a: 145, d: 0.82 },
  { a: 198, d: 0.55 }, { a: 250, d: 0.72 }, { a: 305, d: 0.45 },
  { a: 15, d: 0.88 }, { a: 170, d: 0.3 },
];

export default {
  name: 'Radar Sweep',

  create(el) {
    el.style.cssText = 'background:#000;position:relative;overflow:hidden;';

    // Sweep glow layer (CSS conic-gradient, updated per frame)
    const sweep = document.createElement('div');
    sweep.id = 'rd-sweep';
    sweep.style.cssText = `
      position:absolute;inset:0;border-radius:50%;
      will-change:background;
    `;
    el.appendChild(sweep);

    // SVG overlay for rings, labels, blips
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

    // Concentric range rings
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      svg.appendChild(ring(CX, CY, R * frac, DIM));
    });

    // Crosshair lines
    [[CX, CY - R, CX, CY + R], [CX - R, CY, CX + R, CY]].forEach(([x1, y1, x2, y2]) => {
      const l = document.createElementNS(SVG_NS, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      l.setAttribute('stroke', DIM);
      l.setAttribute('stroke-width', '0.5');
      svg.appendChild(l);
    });

    // Compass labels
    const labels = [['N', CX, CY - R - 8], ['S', CX, CY + R + 14], ['E', CX + R + 10, CY + 4], ['W', CX - R - 10, CY + 4]];
    labels.forEach(([txt, x, y]) => {
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', 'rgba(0,255,65,0.3)');
      t.setAttribute('font-size', '10');
      t.setAttribute('font-family', "'SF Pro Display',-apple-system,Helvetica,sans-serif");
      t.textContent = txt;
      svg.appendChild(t);
    });

    // Target blips
    TARGETS.forEach((tgt, i) => {
      const rad = tgt.a * Math.PI / 180;
      const bx = CX + Math.cos(rad) * R * tgt.d;
      const by = CY + Math.sin(rad) * R * tgt.d;
      const blip = document.createElementNS(SVG_NS, 'circle');
      blip.id = `rd-blip-${i}`;
      blip.setAttribute('cx', bx);
      blip.setAttribute('cy', by);
      blip.setAttribute('r', 3);
      blip.setAttribute('fill', GREEN);
      blip.setAttribute('opacity', '0');
      svg.appendChild(blip);

      // Blip halo
      const halo = document.createElementNS(SVG_NS, 'circle');
      halo.id = `rd-halo-${i}`;
      halo.setAttribute('cx', bx);
      halo.setAttribute('cy', by);
      halo.setAttribute('r', 6);
      halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', GREEN);
      halo.setAttribute('stroke-width', '0.5');
      halo.setAttribute('opacity', '0');
      svg.appendChild(halo);
    });

    // Sweep line (thin bright line at leading edge)
    const sweepLine = document.createElementNS(SVG_NS, 'line');
    sweepLine.id = 'rd-line';
    sweepLine.setAttribute('x1', CX);
    sweepLine.setAttribute('y1', CY);
    sweepLine.setAttribute('x2', CX);
    sweepLine.setAttribute('y2', CY - R);
    sweepLine.setAttribute('stroke', GREEN);
    sweepLine.setAttribute('stroke-width', '1.5');
    sweepLine.setAttribute('opacity', '0.8');
    svg.appendChild(sweepLine);

    // Center dot
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', CX);
    dot.setAttribute('cy', CY);
    dot.setAttribute('r', 3);
    dot.setAttribute('fill', GREEN);
    svg.appendChild(dot);

    // Time display
    const time = document.createElementNS(SVG_NS, 'text');
    time.id = 'rd-time';
    time.setAttribute('x', CX);
    time.setAttribute('y', CY + 32);
    time.setAttribute('text-anchor', 'middle');
    time.setAttribute('fill', GREEN);
    time.setAttribute('font-size', '14');
    time.setAttribute('font-family', "'Courier New',monospace");
    time.setAttribute('opacity', '0.7');
    time.setAttribute('letter-spacing', '2');
    svg.appendChild(time);

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const sweepDeg = ((s + ms / 1000) / 60) * 360;

    // Update conic gradient sweep (glow trail)
    const sweepEl = document.getElementById('rd-sweep');
    if (sweepEl) {
      const from = sweepDeg - 90; // CSS conic-gradient starts at top (12 o'clock)
      sweepEl.style.background = `conic-gradient(from ${from - 40}deg at 50% 50%, transparent 0deg, rgba(0,255,65,0.08) 20deg, rgba(0,255,65,0.18) 38deg, rgba(0,255,65,0.04) 40deg, transparent 40deg)`;
    }

    // Rotate sweep line
    const line = document.getElementById('rd-line');
    if (line) line.setAttribute('transform', `rotate(${sweepDeg} ${CX} ${CY})`);

    // Update blip brightness based on sweep angle
    TARGETS.forEach((tgt, i) => {
      // How far behind the sweep is this blip? (0 = just passed, 360 = about to pass)
      const behind = ((sweepDeg - tgt.a) % 360 + 360) % 360;
      let opacity = 0;
      if (behind < 90) {
        opacity = Math.max(0, 1 - behind / 90);
      }
      const blip = document.getElementById(`rd-blip-${i}`);
      const halo = document.getElementById(`rd-halo-${i}`);
      if (blip) blip.setAttribute('opacity', opacity.toFixed(2));
      if (halo) halo.setAttribute('opacity', (opacity * 0.4).toFixed(2));
    });

    // Time
    const timeEl = document.getElementById('rd-time');
    if (timeEl) {
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const sec = pad(s);
      timeEl.textContent = `${h}:${m}:${sec}`;
    }
  },
};

function ring(cx, cy, r, stroke) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', 'none');
  c.setAttribute('stroke', stroke);
  c.setAttribute('stroke-width', '0.5');
  return c;
}

function pad(n) { return n.toString().padStart(2, '0'); }
