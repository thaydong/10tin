'use strict';

import { getState, saveState, activeClass, classStudents, logTransaction } from '../state.js';
import { esc, renderAvatar, toast, downloadXlsx, isDateInWeek } from '../utils.js';
import { today } from '../config.js';

export const COMMENDATION_TYPES = [
  { id: 'speech', label: 'Phát biểu xây dựng bài', icon: 'fa-comments', coins: 3, color: '#0d9488' },
  { id: 'lesson', label: 'Học thuộc bài', icon: 'fa-book-bookmark', coins: 3, color: '#0284c7' },
  { id: 'homework', label: 'Có chuẩn bị bài tập nhà', icon: 'fa-pen-to-square', coins: 3, color: '#8b5cf6' },
  { id: 'activities', label: 'Tham gia tốt các hoạt động', icon: 'fa-star', coins: 3, color: '#eab308' }
];

export function commendationsKey() {
  const state = getState();
  return state.activeClassId + '_' + (document.getElementById('comDate')?.value || state.commendationsDate || today());
}

export function changeCommendationsDate(v) {
  const state = getState();
  state.commendationsDate = v;
  saveState(false);
  window.app.renderPage();
}

export function saveCommendationsManually() {
  saveState(true);
  toast('Đã lưu toàn bộ thông tin tuyên dương!');
}

export function renderCommendations() {
  const state = getState();
  const ss = classStudents();
  const date = state.commendationsDate || today();
  const key = state.activeClassId + '_' + date;
  if (!state.commendations) state.commendations = {};
  const com = state.commendations[key] || {};

  return `
    <div class="section-head mb-3">
      <div>
        <h2><i class="fa-solid fa-award text-warning me-2"></i>Tuyên dương & Khen thưởng ${esc(activeClass().name)}</h2>
        <p>Ghi nhận thành tích, phát biểu xây dựng bài và hoạt động tích cực của học sinh.</p>
      </div>
      <div class="d-flex gap-2">
        <input id="comDate" type="date" class="form-control" style="width:160px" value="${date}" onchange="window.app.changeCommendationsDate(this.value)">
        <button class="btn btn-outline-primary" onclick="window.app.openExportModal('commendations')"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel</button>
        <button class="btn btn-primary" onclick="window.app.saveCommendationsManually()"><i class="fa-solid fa-floppy-disk me-1"></i>Lưu tuyên dương</button>
      </div>
    </div>
    
    <div class="card p-3 mt-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <div class="fw-bold text-success"><i class="fa-solid fa-star me-1"></i>Danh sách tuyên dương & thưởng xu</div>
          <div class="small text-muted">Đánh dấu vào ô vuông nếu học sinh đạt tuyên dương tương ứng để cộng xu thi đua.</div>
        </div>
        <div class="small text-muted">Sĩ số: <strong>${ss.length}</strong> học sinh</div>
      </div>
      <div class="commendations-grid">
        ${ss
          .map((s, i) => {
            const studentComs = com[s.id] || {};
            return `
            <div class="violation-card p-3 border rounded-4 mb-3 bg-white shadow-sm" style="border-left: 4px solid #10b981 !important;">
              <div class="d-flex gap-3 align-items-center mb-3 pb-3 border-bottom">
                <div class="fw-bold text-muted" style="width: 24px;">${i + 1}</div>
                ${renderAvatar(s, 'mini-avatar')}
                <div class="flex-fill">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-bold fs-5">${esc(s.name)}</div>
                      <div class="text-muted small">${esc(activeClass().name)}${s.gender ? ` · ${esc(s.gender)}` : ''}</div>
                    </div>
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                      <i class="fa-solid fa-coins me-1"></i>${s.coins || 0} xu hiện có
                    </span>
                  </div>
                </div>
              </div>
              <div class="violation-checks row g-2">
                ${COMMENDATION_TYPES.map(
                  ct => `
                  <div class="col-md-6 col-lg-3">
                    <div class="form-check p-2 border rounded-3 d-flex align-items-center cursor-pointer hover-bg-light ${studentComs[ct.id] ? 'border-success bg-success bg-opacity-10' : ''}" 
                         onclick="window.app.toggleCommendation('${s.id}', '${ct.id}')"
                         style="cursor: pointer; transition: all 0.2s;">
                      <input class="form-check-input m-0 me-2" type="checkbox" 
                             style="cursor: pointer; transform: scale(1.2);"
                             ${studentComs[ct.id] ? 'checked' : ''} 
                             onclick="event.stopPropagation(); window.app.toggleCommendation('${s.id}', '${ct.id}')">
                      <label class="form-check-label mb-0 fw-bold ${studentComs[ct.id] ? 'text-success' : 'text-secondary'}" style="cursor: pointer; user-select: none; font-size: 0.88rem;">
                        <i class="fa-solid ${ct.icon} me-1" style="color: ${ct.color}"></i> ${ct.label}
                        <span class="badge bg-warning text-dark ms-1">+${ct.coins} xu</span>
                      </label>
                    </div>
                  </div>
                `
                ).join('')}
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}

