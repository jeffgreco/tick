/**
 * Face: GOES Earth
 *
 * Animates the last 24 hours of GOES-East (GOES-19) full-disk
 * GeoColor satellite imagery from NOAA's CDN.
 *
 * Images are captured every 10 minutes → ~144 frames per day.
 * Uses 1808×1808 resolution. Crossfades between frames.
 */

const CDN = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR';
const RES = '1808x1808';
const FRAME_DURATION = 180;          // ms per frame (continuous crossfade)
const SIZE = 1808;
const HOURS = 24;
const IMAGE_INTERVAL_MIN = 10;       // GOES captures every 10 min
const REFRESH_INTERVAL = 10 * 60e3;  // reload image list every 10 min

/** Convert a Date to the GOES CDN timestamp: YYYYDDDHHMM */
function toGoesTimestamp(date) {
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const doy = Math.floor((date.getTime() - start) / 864e5) + 1;
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}${String(doy).padStart(3, '0')}${hh}${mm}`;
}

/** Build an array of CDN URLs covering the last `hours` hours. */
function buildUrls(hours) {
  const urls = [];
  const now = new Date();
  now.setUTCMinutes(Math.floor(now.getUTCMinutes() / IMAGE_INTERVAL_MIN) * IMAGE_INTERVAL_MIN, 0, 0);
  const count = (hours * 60) / IMAGE_INTERVAL_MIN;
  for (let i = count; i >= 0; i--) {
    const t = new Date(now.getTime() - i * IMAGE_INTERVAL_MIN * 60e3);
    const ts = toGoesTimestamp(t);
    urls.push({
      url: `${CDN}/${ts}_GOES19-ABI-FD-GEOCOLOR-${RES}.jpg`,
      time: t,
    });
  }
  return urls;
}

/** Load a single image, resolve with it or null on failure. */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default {
  name: 'GOES Earth',

  create(el) {
    el.style.cssText = 'background:#000;position:relative;';

    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 100%; height: 100%;
      object-fit: cover;
    `;
    el.appendChild(canvas);
    this._ctx = canvas.getContext('2d');


    // Loading indicator
    const loader = document.createElement('div');
    loader.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 3vmin;
      color: rgba(255,255,255,0.5);
      z-index: 4;
      text-align: center;
    `;
    loader.textContent = 'loading satellite imagery…';
    el.appendChild(loader);
    this._loader = loader;

    // Progress ring
    const progSize = 20;
    const progSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    progSvg.setAttribute('viewBox', `0 0 ${progSize} ${progSize}`);
    progSvg.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 30vmin; height: 30vmin;
      z-index: 4;
      pointer-events: none;
    `;
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', progSize / 2);
    track.setAttribute('cy', progSize / 2);
    track.setAttribute('r', progSize / 2 - 1);
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(255,255,255,0.1)');
    track.setAttribute('stroke-width', '0.5');
    progSvg.appendChild(track);
    const prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    prog.setAttribute('cx', progSize / 2);
    prog.setAttribute('cy', progSize / 2);
    prog.setAttribute('r', progSize / 2 - 1);
    prog.setAttribute('fill', 'none');
    prog.setAttribute('stroke', 'rgba(100,180,255,0.6)');
    prog.setAttribute('stroke-width', '0.5');
    prog.setAttribute('stroke-linecap', 'round');
    prog.setAttribute('transform', `rotate(-90 ${progSize / 2} ${progSize / 2})`);
    const circumference = 2 * Math.PI * (progSize / 2 - 1);
    prog.setAttribute('stroke-dasharray', `${circumference}`);
    prog.setAttribute('stroke-dashoffset', `${circumference}`);
    progSvg.appendChild(prog);
    el.appendChild(progSvg);
    this._progSvg = progSvg;
    this._progCircle = prog;
    this._circumference = circumference;

    this._frames = [];
    this._frameIndex = 0;
    this._prevIndex = 0;
    this._cycleStart = 0;
    this._drawnIndex = -1;
    this._loadBatch();

    this._refreshTimer = setInterval(() => this._loadBatch(), REFRESH_INTERVAL);
  },

  async _loadBatch() {
    const entries = buildUrls(HOURS);
    const total = entries.length;
    let loaded = 0;

    const CONCURRENCY = 12;
    let idx = 0;
    const results = new Array(total);

    const next = async () => {
      while (idx < total) {
        const i = idx++;
        const img = await loadImage(entries[i].url);
        loaded++;
        const pct = loaded / total;
        this._progCircle.setAttribute(
          'stroke-dashoffset',
          `${this._circumference * (1 - pct)}`
        );
        this._loader.textContent = `loading satellite imagery… ${Math.round(pct * 100)}%`;
        results[i] = img ? { img, time: entries[i].time } : null;
      }
    };

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) workers.push(next());
    await Promise.all(workers);

    const frames = [];
    for (let i = 0; i < total; i++) {
      if (results[i]) frames.push(results[i]);
    }

    if (frames.length > 0) {
      this._frames = frames;
      this._frameIndex = 0;
      this._loader.style.display = 'none';
      this._progSvg.style.display = 'none';
      this._cycleStart = Date.now();
    } else {
      this._loader.textContent = 'no imagery available';
    }
  },

  update(el, now) {
    if (this._frames.length === 0) return;

    // Catch up if we fell behind (e.g. tab was backgrounded)
    while (now - this._cycleStart >= FRAME_DURATION) {
      this._frameIndex = (this._frameIndex + 1) % this._frames.length;
      this._cycleStart += FRAME_DURATION;
    }

    const alpha = (now - this._cycleStart) / FRAME_DURATION;
    const nextIndex = (this._frameIndex + 1) % this._frames.length;
    const ctx = this._ctx;

    ctx.globalAlpha = 1;
    ctx.drawImage(this._frames[this._frameIndex].img, 0, 0, SIZE, SIZE);
    ctx.globalAlpha = alpha;
    ctx.drawImage(this._frames[nextIndex].img, 0, 0, SIZE, SIZE);
    ctx.globalAlpha = 1;

  },

  destroy() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._frames = [];
  },
};
