import { Engine } from './lib/engine.js';
import { showAlert } from './lib/alerts.js';

import minimalAnalog from './faces/minimal-analog.js';
import pebbleDigital from './faces/pebble-digital.js';
import snoopyMoon from './faces/snoopy-moon.js';
import porthole from './faces/porthole.js';

// ── Boot ──

const engine = new Engine(
  document.getElementById('face-container'),
  document.getElementById('face-dots'),
);

engine.register(minimalAnalog);
engine.register(snoopyMoon);
engine.register(pebbleDigital);
engine.register(porthole);

engine.start();

// ── Expose alert API globally for external integrations ──
// e.g. from a webhook, Home Assistant, or the browser console:
//   window.tick.alert('Pizza is here!', { duration: 5000 })
window.tick = {
  alert: showAlert,
  engine,
  nextFace: () => engine.next(),
  prevFace: () => engine.prev(),
};

// ── Demo alert on first load ──
setTimeout(() => {
  showAlert('swipe to change faces', { duration: 3000, color: '#aaa' });
}, 1500);
