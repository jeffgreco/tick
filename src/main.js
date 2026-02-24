import { Engine } from './lib/engine.js';
import { showAlert } from './lib/alerts.js';

import minimalAnalog from './faces/minimal-analog.js';
import pebbleDigital from './faces/pebble-digital.js';
import snoopyMoon from './faces/snoopy-moon.js';
import porthole from './faces/porthole.js';
import matrixRain from './faces/matrix-rain.js';
import radarSweep from './faces/radar-sweep.js';
import nixieTube from './faces/nixie-tube.js';
import wordClock from './faces/word-clock.js';
import literatureClock from './faces/literature-clock.js';
import orrery from './faces/orrery.js';
import tourbillon from './faces/tourbillon.js';
import goesEarth from './faces/goes-earth.js';
import girardPerregaux from './faces/girard-perregaux.js';
import movadoChronograph from './faces/movado-chronograph.js';
import weather from './faces/weather.js';
import mad1 from './faces/mad1.js';
import pebbleRound from './faces/pebble-round.js';

// ── Boot ──

const engine = new Engine(
  document.getElementById('face-container'),
  document.getElementById('face-dots'),
);

engine.register(minimalAnalog);
engine.register(snoopyMoon);
engine.register(pebbleDigital);
engine.register(matrixRain);
engine.register(radarSweep);
engine.register(nixieTube);
engine.register(wordClock);
engine.register(literatureClock);
engine.register(orrery);
engine.register(tourbillon);
engine.register(goesEarth);
engine.register(girardPerregaux);
engine.register(movadoChronograph);
engine.register(weather);
engine.register(porthole);
engine.register(pebbleRound);
engine.register(mad1);

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

