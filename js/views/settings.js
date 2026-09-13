'use strict';

import { getState, saveState } from '../state.js';
import { esc, renderAvatar, readFileData, toast } from '../utils.js';
import { getGoogleSheetConfig, saveGoogleSheetConfig } from '../googlesheet.js';

export function renderSettings() {
  const state = getState();
  const gsCfg = getGoogleSheetConfig();
  const gsConnected = Boolean(gsCfg.enabled && gsCfg.webAppUrl);

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-gear text-primary me-2"></i>Cài đặt Hệ Thống & Hồ Sơ Giáo Viên</h2>
        <p>Cập nhật thông tin cá nhân giáo viên, ảnh đại diện và danh sách môn học.</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="card setting-box">
        <h5 class="fw-bold"><i class="fa-regular fa-user text-primary me-1"></i>Thông Tin & Ảnh Đại Diện Giáo Viên</h5>
        <form onsubmit="saveTeacher(event)">
          <div class="d-flex gap-3 align-items-center p-3 mt-3 rounded-4" style="border:2px dashed #99f6e4;background:#f0fdfa">
            ${renderAvatar(state.teacher, 'student-avatar')}
            <div class="flex-fill">
              <strong>Ảnh Đại Diện Giáo Viên</strong>
              <div class="small text-muted">JPG, PNG, WEBP. Ảnh được lưu trực tiếp trong trình duyệt.</div>
              <input id="teacherAvatarInput" type="file" accept="image/*" class="form-control mt-2">
            </div>
          </div>
          <div class="mt-3">
            <label class="form-label fw-bold">Họ và tên Giáo viên *</label>
            <input id="tName" class="form-control" required value="${esc(state.teacher.name)}">
          </div>
          <div class="row g-3 mt-0">
            <div class="col-md-6">
              <label class="form-label fw-bold">Vai trò / Chức vụ</label>
              <input id="tRole" class="form-control" value="${esc(state.teacher.role)}">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Môn giảng dạy</label>
              <input id="tSubject" class="form-control" value="${esc(state.teacher.subject)}">
            </div>
          </div>
          <div class="mt-3">
            <label class="form-label fw-bold">Tên trường học</label>
            <input id="tSchool" class="form-control" value="${esc(state.teacher.school)}">
          </div>
          <div class="text-end mt-4">
            <button class="btn btn-primary"><i class="fa-solid fa-floppy-disk me-1"></i>Lưu Hồ Sơ Giáo Viên</button>
          </div>
        </form>
      </div>
      <div>
        <div class="card setting-box">
          <h5 class="fw-bold text-primary"><i class="fa-solid fa-palette me-2"></i>Giao diện & Theme</h5>
          <p class="text-muted small">Chuyển đổi giữa Theme Xanh hệ thống và Theme Nâu Ấm mới.</p>
          <div class="row g-2 mt-1">
            <div class="col-6">
              <div class="p-3 rounded-4 border text-center ${state.theme !== 'warm' ? 'shadow-sm' : ''}" 
                   onclick="window.app.setTheme('teal')" 
                   style="cursor:pointer; background: linear-gradient(135deg, #ccfbf1, #f0fdfa); border: 2px solid ${state.theme !== 'warm' ? '#0d9488' : '#cbd5e1'} !important;">
                <div class="fw-bold" style="color:#0f766e"><i class="fa-solid fa-circle-check me-1"></i>Theme Xanh</div>
                <small class="text-muted">Mặc định hệ thống</small>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 rounded-4 border text-center ${state.theme === 'warm' ? 'shadow-sm' : ''}" 
                   onclick="window.app.setTheme('warm')" 
                   style="cursor:pointer; background: linear-gradient(135deg, #fffbeb, #ffedd5); border: 2px solid ${state.theme === 'warm' ? '#ea580c' : '#cbd5e1'} !important;">
                <div class="fw-bold" style="color:#ea580c"><i class="fa-solid fa-fire me-1"></i>Theme Nâu Ấm</div>
                <small class="text-muted">Mẫu màu theo ảnh</small>
              </div>
            </div>
          </div>
        </div>
        <div class="card setting-box mt-3">
          <h5 class="fw-bold text-primary">✨ Mẹo Dành Cho Giáo Viên</h5>
          <ul class="mt-3">
            <li class="mb-2">Cộng xu khi học sinh phát biểu hăng hái để tăng động lực.</li>
            <li class="mb-2">Dùng Vòng quay hoặc Cuộn phim để sinh hoạt và gọi tên vui tươi.</li>
            <li class="mb-2">Xuất file JSON sao lưu thường xuyên để dữ liệu luôn an toàn.</li>
            <li>Dùng microphone Chống Ồn khi trình duyệt cho phép truy cập.</li>
          </ul>
        </div>
        <div class="card setting-box mt-3">
          <h5 class="fw-bold">📚 Danh sách môn học</h5>
          <p class="text-muted small">Các môn này xuất hiện khi cộng/trừ xu và lập thời khóa biểu.</p>
          <div>${state.subjects.map(x => `<span class="subject-chip">${esc(x)}</span>`).join('')}</div>
          <button class="btn btn-outline-primary mt-3" onclick="editSubjects()">Tùy chỉnh danh sách môn</button>
        </div>
        <div class="card setting-box mt-3">
          <h5 class="fw-bold text-primary"><i class="fa-solid fa-file-excel me-2"></i>Cấu Hình Google Sheet Database</h5>
          <p class="text-muted small">Tự động đồng bộ toàn bộ dữ liệu ứng dụng trực tiếp lên Google Sheets cá nhân của bạn.</p>
          <form onsubmit="saveGoogleSheetForm(event)">
            <div class="mb-3">
              <label class="form-label fw-bold">Google Apps Script Web App URL</label>
              <input id="gsUrl" class="form-control" placeholder="https://script.google.com/macros/s/.../exec" value="${esc(gsCfg.webAppUrl || '')}">
              <div class="form-text mt-1">Copy mã trong file <code>google_script.gs</code> vào Google Apps Script và dán URL Web App vào đây.</div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <span class="badge ${gsConnected ? 'bg-success' : 'bg-secondary'}">
                <i class="fa-solid ${gsConnected ? 'fa-circle-check' : 'fa-circle-exclamation'} me-1"></i>
                ${gsConnected ? 'Đã kết nối Google Sheet' : 'Chưa kết nối Google Sheet'}
              </span>
              <button class="btn btn-primary btn-sm"><i class="fa-solid fa-link me-1"></i>Lưu cấu hình Cloud</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export async function saveTeacher(e) {
  e.preventDefault();
  const state = getState();
  const f = document.getElementById('teacherAvatarInput').files[0];
  if (f) state.teacher.avatar = await readFileData(f);
  state.teacher.name = document.getElementById('tName').value.trim();
  state.teacher.role = document.getElementById('tRole').value.trim();
  state.teacher.subject = document.getElementById('tSubject').value.trim();
  state.teacher.school = document.getElementById('tSchool').value.trim();
  saveState();
  if (window.renderHeader) window.renderHeader();
  if (window.renderPage) window.renderPage();
  toast('Đã cập nhật thông tin giáo viên');
}

export function saveGoogleSheetForm(e) {
  e.preventDefault();
  const url = document.getElementById('gsUrl').value;
  saveGoogleSheetConfig(url);
  saveState();
  if (window.renderPage) window.renderPage();
  toast('Đã lưu cấu hình và đồng bộ dữ liệu lên Google Sheet');
}

export async function editSubjects() {
  const state = getState();
  const { value } = await Swal.fire({
    title: 'Tùy chỉnh danh sách môn',
    input: 'textarea',
    inputValue: state.subjects.join('\n'),
    inputLabel: 'Mỗi dòng một môn / nhóm',
    showCancelButton: true,
    confirmButtonText: 'Lưu danh sách'
  });
  if (value === undefined) return;
  state.subjects = value
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);
  saveState();
  if (window.renderPage) window.renderPage();
}

