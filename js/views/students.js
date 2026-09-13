'use strict';

import { getState, saveState, activeClass, classStudents, logTransaction } from '../state.js';
import { esc, renderAvatar, toast, readFileData, downloadXlsx } from '../utils.js';
import { uid } from '../config.js';

export function studentCard(s) {
  return `
    <div class="card hover-lift student-card" data-name="${esc(s.name.toLowerCase())}">
      <div class="student-top" style="cursor: pointer" onclick="window.app.openStudentModal('${s.id}')">
        ${renderAvatar(s, 'student-avatar')}
        <div>
          <div class="student-name">${esc(s.name)} ${s.favorite ? '<i class="fa-solid fa-star text-warning" title="Yêu thích"></i>' : ''}</div>
          <div class="text-muted small">${esc(activeClass().name)} · ${esc(s.gender || '')}</div>
          <span class="coin-pill"><i class="fa-solid fa-coins"></i>${s.coins || 0} xu</span>
        </div>
      </div>
      <div class="student-actions">
        <button class="icon-btn plus-btn" onclick="window.app.quickAdjustCoins('${s.id}', 5)"><i class="fa-solid fa-plus"></i></button>
        <button class="icon-btn minus-btn" onclick="window.app.quickAdjustCoins('${s.id}', -5)"><i class="fa-solid fa-minus"></i></button>
        <button class="icon-btn" title="Yêu thích" onclick="window.app.toggleFavorite('${s.id}')"><i class="fa-${s.favorite ? 'solid' : 'regular'} fa-star"></i></button>
        <button class="icon-btn" onclick="window.app.openStudentModal('${s.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn text-danger" onclick="window.app.deleteStudent('${s.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `;
}

