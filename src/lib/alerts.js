/**
 * Simple alert/notification overlay system.
 *
 * Usage:
 *   import { showAlert } from './lib/alerts.js';
 *   showAlert('Meeting in 5 minutes', { duration: 5000, color: '#ff3b30' });
 */

let timeout = null;

export function showAlert(message, { duration = 4000, color = '#fff' } = {}) {
  const overlay = document.getElementById('alert-overlay');
  const content = document.getElementById('alert-content');

  if (timeout) clearTimeout(timeout);

  content.textContent = message;
  content.style.color = color;
  overlay.classList.remove('hidden');

  if (duration > 0) {
    timeout = setTimeout(() => {
      overlay.classList.add('hidden');
      timeout = null;
    }, duration);
  }
}

export function dismissAlert() {
  const overlay = document.getElementById('alert-overlay');
  overlay.classList.add('hidden');
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
}
