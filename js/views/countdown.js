'use strict';

import { getState, saveState } from '../state.js';
import { beep } from '../utils.js';

let countdownInterval = null;
let countdown = { total: 300, left: 300, running: false };

export function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

export function updateCountdownUI() {
  const state = getState();
  const t = document.getElementById('countdownTime');
  const r = document.getElementById('countdownRing');
  const st = document.getElementById('countdownStatus');
  const b = document.getElementById('countdownStart');

  if (t) t.textContent = fmtTime(countdown.left);
  if (r) {
    const pct = countdown.total ? (countdown.left / countdown.total) * 100 : 0;
    r.style.setProperty('--progress', pct + '%');
    r.style.setProperty('--timer-color', state.settings.timerColor || '#0d9488');
  }
  if (st) st.textContent = countdown.running ? 'ĐANG ĐẾM NGƯỢC' : 'Sẵn sàng';
  if (b) b.innerHTML = countdown.running ? '<i class="fa-solid fa-pause me-1"></i>Tạm dừng' : '<i class="fa-solid fa-play me-1"></i>Bắt đầu';
}

export function setCountdown(s) {
  clearInterval(countdownInterval);
  countdown = { total: s, left: s, running: false };
  updateCountdownUI();
}

export function applyTimerInputs() {
  const s =
    (+document.getElementById('timerH').value || 0) * 3600 +
    (+document.getElementById('timerM').value || 0) * 60 +
    (+document.getElementById('timerS').value || 0);
  setCountdown(Math.max(1, s));
}

export function adjustCountdown(n) {
  countdown.left = Math.max(0, countdown.left + n);
  countdown.total = Math.max(countdown.total, countdown.left);
  updateCountdownUI();
}

export function resetCountdown() {
  clearInterval(countdownInterval);
  countdown.left = countdown.total;
  countdown.running = false;
  updateCountdownUI();
}

export function toggleCountdown() {
  const state = getState();
  if (countdown.running) {
    clearInterval(countdownInterval);
    countdown.running = false;
    updateCountdownUI();
    return;
  }
  if (countdown.left <= 0) countdown.left = countdown.total;
  countdown.running = true;
  updateCountdownUI();
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    countdown.left--;
    if (state.settings.tickLast10 && countdown.left <= 10 && countdown.left > 0) {
      beep(900, 0.05, 0.04);
    }
    if (countdown.left <= 0) {
      clearInterval(countdownInterval);
      countdown.running = false;
      beep(880, 0.5, 0.18);
      Swal.fire({ icon: 'success', title: 'Hết giờ!', text: 'Đồng hồ đếm ngược đã kết thúc.' });
    }
    updateCountdownUI();
  }, 1000);
}

export function setTimerColor(c) {
  const state = getState();
  state.settings.timerColor = c;
  saveState(false);
  updateCountdownUI();
}

export function renderCountdown() {
  const state = getState();
  return `
    <div class="countdown-layout">
      <div class="card p-3">
        <div class="countdown-ring" id="countdownRing">
          <div class="countdown-inner">
            <div class="countdown-time" id="countdownTime">05:00</div>
            <div class="text-uppercase small" id="countdownStatus">Sẵn sàng</div>
          </div>
        </div>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <button class="btn btn-light" onclick="window.app.adjustCountdown(-30)">−30s</button>
          <button id="countdownStart" class="btn btn-primary px-5" onclick="window.app.toggleCountdown()"><i class="fa-solid fa-play me-1"></i>Bắt đầu</button>
          <button class="btn btn-light" onclick="window.app.adjustCountdown(30)">+30s</button>
          <button class="btn btn-outline-primary" onclick="window.app.resetCountdown()"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
        <div class="form-check form-switch text-center mt-3">
          <input class="form-check-input" id="tickLast10" type="checkbox" ${state.settings.tickLast10 ? 'checked' : ''} onchange="window.app.setTickLast10(this.checked)">
          <label class="form-check-label">Tiếng tick cuối 10 giây</label>
        </div>
      </div>
      <div>
        <div class="card p-3">
          <h5 class="fw-bold">⏱ Thiết lập thời gian</h5>
          <div class="row g-2 text-center">
            <div class="col"><input id="timerH" type="number" min="0" max="9" class="form-control text-center fw-bold" value="0"><small>GIỜ</small></div>
            <div class="col"><input id="timerM" type="number" min="0" max="59" class="form-control text-center fw-bold" value="5"><small>PHÚT</small></div>
            <div class="col"><input id="timerS" type="number" min="0" max="59" class="form-control text-center fw-bold" value="0"><small>GIÂY</small></div>
          </div>
          <button class="btn btn-primary w-100 mt-3" onclick="window.app.applyTimerInputs()">✓ Áp dụng thời gian này</button>
        </div>
        <div class="card p-3 mt-3">
          <h5 class="fw-bold">⚡ Mẫu nhanh</h5>
          <div class="preset-grid">
            ${[1, 3, 5, 10, 15, 20, 25, 30, 45, 60]
              .map(m => `<button class="preset" onclick="window.app.setCountdown(${m * 60})">${m === 60 ? '1 giờ' : m + ' phút'}</button>`)
              .join('')}
          </div>
        </div>
        <div class="card p-3 mt-3">
          <h5 class="fw-bold">🎨 Màu sắc đồng hồ</h5>
          <div class="d-flex gap-2 flex-wrap">
            ${[
              ['#7c3aed', 'Tím'],
              ['#0ea5e9', 'Xanh'],
              ['#0d9488', 'Lá'],
              ['#f59e0b', 'Cam'],
              ['#f43f5e', 'Hồng']
            ]
              .map(
                ([c, n]) => `
              <button class="btn btn-sm" style="border:2px solid ${c};color:${c}" onclick="window.app.setTimerColor('${c}')">● ${n}</button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setTickLast10(val) {
  const state = getState();
  state.settings.tickLast10 = val;
  saveState(false);
}
