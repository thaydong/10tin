'use strict';

import { getState, saveState, activeClass } from '../state.js';
import { esc } from '../utils.js';
import { DAYS, uid } from '../config.js';

export function timeSlots() {
  const state = getState();
  const t = [];
  const sm = ['07:00 - 07:45', '07:50 - 08:35', '08:50 - 09:35', '09:40 - 10:25', '10:30 - 11:15', '11:20 - 12:05'];
  const ch = ['13:00 - 13:45', '13:50 - 14:35', '14:40 - 15:25', '15:40 - 16:25', '16:30 - 17:15', '17:20 - 18:05'];

  if (state.timetable.morning) {
    for (let i = 0; i < state.timetable.morningCount; i++) {
      t.push({ id: 'S' + (i + 1), label: 'Tiết ' + (i + 1) + ' Sáng', time: sm[i] });
    }
  }
  if (state.timetable.afternoon) {
    for (let i = 0; i < state.timetable.afternoonCount; i++) {
      t.push({ id: 'C' + (i + 1), label: 'Tiết ' + (i + 1) + ' Chiều', time: ch[i] });
    }
  }
  return t;
}

export function renderTimetable() {
  const state = getState();
  const slots = timeSlots();
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-calendar-days text-primary me-2"></i>Thời Khóa Biểu ${esc(activeClass().name)}</h2>
        <p>Bấm ô trống để thêm tiết; bấm tiết đã có để chỉnh sửa.</p>
      </div>
      <button class="btn btn-outline-primary" onclick="window.app.openTimetableConfig()"><i class="fa-solid fa-sliders me-1"></i>Cấu hình thời khóa biểu</button>
    </div>
    <div class="timetable">
      <div class="timetable-grid">
        <div class="tt-head">TIẾT</div>
        ${DAYS.map(d => `<div class="tt-head">${d}</div>`).join('')}
        ${slots
          .map(
            slot => `
          <div class="tt-cell tt-time">
            <strong>${slot.label}</strong>
            <small>${slot.time}</small>
          </div>
          ${DAYS.map((d, di) => {
            const e = state.timetable.entries.find(
              x => x.classId === state.activeClassId && x.day === di && x.slot === slot.id
            );
            return `
              <div class="tt-cell" onclick="window.app.openLessonModal(${di},'${slot.id}','${e?.id || ''}')">
                ${
                  e
                    ? `<div class="lesson"><strong>${esc(e.subject)}</strong><div>${esc(e.time)}</div></div>`
                    : '<div class="text-muted text-center mt-3"><i class="fa-solid fa-plus"></i> Thêm tiết</div>'
                }
              </div>
            `;
          }).join('')}
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

export function openTimetableConfig() {
  const state = getState();
  window.app.showModal(
    'Cấu hình Thời Khóa Biểu',
    `
    <form onsubmit="window.app.saveTimetableConfig(event)">
      <div class="grid-equal">
        <div class="card p-3">
          <div class="form-check form-switch">
            <input id="morningOn" class="form-check-input" type="checkbox" ${state.timetable.morning ? 'checked' : ''}>
            <label class="form-check-label fw-bold">☀️ Buổi Sáng</label>
          </div>
          <label class="mt-3 form-label">Số tiết sáng</label>
          <select id="morningCount" class="form-select">
            ${[3, 4, 5, 6].map(n => `<option ${state.timetable.morningCount === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="card p-3">
          <div class="form-check form-switch">
            <input id="afternoonOn" class="form-check-input" type="checkbox" ${state.timetable.afternoon ? 'checked' : ''}>
            <label class="form-check-label fw-bold">🌇 Buổi Chiều</label>
          </div>
          <label class="mt-3 form-label">Số tiết chiều</label>
          <select id="afternoonCount" class="form-select">
            ${[2, 3, 4, 5].map(n => `<option ${state.timetable.afternoonCount === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="text-end mt-3">
        <button class="btn btn-primary">Áp dụng cấu hình</button>
      </div>
    </form>
  `
  );
}

export function saveTimetableConfig(e) {
  e.preventDefault();
  const state = getState();
  state.timetable.morning = document.getElementById('morningOn').checked;
  state.timetable.afternoon = document.getElementById('afternoonOn').checked;
  state.timetable.morningCount = +document.getElementById('morningCount').value;
  state.timetable.afternoonCount = +document.getElementById('afternoonCount').value;
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
}

export function openLessonModal(day, slot, id = '') {
  const state = getState();
  const sl = timeSlots().find(x => x.id === slot);
  const e = state.timetable.entries.find(x => x.id === id) || { subject: '', time: sl?.time || '' };
  window.app.showModal(
    id ? 'Sửa tiết học' : 'Thêm tiết học',
    `
    <form onsubmit="window.app.saveLesson(event,${day},'${slot}','${id}')">
      <div class="mb-3">
        <label class="form-label fw-bold">Chọn nhanh môn học phổ biến</label>
        <div>
          ${state.subjects
            .map(
              x => `
            <button type="button" class="subject-chip" onclick="document.getElementById('lessonSubject').value='${esc(x)}'">${esc(x)}</button>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Tên môn học / Hoạt động *</label>
        <input id="lessonSubject" class="form-control" required value="${esc(e.subject)}">
      </div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-bold">Giáo viên giảng dạy</label>
          <input class="form-control" value="${esc(state.teacher.name)}" disabled>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Khung giờ tiết học</label>
          <select id="lessonTime" class="form-select">
            ${timeSlots().map(t => `<option value="${t.time}" ${e.time === t.time || (!e.time && sl?.time === t.time) ? 'selected' : ''}>${t.label} (${t.time})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="d-flex justify-content-between mt-4">
        ${id ? `<button type="button" class="btn btn-outline-danger" onclick="window.app.deleteLesson('${id}')">Xóa tiết</button>` : '<span></span>'}
        <button class="btn btn-primary">Lưu tiết học</button>
      </div>
    </form>
  `
  );
}

export function saveLesson(e, day, slot, id) {
  e.preventDefault();
  const state = getState();
  const d = {
    subject: document.getElementById('lessonSubject').value.trim(),
    time: document.getElementById('lessonTime').value.trim()
  };
  if (id) {
    Object.assign(
      state.timetable.entries.find(x => x.id === id),
      d
    );
  } else {
    state.timetable.entries.push({
      id: uid('tt'),
      classId: state.activeClassId,
      day,
      slot,
      ...d
    });
  }
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
}

export function deleteLesson(id) {
  const state = getState();
  state.timetable.entries = state.timetable.entries.filter(x => x.id !== id);
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
}
