/**
 * Face: Pebble Digital
 *
 * Retro digital face inspired by the Pebble smartwatch aesthetic.
 * Chunky pixel-ish font, minimal layout, battery-friendly dark background.
 * Includes day-of-week, date, and a step-counter style decoration.
 */

export default {
  name: 'Pebble Digital',

  create(el) {
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000;
      font-family: 'Courier New', 'Consolas', monospace;
      color: #fff;
    `;

    el.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5vmin;
      ">
        <!-- Day / Date -->
        <div id="peb-daydate" style="
          font-size: 3.8vmin;
          letter-spacing: 0.25em;
          color: #aaa;
          text-transform: uppercase;
        "></div>

        <!-- Separator line -->
        <div style="
          width: 50%;
          height: 1px;
          background: #333;
        "></div>

        <!-- Time -->
        <div id="peb-time" style="
          font-size: 18vmin;
          font-weight: bold;
          letter-spacing: 0.05em;
          line-height: 1;
        "></div>

        <!-- Seconds bar -->
        <div style="
          width: 50%;
          height: 4px;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
        ">
          <div id="peb-sec-bar" style="
            height: 100%;
            background: #55bf3b;
            border-radius: 2px;
            transition: width 0.15s linear;
          "></div>
        </div>

        <!-- Separator line -->
        <div style="
          width: 50%;
          height: 1px;
          background: #333;
        "></div>

        <!-- Bottom info -->
        <div id="peb-info" style="
          font-size: 3vmin;
          color: #666;
          letter-spacing: 0.15em;
        "></div>
      </div>
    `;
  },

  update(el) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const daydate = document.getElementById('peb-daydate');
    if (daydate) {
      daydate.textContent = `${days[now.getDay()]}  ${months[now.getMonth()]} ${now.getDate()}`;
    }

    const time = document.getElementById('peb-time');
    if (time) {
      time.textContent = `${pad(h)}:${pad(m)}`;
    }

    const bar = document.getElementById('peb-sec-bar');
    if (bar) {
      bar.style.width = `${(s / 59) * 100}%`;
      // Pulse green at the top of each minute
      bar.style.background = s < 2 ? '#7cfc00' : '#55bf3b';
    }

    const info = document.getElementById('peb-info');
    if (info) {
      // Show week number and day-of-year as decoration
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const dayOfYear = Math.ceil((now - startOfYear) / 86400000);
      info.textContent = `W${getWeek(now)}  D${dayOfYear}`;
    }
  },
};

function pad(n) {
  return n.toString().padStart(2, '0');
}

function getWeek(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}
