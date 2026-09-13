'use strict';

import { getState, saveState, activeClass, classStudents } from '../state.js';
import { esc, renderAvatar, toast, downloadXlsx, isDateInWeek } from '../utils.js';
import { today } from '../config.js';

export function attKey() {
  const state = getState();
  return state.activeClassId + '_' + (document.getElementById('attDate')?.value || state.attendanceDate || today());
}

export function changeAttendanceDate(v) {
  const state = getState();
  state.attendanceDate = v;
  saveState(false);
  window.app.renderPage();
}

export function attendanceStatusInfo(status) {
  return (
    {
      present: { label: 'Có mặt', icon: 'fa-circle-check' },
      late: { label: 'Đi muộn', icon: 'fa-clock' },
      excused: { label: 'Có phép', icon: 'fa-envelope-open-text' },
      unexcused: { label: 'Không phép', icon: 'fa-circle-xmark' }
    }[status] || { label: 'Có mặt', icon: 'fa-circle-check' }
  );
}

export function attendanceSummary(att, ss) {
  const counts = { present: 0, late: 0, excused: 0, unexcused: 0 };
  ss.forEach(s => counts[att[s.id] || 'present']++);
  return `
    <div class="attendance-summary">
      <div class="att-box present"><strong>${counts.present}</strong>Có mặt</div>
      <div class="att-box late"><strong>${counts.late}</strong>Đi muộn</div>
      <div class="att-box excused"><strong>${counts.excused}</strong>Có phép</div>
      <div class="att-box unexcused"><strong>${counts.unexcused}</strong>Không phép</div>
    </div>
  `;
}

export function renderAttendance() {
  const state = getState();
  const ss = classStudents();
  const date = state.attendanceDate || today();
  const att = state.attendance[state.activeClassId + '_' + date] || {};

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-clipboard-check text-primary me-2"></i>Điểm danh lớp ${esc(activeClass().name)}</h2>
        <p>Ảnh học sinh cạnh tên đã được thu nhỏ lại để không che bố cục. Bấm nhanh vào 1 trong 4 trạng thái cho từng em.</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <input id="attDate" type="date" class="form-control" style="width:160px" value="${date}" onchange="window.app.changeAttendanceDate(this.value)">
        <button class="btn btn-outline-primary" onclick="window.app.openExportModal('attendance')"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel</button>
        <button class="btn btn-primary" onclick="window.app.saveState();window.app.toast('Đã lưu điểm danh')"><i class="fa-solid fa-floppy-disk me-1"></i>Lưu điểm danh</button>
      </div>
    </div>
    ${attendanceSummary(att, ss)}
    <div class="card p-3 mt-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <div class="fw-bold text-primary">Danh sách điểm danh</div>
          <div class="small text-muted">Ảnh cạnh tên là avatar nhỏ, không còn bị phóng lớn như trước.</div>
        </div>
        <div class="small text-muted">Sĩ số: <strong>${ss.length}</strong> học sinh</div>
      </div>
      <div class="attendance-grid">
        ${ss
          .map((s, i) => {
            const st = att[s.id] || 'present';
            const info = attendanceStatusInfo(st);
            return `
            <div class="attendance-card">
              <div class="attendance-card-head">
                <div class="attendance-stt">${i + 1}</div>
                ${renderAvatar(s, 'mini-avatar')}
                <div class="attendance-info">
                  <div class="attendance-name">${esc(s.name)}</div>
                  <div class="attendance-meta">${esc(activeClass().name)}${s.gender ? ` · ${esc(s.gender)}` : ''}</div>
                  <div class="status-pill ${st}"><i class="fa-solid ${info.icon}"></i>${info.label}</div>
                </div>
              </div>
              <div class="attendance-actions">
                ${[
                  ['present', 'Có mặt', 'fa-circle-check'],
                  ['late', 'Đi muộn', 'fa-clock'],
                  ['excused', 'Có phép', 'fa-envelope-open-text'],
                  ['unexcused', 'Không phép', 'fa-circle-xmark']
                ]
                  .map(
                    ([k, l, icon]) => `
                  <button class="attendance-btn ${k} ${st === k ? 'active' : ''}" onclick="window.app.setAttendance('${s.id}','${k}')">
                    <i class="fa-solid ${icon}"></i>${l}
                  </button>
                `
                  )
                  .join('')}
              </div>
              <div class="attendance-note">${s.note ? esc(s.note) : 'Có thể thêm hoặc đổi ảnh học sinh ở mục Học sinh.'}</div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}

export function setAttendance(id, status) {
  const state = getState();
  const k = attKey();
  if (!state.attendance[k]) state.attendance[k] = {};
  state.attendance[k][id] = status;
  saveState(false);
  window.app.renderPage();
}

export function exportAttendanceData(timeType, timeValue) {
  const state = getState();
  const ss = classStudents();
  
  if (timeType === 'day') {
    const att = state.attendance[state.activeClassId + '_' + timeValue] || {};
    const rows = ss.map((s, i) => ({
      'STT': i + 1,
      'Họ tên': s.name,
      'Trạng thái': { present: 'Có mặt', late: 'Đi muộn', excused: 'Có phép', unexcused: 'Không phép' }[att[s.id] || 'present']
    }));
    downloadXlsx([['Điểm danh', rows]], `diem-danh-${activeClass().name}-${timeValue}.xlsx`);
    return;
  }
  
  const matchingKeys = Object.keys(state.attendance || {}).filter(k => {
    if (!k.startsWith(state.activeClassId + '_')) return false;
    if (timeType === 'week') {
      const datePart = k.split('_')[1];
      return isDateInWeek(datePart, timeValue);
    }
    return k.startsWith(state.activeClassId + '_' + timeValue);
  });
  
  const rows = ss.map((s, i) => {
    let present = 0, late = 0, excused = 0, unexcused = 0;
    
    matchingKeys.forEach(k => {
      const status = state.attendance[k][s.id] || 'present';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
      else if (status === 'unexcused') unexcused++;
    });
    
    return {
      'STT': i + 1,
      'Họ tên': s.name,
      'Có mặt': present,
      'Đi muộn': late,
      'Có phép': excused,
      'Không phép': unexcused
    };
  });
  
  downloadXlsx([['Tổng hợp', rows]], `tong-hop-diem-danh-${activeClass().name}-${timeValue}.xlsx`);
}
