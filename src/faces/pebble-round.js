/**
 * Face: Pebble Round
 *
 * A direct port of camr0/SimpleRoundWatchFace for Pebble Round 2,
 * running the original Moddable/Alloy drawing code through a
 * Canvas 2D shim layer. The original code targets a 260×260 round
 * display using Poco (Moddable's renderer) and Pebble watch APIs.
 *
 * Shim approach:
 *   - commodetto/Poco  → src/shims/poco.js  (Canvas 2D backend)
 *   - pebble/message   → src/shims/pebble.js (web API equivalents)
 *   - watch global      → src/shims/pebble.js
 *   - Battery/Location  → src/shims/pebble.js
 *
 * Original source: https://github.com/camr0/SimpleRoundWatchFace
 */

import { Poco } from '../shims/poco.js';
import { Watch, Battery, Location, Message } from '../shims/pebble.js';

export default {
  name: 'Pebble Round',

  create(el) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    el.appendChild(canvas);

    // Set up canvas at the original Pebble Round 2 resolution
    // and scale for the container
    const SIZE = 260;
    canvas.width = SIZE;
    canvas.height = SIZE;

    // ── Instantiate shims ──

    const render = new Poco(canvas, SIZE, SIZE);
    const watch = new Watch();

    // Store on element for cleanup
    el._pr = { render, watch, canvas };

    // ── Original code begins (adapted minimally) ──
    // Changes from original:
    //   - Removed `import` statements (shims provided above)
    //   - `screen` replaced with canvas
    //   - `new render.Font(...)` → `new Poco.Font(...)` via shim
    //   - `watch` is our shim instance, not a global
    //   - Removed Pebble-specific Battery ring & Bluetooth icon
    //     (no meaningful equivalent on web)
    //   - drawScreen is called from update() on every animation frame
    //   - Weather uses HTTPS (original used HTTP)

    const CX = render.width >> 1;    // 130
    const CY = render.height >> 1;   // 130
    const R  = 118;                   // clock face outer radius

    // ── Settings (defaults, no Clay on web) ──
    const settings = {
      darkMode:        true,   // dark mode fits tick's aesthetic
      useFahrenheit:   true,
      use24Hour:       false,
      showDigitalTime: true,
      showDate:        true,
      showWeather:     true,
      showBattery:     false,
      showBatteryLowOnly: false,
      showBluetooth:   false,
      showDisconnectedBluetooth: false,
    };

    // ── Theme colors ──
    const red    = render.makeColor(210, 45,  45);
    const yellow = render.makeColor(230, 185, 0);

    let bg, fg, fgDim, tempColor, weatherIconColor;

    function updateColors() {
      const dark = settings.darkMode;
      bg        = dark ? render.makeColor(0,   0,   0)   : render.makeColor(255, 255, 255);
      fg        = dark ? render.makeColor(255, 255, 255) : render.makeColor(0,   0,   0);
      fgDim     = dark ? render.makeColor(90,  90,  90)  : render.makeColor(160, 160, 160);
      weatherIconColor = dark ? render.makeColor(165, 165, 165) : render.makeColor(80, 80, 80);
      tempColor = dark ? render.makeColor(100, 180, 255) : render.makeColor(0,   110, 210);
    }
    updateColors();

    // ── Fonts ──
    const Font = render.Font;
    const timeFont  = new Font('Bitham-Black',     30);
    const numFont   = new Font('Gothic-Bold',      28);
    const smallFont = new Font('Roboto-Condensed', 21);

    const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];

    // ── State ──
    let weatherTemp = null;
    let weatherCode = -1;
    let lastLatitude = null;
    let lastLongitude = null;
    let fetching = false;

    // ── Geometry helper ──
    function pt(angle, r) {
      return [
        (CX + r * Math.sin(angle)) | 0,
        (CY - r * Math.cos(angle)) | 0
      ];
    }

    // ─── Weather icons ──────────────────────────────────────────────

    function drawSun(x, y, r, color) {
      render.drawCircle(color, x, y, r,     0, 360);
      render.drawCircle(color, x, y, r - 1, 0, 360);
      render.drawCircle(color, x, y, r - 2, 0, 360);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        render.drawLine(
          (x + (r + 2) * Math.sin(a)) | 0, (y - (r + 2) * Math.cos(a)) | 0,
          (x + (r + 7) * Math.sin(a)) | 0, (y - (r + 7) * Math.cos(a)) | 0,
          color, 2);
      }
      for (let i = 0; i < 4; i++) {
        const a = ((i + 0.5) / 4) * Math.PI * 2;
        render.drawLine(
          (x + (r + 2) * Math.sin(a)) | 0, (y - (r + 2) * Math.cos(a)) | 0,
          (x + (r + 5) * Math.sin(a)) | 0, (y - (r + 5) * Math.cos(a)) | 0,
          color, 2);
      }
    }

    function drawCloud(x, y, color) {
      render.drawCircle(color, x - 5, y + 3, 7, 0, 360);
      render.drawCircle(color, x + 5, y + 3, 7, 0, 360);
      render.drawCircle(color, x,     y - 2, 6, 0, 360);
    }

    function drawSnowflake(x, y, color) {
      render.drawLine(x - 9, y,     x + 9, y,     color, 2);
      render.drawLine(x,     y - 9, x,     y + 9, color, 2);
      render.drawLine(x - 6, y - 6, x + 6, y + 6, color, 2);
      render.drawLine(x + 6, y - 6, x - 6, y + 6, color, 2);
      render.drawCircle(color, x, y, 2, 0, 360);
    }

    function drawWeatherIcon(x, y, code) {
      if (code < 0) return;
      if (code === 0) {
        drawSun(x, y, 7, yellow);
      } else if (code <= 2) {
        drawSun(x + 4, y - 5, 5, yellow);
        drawCloud(x - 2, y + 4, weatherIconColor);
      } else if (code <= 44) {
        drawCloud(x, y, weatherIconColor);
      } else if (code <= 48) {
        drawCloud(x, y - 4, weatherIconColor);
        render.drawLine(x - 9, y + 8,  x + 9, y + 8,  weatherIconColor, 2);
        render.drawLine(x - 7, y + 13, x + 7, y + 13, fgDim, 2);
      } else if (code <= 67) {
        drawCloud(x, y - 6, weatherIconColor);
        const drops = code <= 55 ? 2 : 3;
        for (let i = 0; i < drops; i++) {
          const dx = x - 5 + i * 5;
          render.drawLine(dx, y + 5, dx - 3, y + 13, tempColor, 2);
        }
      } else if (code <= 77) {
        drawSnowflake(x, y, weatherIconColor);
      } else if (code <= 86) {
        drawCloud(x, y - 7, weatherIconColor);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          render.drawLine(x, y + 7,
            (x + 7 * Math.sin(a)) | 0, (y + 7 - 7 * Math.cos(a)) | 0,
            weatherIconColor, 2);
        }
      } else {
        drawCloud(x, y - 7, weatherIconColor);
        render.drawLine(x + 4, y + 4,  x - 2, y + 12, yellow, 3);
        render.drawLine(x - 2, y + 12, x + 4, y + 20, yellow, 3);
      }
    }

    // ─── Clock face ─────────────────────────────────────────────────

    const CLOCK_NUMS = new Map([[0, '12'], [15, '3'], [30, '6'], [45, '9']]);

    function drawFace() {
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const label = CLOCK_NUMS.get(i);

        if (label !== undefined) {
          const nr = R - 20;
          const nx = (CX + nr * Math.sin(a)) | 0;
          const ny = (CY - nr * Math.cos(a)) | 0;
          const w  = render.getTextWidth(label, numFont);
          render.drawText(label, numFont, fg,
            nx - (w >> 1),
            ny - (numFont.height >> 1));
        } else if (i % 5 === 0) {
          const [x1, y1] = pt(a, R - 14);
          const [x2, y2] = pt(a, R - 2);
          render.drawLine(x1, y1, x2, y2, fg, 3);
        } else {
          const [x1, y1] = pt(a, R - 7);
          const [x2, y2] = pt(a, R - 2);
          render.drawLine(x1, y1, x2, y2, fgDim, 1);
        }
      }
    }

    // ─── Hands ──────────────────────────────────────────────────────

    function drawHand(angle, tipLen, tailLen, color, thickness) {
      const [x1, y1] = pt(angle + Math.PI, tailLen);
      const [x2, y2] = pt(angle, tipLen);
      render.drawLine(x1, y1, x2, y2, color, thickness);
    }

    // ─── Info panel ─────────────────────────────────────────────────

    function drawInfo(now) {
      const hr = now.getHours();
      const mn = now.getMinutes();

      let timeStr;
      if (settings.use24Hour) {
        timeStr = `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
      } else {
        timeStr = `${hr % 12 || 12}:${String(mn).padStart(2, '0')}`;
      }

      const timeY = CY - 65;
      let textY = timeY;

      if (settings.showDigitalTime) {
        const timeTW = render.getTextWidth(timeStr, timeFont);
        render.drawText(timeStr, timeFont, fg, (render.width - timeTW) >> 1, textY);
        textY += timeFont.height + 4;
      }

      if (settings.showDate) {
        const dateStr = `${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}`;
        const dw = render.getTextWidth(dateStr, smallFont);
        render.drawText(dateStr, smallFont, fg, (render.width - dw) >> 1, textY);
      }

      if (settings.showWeather) {
        const iconY = CY + 34;
        drawWeatherIcon(CX, iconY, weatherCode);

        const unit = settings.useFahrenheit ? 'F' : 'C';
        const tempStr = weatherTemp !== null ? `${weatherTemp}°${unit}` : '--°';
        const tw2 = render.getTextWidth(tempStr, smallFont);
        render.drawText(tempStr, smallFont, tempColor, (render.width - tw2) >> 1, iconY + 16);
      }
    }

    // ─── Main draw ──────────────────────────────────────────────────

    function drawScreen(now) {
      const hr = now.getHours() % 12;
      const mn = now.getMinutes();
      const hourAngle   = ((hr + mn / 60) / 12) * Math.PI * 2;
      const minuteAngle = (mn / 60) * Math.PI * 2;

      render.begin();
      render.fillRectangle(bg, 0, 0, render.width, render.height);

      // Clip to circle (the original runs on a round display)
      const ctx = render.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, CX, 0, Math.PI * 2);
      ctx.clip();

      drawFace();
      drawInfo(now);

      // Center cap
      render.drawCircle(fgDim, CX, CY, 8, 0, 360);
      render.drawCircle(red,   CX, CY, 6, 0, 360);
      render.drawCircle(bg,    CX, CY, 3, 0, 360);
      // Fill center cap
      ctx.beginPath();
      ctx.arc(CX, CY, 3, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      drawHand(minuteAngle, 95, 12, fg, 3);
      drawHand(hourAngle,   62, 18, fg, 5);

      // Red tip on hour hand
      const [tipX, tipY] = pt(hourAngle, 62);
      const [midX, midY] = pt(hourAngle, 47);
      render.drawLine(midX, midY, tipX, tipY, red, 5);

      ctx.restore();
      render.end();
    }

    // ─── Weather ────────────────────────────────────────────────────

    async function fetchWeather(lat, lon) {
      if (fetching) return;
      fetching = true;
      try {
        const unit = settings.useFahrenheit ? 'fahrenheit' : 'celsius';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${unit}`;
        const response = await fetch(url);
        const data = await response.json();
        weatherTemp = Math.round(data.current.temperature_2m);
        weatherCode = data.current.weather_code;
      } catch (e) {
        console.log('Pebble Round weather error:', e);
      } finally {
        fetching = false;
      }
    }

    function requestLocation() {
      if (!settings.showWeather) return;
      const loc = new Location({
        onSample() {
          const s = this.sample();
          lastLatitude = s.latitude;
          lastLongitude = s.longitude;
          fetchWeather(s.latitude, s.longitude);
          this.close();
        }
      });
    }

    // ─── Watch events (via shim) ────────────────────────────────────

    watch.addEventListener('hourchange', () => {
      // Refresh weather every hour
      if (lastLatitude !== null) {
        fetchWeather(lastLatitude, lastLongitude);
      } else {
        requestLocation();
      }
    });

    // Initial weather fetch
    requestLocation();

    // Store drawScreen for use in update()
    el._pr.drawScreen = drawScreen;
  },

  update(el) {
    if (el._pr && el._pr.drawScreen) {
      el._pr.drawScreen(new Date());
    }
  },

  destroy(el) {
    if (el._pr) {
      if (el._pr.watch) el._pr.watch.destroy();
      el._pr = null;
    }
  },
};
