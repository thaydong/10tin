'use strict';

import { getState, saveState } from '../state.js';
import { esc, toast, downloadXlsx } from '../utils.js';
import { uid } from '../config.js';

export function renderTeachers() {
  const state = getState();
  const teachers = state.teachers || [];
  
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-chalkboard-user text-primary me-2"></i>Quản lý Giáo viên <span class="fs-6 text-muted">${teachers.length} người</span></h2>
        <p>Thêm, sửa, xóa và quản lý danh sách giáo viên trong trường.</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-primary" onclick="window.app.importTeacherList()"><i class="fa-solid fa-clipboard me-1"></i>Dán danh sách</button>
        <button class="btn btn-outline-primary" onclick="window.app.exportTeacherList()"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel</button>
        <button class="btn btn-primary" onclick="window.app.openTeacherModal()"><i class="fa-solid fa-plus me-1"></i>Thêm giáo viên</button>
      </div>
    </div>
    
    <div class="card p-3">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 text-nowrap">
          <thead class="table-light">
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Môn giảng dạy</th>
              <th>Số điện thoại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${teachers.length ? teachers.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="fw-bold text-primary">${esc(t.name)}</td>
                <td>${esc(t.subject || '-')}</td>
                <td>${esc(t.phone || '-')}</td>
                <td>
                  <button class="btn btn-sm btn-light text-primary me-1" onclick="window.app.openTeacherModal('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-sm btn-light text-danger" onclick="window.app.deleteTeacherRecord('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có dữ liệu giáo viên. Vui lòng Thêm giáo viên hoặc Dán danh sách.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function openTeacherModal(id = '') {
  const state = getState();
  const t = id ? state.teachers.find(x => x.id === id) : null;
  const isEdit = !!t;
  
  const html = `
    <form onsubmit="window.app.saveTeacherRecord(event, '${id}')">
      <div class="mb-3">
        <label class="form-label fw-bold">Họ tên Giáo viên</label>
        <input id="tName" class="form-control" required value="${isEdit ? esc(t.name) : ''}" placeholder="Vd: Lê Văn Đông">
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Môn giảng dạy</label>
        <input id="tSubject" class="form-control" value="${isEdit ? esc(t.subject || '') : ''}" placeholder="Vd: Toán">
      </div>
      <div class="mb-4">
        <label class="form-label fw-bold">Số điện thoại</label>
        <input type="tel" id="tPhone" class="form-control" value="${isEdit ? esc(t.phone || '') : ''}" placeholder="Vd: 0905202551">
      </div>
      <div class="text-end">
        <button type="submit" class="btn btn-primary px-4">${isEdit ? 'Lưu thay đổi' : 'Thêm mới'}</button>
      </div>
    </form>
  `;
  window.app.showModal(isEdit ? 'Sửa thông tin Giáo viên' : 'Thêm Giáo viên mới', html);
}

export function saveTeacherRecord(e, id) {
  e.preventDefault();
  const state = getState();
  const d = {
    name: document.getElementById('tName').value.trim(),
    subject: document.getElementById('tSubject').value.trim(),
    phone: document.getElementById('tPhone').value.trim()
  };
  
  if (id) {
    const t = state.teachers.find(x => x.id === id);
    if (t) Object.assign(t, d);
  } else {
    state.teachers.push({ id: uid('t'), ...d });
  }
  
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
  toast('Đã lưu thông tin Giáo viên!');
}

export async function deleteTeacherRecord(id) {
  if (!window.Swal) return;
  const r = await Swal.fire({
    icon: 'warning',
    title: 'Xóa giáo viên này?',
    text: 'Thao tác này không thể hoàn tác.',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });
  if (!r.isConfirmed) return;
  
  const state = getState();
  state.teachers = state.teachers.filter(x => x.id !== id);
  saveState();
  window.app.renderPage();
  toast('Đã xóa Giáo viên!');
}

export function toggleTeacherStatus(id) {
  const state = getState();
  const t = state.teachers.find(x => x.id === id);
  if (t) {
    t.active = !t.active;
    saveState();
    window.app.renderPage();
    toast(t.active ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản!');
  }
}

export async function importTeacherList() {
  if (!window.Swal) return;
  const { value } = await Swal.fire({
    title: 'Dán danh sách Giáo viên',
    input: 'textarea',
    inputPlaceholder: 'Mỗi dòng một người.\\nHoặc copy từ Excel với các cột theo thứ tự: Họ tên [tab] Môn giảng dạy [tab] Số điện thoại',
    showCancelButton: true,
    confirmButtonText: 'Nhập dữ liệu',
    cancelButtonText: 'Hủy'
  });
  
  if (!value) return;
  
  let count = 0;
  const state = getState();
  
  value
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
    .forEach(line => {
      const cols = line.split('\t');
      const name = cols[0]?.trim() || '';
      if (name) {
        state.teachers.push({
          id: uid('t'),
          name: name,
          subject: cols[1]?.trim() || '',
          phone: cols[2]?.trim() || ''
        });
        count++;
      }
    });
    
  if (count > 0) {
    saveState();
    window.app.renderPage();
    toast(`Đã thêm ${count} giáo viên!`);
  }
}

export function exportTeacherList() {
  const state = getState();
  const ts = state.teachers || [];
  if (!ts.length) return toast('Không có dữ liệu!');
  const rows = ts.map((t, i) => ({
    'STT': i + 1,
    'Họ tên': t.name,
    'Môn giảng dạy': t.subject || '',
    'Số điện thoại': t.phone || ''
  }));
  downloadXlsx([['Danh sách giáo viên', rows]], `danh-sach-giao-vien.xlsx`);
}
