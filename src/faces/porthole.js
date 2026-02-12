/**
 * Face: Porthole
 *
 * Plays looping video through a submarine/spaceship porthole frame.
 * Falls back to an animated CSS scene if no video is available.
 *
 * Drop .mp4 or .webm files into public/videos/ and list them below.
 * The face cycles through them on tap.
 */

const VIDEOS = [
  // Add your videos here, e.g.:
  // '/videos/fish-tank.mp4',
  // '/videos/space-flyby.webm',
];

export default {
  name: 'Porthole',

  create(el) {
    el.style.cssText = 'background:#000;position:relative;';

    if (VIDEOS.length > 0) {
      this._createVideoMode(el);
    } else {
      this._createFallback(el);
    }

    this._createFrame(el);
  },

  /** Looping video player */
  _createVideoMode(el) {
    const video = document.createElement('video');
    video.id = 'ph-video';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      min-width: 100%; min-height: 100%;
      object-fit: cover;
    `;
    video.src = VIDEOS[0];
    el.appendChild(video);

    // Cycle videos on tap
    let idx = 0;
    el.addEventListener('click', () => {
      idx = (idx + 1) % VIDEOS.length;
      video.src = VIDEOS[idx];
      video.play();
    });
  },

  /** Animated underwater / space fallback scene */
  _createFallback(el) {
    const scene = document.createElement('div');
    scene.id = 'ph-scene';
    scene.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, #0a2a4a 0%, #051525 40%, #020c15 100%);
      overflow: hidden;
    `;

    // Floating particles (bubbles / stars)
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      const size = 2 + Math.random() * 6;
      const x = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 6 + Math.random() * 8;
      p.style.cssText = `
        position: absolute;
        bottom: -10%;
        left: ${x}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(150,200,255,0.6), rgba(100,160,220,0.2));
        animation: ph-rise ${duration}s ${delay}s linear infinite;
      `;
      scene.appendChild(p);
    }

    // A swimming silhouette (simple fish)
    const fish = document.createElement('div');
    fish.id = 'ph-fish';
    fish.innerHTML = `
      <svg viewBox="0 0 60 30" width="8%" style="opacity:0.4;">
        <ellipse cx="25" cy="15" rx="20" ry="10" fill="#1a4a6a"/>
        <polygon points="45,15 55,5 55,25" fill="#1a4a6a"/>
        <circle cx="14" cy="12" r="2" fill="#2a7aaa"/>
        <ellipse cx="30" cy="15" rx="6" ry="3" fill="rgba(100,180,220,0.15)"/>
      </svg>
    `;
    fish.style.cssText = `
      position: absolute;
      top: 45%;
      animation: ph-swim 18s linear infinite;
    `;
    scene.appendChild(fish);

    // Second fish, different timing
    const fish2 = document.createElement('div');
    fish2.innerHTML = `
      <svg viewBox="0 0 60 30" width="5%" style="opacity:0.25;transform:scaleX(-1);">
        <ellipse cx="25" cy="15" rx="20" ry="10" fill="#1a4a6a"/>
        <polygon points="45,15 55,5 55,25" fill="#1a4a6a"/>
        <circle cx="14" cy="12" r="2" fill="#2a7aaa"/>
      </svg>
    `;
    fish2.style.cssText = `
      position: absolute;
      top: 60%;
      animation: ph-swim-reverse 24s 4s linear infinite;
    `;
    scene.appendChild(fish2);

    // Light rays from top
    for (let i = 0; i < 3; i++) {
      const ray = document.createElement('div');
      const left = 25 + i * 18;
      ray.style.cssText = `
        position: absolute;
        top: -10%;
        left: ${left}%;
        width: 15%;
        height: 70%;
        background: linear-gradient(180deg,
          rgba(100,180,255,0.08) 0%,
          rgba(100,180,255,0.02) 60%,
          transparent 100%
        );
        transform: skewX(${-10 + i * 8}deg);
        animation: ph-ray ${4 + i}s ease-in-out infinite alternate;
      `;
      scene.appendChild(ray);
    }

    el.appendChild(scene);

    // Inject keyframes
    if (!document.getElementById('ph-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ph-keyframes';
      style.textContent = `
        @keyframes ph-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(calc(-110vh)) translateX(20px); opacity: 0; }
        }
        @keyframes ph-swim {
          0% { left: -15%; }
          100% { left: 110%; }
        }
        @keyframes ph-swim-reverse {
          0% { right: -15%; left: auto; }
          100% { right: 110%; left: auto; }
        }
        @keyframes ph-ray {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  },

  /** Porthole frame overlay */
  _createFrame(el) {
    const frame = document.createElement('div');
    frame.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: 50%;
      box-shadow:
        inset 0 0 40px 20px rgba(0,0,0,0.6),
        inset 0 0 4px 2px rgba(0,0,0,0.8);
      pointer-events: none;
      z-index: 2;
    `;

    // Rivets around the porthole
    const rivetCount = 12;
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i * (360 / rivetCount)) * (Math.PI / 180);
      const r = 47; // % from center
      const x = 50 + Math.cos(angle) * r;
      const y = 50 + Math.sin(angle) * r;
      const rivet = document.createElement('div');
      rivet.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: 2.2%;
        height: 2.2%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #555, #222);
        box-shadow: 0 1px 2px rgba(0,0,0,0.5);
      `;
      frame.appendChild(rivet);
    }

    // Glass reflection highlight
    const glare = document.createElement('div');
    glare.style.cssText = `
      position: absolute;
      top: 8%;
      left: 15%;
      width: 35%;
      height: 20%;
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(255,255,255,0.08), transparent);
      transform: rotate(-20deg);
    `;
    frame.appendChild(glare);

    el.appendChild(frame);
  },

  update() {
    // CSS animations handle everything, no per-frame work needed
  },
};
