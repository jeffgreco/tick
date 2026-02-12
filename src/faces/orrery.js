/**
 * Face: Solar System Orrery
 *
 * An astronomical clock showing the inner solar system.
 * Planets orbit the sun at different rates; the second hand
 * is Mercury, the minute hand is Earth, and so on.
 * Stars twinkle in the background.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 200;
const CY = 200;

const PLANETS = [
  { id: 'or-mercury', r: 50,  size: 2.5, color: '#b0a090', period: 10,  label: null },
  { id: 'or-venus',   r: 75,  size: 3.5, color: '#e8d8a0', period: 25,  label: null },
  { id: 'or-earth',   r: 100, size: 4,   color: '#4a90d9', period: 60,  label: null },
  { id: 'or-mars',    r: 125, size: 3,   color: '#c45c3c', period: 113, label: null },
  { id: 'or-jupiter', r: 155, size: 7,   color: '#c8a87a', period: 710, label: null },
  { id: 'or-saturn',  r: 180, size: 5.5, color: '#d4c090', period: 1770, label: null, rings: true },
];

export default {
  name: 'Orrery',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    const defs = document.createElementNS(SVG_NS, 'defs');

    // Sun glow gradient
    const sunGrad = document.createElementNS(SVG_NS, 'radialGradient');
    sunGrad.id = 'sunGlow';
    addStop(sunGrad, '0%', '#fff8e0');
    addStop(sunGrad, '30%', '#ffcc33');
    addStop(sunGrad, '70%', '#ff8800');
    addStop(sunGrad, '100%', 'rgba(255,100,0,0)');
    defs.appendChild(sunGrad);

    // Sun corona
    const coronaGrad = document.createElementNS(SVG_NS, 'radialGradient');
    coronaGrad.id = 'coronaGlow';
    addStop(coronaGrad, '0%', 'rgba(255,200,50,0.15)');
    addStop(coronaGrad, '100%', 'rgba(255,200,50,0)');
    defs.appendChild(coronaGrad);

    svg.appendChild(defs);

    // Deep space background
    svg.appendChild(rect(0, 0, 400, 400, '#02020a'));

    // Background stars
    for (let i = 0; i < 80; i++) {
      const star = makeCircle(
        Math.random() * 400,
        Math.random() * 400,
        0.3 + Math.random() * 0.7,
        '#fff'
      );
      star.setAttribute('opacity', (0.15 + Math.random() * 0.5).toFixed(2));

      // Twinkle
      const anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'opacity');
      const base = 0.15 + Math.random() * 0.3;
      anim.setAttribute('values', `${base};${base + 0.4};${base}`);
      anim.setAttribute('dur', `${2 + Math.random() * 4}s`);
      anim.setAttribute('repeatCount', 'indefinite');
      anim.setAttribute('begin', `${Math.random() * 4}s`);
      star.appendChild(anim);
      svg.appendChild(star);
    }

    // Orbital tracks
    PLANETS.forEach(p => {
      const track = makeCircle(CX, CY, p.r, 'none');
      track.setAttribute('stroke', 'rgba(255,255,255,0.04)');
      track.setAttribute('stroke-width', '0.5');
      svg.appendChild(track);
    });

    // Sun corona
    svg.appendChild(makeCircle(CX, CY, 35, 'url(#coronaGlow)'));

    // Sun body
    svg.appendChild(makeCircle(CX, CY, 16, 'url(#sunGlow)'));
    svg.appendChild(makeCircle(CX, CY, 10, '#ffdd44'));

    // Planets (positioned at 12 o'clock, rotated per frame)
    PLANETS.forEach(p => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.id = p.id;
      g.setAttribute('transform', `rotate(0 ${CX} ${CY})`);

      // Planet body
      const planet = makeCircle(CX, CY - p.r, p.size, p.color);
      g.appendChild(planet);

      // Earth gets a tiny moon
      if (p.id === 'or-earth') {
        const moonG = document.createElementNS(SVG_NS, 'g');
        moonG.id = 'or-moon';
        const moon = makeCircle(CX + 9, CY - p.r, 1.2, '#ccc');
        moonG.appendChild(moon);
        g.appendChild(moonG);
      }

      // Saturn gets rings
      if (p.rings) {
        const ringEl = document.createElementNS(SVG_NS, 'ellipse');
        ringEl.setAttribute('cx', CX);
        ringEl.setAttribute('cy', CY - p.r);
        ringEl.setAttribute('rx', p.size + 5);
        ringEl.setAttribute('ry', 2);
        ringEl.setAttribute('fill', 'none');
        ringEl.setAttribute('stroke', p.color);
        ringEl.setAttribute('stroke-width', '1.2');
        ringEl.setAttribute('opacity', '0.5');
        g.appendChild(ringEl);
      }

      // Atmosphere glow for gas giants
      if (p.size >= 5) {
        const atmo = makeCircle(CX, CY - p.r, p.size + 1.5, 'none');
        atmo.setAttribute('stroke', p.color);
        atmo.setAttribute('stroke-width', '0.8');
        atmo.setAttribute('opacity', '0.2');
        g.appendChild(atmo);
      }

      svg.appendChild(g);
    });

    // Time display
    const time = document.createElementNS(SVG_NS, 'text');
    time.id = 'or-time';
    time.setAttribute('x', CX);
    time.setAttribute('y', CY + 6);
    time.setAttribute('text-anchor', 'middle');
    time.setAttribute('fill', 'rgba(255,255,255,0.5)');
    time.setAttribute('font-size', '11');
    time.setAttribute('font-family', "'SF Pro Display',-apple-system,Helvetica,sans-serif");
    time.setAttribute('letter-spacing', '2');
    svg.appendChild(time);

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const m = now.getMinutes();
    const h = now.getHours();

    const totalSec = s + ms / 1000;
    const totalMin = m + totalSec / 60;

    // Each planet orbits based on its period (in seconds)
    PLANETS.forEach(p => {
      let elapsed;
      if (p.period <= 60) {
        elapsed = totalSec;
      } else if (p.period <= 3600) {
        elapsed = totalMin * 60 + totalSec;
      } else {
        elapsed = (h * 3600) + (m * 60) + totalSec;
      }
      const deg = (elapsed / p.period) * 360;
      const g = document.getElementById(p.id);
      if (g) g.setAttribute('transform', `rotate(${deg % 360} ${CX} ${CY})`);
    });

    // Moon orbits Earth (1 rev per 10 seconds for visibility)
    const moonDeg = (totalSec / 3) * 360;
    const moonG = document.getElementById('or-moon');
    if (moonG) {
      const earthG = document.getElementById('or-earth');
      if (earthG) {
        // Moon rotates around Earth's position
        // Earth is at (CX, CY - earthR) in its local coords
        moonG.setAttribute('transform', `rotate(${moonDeg} ${CX} ${CY - 100})`);
      }
    }

    // Time
    const timeEl = document.getElementById('or-time');
    if (timeEl) {
      timeEl.textContent = `${pad(h)}:${pad(m)}`;
    }
  },
};

function makeCircle(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

function rect(x, y, w, h, fill) {
  const r = document.createElementNS(SVG_NS, 'rect');
  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', w);
  r.setAttribute('height', h);
  r.setAttribute('fill', fill);
  return r;
}

function addStop(grad, offset, color) {
  const stop = document.createElementNS(SVG_NS, 'stop');
  stop.setAttribute('offset', offset);
  stop.setAttribute('stop-color', color);
  grad.appendChild(stop);
}

function pad(n) { return n.toString().padStart(2, '0'); }
