/**
 * Poco Renderer Shim — implements the Moddable/Pebble Poco rendering API
 * on top of HTML Canvas 2D.
 *
 * This allows Pebble watch face code that uses `render.drawLine()`,
 * `render.drawCircle()`, `render.drawText()`, etc. to run unmodified
 * in a browser.
 */

export class Poco {
  constructor(canvas, width = 260, height = 260) {
    this.canvas = canvas;
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
  }

  // ── Frame bracketing ──

  begin() {
    this.ctx.save();
  }

  end() {
    this.ctx.restore();
  }

  // ── Color ──

  makeColor(r, g, b) {
    return `rgb(${r},${g},${b})`;
  }

  // ── Primitives ──

  fillRectangle(color, x, y, w, h) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawPixel(color, x, y) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 1, 1);
  }

  /**
   * drawLine(x1, y1, x2, y2, color, thickness)
   * Pebble/Alloy extension — not in base Poco, but used by the watch face.
   */
  drawLine(x1, y1, x2, y2, color, thickness = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * drawCircle(color, cx, cy, r, startDeg, endDeg)
   * Pebble/Alloy extension — draws a stroked circle arc.
   * Angles in degrees, 0 = top (3 o'clock in canvas terms).
   */
  drawCircle(color, cx, cy, r, startDeg, endDeg) {
    const ctx = this.ctx;
    // Pebble uses 0°=right, going clockwise, same as canvas default
    const startRad = (startDeg - 90) * Math.PI / 180;
    const endRad = (endDeg - 90) * Math.PI / 180;
    ctx.beginPath();
    if (startDeg === 0 && endDeg === 360) {
      ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy, Math.max(0, r), startRad, endRad);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Text ──

  /**
   * drawText(text, font, color, x, y)
   * Draws text at (x, y) where y is the top of the text bounding box.
   */
  drawText(text, font, color, x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = font._cssFont;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  getTextWidth(text, font) {
    this.ctx.font = font._cssFont;
    return this.ctx.measureText(text).width;
  }

  // ── Font ──
  // Accessed as `new render.Font(name, size)` in original code

  Font = PocoFont;
}

/**
 * Font shim — maps Pebble font names to web-safe equivalents.
 */
const FONT_MAP = {
  'Bitham-Black':     { family: "'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif", weight: '900' },
  'Gothic-Bold':      { family: "'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif", weight: '700' },
  'Roboto-Condensed': { family: "'Roboto Condensed', 'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif", weight: '400' },
  'Gothic-Regular':   { family: "'SF Pro Display', 'Helvetica Neue', Helvetica, sans-serif", weight: '400' },
};

export class PocoFont {
  constructor(name, size) {
    const mapped = FONT_MAP[name] || FONT_MAP['Gothic-Regular'];
    this.size = size;
    this.family = mapped.family;
    this.weight = mapped.weight;
    this._cssFont = `${this.weight} ${size}px ${this.family}`;
    // Approximate line height — Pebble fonts tend to be tightly spaced
    this.height = Math.round(size * 1.15);
  }
}
