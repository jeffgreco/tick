/**
 * Pebble API Shims — implements watch, Battery, Location, and Message APIs
 * using web platform equivalents.
 *
 * watch.addEventListener('minutechange', cb) → setInterval checking clock
 * Battery  → navigator.getBattery() or stub
 * Location → navigator.geolocation
 * Message  → no-op (settings come from phone companion, not applicable on web)
 */

// ── Watch global ──

export class Watch {
  constructor() {
    this._listeners = {};
    this._lastMinute = -1;
    this._lastHour = -1;
    this.connected = { app: true };

    // Poll every second for minute/hour changes
    this._interval = setInterval(() => this._tick(), 1000);
    this._tick();
  }

  addEventListener(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    const cbs = this._listeners[event];
    if (cbs) cbs.forEach(cb => cb(data));
  }

  _tick() {
    const now = new Date();
    const min = now.getMinutes();
    const hr = now.getHours();

    if (min !== this._lastMinute) {
      this._lastMinute = min;
      this._emit('minutechange', { date: now });
    }
    if (hr !== this._lastHour) {
      this._lastHour = hr;
      this._emit('hourchange', { date: now });
    }
  }

  destroy() {
    clearInterval(this._interval);
  }
}

// ── Battery ──

export class Battery {
  constructor(opts = {}) {
    this._percent = 100;
    this._onSample = opts.onSample;

    // Try Web Battery API
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        this._percent = Math.round(bat.level * 100);
        bat.addEventListener('levelchange', () => {
          this._percent = Math.round(bat.level * 100);
          if (this._onSample) this._onSample.call(this);
        });
      }).catch(() => {});
    }
  }

  sample() {
    return { percent: this._percent };
  }
}

// ── Location ──

export class Location {
  constructor(opts = {}) {
    this._onSample = opts.onSample;
    this._closed = false;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (this._closed) return;
          this._lat = pos.coords.latitude;
          this._lon = pos.coords.longitude;
          if (this._onSample) this._onSample.call(this);
        },
        () => {
          // Fallback: try IP geolocation
          this._ipFallback();
        },
        { timeout: 10000 }
      );
    } else {
      this._ipFallback();
    }
  }

  async _ipFallback() {
    if (this._closed) return;
    try {
      const r = await fetch('https://ipapi.co/json/');
      const d = await r.json();
      this._lat = d.latitude;
      this._lon = d.longitude;
    } catch {
      // Default to NYC
      this._lat = 40.71;
      this._lon = -74.01;
    }
    if (!this._closed && this._onSample) this._onSample.call(this);
  }

  sample() {
    return { latitude: this._lat, longitude: this._lon };
  }

  close() {
    this._closed = true;
  }
}

// ── Message (no-op on web) ──

export class Message {
  constructor(opts = {}) {
    // Settings via Clay/AppMessage don't apply on web — no-op
    this._onReadable = opts.onReadable;
  }

  read() {
    return null;
  }
}
