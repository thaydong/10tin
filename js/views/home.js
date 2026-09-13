'use strict';

import { getState, saveState, activeClass, classStudents } from '../state.js';
import { esc, renderAvatar, isDateInWeek } from '../utils.js';
import { today } from '../config.js';
import { attendanceStatusInfo } from './attendance.js';
import { COMMENDATION_TYPES } from './commendations.js';

export function setHomeHistoryFilter(v) {
  const state = getState();
  state.homeHistoryFilter = v;
  saveState(false);
  window.app.renderPage();
}

export function eventRow(ev, s) {
  const d = new Date(ev.date);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dateHtml = `
    <div class="text-center" style="width: 40px; line-height: 1.2">
      <div class="fw-bold" style="font-size:0.85rem; color:var(--primary-color)">${days[d.getDay()]}</div>
      <div class="text-muted" style="font-size:0.7rem">${d.getDate()}/${d.getMonth()+1}</div>
    </div>
  `;

  if (ev.type === 'att') {
    const info = attendanceStatusInfo(ev.status);
    return `
      <div class="rank-row">
        ${dateHtml}
        ${renderAvatar(s, 'mini-avatar')}
        <div>
          <div class="fw-bold">${esc(s.name)}</div>
          <div class="text-muted small">${info.label}</div>
        </div>
        <span class="status-pill ${ev.status}"><i class="fa-solid ${info.icon}"></i> ${info.label}</span>
      </div>
    `;
  } else if (ev.type === 'com') {
    return `
      <div class="rank-row">
        ${dateHtml}
        ${renderAvatar(s, 'mini-avatar')}
        <div style="min-width:0; flex:1">
          <div class="fw-bold text-truncate">${esc(s.name)}</div>
          <div class="text-success small text-truncate fw-bold" title="${esc(ev.com.type)}">${esc(ev.com.type)}</div>
        </div>
        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
          <i class="fa-solid fa-award me-1"></i>+${ev.com.coins || 3} xu
        </span>
      </div>
    `;
  } else {
    return `
      <div class="rank-row">
        ${dateHtml}
        ${renderAvatar(s, 'mini-avatar')}
        <div style="min-width:0; flex:1">
          <div class="fw-bold text-truncate">${esc(s.name)}</div>
          <div class="text-danger small text-truncate" title="${esc(ev.vio.type)}">${esc(ev.vio.type)}</div>
        </div>
        <span class="status-pill unexcused"><i class="fa-solid fa-triangle-exclamation"></i> Vi phạm</span>
      </div>
    `;
  }
}

export function rankRow(s, i) {
  const ss = classStudents();
  const max = Math.max(1, ...ss.map(x => x.coins || 0));
  return `
    <div class="rank-row">
      <div class="rank-no">${i + 1}</div>
      ${renderAvatar(s, 'mini-avatar')}
      <div>
        <div class="fw-bold">${esc(s.name)}</div>
        <div class="progress-thin">
          <div style="width:${Math.round(((s.coins || 0) / max) * 100)}%"></div>
        </div>
      </div>
      <span class="coin-pill"><i class="fa-solid fa-coins"></i>${s.coins || 0}</span>
    </div>
  `;
}

export function drawHomeChart(chartRefs) {
  const ctx = document.getElementById('homeChart');
  if (!ctx || !window.Chart) return;
  const ss = [...classStudents()];
  if (ss.length === 0) return;

  const isWarm = document.documentElement.getAttribute('data-theme') === 'warm';
  const bgColor = isWarm ? '#f97316' : '#14b8a6';
  const hoverBgColor = isWarm ? '#ea580c' : '#0d9488';

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ss.map(s => s.name.split(' ').slice(-2).join(' ')),
      datasets: [{
        label: 'Xu thi đua',
        data: ss.map(s => s.coins || 0),
        backgroundColor: bgColor,
        hoverBackgroundColor: hoverBgColor,
        borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        maxBarThickness: 32,
        categoryPercentage: 0.8,
        barPercentage: 0.85
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { family: "'Be Vietnam Pro', sans-serif", size: 13, weight: 'bold' },
          bodyFont: { family: "'Be Vietnam Pro', sans-serif", size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context) => ` Xu thi đua: ${context.parsed.y} xu`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(226, 232, 240, 0.7)',
            drawBorder: false
          },
          ticks: {
            font: { family: "'Be Vietnam Pro', sans-serif", size: 11, weight: '600' },
            color: '#64748b',
            maxRotation: 45,
            minRotation: 35
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(226, 232, 240, 0.7)',
            drawBorder: false
          },
          ticks: {
            font: { family: "'Be Vietnam Pro', sans-serif", size: 11, weight: '600' },
            color: '#64748b',
            precision: 0
          }
        }
      }
    }
  });
  if (chartRefs) chartRefs.push(chart);
  return chart;
}

