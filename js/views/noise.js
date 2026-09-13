'use strict';

import { beep } from '../utils.js';

let quietInterval = null;
let quietLeft = 0;
let micCtx = null;
let micStream = null;
let micRAF = null;

export function renderNoise() {
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-shield-halved text-primary me-2"></i>Công cụ Chống Ồn</h2>
        <p>Bấm cảnh báo tức thì, đếm ngược im lặng hoặc dùng microphone phát hiện tiếng ồn tự động.</p>
      </div>
    </div>
    <div class="grid-equal">
      <div class="card p-3">
        <h5 class="fw-bold">🔔 Cảnh Báo Tức Thì</h5>
        <div class="alert-grid mt-3">
          <div class="class-alert" style="background:#fef3c7;border-color:#f59e0b" onclick="window.app.classAlert('🤫','SHH! Im lặng nào!','#d97706')">
            <span class="fs-1">🤫</span>SHH! Im lặng nào!
          </div>
          <div class="class-alert" style="background:#ffedd5;border-color:#fb923c" onclick="window.app.classAlert('⚠️','LỚP QUÁ ỒN!','#ea580c')">
            <span class="fs-1">⚠️</span>LỚP QUÁ ỒN!
          </div>
          <div class="class-alert" style="background:#fee2e2;border-color:#ef4444" onclick="window.app.classAlert('🚨','DỪNG LẠI NGAY!','#dc2626')">
            <span class="fs-1">🚨</span>DỪNG LẠI NGAY!
          </div>
          <div class="class-alert" style="background:#d1fae5;border-color:#10b981" onclick="window.app.classAlert('🌟','TUYỆT VỜI!','#059669')">
            <span class="fs-1">🌟</span>TUYỆT VỜI!
          </div>
        </div>
      </div>
      <div class="card p-3">
        <h5 class="fw-bold">🎵 Đếm Ngược Im Lặng</h5>
        <div class="quiet-timer" id="quietTimer">⏱️</div>
        <div class="d-flex justify-content-center gap-2 flex-wrap mt-3">
          ${[10, 15, 20, 30, 60].map(n => `<button class="btn btn-outline-primary" onclick="window.app.startQuiet(${n})">${n}s</button>`).join('')}
        </div>
        <div class="text-center text-muted small mt-2">Khi hết giờ sẽ tự động khen lớp “TUYỆT VỜI!”</div>
      </div>
    </div>
    <div class="card p-3 mt-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="fw-bold m-0">🎙️ Phát Hiện Tiếng Ồn Tự Động (Microphone)</h5>
        <div>
          <label class="form-check form-switch d-inline-block me-3">
            <input id="autoNoise" class="form-check-input" type="checkbox">
            <span class="form-check-label">Cảnh báo tự động</span>
          </label>
          <button id="micBtn" class="btn btn-outline-primary" onclick="window.app.toggleMic()">
            <i class="fa-solid fa-microphone me-1"></i>Bật micro
          </button>
        </div>
      </div>
      <div class="d-flex justify-content-between mt-3">
        <span>Mức độ tiếng ồn</span>
        <strong id="noisePct">0%</strong>
      </div>
      <div class="noise-meter mt-2">
        <div class="noise-fill" id="noiseFill"></div>
      </div>
      <div id="noiseStatus" class="alert alert-success mt-3 mb-0">Lớp đang yên tĩnh — Tốt lắm!</div>
      <div class="row text-center small mt-2">
        <div class="col bg-success-subtle p-2 rounded-start">Yên tĩnh<br>0–40%</div>
        <div class="col bg-warning-subtle p-2">Hơi ồn<br>40–70%</div>
        <div class="col bg-danger-subtle p-2 rounded-end">Rất ồn<br>70–100%</div>
      </div>
    </div>
  `;
}

export function classAlert(emoji, text, color) {
  beep(text.includes('TUYỆT') ? 880 : 440, 0.3, 0.15);
  const o = document.createElement('div');
  o.className = 'full-alert-overlay';
  o.innerHTML = `
    <div class="full-alert-card" style="background:${color}">
      <div class="emoji">${emoji}</div>
      <h2>${text}</h2>
      <p>Nhấn bất kỳ đâu để đóng</p>
    </div>
  `;
  o.onclick = () => o.remove();
  document.body.appendChild(o);
  setTimeout(() => o.remove(), 3500);
}

export function startQuiet(sec) {
  clearInterval(quietInterval);
  quietLeft = sec;
  const el = document.getElementById('quietTimer');
  if (el) el.textContent = quietLeft + 's';
  quietInterval = setInterval(() => {
    quietLeft--;
    const x = document.getElementById('quietTimer');
    if (x) x.textContent = Math.max(0, quietLeft) + 's';
    if (quietLeft <= 0) {
      clearInterval(quietInterval);
      beep(880, 0.35, 0.15);
      classAlert('🌟', 'TUYỆT VỜI!', '#059669');
    }
  }, 1000);
}

export async function toggleMic() {
  if (micStream) {
    stopMic();
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = micCtx.createMediaStreamSource(micStream);
    const an = micCtx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const btn = document.getElementById('micBtn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-microphone-slash me-1"></i>Tắt micro';
    let lastWarn = 0;

    const loop = () => {
      an.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const pct = Math.min(100, Math.round((avg / 90) * 100));
      const f = document.getElementById('noiseFill');
      const p = document.getElementById('noisePct');
      const st = document.getElementById('noiseStatus');

      if (f) f.style.width = pct + '%';
      if (p) p.textContent = pct + '%';
      if (st) {
        st.className = 'alert mt-3 mb-0 ' + (pct < 40 ? 'alert-success' : pct < 70 ? 'alert-warning' : 'alert-danger');
        st.textContent = pct < 40 ? 'Lớp đang yên tĩnh — Tốt lắm!' : pct < 70 ? 'Lớp hơi ồn — Hãy nhắc nhẹ các em.' : 'Mức ồn cao — Cần ổn định lớp.';
      }
      if (pct > 72 && document.getElementById('autoNoise')?.checked && Date.now() - lastWarn > 7000) {
        lastWarn = Date.now();
        beep(360, 0.2, 0.15);
      }
      micRAF = requestAnimationFrame(loop);
    };
    loop();
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Không mở được microphone',
      text: 'Trình duyệt có thể yêu cầu HTTPS/localhost và quyền truy cập microphone.'
    });
  }
}

export function stopMic() {
  if (micRAF) cancelAnimationFrame(micRAF);
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  if (micCtx) micCtx.close();
  micRAF = null;
  micStream = null;
  micCtx = null;
  const b = document.getElementById('micBtn');
  if (b) b.innerHTML = '<i class="fa-solid fa-microphone me-1"></i>Bật micro';
}
