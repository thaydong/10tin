'use strict';

import { getState, saveState, classStudents, logTransaction } from '../state.js';
import { esc, initials, beep, toast, confettiLite } from '../utils.js';
import { WHEEL_EFFECTS, uid } from '../config.js';

export function wheelCandidates() {
  const state = getState();
  let ss = classStudents().filter(s => !state.wheelExcluded.includes(s.id));
  if (state.wheelGroup === 'favorite') ss = ss.filter(s => s.favorite);
  return ss;
}

export function positionWheelBalls() {
  const balls = [...document.querySelectorAll('.wheel-ball')];
  const n = balls.length;
  balls.forEach((b, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = n > 10 ? 39 : 35;
    b.style.left = 50 + Math.cos(a) * r + '%';
    b.style.top = 50 + Math.sin(a) * r + '%';
  });
}

export function renderWheel() {
  const state = getState();
  const candidates = wheelCandidates();
  return `
    <div class="wheel-layout">
      <div class="card wheel-card">
        <div class="d-flex justify-content-between">
          <span class="badge text-bg-light">Hiệu ứng: <b id="effectLabel">${esc(state.wheelEffect || 'Xoáy tròn')}</b></span>
          <button class="icon-btn" onclick="window.app.beep()"><i class="fa-solid fa-volume-high"></i></button>
        </div>
        <div class="wheel-machine" id="wheelMachine">
          ${candidates
            .map(
              (s, i) => `
            <div class="wheel-ball" data-index="${i}" title="${esc(s.name)}">
              ${s.avatar ? `<img src="${s.avatar}">` : esc(initials(s.name))}
            </div>
          `
            )
            .join('')}
        </div>
        <button id="spinBtn" class="btn btn-primary w-100 py-3 fs-5" onclick="window.app.spinWheel()"><i class="fa-solid fa-wand-magic-sparkles me-2"></i>QUAY NGAY</button>
        <div class="d-flex justify-content-between mt-2 text-muted small">
          <span>🌐 Trong lồng: ${candidates.length} học sinh</span>
          <span>${state.settings.wheelExclude ? '🛡️ Loại trừ sau khi trúng' : '↻ Có thể trúng lại'}</span>
        </div>
        <div class="card p-3 mt-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" ${state.settings.wheelExclude ? 'checked' : ''} onchange="window.app.setWheelExclude(this.checked)">
            <label class="form-check-label fw-bold">Loại trừ sau khi trúng</label>
          </div>
          ${
            state.wheelExcluded.length
              ? `
            <div class="mt-2">
              <small>Đã loại khỏi lồng (${state.wheelExcluded.length}):</small>
              <div>
                ${state.wheelExcluded
                  .map(id => {
                    const s = state.students.find(x => x.id === id);
                    return s ? `<span class="subject-chip">${esc(s.name)} <i class="fa-solid fa-rotate-left" onclick="window.app.restoreWheel('${id}')" style="cursor:pointer"></i></span>` : '';
                  })
                  .join('')}
                <button class="btn btn-sm btn-link" onclick="window.app.restoreAllWheel()">Cho tất cả vào lại</button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
      <div>
        <div class="card p-3">
          <h5 class="fw-bold">Thiết lập hiệu ứng Lồng Cầu</h5>
          <div class="btn-group w-100 mb-3">
            <button class="btn btn-outline-primary active">Tự động đổi</button>
            <button class="btn btn-outline-primary" onclick="window.app.setWheelGroup('all')">Chọn thủ công</button>
            <button class="btn btn-outline-primary" onclick="window.app.setWheelGroup('favorite')">Nhóm yêu thích</button>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${WHEEL_EFFECTS.map(e => `<span class="effect-chip ${state.wheelEffect === e ? 'active' : ''}" onclick="window.app.selectWheelEffect('${e}')">${e}</span>`).join('')}
          </div>
        </div>
        <div class="card p-3 mt-3">
          <div class="d-flex justify-content-between">
            <h5 class="fw-bold">🏆 Lịch sử Quay (${state.wheelHistory.filter(x => x.classId === state.activeClassId).length})</h5>
            <button class="btn btn-sm btn-link" onclick="window.app.clearWheelHistory()">Xóa lịch sử</button>
          </div>
          <div class="history-list">
            ${
              state.wheelHistory
                .filter(x => x.classId === state.activeClassId)
                .slice(0, 15)
                .map(
                  h => `
                <div class="history-item">
                  <strong>${esc(h.studentName)}</strong>
                  <span class="text-muted">${esc(h.effect)} · ${new Date(h.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              `
                )
                .join('') || '<div class="empty">Chưa có lượt quay nào</div>'
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

export function selectWheelEffect(e) {
  const state = getState();
  state.wheelEffect = e;
  saveState(false);
  window.app.renderPage();
}

export function setWheelGroup(g) {
  const state = getState();
  state.wheelGroup = g;
  saveState(false);
  window.app.renderPage();
}

export function setWheelExclude(val) {
  const state = getState();
  state.settings.wheelExclude = val;
  saveState(false);
  window.app.renderPage();
}

export async function spinWheel() {
  const state = getState();
  const cand = wheelCandidates();
  if (!cand.length) {
    state.wheelExcluded = [];
    saveState(false);
    window.app.renderPage();
    return toast('Đã đưa tất cả học sinh vào lại', 'info');
  }

  const machine = document.getElementById('wheelMachine');
  const btn = document.getElementById('spinBtn');
  if (machine) machine.classList.add('spinning');
  if (btn) btn.disabled = true;

  const effect = WHEEL_EFFECTS[Math.floor(Math.random() * WHEEL_EFFECTS.length)];
  state.wheelEffect = effect;
  if (machine) machine.classList.add('fx' + WHEEL_EFFECTS.indexOf(effect));
  const lab = document.getElementById('effectLabel');
  if (lab) lab.textContent = effect;

  await new Promise(r => setTimeout(r, 1900));

  const s = cand[Math.floor(Math.random() * cand.length)];
  if (state.settings.wheelExclude && !state.wheelExcluded.includes(s.id)) {
    state.wheelExcluded.push(s.id);
  }
  state.wheelHistory.unshift({
    id: uid('wh'),
    classId: state.activeClassId,
    studentId: s.id,
    studentName: s.name,
    effect,
    time: new Date().toISOString()
  });
  saveState(false);
  if (machine) machine.classList.remove('spinning');
  beep(880, 0.25, 0.15);
  showWinner(s, 'wheel');
}

export async function showWinner(s, type) {
  await Swal.fire({
    title: '🎉 CHÚC MỪNG HỌC SINH MAY MẮN!',
    html: `
      <div class="mx-auto student-avatar mb-2">
        ${s.avatar ? `<img src="${s.avatar}">` : esc(initials(s.name))}
      </div>
      <h2 class="fw-bold">${esc(s.name)}</h2>
      <div class="text-muted">Thưởng xu ngay:</div>
      <div class="d-flex justify-content-center gap-2 mt-3 flex-wrap">
        <button class="btn btn-primary" onclick="Swal.clickConfirm()" data-award="1">+1 xu</button>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Quay tiếp / Đóng',
    cancelButtonText: 'Đóng',
    didOpen: () => {
      const box = Swal.getHtmlContainer();
      box.querySelector('.d-flex').innerHTML = [1, 2, 5, 10]
        .map(n => `<button class="btn btn-primary" onclick="window.app.awardWinner('${s.id}',${n})">+${n} xu</button>`)
        .join('');
    }
  });
  window.app.renderPage();
}

export function awardWinner(id, n) {
  logTransaction(id, n, 'Thưởng trò chơi', 'Ghi chung / Nề nếp');
  saveState();
  toast('Đã thưởng +' + n + ' xu');
  confettiLite();
  Swal.close();
  window.app.renderPage();
}

export function restoreWheel(id) {
  const state = getState();
  state.wheelExcluded = state.wheelExcluded.filter(x => x !== id);
  saveState(false);
  window.app.renderPage();
}

export function restoreAllWheel() {
  const state = getState();
  state.wheelExcluded = [];
  saveState(false);
  window.app.renderPage();
}

export function clearWheelHistory() {
  const state = getState();
  state.wheelHistory = state.wheelHistory.filter(x => x.classId !== state.activeClassId);
  saveState();
  window.app.renderPage();
}
