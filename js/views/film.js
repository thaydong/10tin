'use strict';

import { getState, saveState, classStudents, logTransaction } from '../state.js';
import { esc, renderAvatar, beep, toast, confettiLite } from '../utils.js';
import { uid } from '../config.js';

export function filmCandidates() {
  const state = getState();
  return classStudents().filter(s => !state.filmExcluded.includes(s.id));
}

export function filmPerson(s) {
  return `
    <div class="film-person">
      ${renderAvatar(s, 'mini-avatar')}
      <strong>${esc(s.name.split(' ').slice(-2).join(' '))}</strong>
    </div>
  `;
}

export function renderFilm() {
  const state = getState();
  const cand = filmCandidates();
  return `
    <div class="grid-2">
      <div class="card p-3">
        <h5 class="fw-bold text-center mb-3">🎞️ MÁY CHIẾU PHIM MAY MẮN 🎞️</h5>
        <div class="film-stage">
          <div class="film-strip" id="filmStrip">${[...cand, ...cand, ...cand].map(s => filmPerson(s)).join('')}</div>
          <div class="film-marker"></div>
        </div>
        <div class="winner-box mt-3" id="filmWinner">
          <div class="text-muted">Bấm quay để chọn học sinh ngẫu nhiên</div>
        </div>
        <button class="btn btn-primary w-100 mt-3 py-3 fs-5" id="filmBtn" onclick="window.app.spinFilm()"><i class="fa-solid fa-play me-2"></i>🎬 Bấm Quay Cuộn Phim!</button>
        <div class="form-check form-switch mt-3">
          <input class="form-check-input" type="checkbox" ${state.settings.filmExclude ? 'checked' : ''} onchange="window.app.setFilmExclude(this.checked)">
          <label class="form-check-label fw-bold">Tự động loại học sinh sau khi chọn</label>
        </div>
      </div>
      <div>
        <div class="card p-3">
          <h5 class="fw-bold">Học sinh trong cuộn phim (${cand.length})</h5>
          <div class="student-grid" style="grid-template-columns:repeat(3,1fr)">
            ${cand.map(s => `<div class="text-center">${renderAvatar(s, 'mini-avatar')}<div class="small fw-bold mt-1">${esc(s.name.split(' ').slice(-2).join(' '))}</div></div>`).join('')}
          </div>
          ${
            state.filmExcluded.length
              ? `<button class="btn btn-sm btn-outline-primary mt-3" onclick="window.app.restoreAllFilm()">Đưa tất cả vào lại</button>`
              : ''
          }
        </div>
        <div class="card p-3 mt-3">
          <h5 class="fw-bold">🏆 Lịch sử (${state.filmHistory.filter(x => x.classId === state.activeClassId).length})</h5>
          ${
            state.filmHistory
              .filter(x => x.classId === state.activeClassId)
              .slice(0, 10)
              .map(
                h => `
              <div class="history-item">
                <strong>${esc(h.studentName)}</strong>
                <span>${new Date(h.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            `
              )
              .join('') || '<div class="empty">Chưa có lượt quay nào</div>'
          }
        </div>
      </div>
    </div>
  `;
}

export function setFilmExclude(val) {
  const state = getState();
  state.settings.filmExclude = val;
  saveState(false);
  window.app.renderPage();
}

export function restoreAllFilm() {
  const state = getState();
  state.filmExcluded = [];
  saveState(false);
  window.app.renderPage();
}

export async function spinFilm() {
  const state = getState();
  let cand = filmCandidates();
  if (!cand.length) {
    state.filmExcluded = [];
    saveState(false);
    window.app.renderPage();
    return;
  }

  const strip = document.getElementById('filmStrip');
  const btn = document.getElementById('filmBtn');
  if (btn) btn.disabled = true;

  const s = cand[Math.floor(Math.random() * cand.length)];
  const all = [...cand, ...cand, ...cand];
  const idx = cand.length + all.findIndex((x, i) => i < cand.length && x.id === s.id);
  const itemW = 142;
  const stage = document.querySelector('.film-stage')?.clientWidth || 400;
  const translate = -(idx * itemW - stage / 2 + itemW / 2 + 18);

  if (strip) strip.style.transform = `translateX(${translate}px)`;
  await new Promise(r => setTimeout(r, 2850));

  if (state.settings.filmExclude) state.filmExcluded.push(s.id);
  state.filmHistory.unshift({
    id: uid('fh'),
    classId: state.activeClassId,
    studentId: s.id,
    studentName: s.name,
    time: new Date().toISOString()
  });
  saveState(false);
  beep(740, 0.3, 0.14);

  const winnerEl = document.getElementById('filmWinner');
  if (winnerEl) {
    winnerEl.innerHTML = `
      <div class="text-warning fw-bold">🏆 PHIM DỪNG TẠI...</div>
      <h2 class="fw-bold">${esc(s.name)}</h2>
      <div class="d-flex justify-content-center gap-2">
        <select id="filmAward" class="form-select" style="width:120px">
          ${[1, 2, 3, 5, 10, 15, 20].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>+${n} xu</option>`).join('')}
        </select>
        <button class="btn btn-warning" onclick="window.app.awardFilm('${s.id}')"><i class="fa-solid fa-coins me-1"></i>Thưởng xu</button>
        <button class="btn btn-light" onclick="window.app.renderPage()">Reset</button>
      </div>
    `;
  }
  confettiLite();
  if (btn) btn.disabled = false;
}

export function awardFilm(id) {
  const n = +document.getElementById('filmAward').value;
  logTransaction(id, n, 'Thưởng cuộn phim', 'Ghi chung / Nề nếp');
  saveState();
  toast('Đã thưởng +' + n + ' xu');
}
