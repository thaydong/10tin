'use strict';

import { getState, setState, saveState } from '../state.js';
import { toast, downloadBlob } from '../utils.js';
import { defaultState, today } from '../config.js';

export function renderData() {
  const state = getState();
  const size = (new Blob([JSON.stringify(state)]).size / 1024).toFixed(1);
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-database text-primary me-2"></i>Quản lý Dữ liệu</h2>
        <p>Sao lưu dữ liệu định kỳ để chuyển máy hoặc khôi phục khi cần.</p>
      </div>
    </div>
    <div class="grid-equal">
      <div class="card p-4">
        <h4 class="fw-bold">📦 Sao lưu toàn bộ</h4>
        <p class="text-muted">Xuất mọi lớp, học sinh, điểm danh, xu, lịch, phần thưởng và cài đặt thành một tệp JSON.</p>
        <button class="btn btn-primary" onclick="window.app.exportJSON()"><i class="fa-solid fa-download me-1"></i>Xuất file JSON sao lưu</button>
        <div class="mt-3 small text-muted">Kích thước dữ liệu hiện tại: ~${size} KB</div>
      </div>
      <div class="card p-4">
        <h4 class="fw-bold">♻️ Khôi phục</h4>
        <p class="text-muted">Nhập file JSON đã sao lưu từ ứng dụng này. Dữ liệu hiện tại sẽ được thay thế sau khi xác nhận.</p>
        <button class="btn btn-outline-primary" onclick="document.getElementById('hiddenImport').click()"><i class="fa-solid fa-upload me-1"></i>Nhập file JSON</button>
      </div>
    </div>
    <div class="card p-4 mt-3 border-danger">
      <h4 class="fw-bold text-danger">⚠️ Vùng dữ liệu nguy hiểm</h4>
      <p class="text-muted">Đặt lại toàn bộ ứng dụng về dữ liệu mẫu ban đầu.</p>
      <button class="btn btn-outline-danger" onclick="window.app.resetAllData()"><i class="fa-solid fa-trash-can me-1"></i>Xóa và tạo lại dữ liệu mẫu</button>
    </div>
  `;
}

export function exportJSON() {
  const state = getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `lop-hoc-vui-ve-backup-${today()}.json`);
  toast('Đã xuất bản sao lưu');
}

export async function importJSON(file) {
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    if (!obj.version || !obj.classes || !obj.students) throw new Error('Sai cấu trúc');
    const r = await Swal.fire({
      icon: 'warning',
      title: 'Khôi phục dữ liệu?',
      text: 'Dữ liệu hiện tại sẽ bị thay thế.',
      showCancelButton: true,
      confirmButtonText: 'Khôi phục'
    });
    if (!r.isConfirmed) return;

    setState(obj);
    saveState();
    window.app.buildNav();
    window.app.renderHeader();
    window.app.renderPage();
    toast('Khôi phục thành công');
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'File không hợp lệ', text: e.message });
  }
}

export async function resetAllData() {
  const r = await Swal.fire({
    icon: 'warning',
    title: 'Đặt lại toàn bộ dữ liệu?',
    text: 'Thao tác này không thể hoàn tác nếu chưa sao lưu.',
    showCancelButton: true,
    confirmButtonText: 'Đặt lại',
    confirmButtonColor: '#dc2626'
  });
  if (!r.isConfirmed) return;

  setState(defaultState());
  saveState();
  window.app.buildNav();
  window.app.renderHeader();
  window.app.renderPage();
}
