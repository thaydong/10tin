'use strict';

import { getState, saveState, classStudents, logTransaction } from '../state.js';
import { esc, toast, confettiLite } from '../utils.js';
import { uid } from '../config.js';

export function renderRewards() {
  const state = getState();
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-gift text-primary me-2"></i>Cửa hàng đổi quà</h2>
        <p>Học sinh dùng xu tích lũy để đổi phần thưởng.</p>
      </div>
      <button class="btn btn-primary" onclick="window.app.openRewardModal()"><i class="fa-solid fa-plus me-1"></i>Thêm phần thưởng</button>
    </div>
    <div class="reward-grid">
      ${state.rewards
        .map(
          r => `
        <div class="card reward-card hover-lift">
          <div class="reward-visual">${esc(r.emoji || '🎁')}</div>
          <div class="reward-body">
            <div class="d-flex justify-content-between">
              <h5 class="fw-bold">${esc(r.name)}</h5>
              <span class="coin-pill">${r.cost} xu</span>
            </div>
            <div class="text-muted small">Còn ${r.stock} phần</div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-primary flex-fill" onclick="window.app.redeemReward('${r.id}')">Đổi phần thưởng</button>
              <button class="icon-btn" onclick="window.app.openRewardModal('${r.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn text-danger" onclick="window.app.deleteReward('${r.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="card p-3 mt-3">
      <h5 class="fw-bold">Lịch sử đổi quà</h5>
      ${
        state.redemptions
          .filter(x => x.classId === state.activeClassId)
          .slice(0, 20)
          .map(
            x => `
          <div class="history-item">
            <span><strong>${esc(x.studentName)}</strong> đổi ${esc(x.rewardName)}</span>
            <span class="text-muted">-${x.cost} xu · ${new Date(x.time).toLocaleString('vi-VN')}</span>
          </div>
        `
          )
          .join('') || '<div class="empty">Chưa có lượt đổi quà</div>'
      }
    </div>
  `;
}

export function openRewardModal(id = '') {
  const state = getState();
  const r = state.rewards.find(x => x.id === id) || { name: '', cost: 10, emoji: '🎁', stock: 10 };
  window.app.showModal(
    id ? 'Sửa phần thưởng' : 'Thêm phần thưởng',
    `
    <form onsubmit="window.app.saveReward(event,'${id}')">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-bold">Tên quà</label>
          <input id="rName" class="form-control" required value="${esc(r.name)}">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold">Emoji</label>
          <input id="rEmoji" class="form-control" value="${esc(r.emoji)}">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold">Giá xu</label>
          <input id="rCost" type="number" min="1" class="form-control" value="${r.cost}">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold">Tồn</label>
          <input id="rStock" type="number" min="0" class="form-control" value="${r.stock}">
        </div>
      </div>
      <div class="text-end mt-4">
        <button class="btn btn-primary">Lưu phần thưởng</button>
      </div>
    </form>
  `
  );
}

export function saveReward(e, id) {
  e.preventDefault();
  const state = getState();
  const d = {
    name: document.getElementById('rName').value.trim(),
    emoji: document.getElementById('rEmoji').value || '🎁',
    cost: +document.getElementById('rCost').value || 1,
    stock: +document.getElementById('rStock').value || 0
  };
  if (id) {
    Object.assign(
      state.rewards.find(x => x.id === id),
      d
    );
  } else {
    state.rewards.push({ id: uid('r'), ...d });
  }
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
}

export function deleteReward(id) {
  const state = getState();
  state.rewards = state.rewards.filter(x => x.id !== id);
  saveState();
  window.app.renderPage();
}

export async function redeemReward(rid) {
  const state = getState();
  const r = state.rewards.find(x => x.id === rid);
  const eligible = classStudents().filter(s => s.coins >= r.cost);
  if (!eligible.length) {
    return Swal.fire({
      icon: 'info',
      title: 'Chưa có học sinh đủ xu',
      text: `Cần ít nhất ${r.cost} xu để đổi ${r.name}.`
    });
  }
  const { value: sid } = await Swal.fire({
    title: 'Đổi quà cho học sinh',
    html: `<div class="fs-1 mb-2">${r.emoji}</div><strong>${esc(r.name)} (${r.cost} xu)</strong>`,
    input: 'select',
    inputOptions: Object.fromEntries(eligible.map(s => [s.id, `${s.name} (${s.coins} xu)`])),
    showCancelButton: true,
    confirmButtonText: 'Xác nhận đổi quà'
  });
  if (!sid) return;

  const s = state.students.find(x => x.id === sid);
  logTransaction(sid, -r.cost, 'Đổi quà: ' + r.name, 'Ghi chung / Nề nếp');
  r.stock = Math.max(0, r.stock - 1);
  state.redemptions.unshift({
    id: uid('rd'),
    classId: state.activeClassId,
    studentId: sid,
    studentName: s.name,
    rewardName: r.name,
    cost: r.cost,
    time: new Date().toISOString()
  });
  saveState();
  window.app.renderPage();
  confettiLite();
  toast('Đổi quà thành công');
}