export function renderStudents() {
  const ss = classStudents();
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-graduation-cap text-primary me-2"></i>Danh sách ${esc(activeClass().name)} <span class="fs-6 text-muted">${ss.length} học sinh</span></h2>
        <p>Cộng/trừ xu, chỉnh sửa hồ sơ và chọn nhóm yêu thích.</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-primary" onclick="window.app.navigate('wheel')"><i class="fa-solid fa-wand-magic-sparkles me-1"></i>Trò chơi Vòng quay</button>
        <button class="btn btn-outline-primary" onclick="window.app.resetCoins()"><i class="fa-solid fa-rotate-left me-1"></i>Đặt xu về 50</button>
        <button class="btn btn-outline-primary" onclick="window.app.pasteStudentList()"><i class="fa-solid fa-clipboard me-1"></i>Dán danh sách</button>
        <button class="btn btn-outline-primary" onclick="window.app.exportStudentList()"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel</button>
        <button class="btn btn-primary" onclick="window.app.openStudentModal()"><i class="fa-solid fa-plus me-1"></i>Thêm học sinh</button>
      </div>
    </div>
    <div class="mb-3">
      <input id="studentSearch" class="form-control" placeholder="🔎 Tìm học sinh..." oninput="window.app.filterStudents(this.value)">
    </div>
    <div class="student-grid" id="studentGrid">
      ${ss.map(studentCard).join('')}
    </div>
  `;
}

export function filterStudents(q) {
  q = q.toLowerCase();
  document.querySelectorAll('#studentGrid .student-card').forEach(x => {
    x.style.display = x.dataset.name.includes(q) ? '' : 'none';
  });
}

export function openStudentModal(id = '') {
  const state = getState();
  const s = state.students.find(x => x.id === id) || { name: '', gender: 'Nữ', coins: 50, avatar: '', note: '', favorite: false };
  window.app.showModal(
    id ? 'Sửa học sinh' : 'Thêm học sinh',
    `
    <form onsubmit="window.app.saveStudent(event,'${id}')">
      <div class="row g-3">
        <div class="col-md-8">
          <label class="form-label fw-bold">Họ và tên *</label>
          <input id="sName" class="form-control" required value="${esc(s.name)}">
        </div>
        <div class="col-md-4">
          <label class="form-label fw-bold">Giới tính</label>
          <select id="sGender" class="form-select">
            <option ${s.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
            <option ${s.gender === 'Nam' ? 'selected' : ''}>Nam</option>
            <option ${s.gender === 'Khác' ? 'selected' : ''}>Khác</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-bold">Xu hiện có</label>
          <input id="sCoins" type="number" min="0" class="form-control" value="${s.coins}">
        </div>
        <div class="col-md-8">
          <label class="form-label fw-bold">Ảnh đại diện</label>
          <input id="sAvatar" type="file" accept="image/*" class="form-control">
          <input id="sAvatarOld" type="hidden" value="${esc(s.avatar || '')}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Họ tên Ba</label>
          <input id="sDadName" class="form-control" value="${esc(s.dadName || '')}" placeholder="Nhập họ tên ba">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Số điện thoại Ba</label>
          <input type="tel" id="sDadPhone" class="form-control" value="${esc(s.dadPhone || '')}" placeholder="Ví dụ: 0901234567">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Họ tên Mẹ</label>
          <input id="sMomName" class="form-control" value="${esc(s.momName || '')}" placeholder="Nhập họ tên mẹ">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Số điện thoại Mẹ</label>
          <input type="tel" id="sMomPhone" class="form-control" value="${esc(s.momPhone || '')}" placeholder="Ví dụ: 0901234567">
        </div>
        <div class="col-12">
          <label class="form-label fw-bold">Địa chỉ</label>
          <input id="sAddress" class="form-control" value="${esc(s.address || '')}" placeholder="Nhập địa chỉ nhà">
        </div>
        <div class="col-12">
          <label class="form-label fw-bold">Ghi chú</label>
          <textarea id="sNote" class="form-control">${esc(s.note || '')}</textarea>
        </div>
        <div class="col-12 form-check ms-2">
          <input id="sFav" class="form-check-input" type="checkbox" ${s.favorite ? 'checked' : ''}>
          <label class="form-check-label fw-bold">Thêm vào nhóm yêu thích</label>
        </div>
      </div>
      <div class="text-end mt-4">
        <button class="btn btn-primary">Lưu học sinh</button>
      </div>
    </form>
  `
  );
}

export async function saveStudent(e, id) {
  e.preventDefault();
  const state = getState();
  let avatar = document.getElementById('sAvatarOld').value;
  const f = document.getElementById('sAvatar').files[0];
  if (f) avatar = await readFileData(f);

  const d = {
    name: document.getElementById('sName').value.trim(),
    gender: document.getElementById('sGender').value,
    coins: +document.getElementById('sCoins').value || 0,
    avatar,
    dadName: document.getElementById('sDadName').value.trim(),
    dadPhone: document.getElementById('sDadPhone').value.trim(),
    momName: document.getElementById('sMomName').value.trim(),
    momPhone: document.getElementById('sMomPhone').value.trim(),
    address: document.getElementById('sAddress').value.trim(),
    note: document.getElementById('sNote').value.trim(),
    favorite: document.getElementById('sFav').checked
  };

  if (id) {
    Object.assign(
      state.students.find(x => x.id === id),
      d
    );
  } else {
    state.students.push({
      id: uid('s'),
      classId: state.activeClassId,
      ...d
    });
  }

  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
  toast('Đã lưu học sinh');
}

export async function deleteStudent(id) {
  const state = getState();
  const s = state.students.find(x => x.id === id);
  const r = await Swal.fire({
    icon: 'warning',
    title: 'Xóa học sinh?',
    text: s?.name || '',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    confirmButtonColor: '#dc2626'
  });
  if (!r.isConfirmed) return;

  state.students = state.students.filter(x => x.id !== id);
  Object.values(state.seating).forEach(cfg => {
    Object.keys(cfg.assignments || {}).forEach(k => {
      if (cfg.assignments[k] === id) delete cfg.assignments[k];
    });
  });

  saveState();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
}

export function toggleFavorite(id) {
  const state = getState();
  const s = state.students.find(x => x.id === id);
  if (s) {
    s.favorite = !s.favorite;
    saveState(false);
    window.app.renderPage();
  }
}

export async function adjustCoins(id, sign) {
  const state = getState();
  const s = state.students.find(x => x.id === id);
  if (!s) return;

  const { value: v } = await Swal.fire({
    title: (sign > 0 ? 'Cộng' : 'Trừ') + ' xu cho ' + s.name,
    html: `
      <div class="text-start">
        <label class="form-label fw-bold">Số xu</label>
        <select id="coinAmount" class="form-select">
          <option>1</option><option>2</option><option>3</option><option>5</option>
          <option selected>10</option><option>15</option><option>20</option>
        </select>
        <label class="form-label fw-bold mt-3">Môn / nhóm</label>
        <select id="coinSubject" class="form-select">
          ${state.subjects.map(x => `<option>${esc(x)}</option>`).join('')}
        </select>
        <label class="form-label fw-bold mt-3">Lý do</label>
        <input id="coinReason" class="form-control" placeholder="Phát biểu tốt, hoàn thành bài...">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Xác nhận',
    preConfirm: () => ({
      amount: +document.getElementById('coinAmount').value,
      subject: document.getElementById('coinSubject').value,
      reason: document.getElementById('coinReason').value || 'Điều chỉnh xu'
    })
  });

  if (!v) return;
  logTransaction(id, sign * v.amount, v.reason, v.subject);
  window.app.renderPage();
  toast('Đã cập nhật xu');
}

