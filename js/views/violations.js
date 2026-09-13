'use strict';

import { getState, saveState, activeClass, classStudents, logTransaction } from '../state.js';
import { esc, renderAvatar, toast, downloadXlsx, isDateInWeek } from '../utils.js';
import { today } from '../config.js';

export const VIOLATION_TYPES = [
  { id: 'late', label: 'Đi học trễ', icon: 'fa-clock' },
  { id: 'no_lesson', label: 'Không thuộc bài', icon: 'fa-book-open-reader' },
  { id: 'no_hw', label: 'Không làm bài', icon: 'fa-pen-to-square' },
  { id: 'no_supplies', label: 'Không mang dụng cụ học tập', icon: 'fa-toolbox' },
  { id: 'no_uniform', label: 'Không đồng phục', icon: 'fa-shirt' },
  { id: 'no_duty', label: 'Không trực nhật', icon: 'fa-broom' }
];

export function violationsKey() {
  const state = getState();
  return state.activeClassId + '_' + (document.getElementById('vioDate')?.value || state.violationsDate || today());
}

export function changeViolationsDate(v) {
  const state = getState();
  state.violationsDate = v;
  saveState(false);
  window.app.renderPage();
}

export function saveViolationsManually() {
  saveState(true);
  toast('Đã lưu toàn bộ thông tin vi phạm!');
}

export function renderViolations() {
  const state = getState();
  const ss = classStudents();
  const date = state.violationsDate || today();
  const key = state.activeClassId + '_' + date;
  if (!state.violations) state.violations = {};
  const vio = state.violations[key] || {};

  return `
    <div class="section-head mb-3">
      <div>
        <h2><i class="fa-solid fa-triangle-exclamation text-primary me-2"></i>Vi phạm ${esc(activeClass().name)}</h2>
        <p>Ghi nhận và theo dõi các lỗi vi phạm của học sinh trong ngày.</p>
      </div>
      <div class="d-flex gap-2">
        <input id="vioDate" type="date" class="form-control" style="width:160px" value="${date}" onchange="window.app.changeViolationsDate(this.value)">
        <button class="btn btn-outline-primary" onclick="window.app.openExportModal('violations')"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel</button>
        <button class="btn btn-primary" onclick="window.app.saveViolationsManually()"><i class="fa-solid fa-floppy-disk me-1"></i>Lưu vi phạm</button>
      </div>
    </div>
    
    <div class="card p-3 mt-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <div class="fw-bold text-primary">Danh sách vi phạm</div>
          <div class="small text-muted">Đánh dấu vào ô vuông nếu học sinh có vi phạm tương ứng.</div>
        </div>
        <div class="small text-muted">Sĩ số: <strong>${ss.length}</strong> học sinh</div>
      </div>
      <div class="violations-grid">
        ${ss
          .map((s, i) => {
            const studentVios = vio[s.id] || {};
            return `
            <div class="violation-card p-3 border rounded-4 mb-3 bg-white shadow-sm">
              <div class="d-flex gap-3 align-items-center mb-3 pb-3 border-bottom">
                <div class="fw-bold text-muted" style="width: 24px;">${i + 1}</div>
                ${renderAvatar(s, 'mini-avatar')}
                <div>
                  <div class="fw-bold fs-5">${esc(s.name)}</div>
                  <div class="text-muted small">${esc(activeClass().name)}${s.gender ? ` · ${esc(s.gender)}` : ''}</div>
                </div>
              </div>
              <div class="violation-checks row g-2">
                ${VIOLATION_TYPES.map(
                  vt => `
                  <div class="col-md-6 col-lg-4">
                    <div class="form-check p-2 border rounded-3 d-flex align-items-center cursor-pointer hover-bg-light ${studentVios[vt.id] ? 'border-primary bg-primary bg-opacity-10' : ''}" 
                         onclick="window.app.toggleViolation('${s.id}', '${vt.id}')"
                         style="cursor: pointer; transition: all 0.2s;">
                      <input class="form-check-input m-0 me-2" type="checkbox" 
                             style="cursor: pointer; transform: scale(1.2);"
                             ${studentVios[vt.id] ? 'checked' : ''} 
                             onclick="event.stopPropagation(); window.app.toggleViolation('${s.id}', '${vt.id}')">
                      <label class="form-check-label mb-0 fw-bold ${studentVios[vt.id] ? 'text-primary' : 'text-secondary'}" style="cursor: pointer; user-select: none;">
                        <i class="fa-solid ${vt.icon} me-1 opacity-75"></i> ${vt.label}
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

export function toggleViolation(studentId, violationId) {
  const state = getState();
  const k = violationsKey();
  
  if (!state.violations) state.violations = {};
  if (!state.violations[k]) state.violations[k] = {};
  if (!state.violations[k][studentId]) state.violations[k][studentId] = {};
  
  // Toggle
  const isViolated = !state.violations[k][studentId][violationId];
  state.violations[k][studentId][violationId] = isViolated;
  
  const vt = VIOLATION_TYPES.find(x => x.id === violationId);
  const vLabel = vt ? vt.label : 'Vi phạm';

  if (isViolated) {
    logTransaction(studentId, -5, 'Vi phạm: ' + vLabel, 'Ghi chung / Nề nếp');
    toast('Đã trừ 5 xu vi phạm: ' + vLabel);
  } else {
    logTransaction(studentId, 5, 'Hủy vi phạm: ' + vLabel, 'Ghi chung / Nề nếp');
    toast('Đã hoàn lại 5 xu hủy vi phạm: ' + vLabel);
  }
  
  // Cleanup if empty
  if (!state.violations[k][studentId][violationId]) {
    delete state.violations[k][studentId][violationId];
  }
  if (Object.keys(state.violations[k][studentId]).length === 0) {
    delete state.violations[k][studentId];
  }
  
  saveState(false);
  window.app.renderPage();
}

export function exportViolationsData(timeType, timeValue) {
  const state = getState();
  const ss = classStudents();
  if (!state.violations) state.violations = {};
  
  if (timeType === 'day') {
    const key = state.activeClassId + '_' + timeValue;
    const vio = state.violations[key] || {};
    
    const rows = ss.map((s, i) => {
      const sVio = vio[s.id] || {};
      const row = { 'STT': i + 1, 'Họ tên': s.name };
      VIOLATION_TYPES.forEach(vt => {
        row[vt.label] = sVio[vt.id] ? 'x' : '';
      });
      return row;
    });
    
    downloadXlsx([['Vi phạm', rows]], `vi-pham-${activeClass().name}-${timeValue}.xlsx`);
    return;
  }
  
  // Summary
  const matchingKeys = Object.keys(state.violations).filter(k => {
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
    VIOLATION_TYPES.forEach(vt => counts[vt.id] = 0);
    
    matchingKeys.forEach(k => {
      const sVio = state.violations[k][s.id] || {};
      VIOLATION_TYPES.forEach(vt => {
        if (sVio[vt.id]) counts[vt.id]++;
      });
    });
    
    VIOLATION_TYPES.forEach(vt => {
      row['Tổng ' + vt.label] = counts[vt.id];
    });
    
    return row;
  });
  
  downloadXlsx([['Tổng hợp Vi phạm', rows]], `tong-hop-vi-pham-${activeClass().name}-${timeValue}.xlsx`);
}
