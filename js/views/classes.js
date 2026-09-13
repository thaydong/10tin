'use strict';

import { getState, saveState, classStudentsFor } from '../state.js';
import { esc, toast, classBadgeName } from '../utils.js';
import { uid } from '../config.js';

export function renderClasses() {
  const state = getState();
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-school text-primary me-2"></i>Quản lý Danh sách Lớp học</h2>
        <p>Tạo thêm lớp mới hoặc chuyển nhanh không gian quản lý giữa các lớp học.</p>
      </div>
      <button class="btn btn-primary" onclick="openClassModal()"><i class="fa-solid fa-plus me-1"></i>Tạo lớp học mới</button>
    </div>
    <div class="student-grid">
      ${state.classes
        .map(
          c => `
        <div class="card hover-lift p-3">
          <div class="d-flex justify-content-between">
            <div class="avatar">${esc(classBadgeName(c.name))}</div>
            ${c.id === state.activeClassId ? '<span class="badge bg-success align-self-start">Lớp đang chọn</span>' : ''}
          </div>
          <h4 class="fw-bold mt-3 mb-1">${esc(c.name)}</h4>
          <div class="text-muted">${esc(c.grade)} · Năm học ${esc(c.year)}</div>
          <div class="coin-pill mt-2"><i class="fa-solid fa-users"></i>${classStudentsFor(c.id).length} học sinh</div>
          <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <button class="btn btn-sm btn-outline-primary" onclick="window.app.switchClass('${c.id}')">Vào không gian lớp</button>
            <div>
              <button class="icon-btn d-inline-grid" onclick="window.app.openClassModal('${c.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn d-inline-grid text-danger" onclick="window.app.deleteClass('${c.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function openClassModal(id = '') {
  const state = getState();
  const c = state.classes.find(x => x.id === id) || { name: '', grade: 'Khối 1', year: '2026 - 2027' };
  window.app.showModal(
    id ? 'Sửa lớp học' : 'Tạo lớp học mới',
    `
    <form onsubmit="window.app.saveClass(event,'${id}')">
      <div class="mb-3">
        <label class="form-label fw-bold">Tên lớp</label>
        <input id="cName" class="form-control" value="${esc(c.name)}" required placeholder="Ví dụ: 3/1">
      </div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-bold">Khối</label>
          <select id="cGrade" class="form-select">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
              .map(g => `<option ${c.grade === 'Khối ' + g ? 'selected' : ''}>Khối ${g}</option>`)
              .join('')}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Năm học</label>
          <input id="cYear" class="form-control" value="${esc(c.year)}">
        </div>
      </div>
      <div class="text-end mt-4">
        <button class="btn btn-primary"><i class="fa-solid fa-floppy-disk me-1"></i>Lưu lớp</button>
      </div>
    </form>
  `
  );
}

export function saveClass(e, id) {
  e.preventDefault();
  const state = getState();
  const data = {
    name: document.getElementById('cName').value.trim(),
    grade: document.getElementById('cGrade').value,
    year: document.getElementById('cYear').value.trim()
  };
  if (id) {
    Object.assign(
      state.classes.find(x => x.id === id),
      data
    );
  } else {
    const nid = uid('class');
    state.classes.push({ id: nid, ...data, color: '#0d9488' });
    state.seating[nid] = { lanes: 4, seats: 16, mode: '2d', assignments: {} };
    state.activeClassId = nid;
  }
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
  toast('Đã lưu lớp học');
}

export async function deleteClass(id) {
  const state = getState();
  if (state.classes.length === 1) return toast('Phải giữ ít nhất một lớp', 'warning');
  const r = await Swal.fire({
    icon: 'warning',
    title: 'Xóa lớp học?',
    text: 'Học sinh và dữ liệu liên quan của lớp này sẽ bị xóa.',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#dc2626'
  });
  if (!r.isConfirmed) return;
  state.classes = state.classes.filter(c => c.id !== id);
  state.students = state.students.filter(s => s.classId !== id);
  state.transactions = state.transactions.filter(x => x.classId !== id);
  delete state.seating[id];
  if (state.activeClassId === id) state.activeClassId = state.classes[0].id;
  saveState();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
}