export function quickAdjustCoins(id, amount) {
  const state = getState();
  const s = state.students.find(x => x.id === id);
  if (!s) return;
  const reason = amount > 0 ? 'Thưởng nhanh' : 'Phạt nhanh';
  logTransaction(id, amount, reason, 'Ghi chung / Nề nếp');
  window.app.renderPage();
  toast(amount > 0 ? `Đã cộng ${amount} xu` : `Đã trừ ${-amount} xu`);
}

export async function resetCoins() {
  const r = await Swal.fire({
    icon: 'warning',
    title: 'Đặt xu cả lớp về 50?',
    showCancelButton: true,
    confirmButtonText: 'Đặt về 50'
  });
  if (!r.isConfirmed) return;
  classStudents().forEach(s => (s.coins = 50));
  saveState();
  window.app.renderPage();
}

export async function pasteStudentList() {
  const state = getState();
  const { value } = await Swal.fire({
    title: 'Dán danh sách học sinh',
    input: 'textarea',
    inputPlaceholder: 'Mỗi dòng một học sinh\nNguyễn Văn A\nTrần Thị B',
    showCancelButton: true,
    confirmButtonText: 'Thêm danh sách'
  });
  if (!value) return;

  value
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
    .forEach(name =>
      state.students.push({
        id: uid('s'),
        classId: state.activeClassId,
        name,
        gender: '',
        coins: 50,
        avatar: '',
        favorite: false,
        note: ''
      })
    );

  saveState();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
}

export function exportStudentList() {
  const ss = classStudents();
  if (!ss.length) return toast('Không có dữ liệu!');
  const rows = ss.map((s, i) => ({
    'STT': i + 1,
    'Họ tên': s.name,
    'Giới tính': s.gender || '',
    'Xu': s.coins || 0,
    'Họ tên Ba': s.dadName || '',
    'SĐT Ba': s.dadPhone || '',
    'Họ tên Mẹ': s.momName || '',
    'SĐT Mẹ': s.momPhone || '',
    'Địa chỉ': s.address || '',
    'Ghi chú': s.note || '',
    'Yêu thích': s.favorite ? 'Có' : 'Không'
  }));
  downloadXlsx([['Danh sách học sinh', rows]], `hoc-sinh-${activeClass().name}.xlsx`);
}
