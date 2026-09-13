'use strict';

import { getState, saveState } from '../state.js';
import { esc } from '../utils.js';
import { uid } from '../config.js';

export function openSafeUrl(encoded) {
  let u = decodeURIComponent(encoded);
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  window.open(u, '_blank', 'noopener');
}

export function renderLinks() {
  const state = getState();
  const ls = [...state.links].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-link text-primary me-2"></i>Liên kết Tiện ích</h2>
        <p>Lưu website, học liệu, Google Meet/Zoom và tài liệu hay dùng.</p>
      </div>
      <button class="btn btn-primary" onclick="window.app.openLinkModal()"><i class="fa-solid fa-plus me-1"></i>Thêm liên kết</button>
    </div>
    ${
      ls.length
        ? `
      <div class="link-grid">
        ${ls
          .map(
            l => `
          <div class="card link-card hover-lift">
            <div class="d-flex gap-3">
              <div class="link-icon"><i class="fa-solid fa-link"></i></div>
              <div class="flex-fill min-width-0">
                <div class="d-flex justify-content-between">
                  <h5 class="fw-bold mb-1">${esc(l.name)} ${l.pinned ? '📌' : ''}</h5>
                </div>
                <span class="badge text-bg-light">${esc(l.category)}</span>
                <p class="text-muted small mt-2 mb-2">${esc(l.desc || '')}</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-primary" onclick="window.app.openSafeUrl('${encodeURIComponent(l.url)}')">Mở liên kết</button>
                  <button class="icon-btn" onclick="window.app.openLinkModal('${l.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="icon-btn text-danger" onclick="window.app.deleteLink('${l.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
        : `
      <div class="card empty">
        <i class="fa-solid fa-book-open fs-1 mb-2"></i>
        <h5>Chưa có liên kết tiện ích nào</h5>
        <p>Hãy tạo các liên kết cố định cho lớp học.</p>
      </div>
    `
    }
  `;
}

export function openLinkModal(id = '') {
  const state = getState();
  const l = state.links.find(x => x.id === id) || { name: '', url: 'https://', category: 'Học liệu & SGK', desc: '', pinned: false };
  window.app.showModal(
    id ? 'Sửa liên kết' : 'Thêm Liên Kết Mới',
    `
    <form onsubmit="window.app.saveLink(event,'${id}')">
      <div class="mb-3">
        <label class="form-label fw-bold">Tên liên kết / Trang web *</label>
        <input id="lName" class="form-control" required value="${esc(l.name)}">
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Địa chỉ URL (Link) *</label>
        <input id="lUrl" class="form-control" required value="${esc(l.url)}">
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Danh mục</label>
        <select id="lCat" class="form-select">
          ${['Học liệu & SGK', 'Google Meet / Zoom', 'Bài tập', 'Trò chơi học tập', 'Tài liệu giáo viên', 'Khác']
            .map(x => `<option ${l.category === x ? 'selected' : ''}>${x}</option>`)
            .join('')}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Mô tả ngắn</label>
        <input id="lDesc" class="form-control" value="${esc(l.desc)}">
      </div>
      <div class="form-check">
        <input id="lPin" class="form-check-input" type="checkbox" ${l.pinned ? 'checked' : ''}>
        <label class="form-check-label fw-bold">Ghim liên kết này lên đầu trang</label>
      </div>
      <div class="text-end mt-4">
        <button class="btn btn-primary">Thêm / Lưu Liên Kết</button>
      </div>
    </form>
  `
  );
}

export function saveLink(e, id) {
  e.preventDefault();
  const state = getState();
  const d = {
    name: document.getElementById('lName').value.trim(),
    url: document.getElementById('lUrl').value.trim(),
    category: document.getElementById('lCat').value,
    desc: document.getElementById('lDesc').value.trim(),
    pinned: document.getElementById('lPin').checked
  };
  if (id) {
    Object.assign(
      state.links.find(x => x.id === id),
      d
    );
  } else {
    state.links.push({ id: uid('l'), ...d });
  }
  saveState();
  if (window.app.mainModal) window.app.mainModal.hide();
  window.app.renderPage();
}

export function deleteLink(id) {
  const state = getState();
  state.links = state.links.filter(x => x.id !== id);
  saveState();
  window.app.renderPage();
}
