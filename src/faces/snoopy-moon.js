/**
 * Face: Snoopy Moonwatch
 *
 * Homage to the Omega Speedmaster "Silver Snoopy Award" 50th Anniversary caseback.
 * - A continuously rotating Earth (1 revolution / 60 seconds, synced to seconds)
 * - Snoopy in his spacesuit riding a command module, orbiting around the moon
 * - Stars in the background
 * - "EYES ON THE STARS" text
 *
 * All rendered in SVG for crisp scaling.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export default {
  name: 'Snoopy Moon',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    // ── Defs ──
    const defs = document.createElementNS(SVG_NS, 'defs');

    // Earth gradient
    const earthGrad = document.createElementNS(SVG_NS, 'radialGradient');
    earthGrad.id = 'earthGrad';
    addStop(earthGrad, '0%', '#4a90d9');
    addStop(earthGrad, '50%', '#2e6cb5');
    addStop(earthGrad, '100%', '#1a3a6c');
    defs.appendChild(earthGrad);

    // Moon gradient
    const moonGrad = document.createElementNS(SVG_NS, 'radialGradient');
    moonGrad.id = 'moonGrad';
    moonGrad.setAttribute('cx', '40%');
    moonGrad.setAttribute('cy', '40%');
    addStop(moonGrad, '0%', '#d4d0c8');
    addStop(moonGrad, '60%', '#b0a890');
    addStop(moonGrad, '100%', '#8a8070');
    defs.appendChild(moonGrad);

    // Star field filter for twinkle
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.id = 'twinkle';
    const turbulence = document.createElementNS(SVG_NS, 'feTurbulence');
    turbulence.setAttribute('baseFrequency', '0.9');
    turbulence.setAttribute('numOctaves', '1');
    turbulence.setAttribute('seed', '2');
    filter.appendChild(turbulence);
    const displace = document.createElementNS(SVG_NS, 'feDisplacementMap');
    displace.setAttribute('in', 'SourceGraphic');
    displace.setAttribute('scale', '1');
    filter.appendChild(displace);
    defs.appendChild(filter);

    svg.appendChild(defs);

    // ── Deep space background ──
    svg.appendChild(rect(0, 0, 400, 400, '#050510'));

    // ── Stars ──
    const starsGroup = document.createElementNS(SVG_NS, 'g');
    starsGroup.setAttribute('opacity', '0.8');
    const starPositions = [
      [45, 30], [120, 55], [350, 40], [300, 80], [70, 120], [250, 25],
      [180, 65], [330, 130], [55, 200], [370, 190], [90, 310], [310, 290],
      [200, 350], [150, 380], [340, 350], [40, 370], [270, 370], [380, 300],
      [20, 150], [160, 140], [280, 160], [100, 250], [230, 280], [360, 240],
      [130, 330], [50, 85], [220, 110], [315, 55], [175, 210], [265, 330],
    ];
    starPositions.forEach(([x, y], i) => {
      const star = document.createElementNS(SVG_NS, 'circle');
      star.setAttribute('cx', x);
      star.setAttribute('cy', y);
      star.setAttribute('r', 0.5 + Math.random() * 1);
      star.setAttribute('fill', '#fff');
      star.setAttribute('opacity', 0.3 + Math.random() * 0.7);

      // Twinkle animation
      const anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'opacity');
      anim.setAttribute('values', `${0.3 + Math.random() * 0.4};${0.7 + Math.random() * 0.3};${0.3 + Math.random() * 0.4}`);
      anim.setAttribute('dur', `${2 + Math.random() * 3}s`);
      anim.setAttribute('repeatCount', 'indefinite');
      anim.setAttribute('begin', `${Math.random() * 3}s`);
      star.appendChild(anim);

      starsGroup.appendChild(star);
    });
    svg.appendChild(starsGroup);

    // ── "EYES ON THE STARS" text (curved along top) ──
    const textPath = document.createElementNS(SVG_NS, 'path');
    textPath.id = 'textArc';
    textPath.setAttribute('d', 'M 80 340 A 165 165 0 0 1 320 340');
    textPath.setAttribute('fill', 'none');
    defs.appendChild(textPath);

    const motto = document.createElementNS(SVG_NS, 'text');
    motto.setAttribute('fill', 'rgba(255,255,255,0.2)');
    motto.setAttribute('font-size', '10');
    motto.setAttribute('font-family', 'SF Pro Display, -apple-system, Helvetica, sans-serif');
    motto.setAttribute('letter-spacing', '4');
    const tp = document.createElementNS(SVG_NS, 'textPath');
    tp.setAttribute('href', '#textArc');
    tp.setAttribute('startOffset', '50%');
    tp.setAttribute('text-anchor', 'middle');
    tp.textContent = 'EYES ON THE STARS';
    motto.appendChild(tp);
    svg.appendChild(motto);

    // ── Moon (center) ──
    const moonGroup = document.createElementNS(SVG_NS, 'g');

    // Moon body
    moonGroup.appendChild(makeCircle(200, 200, 55, 'url(#moonGrad)'));

    // Craters
    const craters = [
      [185, 185, 8, 'rgba(0,0,0,0.1)'],
      [210, 178, 5, 'rgba(0,0,0,0.08)'],
      [195, 210, 6, 'rgba(0,0,0,0.12)'],
      [220, 200, 4, 'rgba(0,0,0,0.1)'],
      [175, 205, 3, 'rgba(0,0,0,0.08)'],
      [205, 220, 7, 'rgba(0,0,0,0.06)'],
      [225, 185, 3.5, 'rgba(0,0,0,0.09)'],
    ];
    craters.forEach(([cx, cy, r, fill]) => {
      moonGroup.appendChild(makeCircle(cx, cy, r, fill));
    });

    svg.appendChild(moonGroup);

    // ── Earth (bottom-right, rotating) ──
    const earthGroup = document.createElementNS(SVG_NS, 'g');
    earthGroup.id = 'sn-earth';

    // Earth sphere
    earthGroup.appendChild(makeCircle(0, 0, 28, 'url(#earthGrad)'));

    // Continent shapes (simplified)
    const continents = document.createElementNS(SVG_NS, 'g');
    continents.setAttribute('fill', '#3a7d44');
    continents.setAttribute('opacity', '0.6');

    // Simple continent blobs
    const blob1 = document.createElementNS(SVG_NS, 'ellipse');
    blob1.setAttribute('cx', -5);
    blob1.setAttribute('cy', -8);
    blob1.setAttribute('rx', 10);
    blob1.setAttribute('ry', 7);
    continents.appendChild(blob1);

    const blob2 = document.createElementNS(SVG_NS, 'ellipse');
    blob2.setAttribute('cx', 8);
    blob2.setAttribute('cy', 5);
    blob2.setAttribute('rx', 8);
    blob2.setAttribute('ry', 12);
    continents.appendChild(blob2);

    const blob3 = document.createElementNS(SVG_NS, 'ellipse');
    blob3.setAttribute('cx', -12);
    blob3.setAttribute('cy', 10);
    blob3.setAttribute('rx', 6);
    blob3.setAttribute('ry', 5);
    continents.appendChild(blob3);

    earthGroup.appendChild(continents);

    // Cloud layer
    const clouds = document.createElementNS(SVG_NS, 'g');
    clouds.setAttribute('fill', 'rgba(255,255,255,0.3)');
    [[4, -12, 6, 3], [-10, 2, 5, 2], [12, -3, 4, 2.5]].forEach(([cx, cy, rx, ry]) => {
      const c = document.createElementNS(SVG_NS, 'ellipse');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('rx', rx);
      c.setAttribute('ry', ry);
      clouds.appendChild(c);
    });
    earthGroup.appendChild(clouds);

    // Atmosphere glow
    const atmo = makeCircle(0, 0, 28, 'none');
    atmo.setAttribute('stroke', 'rgba(100,180,255,0.3)');
    atmo.setAttribute('stroke-width', '2');
    earthGroup.appendChild(atmo);

    // Clip earth to circle
    const earthClip = document.createElementNS(SVG_NS, 'clipPath');
    earthClip.id = 'earthClip';
    earthClip.appendChild(makeCircle(0, 0, 28, '#000'));
    defs.appendChild(earthClip);
    earthGroup.setAttribute('clip-path', 'url(#earthClip)');

    svg.appendChild(earthGroup);

    // ── Snoopy in Command Module (orbiting) ──
    const orbitGroup = document.createElementNS(SVG_NS, 'g');
    orbitGroup.id = 'sn-orbit';
    orbitGroup.setAttribute('transform', 'rotate(0 200 200)');

    // Orbit path (visible, subtle)
    const orbitPath = makeCircle(200, 200, 105, 'none');
    orbitPath.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    orbitPath.setAttribute('stroke-width', '1');
    orbitPath.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(orbitPath);

    // Snoopy + capsule positioned at top of orbit
    const snoopyGroup = document.createElementNS(SVG_NS, 'g');
    snoopyGroup.setAttribute('transform', 'translate(200, 95)');

    // Command module body
    const capsule = document.createElementNS(SVG_NS, 'path');
    capsule.setAttribute('d', 'M -12 0 L -8 -6 L 8 -6 L 12 0 L 8 4 L -8 4 Z');
    capsule.setAttribute('fill', '#c0c0c0');
    capsule.setAttribute('stroke', '#888');
    capsule.setAttribute('stroke-width', '0.5');
    snoopyGroup.appendChild(capsule);

    // Window
    snoopyGroup.appendChild(makeCircle(0, -2, 3, '#1a3a6c'));
    snoopyGroup.appendChild(makeCircle(0, -2, 2.5, '#2a5a9c'));

    // Snoopy head (peeking from top)
    const head = document.createElementNS(SVG_NS, 'ellipse');
    head.setAttribute('cx', 0);
    head.setAttribute('cy', -9);
    head.setAttribute('rx', 5);
    head.setAttribute('ry', 4);
    head.setAttribute('fill', '#fff');
    snoopyGroup.appendChild(head);

    // Snoopy nose
    const nose = document.createElementNS(SVG_NS, 'ellipse');
    nose.setAttribute('cx', 5);
    nose.setAttribute('cy', -10);
    nose.setAttribute('rx', 2.5);
    nose.setAttribute('ry', 1.5);
    nose.setAttribute('fill', '#222');
    snoopyGroup.appendChild(nose);

    // Snoopy ear
    const ear = document.createElementNS(SVG_NS, 'ellipse');
    ear.setAttribute('cx', -3);
    ear.setAttribute('cy', -7);
    ear.setAttribute('rx', 2);
    ear.setAttribute('ry', 3.5);
    ear.setAttribute('fill', '#222');
    snoopyGroup.appendChild(ear);

    // Helmet visor outline
    const visor = document.createElementNS(SVG_NS, 'path');
    visor.setAttribute('d', 'M -6 -12 A 7 6 0 0 1 6 -12');
    visor.setAttribute('fill', 'none');
    visor.setAttribute('stroke', 'rgba(255,255,255,0.4)');
    visor.setAttribute('stroke-width', '0.8');
    snoopyGroup.appendChild(visor);

    // Eye
    snoopyGroup.appendChild(makeCircle(2, -10.5, 0.8, '#000'));

    orbitGroup.appendChild(snoopyGroup);
    svg.appendChild(orbitGroup);

    // ── Time display ──
    const timeText = document.createElementNS(SVG_NS, 'text');
    timeText.id = 'sn-time';
    timeText.setAttribute('x', 200);
    timeText.setAttribute('y', 290);
    timeText.setAttribute('text-anchor', 'middle');
    timeText.setAttribute('fill', 'rgba(255,255,255,0.6)');
    timeText.setAttribute('font-size', '16');
    timeText.setAttribute('font-family', 'SF Pro Display, -apple-system, Helvetica, sans-serif');
    timeText.setAttribute('letter-spacing', '3');
    svg.appendChild(timeText);

    el.appendChild(svg);
  },

  update(el) {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const m = now.getMinutes();
    const h = now.getHours();

    // Earth: 1 revolution per 60 seconds, smooth
    const earthDeg = ((s + ms / 1000) / 60) * 360;
    const earthEl = document.getElementById('sn-earth');
    if (earthEl) {
      earthEl.setAttribute('transform', `translate(290, 290) rotate(${earthDeg})`);
    }

    // Snoopy orbit: 1 revolution per 60 seconds, smooth
    const orbitDeg = ((s + ms / 1000) / 60) * 360;
    const orbitEl = document.getElementById('sn-orbit');
    if (orbitEl) {
      orbitEl.setAttribute('transform', `rotate(${orbitDeg} 200 200)`);
    }

    // Time
    const timeEl = document.getElementById('sn-time');
    if (timeEl) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}`;
    }
  },
};

// ── helpers ──

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
