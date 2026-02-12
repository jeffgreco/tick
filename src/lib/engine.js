/**
 * Face engine — manages face lifecycle, swipe navigation, and the render loop.
 */

const SWIPE_THRESHOLD = 30; // px

export class Engine {
  /** @type {HTMLElement} */
  container;

  /** @type {Array<{name: string, create: Function, update: Function, destroy?: Function}>} */
  faces = [];

  currentIndex = 0;

  /** @type {number|null} */
  rafId = null;

  constructor(containerEl, dotsEl) {
    this.container = containerEl;
    this.dotsEl = dotsEl;
    this._bindTouch();
    this._bindKeys();
  }

  /** Register a face module */
  register(face) {
    this.faces.push(face);
  }

  /** Initialize all faces, render dots, start loop */
  start() {
    // create face DOM for each registered face
    this.faces.forEach((face) => {
      const el = document.createElement('div');
      el.classList.add('face');
      this.container.appendChild(el);
      face._el = el;
      face.create(el);
    });

    this._renderDots();
    this._goTo(0, false);
    this._loop();
  }

  // ── Navigation ──

  _goTo(index, animate = true) {
    this.currentIndex = Math.max(0, Math.min(index, this.faces.length - 1));

    if (!animate) {
      this.container.style.transition = 'none';
      // force reflow
      this.container.offsetHeight;
    }

    this.container.style.transform = `translateX(-${this.currentIndex * 100}%)`;

    if (!animate) {
      // restore transition on next frame
      requestAnimationFrame(() => {
        this.container.style.transition = '';
      });
    }

    this._renderDots();
  }

  next() {
    if (this.currentIndex < this.faces.length - 1) this._goTo(this.currentIndex + 1);
  }

  prev() {
    if (this.currentIndex > 0) this._goTo(this.currentIndex - 1);
  }

  // ── Dots ──

  _renderDots() {
    this.dotsEl.innerHTML = '';
    this.faces.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (i === this.currentIndex) dot.classList.add('active');
      this.dotsEl.appendChild(dot);
    });
  }

  // ── Touch / pointer handling ──

  _bindTouch() {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onStart = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      tracking = true;
    };

    const onEnd = (e) => {
      if (!tracking) return;
      tracking = false;
      const pt = e.changedTouches ? e.changedTouches[0] : e;
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;

      // only count horizontal swipes (ignore vertical gestures)
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) this.next();
        else this.prev();
      }
    };

    const vp = this.container.parentElement; // #viewport
    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchend', onEnd, { passive: true });
    vp.addEventListener('mousedown', onStart);
    vp.addEventListener('mouseup', onEnd);
  }

  // ── Keyboard handling ──

  _bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.prev();
    });
  }

  // ── Render loop ──

  _loop() {
    const now = Date.now();
    // only update the currently visible face (save CPU)
    const face = this.faces[this.currentIndex];
    if (face && face.update) {
      face.update(face._el, now);
    }
    this.rafId = requestAnimationFrame(() => this._loop());
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.faces.forEach((f) => f.destroy && f.destroy(f._el));
  }
}
