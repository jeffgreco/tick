#!/usr/bin/env bash
#
# setup-kiosk.sh — Configure a Raspberry Pi to boot into tick in kiosk mode.
#
# Run on the Pi:
#   chmod +x setup-kiosk.sh && sudo ./setup-kiosk.sh
#
# What this does:
#   1. Installs Chromium (if needed) and unclutter (hides cursor)
#   2. Creates a systemd service that launches Chromium in kiosk mode
#   3. Points it at http://localhost:3000 (Vite dev server)
#      or a built version served by a simple HTTP server
#
# For production, run `npm run build` and serve the dist/ folder instead.

set -euo pipefail

URL="${1:-http://localhost:3000}"
SERVICE_NAME="tick-kiosk"

echo "==> Setting up tick kiosk mode"
echo "    URL: $URL"

# Install dependencies
echo "==> Installing packages..."
apt-get update -qq
apt-get install -y -qq chromium-browser unclutter > /dev/null 2>&1 || \
apt-get install -y -qq chromium unclutter > /dev/null 2>&1

# Disable screen blanking
echo "==> Disabling screen blanking..."
if ! grep -q 'consoleblank=0' /boot/cmdline.txt 2>/dev/null; then
  sed -i 's/$/ consoleblank=0/' /boot/cmdline.txt
fi

# Create autostart for the current user's desktop session
AUTOSTART_DIR="/home/${SUDO_USER:-pi}/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_DIR/tick-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Tick Kiosk
Exec=bash -c 'sleep 5 && unclutter -idle 0 & chromium-browser --noerrdialogs --disable-infobars --kiosk --incognito --disable-translate --disable-features=TranslateUI --no-first-run --check-for-update-interval=31536000 "$URL"'
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

chown -R "${SUDO_USER:-pi}:${SUDO_USER:-pi}" "$AUTOSTART_DIR"

# Also create a systemd service for headless / Wayland setups
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=Tick Kiosk Display
After=graphical.target
Wants=graphical.target

[Service]
Type=simple
User=${SUDO_USER:-pi}
Environment=DISPLAY=:0
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk --incognito --disable-translate --disable-features=TranslateUI --no-first-run --check-for-update-interval=31536000 ${URL}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"

echo ""
echo "==> Done! Kiosk is configured."
echo "    - On desktop: will auto-start via ~/.config/autostart/"
echo "    - As service: sudo systemctl start ${SERVICE_NAME}"
echo ""
echo "    Make sure tick is running:"
echo "      cd /path/to/tick && npm run dev"
echo "    Or for production:"
echo "      npm run build && npx serve dist -l 3000"
echo ""
echo "    Reboot to test: sudo reboot"
