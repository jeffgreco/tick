/**
 * Face: Literature Clock
 *
 * Displays literary quotes that mention the current time, sourced from
 * https://github.com/JohannesNE/literature-clock
 * A new quote appears each minute with the time reference highlighted.
 */

const BASE_URL =
  'https://raw.githubusercontent.com/JohannesNE/literature-clock/master/docs/times';

// ── State ──
let cache = {};
let activeQuote = null;
let fetching = false;
let fetchFailed = false;
let lastMinute = -1;

// ── Helpers ──

function pad(n) {
  return String(n).padStart(2, '0');
}

function pickQuote(quotes) {
  if (!quotes || quotes.length === 0) return null;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

async function fetchQuotes(h, m) {
  const key = `${pad(h)}_${pad(m)}`;
  if (cache[key] !== undefined) return pickQuote(cache[key]);
  if (fetching) return null;
  fetching = true;
  try {
    const res = await fetch(`${BASE_URL}/${key}.json`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const sfw = data.filter((q) => q.sfw === 'yes');
    cache[key] = sfw.length > 0 ? sfw : null;
    fetchFailed = false;
    return pickQuote(cache[key]);
  } catch {
    fetchFailed = true;
    return null;
  } finally {
    fetching = false;
  }
}

function adjustFontSize(quoteEl) {
  const sizes = ['4vmin', '3.4vmin', '2.9vmin'];
  const parent = quoteEl.parentElement;
  for (const size of sizes) {
    quoteEl.style.fontSize = size;
    if (quoteEl.scrollHeight <= parent.clientHeight * 0.75) return;
  }
  quoteEl.style.fontSize = '2.9vmin';
}

function renderQuote(quote) {
  const quoteEl = document.getElementById('lc-quote');
  const titleEl = document.getElementById('lc-title');
  const authorEl = document.getElementById('lc-author');
  const wrapEl = document.getElementById('lc-wrap');
  const fallbackEl = document.getElementById('lc-fallback');
  if (!quoteEl) return;

  if (!quote) {
    wrapEl.style.display = 'none';
    fallbackEl.style.display = 'block';
    fallbackEl.textContent = fetchFailed
      ? 'the words will come\u2026'
      : 'no quote for this minute';
    return;
  }

  wrapEl.style.display = 'flex';
  fallbackEl.style.display = 'none';

  const first = quote.quote_first || '';
  const time = quote.quote_time_case || '';
  const last = quote.quote_last || '';

  quoteEl.innerHTML = `${first}<span style="color:#e8c170;font-weight:600;white-space:nowrap;">${time}</span>${last}`;

  titleEl.textContent = quote.title;
  authorEl.textContent = `\u2014 ${quote.author}`;

  // Trigger fade-in
  wrapEl.style.animation = 'none';
  wrapEl.offsetHeight; // force reflow
  wrapEl.style.animation = 'lc-fade-in 0.8s ease-out';

  adjustFontSize(quoteEl);
}

// ── Face ──

export default {
  name: 'Literature Clock',

  create(el) {
    el.style.cssText = `
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    `;

    if (!document.getElementById('lc-keyframes')) {
      const style = document.createElement('style');
      style.id = 'lc-keyframes';
      style.textContent = `
        @keyframes lc-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    el.innerHTML = `
      <div id="lc-wrap" style="
        width: 68%;
        max-height: 68%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 2.5vmin;
        padding: 2vmin;
        overflow: hidden;
      ">
        <div id="lc-quote" style="
          font-family: 'Georgia', 'Times New Roman', 'Iowan Old Style', serif;
          font-size: 4vmin;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.85);
          white-space: pre-line;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 8;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        "></div>
        <div id="lc-sep" style="
          width: 20%;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
        "></div>
        <div id="lc-attr" style="
          font-family: 'SF Pro Display', -apple-system, Helvetica, sans-serif;
          font-size: 3vmin;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.45);
          max-width: 90%;
          flex-shrink: 0;
        ">
          <div id="lc-title" style="font-style: italic;"></div>
          <div id="lc-author" style="margin-top: 0.4vmin;"></div>
        </div>
      </div>
      <div id="lc-fallback" style="
        display: none;
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Georgia', serif;
        font-size: 4vmin;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        width: 60%;
      "></div>
    `;

    // Eagerly fetch the current minute
    const now = new Date();
    fetchQuotes(now.getHours(), now.getMinutes()).then((q) => {
      if (q) {
        activeQuote = q;
        renderQuote(q);
        lastMinute = now.getHours() * 60 + now.getMinutes();
      }
    });
  },

  update(el, now) {
    const d = new Date(now);
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    const minuteKey = h * 60 + m;

    // Prefetch next minute 5s early
    if (s >= 55) {
      const nextM = (m + 1) % 60;
      const nextH = m === 59 ? (h + 1) % 24 : h;
      const nk = `${pad(nextH)}_${pad(nextM)}`;
      if (cache[nk] === undefined && !fetching) {
        fetchQuotes(nextH, nextM);
      }
    }

    if (minuteKey === lastMinute) return;
    lastMinute = minuteKey;

    fetchQuotes(h, m).then((quote) => {
      if (quote) {
        activeQuote = quote;
        renderQuote(quote);
      } else if (!activeQuote) {
        renderQuote(null);
      }
    });
  },

  destroy() {
    cache = {};
    activeQuote = null;
    lastMinute = -1;
    fetching = false;
    fetchFailed = false;
  },
};
