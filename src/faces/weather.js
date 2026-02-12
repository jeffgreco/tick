/**
 * Face: Weather
 *
 * Analog clock with hourly weather forecast icons at each hour position.
 * Uses Open-Meteo free API (no API key required).
 * Day hours show sun/cloud icons, night hours show moon phase.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const C = {
  bg:       '#0a0a0a',
  tick:     '#d0d0d0',
  tickDot:  'rgba(255,255,255,0.25)',
  hand:     '#b0b0b0',
  second:   '#5b8fb9',
  date:     '#5b8fb9',
  sun:      '#d4a574',
  moonLit:  '#8a9db0',
  moonDark: '#1e2830',
  cloud:    '#808080',
  rain:     '#6ba3d6',
  snow:     '#b8d4e8',
  bolt:     '#f0c040',
  fog:      '#777',
};

let weatherData = null;
let lastFetch = 0;
let coords = null;
let lastIconKey = '';
let fetchFailed = false;

const FETCH_MS = 30 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

export default {
  name: 'Weather',

  create(el) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.style.cssText = 'width:100%;height:100%;display:block;';

    svg.appendChild(disc(200, 200, 200, C.bg));

    // Tick marks
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 - 90) * Math.PI / 180;
      if (i % 5 === 0) {
        svg.appendChild(ln(
          200 + Math.cos(a) * 182, 200 + Math.sin(a) * 182,
          200 + Math.cos(a) * 193, 200 + Math.sin(a) * 193,
          C.tick, 2
        ));
      } else {
        svg.appendChild(disc(
          200 + Math.cos(a) * 189,
          200 + Math.sin(a) * 189,
          0.7, C.tickDot
        ));
      }
    }

    // Weather icon layer
    const g = document.createElementNS(SVG_NS, 'g');
    g.id = 'wf-icons';
    svg.appendChild(g);

    // Date circle
    const dc = document.createElementNS(SVG_NS, 'circle');
    dc.setAttribute('cx', 250);
    dc.setAttribute('cy', 200);
    dc.setAttribute('r', 15);
    dc.setAttribute('fill', 'none');
    dc.setAttribute('stroke', C.date);
    dc.setAttribute('stroke-width', 1.5);
    svg.appendChild(dc);

    const dt = document.createElementNS(SVG_NS, 'text');
    dt.id = 'wf-date';
    dt.setAttribute('x', 250);
    dt.setAttribute('y', 205.5);
    dt.setAttribute('text-anchor', 'middle');
    dt.setAttribute('fill', C.date);
    dt.setAttribute('font-size', '14');
    dt.setAttribute('font-weight', '600');
    dt.setAttribute('font-family', 'SF Pro Display, -apple-system, Helvetica, sans-serif');
    svg.appendChild(dt);

    // Hands
    svg.appendChild(mkHand('wf-h', 4, C.hand, 95));
    svg.appendChild(mkHand('wf-m', 2.5, C.hand, 140));
    svg.appendChild(mkHand('wf-s', 1.2, C.second, 155));

    // Center cap
    svg.appendChild(disc(200, 200, 5, '#222'));
    svg.appendChild(disc(200, 200, 2.5, C.second));

    el.appendChild(svg);
    initLocation();
  },

  update(el) {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    rot('wf-h', (h + m / 60) * 30);
    rot('wf-m', (m + s / 60) * 6);
    rot('wf-s', (s + ms / 1000) * 6);

    const d = document.getElementById('wf-date');
    if (d) d.textContent = now.getDate();

    const iv = fetchFailed ? RETRY_MS : FETCH_MS;
    if (coords && Date.now() - lastFetch > iv) fetchWeather();

    const key = `${now.getHours()}-${weatherData ? 'w' : 'n'}`;
    if (key !== lastIconKey) {
      lastIconKey = key;
      renderIcons(now);
    }
  },
};

// ── Location & Weather ──

async function initLocation() {
  try {
    const pos = await new Promise((res, rej) => {
      if (!navigator.geolocation) return rej();
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
    });
    coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    try {
      const r = await fetch('https://ipapi.co/json/');
      const d = await r.json();
      coords = { lat: d.latitude, lon: d.longitude };
    } catch {
      coords = { lat: 40.71, lon: -74.01 };
    }
  }
  fetchWeather();
}

async function fetchWeather() {
  if (!coords) return;
  lastFetch = Date.now();
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=weather_code,is_day&timezone=auto&forecast_days=2`;
    const r = await fetch(u);
    const d = await r.json();
    weatherData = d.hourly;
    fetchFailed = false;
    lastIconKey = '';
  } catch {
    fetchFailed = true;
  }
}

// ── Moon Phase ──

function getMoonPhase(date) {
  const ref = new Date(2000, 0, 6, 18, 14);
  const days = (date - ref) / 86400000;
  const cycle = 29.53058770576;
  return (((days % cycle) + cycle) % cycle) / cycle;
}

// ── Icon Rendering ──

function renderIcons(now) {
  const el = document.getElementById('wf-icons');
  if (!el) return;
  el.innerHTML = '';

  const curHour = now.getHours();
  const phase = getMoonPhase(now);
  const R = 150;

  // Find current hour index in API data
  let apiBase = -1;
  if (weatherData && weatherData.time) {
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dy = String(now.getDate()).padStart(2, '0');
    const hr = String(curHour).padStart(2, '0');
    apiBase = weatherData.time.indexOf(`${y}-${mo}-${dy}T${hr}:00`);
  }

  for (let pos = 0; pos < 12; pos++) {
    const angle = (pos * 30 - 90) * Math.PI / 180;
    const cx = 200 + Math.cos(angle) * R;
    const cy = 200 + Math.sin(angle) * R;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${cx},${cy})`);

    // Hours ahead of current time for this dial position
    const stepsAhead = ((pos - (curHour % 12)) + 12) % 12;

    let icon;
    if (apiBase >= 0 && apiBase + stepsAhead < weatherData.weather_code.length) {
      const idx = apiBase + stepsAhead;
      icon = wmoToType(weatherData.weather_code[idx], weatherData.is_day[idx]);
    } else {
      const h24 = (curHour + stepsAhead) % 24;
      icon = (h24 >= 6 && h24 < 20) ? 'sun' : 'moon';
    }

    drawIcon(g, icon, phase);
    el.appendChild(g);
  }
}

function wmoToType(code, isDay) {
  if (code <= 1) return isDay ? 'sun' : 'moon';
  if (code === 2) return isDay ? 'sun_cloud' : 'moon_cloud';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
  if (code >= 95) return 'thunder';
  return isDay ? 'sun' : 'moon';
}

function drawIcon(g, type, phase) {
  const r = 13;
  switch (type) {
    case 'sun':        return iconSun(g, r);
    case 'moon':       return iconMoon(g, phase, r);
    case 'sun_cloud':  return iconSunCloud(g, r);
    case 'moon_cloud': return iconMoonCloud(g, phase, r);
    case 'cloud':      return iconCloud(g, 0, 0, r * 0.85);
    case 'fog':        return iconFog(g, r);
    case 'drizzle':    return iconDrizzle(g, r);
    case 'rain':       return iconRain(g, r);
    case 'snow':       return iconSnow(g, r);
    case 'thunder':    return iconThunder(g, r);
  }
}

// ── Icon Drawing ──

function iconSun(g, r) {
  const body = r * 0.38;
  const ri = r * 0.55;
  const ro = r * 0.85;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.appendChild(ln(
      Math.cos(a) * ri, Math.sin(a) * ri,
      Math.cos(a) * ro, Math.sin(a) * ro,
      C.sun, 1.5
    ));
  }
  g.appendChild(disc(0, 0, body, C.sun));
}

function iconMoon(g, phase, r) {
  const mr = r * 0.6;
  g.appendChild(disc(0, 0, mr + 0.5, C.moonDark));

  if (phase < 0.03 || phase > 0.97) return;
  if (phase > 0.47 && phase < 0.53) {
    g.appendChild(disc(0, 0, mr, C.moonLit));
    return;
  }

  let illum, wax;
  if (phase <= 0.5) { illum = phase * 2; wax = true; }
  else { illum = (1 - phase) * 2; wax = false; }

  const tx = Math.max(0.01, mr * Math.abs(Math.cos(illum * Math.PI)));
  let d;
  if (wax) {
    d = `M0 ${-mr}A${mr} ${mr} 0 0 1 0 ${mr}`;
    d += illum <= 0.5
      ? `A${tx} ${mr} 0 0 0 0 ${-mr}Z`
      : `A${tx} ${mr} 0 0 1 0 ${-mr}Z`;
  } else {
    d = `M0 ${-mr}A${mr} ${mr} 0 0 0 0 ${mr}`;
    d += illum <= 0.5
      ? `A${tx} ${mr} 0 0 1 0 ${-mr}Z`
      : `A${tx} ${mr} 0 0 0 0 ${-mr}Z`;
  }

  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', C.moonLit);
  g.appendChild(p);
}

function iconCloud(g, ox, oy, r) {
  const s = r / 10;
  g.appendChild(disc(ox - 3 * s, oy + 1 * s, 4 * s, C.cloud));
  g.appendChild(disc(ox + 3 * s, oy + 1 * s, 3.5 * s, C.cloud));
  g.appendChild(disc(ox, oy - 2 * s, 3.5 * s, C.cloud));
  g.appendChild(disc(ox + 1 * s, oy + 0.5 * s, 3.5 * s, C.cloud));
}

function iconSunCloud(g, r) {
  const sx = r * 0.3, sy = -r * 0.35;
  const sr = r * 0.25;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.appendChild(ln(
      sx + Math.cos(a) * sr * 1.3, sy + Math.sin(a) * sr * 1.3,
      sx + Math.cos(a) * sr * 2.2, sy + Math.sin(a) * sr * 2.2,
      C.sun, 1
    ));
  }
  g.appendChild(disc(sx, sy, sr, C.sun));
  iconCloud(g, -r * 0.1, r * 0.15, r * 0.7);
}

function iconMoonCloud(g, phase, r) {
  g.appendChild(disc(r * 0.3, -r * 0.35, r * 0.28, C.moonLit));
  g.appendChild(disc(r * 0.42, -r * 0.4, r * 0.24, C.bg));
  iconCloud(g, -r * 0.1, r * 0.15, r * 0.7);
}

function iconRain(g, r) {
  iconCloud(g, 0, -r * 0.2, r * 0.7);
  for (let i = -1; i <= 1; i++) {
    g.appendChild(ln(
      i * r * 0.28, r * 0.35,
      i * r * 0.28 - r * 0.08, r * 0.6,
      C.rain, 1.2
    ));
  }
}

function iconDrizzle(g, r) {
  iconCloud(g, 0, -r * 0.2, r * 0.7);
  g.appendChild(disc(-r * 0.2, r * 0.4, 1, C.rain));
  g.appendChild(disc(r * 0.1, r * 0.5, 1, C.rain));
  g.appendChild(disc(r * 0.2, r * 0.35, 1, C.rain));
}

function iconSnow(g, r) {
  iconCloud(g, 0, -r * 0.2, r * 0.7);
  g.appendChild(disc(-r * 0.25, r * 0.38, 1.3, C.snow));
  g.appendChild(disc(r * 0.05, r * 0.5, 1.3, C.snow));
  g.appendChild(disc(r * 0.28, r * 0.35, 1.3, C.snow));
}

function iconThunder(g, r) {
  iconCloud(g, 0, -r * 0.25, r * 0.7);
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d',
    `M${r * 0.05} ${r * 0.15}L${-r * 0.1} ${r * 0.45}L${r * 0.05} ${r * 0.4}L${-r * 0.05} ${r * 0.7}`
  );
  bolt.setAttribute('fill', 'none');
  bolt.setAttribute('stroke', C.bolt);
  bolt.setAttribute('stroke-width', 1.5);
  bolt.setAttribute('stroke-linecap', 'round');
  bolt.setAttribute('stroke-linejoin', 'round');
  g.appendChild(bolt);
}

function iconFog(g, r) {
  for (let i = -1; i <= 1; i++) {
    g.appendChild(ln(-r * 0.6, i * r * 0.32, r * 0.6, i * r * 0.32, C.fog, 1.5));
  }
}

// ── SVG Helpers ──

function disc(cx, cy, r, fill) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

function ln(x1, y1, x2, y2, stroke, width) {
  const l = document.createElementNS(SVG_NS, 'line');
  l.setAttribute('x1', x1);
  l.setAttribute('y1', y1);
  l.setAttribute('x2', x2);
  l.setAttribute('y2', y2);
  l.setAttribute('stroke', stroke);
  l.setAttribute('stroke-width', width);
  l.setAttribute('stroke-linecap', 'round');
  return l;
}

function mkHand(id, w, color, len) {
  const l = document.createElementNS(SVG_NS, 'line');
  l.id = id;
  l.setAttribute('x1', 200);
  l.setAttribute('y1', 200);
  l.setAttribute('x2', 200);
  l.setAttribute('y2', 200 - len);
  l.setAttribute('stroke', color);
  l.setAttribute('stroke-width', w);
  l.setAttribute('stroke-linecap', 'round');
  l.setAttribute('transform', 'rotate(0 200 200)');
  return l;
}

function rot(id, deg) {
  const e = document.getElementById(id);
  if (e) e.setAttribute('transform', `rotate(${deg} 200 200)`);
}