export function toggleCommendation(studentId, commendationId) {
  const state = getState();
  const k = commendationsKey();
  
  if (!state.commendations) state.commendations = {};
  if (!state.commendations[k]) state.commendations[k] = {};
  if (!state.commendations[k][studentId]) state.commendations[k][studentId] = {};
  
  const ct = COMMENDATION_TYPES.find(x => x.id === commendationId);
  const cLabel = ct ? ct.label : 'Tuyên dương';
  const cCoins = ct ? ct.coins : 3;

  // Toggle
  const isCommended = !state.commendations[k][studentId][commendationId];
  state.commendations[k][studentId][commendationId] = isCommended;

  if (isCommended) {
    logTransaction(studentId, cCoins, 'Tuyên dương: ' + cLabel, 'Thi đua / Tuyên dương');
    toast(`Đã cộng +${cCoins} xu tuyên dương: ${cLabel}`);
  } else {
    logTransaction(studentId, -cCoins, 'Hủy tuyên dương: ' + cLabel, 'Thi đua / Tuyên dương');
    toast(`Đã thu hồi -${cCoins} xu tuyên dương: ${cLabel}`);
  }
  
  // Cleanup if empty
  if (!state.commendations[k][studentId][commendationId]) {
    delete state.commendations[k][studentId][commendationId];
  }
  if (Object.keys(state.commendations[k][studentId]).length === 0) {
    delete state.commendations[k][studentId];
  }
  
  saveState(false);
  window.app.renderPage();
}

export function exportCommendationsData(timeType, timeValue) {
  const state = getState();
  const ss = classStudents();
  if (!state.commendations) state.commendations = {};
  
  if (timeType === 'day') {
    const key = state.activeClassId + '_' + timeValue;
    const com = state.commendations[key] || {};
    
    const rows = ss.map((s, i) => {
      const sCom = com[s.id] || {};
      const row = { 'STT': i + 1, 'Họ tên': s.name };
      COMMENDATION_TYPES.forEach(ct => {
        row[ct.label] = sCom[ct.id] ? 'x' : '';
      });
      return row;
    });
    
    downloadXlsx([['Tuyên dương', rows]], `tuyen-duong-${activeClass().name}-${timeValue}.xlsx`);
    return;
  }
  
  // Summary
  const matchingKeys = Object.keys(state.commendations).filter(k => {
    if (!k.startsWith(state.activeClassId + '_')) return false;
    if (timeType === 'week') {
      const datePart = k.split('_')[1];
      return isDateInWeek(datePart, timeValue);
    }
    return k.startsWith(state.activeClassId + '_' + timeValue);
  });
  
  const rows = ss.map((s, i) => {
    const row = { 'STT': i + 1, 'Họ tên': s.name };
    const counts = {};
    COMMENDATION_TYPES.forEach(ct => counts[ct.id] = 0);
    
    matchingKeys.forEach(k => {
      const sCom = state.commendations[k][s.id] || {};
      COMMENDATION_TYPES.forEach(ct => {
        if (sCom[ct.id]) counts[ct.id]++;
      });
    });
    
    COMMENDATION_TYPES.forEach(ct => {
      row['Tổng ' + ct.label] = counts[ct.id];
    });
    
    return row;
  });
  
  downloadXlsx([['Tổng hợp Tuyên dương', rows]], `tong-hop-tuyen-duong-${activeClass().name}-${timeValue}.xlsx`);
}