export function renderHome() {
  const state = getState();
  const ss = classStudents();
  const attKey = state.activeClassId + '_' + today();
  const att = (state.attendance && state.attendance[attKey]) || {};
  const present = ss.filter(s => (att[s.id] || 'present') === 'present').length;
  const totalCoins = ss.reduce((a, s) => a + (s.coins || 0), 0);

  const attEvents = [];
  const vioEvents = [];
  const comEvents = [];

  // Attendance
  Object.entries(state.attendance || {}).forEach(([k, attMap]) => {
    if (!k.startsWith(state.activeClassId + '_')) return;
    const dateStr = k.substring(state.activeClassId.length + 1);
    if (attMap && typeof attMap === 'object') {
      Object.entries(attMap).forEach(([sid, status]) => {
        if (status !== 'present') attEvents.push({ type: 'att', date: dateStr, sid, status });
      });
    }
  });

  // Violations
  Object.entries(state.violations || {}).forEach(([k, viosMap]) => {
    if (!k.startsWith(state.activeClassId + '_')) return;
    const dateStr = k.substring(state.activeClassId.length + 1);
    if (viosMap && typeof viosMap === 'object') {
      Object.entries(viosMap).forEach(([sid, viosObj]) => {
        if (viosObj && typeof viosObj === 'object') {
          Object.keys(viosObj).forEach(vioId => {
            if (viosObj[vioId]) {
              const vt = window.app && window.app.VIOLATION_TYPES ? window.app.VIOLATION_TYPES.find(x => x.id === vioId) : null;
              const vioLabel = vt ? vt.label : (vioId === 'late' ? 'Đi học trễ' : vioId === 'no_lesson' ? 'Không thuộc bài' : vioId === 'no_hw' ? 'Không làm bài' : vioId === 'no_supplies' ? 'Không mang dụng cụ học tập' : vioId === 'no_uniform' ? 'Không đồng phục' : vioId === 'no_duty' ? 'Không trực nhật' : vioId);
              vioEvents.push({ type: 'vio', date: dateStr, sid, vio: { type: vioLabel } });
            }
          });
        }
      });
    }
  });

  // Commendations
  Object.entries(state.commendations || {}).forEach(([k, comsMap]) => {
    if (!k.startsWith(state.activeClassId + '_')) return;
    const dateStr = k.substring(state.activeClassId.length + 1);
    if (comsMap && typeof comsMap === 'object') {
      Object.entries(comsMap).forEach(([sid, comsObj]) => {
        if (comsObj && typeof comsObj === 'object') {
          Object.keys(comsObj).forEach(cId => {
            if (comsObj[cId]) {
              const ct = COMMENDATION_TYPES.find(x => x.id === cId);
              const cLabel = ct ? ct.label : cId;
              const coins = ct ? ct.coins : 3;
              comEvents.push({ type: 'com', date: dateStr, sid, com: { type: cLabel, coins } });
            }
          });
        }
      });
    }
  });

  const attVioEvents = [...attEvents, ...vioEvents];
  attVioEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
  comEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  const hFilter = state.homeHistoryFilter || 'all';
  const currD = new Date();

  const filterByTime = (list) => {
    if (hFilter === 'day') {
      const t = today();
      return list.filter(e => e.date === t);
    } else if (hFilter === 'week') {
      const firstDayOfYear = new Date(currD.getFullYear(), 0, 1);
      const pastDaysOfYear = (currD - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const currentWeekStr = currD.getFullYear() + '-W' + weekNum.toString().padStart(2, '0');
      return list.filter(e => isDateInWeek(e.date, currentWeekStr));
    } else if (hFilter === 'month') {
      const m = today().slice(0, 7);
      return list.filter(e => e.date.startsWith(m));
    } else if (hFilter === 'year') {
      const y = today().slice(0, 4);
      return list.filter(e => e.date.startsWith(y));
    }
    return list;
  };

  const filteredComEvents = filterByTime(comEvents);
  const filteredAttVioEvents = filterByTime(attVioEvents);

  const comRowsHtml = filteredComEvents.map(ev => {
    const s = ss.find(x => x.id === ev.sid);
    return s ? eventRow(ev, s) : '';
  }).join('');

  const attVioRowsHtml = filteredAttVioEvents.map(ev => {
    const s = ss.find(x => x.id === ev.sid);
    return s ? eventRow(ev, s) : '';
  }).join('');

  const timetableEntries = (state.timetable && state.timetable.entries) || [];

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-sparkles text-primary me-2"></i>Chào mừng đến lớp ${esc(activeClass().name)}</h2>
        <p>Quản lý lớp học, thi đua và hoạt động tương tác trong một nơi.</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" onclick="window.app.navigate('students')"><i class="fa-solid fa-user-plus me-1"></i> Học sinh</button>
        <button class="btn btn-primary" onclick="window.app.navigate('wheel')"><i class="fa-solid fa-wand-magic-sparkles me-1"></i> Quay may mắn</button>
      </div>
    </div>
    <div class="stats-grid mb-3">
      <div class="stat-card">
        <div class="label">Sĩ số lớp</div>
        <div class="value">${ss.length}</div>
        <small>${activeClass().grade}</small>
        <i class="fa-solid fa-users"></i>
      </div>
      <div class="stat-card">
        <div class="label">Đi học hôm nay</div>
        <div class="value">${present}/${ss.length}</div>
        <small>${ss.length ? Math.round((present / ss.length) * 100) : 0}% chuyên cần</small>
        <i class="fa-solid fa-clipboard-check"></i>
      </div>
      <div class="stat-card">
        <div class="label">Tổng xu thi đua</div>
        <div class="value">${totalCoins}</div>
        <small>${(state.transactions || []).filter(x => x.classId === state.activeClassId).length} lượt ghi nhận</small>
        <i class="fa-solid fa-coins"></i>
      </div>
      <div class="stat-card">
        <div class="label">Phần thưởng</div>
        <div class="value">${(state.redemptions || []).filter(x => x.classId === state.activeClassId).length}</div>
        <small>${(state.rewards || []).length} loại quà</small>
        <i class="fa-solid fa-gift"></i>
      </div>
    </div>
    <div class="row mt-3 g-3">
      <div class="col-lg-6 d-flex flex-column gap-3">
        <!-- Khung 1 (Trên - Trái): Thi đua lớp học -->
        <div class="card p-3 d-flex flex-column" style="height: 330px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="fw-bold m-0">Thi đua lớp học</h5>
            <span class="badge bg-success" style="background-color: #059669 !important; font-size: 0.8rem; padding: 6px 12px; border-radius: 999px; font-weight: 700;">Theo thời gian thực</span>
          </div>
          <div class="flex-fill position-relative" style="min-height: 0;">
            ${ss.length === 0
              ? `<div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                   <i class="fa-solid fa-chart-column fa-3x mb-2 text-teal opacity-50"></i>
                   <p class="m-0 small fw-bold">Chưa có dữ liệu học sinh</p>
                   <small class="text-muted mb-3">Vui lòng thêm danh sách học sinh để hiển thị biểu đồ thi đua.</small>
                   <button class="btn btn-sm btn-primary" onclick="window.app.navigate('students')">
                     <i class="fa-solid fa-user-plus me-1"></i>Thêm học sinh ngay
                   </button>
                 </div>`
              : `<canvas id="homeChart"></canvas>`
            }
          </div>
        </div>

        <!-- Khung 3 (Dưới - Trái): Thời khóa biểu hôm nay -->
        <div class="card p-3 d-flex flex-column" style="height: 330px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            ${(() => {
              const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
              const sysDay = new Date().getDay();
              return `<h5 class="fw-bold m-0">Thời khóa biểu (${dayNames[sysDay]})</h5>`;
            })()}
            <button class="btn btn-sm btn-outline-primary" onclick="window.app.navigate('timetable')">Xem TKB</button>
          </div>
          <div class="flex-fill d-flex flex-column justify-content-between py-1" style="min-height: 0; overflow: hidden;">
            ${
            [1, 2, 3, 4, 5].map(i => {
              const slotId = 'S' + i;
              const sysDay = new Date().getDay();
              const todayIndex = (sysDay >= 1 && sysDay <= 5) ? (sysDay - 1) : -1;
              const entry = todayIndex >= 0 ? state.timetable.entries.find(e => e.classId === state.activeClassId && e.day === todayIndex && e.slot === slotId) : null;
              const subject = entry ? entry.subject : 'Trống';
              const time = entry ? entry.time : '--:--';
              return `
            <div class="lesson m-0">
              <div class="d-flex justify-content-between align-items-center">
                <strong>Tiết ${i}: <span class="${subject === 'Trống' ? 'text-muted fw-normal' : ''}">${esc(subject)}</span></strong>
                <span class="text-muted small" style="font-size:0.76rem">${esc(time)}</span>
              </div>
            </div>
          `;
            }).join('')
          }
          </div>
        </div>
      </div>

      <div class="col-lg-6 d-flex flex-column gap-3">
        <!-- Khung 2 (Trên - Phải): Lịch sử Tuyên dương -->
        <div class="card p-3 d-flex flex-column" style="height: 330px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="fw-bold m-0 text-success"><i class="fa-solid fa-award text-warning me-2"></i>Lịch sử Tuyên dương</h5>
            <select class="form-select form-select-sm" style="width:130px" onchange="window.app.setHomeHistoryFilter(this.value)">
              <option value="all" ${hFilter === 'all' ? 'selected' : ''}>Tất cả</option>
              <option value="day" ${hFilter === 'day' ? 'selected' : ''}>Hôm nay</option>
              <option value="week" ${hFilter === 'week' ? 'selected' : ''}>Tuần này</option>
              <option value="month" ${hFilter === 'month' ? 'selected' : ''}>Tháng này</option>
              <option value="year" ${hFilter === 'year' ? 'selected' : ''}>Năm nay</option>
            </select>
          </div>
          <div class="history-list flex-fill" style="overflow-y: auto; min-height: 0;">
            ${filteredComEvents.length ? comRowsHtml : '<div class="empty">Chưa có tuyên dương nào</div>'}
          </div>
        </div>

        <!-- Khung 4 (Dưới - Phải): Lịch sử vắng, đi muộn & Vi phạm -->
        <div class="card p-3 d-flex flex-column" style="height: 330px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="fw-bold m-0 text-danger"><i class="fa-solid fa-triangle-exclamation me-2"></i>Lịch sử vắng, đi muộn & Vi phạm</h5>
            <select class="form-select form-select-sm" style="width:130px" onchange="window.app.setHomeHistoryFilter(this.value)">
              <option value="all" ${hFilter === 'all' ? 'selected' : ''}>Tất cả</option>
              <option value="day" ${hFilter === 'day' ? 'selected' : ''}>Hôm nay</option>
              <option value="week" ${hFilter === 'week' ? 'selected' : ''}>Tuần này</option>
              <option value="month" ${hFilter === 'month' ? 'selected' : ''}>Tháng này</option>
              <option value="year" ${hFilter === 'year' ? 'selected' : ''}>Năm nay</option>
            </select>
          </div>
          <div class="history-list flex-fill" style="overflow-y: auto; min-height: 0;">
            ${filteredAttVioEvents.length ? attVioRowsHtml : '<div class="empty">Chưa có ghi nhận vắng/vi phạm nào</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}
