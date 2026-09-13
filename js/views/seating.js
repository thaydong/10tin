'use strict';

import { getState, saveState, activeClass, classStudents } from '../state.js';
import { esc, renderAvatar, toast } from '../utils.js';

export function seatingCfg() {
  const state = getState();
  if (!state.seating[state.activeClassId]) {
    state.seating[state.activeClassId] = { lanes: 4, seats: 16, mode: '2d', assignments: {} };
  }
  return state.seating[state.activeClassId];
}

export function seatIndicesForLane(total, lanes, lane) {
  const arr = [];
  for (let i = lane; i < total; i += lanes) arr.push(i);
  return arr;
}

export function seatHtml(idx, cfg) {
  const state = getState();
  const sid = cfg.assignments[idx];
  const s = state.students.find(x => x.id === sid);
  return `
    <div class="seat ${s ? 'filled' : ''}" 
         onclick="window.app.chooseSeat(${idx})"
         ondragover="event.preventDefault()"
         ondragenter="event.preventDefault()"
         ondrop="window.app.dropStudent(event, ${idx})"
         ${s ? `draggable="true" ondragstart="window.app.dragStudent(event, '${s.id}', ${idx})"` : ''}>
      ${s ? `<button class="btn btn-danger position-absolute rounded-circle p-0" style="width:22px;height:22px;top:-6px;right:-6px;z-index:10;font-size:12px;line-height:1;box-shadow:0 2px 5px rgba(0,0,0,0.2)" onclick="event.stopPropagation(); window.app.removeSeat(${idx})" title="Xóa khỏi bàn"><i class="fa-solid fa-xmark"></i></button>` : ''}
      <div>
        <small>Bàn ${idx + 1}</small>
        ${
          s
            ? `<div class="d-flex gap-2 align-items-center mt-1">${renderAvatar(s, 'mini-avatar')}<strong style="font-size:.8rem">${esc(s.name)}</strong></div>`
            : '<div class="text-primary mt-2 text-center fs-4"><i class="fa-solid fa-circle-plus"></i></div><div class="text-muted text-center" style="font-size:0.75rem">Chọn HS</div>'
        }
      </div>
    </div>
  `;
}

export function renderSeating() {
  const cfg = seatingCfg();
  const ss = classStudents();
  const state = getState();
  const assigned = new Set(Object.values(cfg.assignments || {}));
  const unassigned = ss.filter(s => !assigned.has(s.id));

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-border-all text-primary me-2"></i>Sơ đồ chỗ ngồi ${esc(activeClass().name)}</h2>
        <p>Chọn số dãy, xếp ngẫu nhiên hoặc bấm từng bàn để chọn học sinh.</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <div class="btn-group">
          <button class="btn ${cfg.mode === '3d' ? 'btn-primary' : 'btn-outline-primary'}" onclick="window.app.setSeatMode('3d')"><i class="fa-solid fa-cube"></i> 3D</button>
          <button class="btn ${cfg.mode !== '3d' ? 'btn-primary' : 'btn-outline-primary'}" onclick="window.app.setSeatMode('2d')"><i class="fa-solid fa-layer-group"></i> 2D</button>
        </div>
        <select class="form-select" style="width:120px" onchange="window.app.setLanes(+this.value)">
          ${[2, 3, 4, 6].map(x => `<option ${cfg.lanes === x ? 'selected' : ''} value="${x}">${x} Dãy</option>`).join('')}
        </select>
        <select class="form-select" style="width:140px" onchange="window.app.setSeatCount(+this.value)">
          ${[ss.length, 16, 20, 24, 30, 36]
            .filter((x, i, a) => x > 0 && a.indexOf(x) === i)
            .sort((a, b) => a - b)
            .map(x => `<option ${cfg.seats === x ? 'selected' : ''} value="${x}">${x} bàn</option>`)
            .join('')}
        </select>
        <button class="btn btn-outline-primary" onclick="window.app.randomSeat()"><i class="fa-solid fa-shuffle me-1"></i>Xếp tất cả</button>
        <button class="btn btn-outline-primary" onclick="window.app.clearSeats()"><i class="fa-solid fa-rotate-left me-1"></i>Xóa xếp chỗ</button>
        <button class="btn btn-primary" onclick="window.app.exportSeatingPNG()"><i class="fa-solid fa-image me-1"></i>Xuất PNG</button>
      </div>
    </div>
    <div class="grid-2">
      <div class="board-wrap" id="seatingExport">
        <div class="class-board ${cfg.mode === '3d' ? 'mode-3d' : ''}">
          <div class="chalkboard">
            ✦ KỶ LUẬT · TRI THỨC · SÁNG TẠO ✦<br>
            <span style="font-size:1.3rem">★ BẢNG LỚP ${esc(activeClass().name)} ★</span><br>
            <small>Niên khóa: ${esc(activeClass().year)} · GVCN: ${esc(state.teacher.name)} · Sĩ số: ${ss.length}</small>
          </div>
          <div class="teacher-desk">
            <i class="fa-solid fa-desktop me-1"></i>BÀN GIÁO VIÊN<br>
            <small>${esc(state.teacher.name)}</small>
          </div>
          <div class="seat-grid" style="grid-template-columns:repeat(${cfg.lanes},minmax(130px,1fr))">
            ${Array.from({ length: cfg.lanes }, (_, lane) => `
              <div class="seat-lane">
                <div class="lane-label">📌 DÃY ${lane + 1}</div>
                ${seatIndicesForLane(cfg.seats, cfg.lanes, lane).map(idx => seatHtml(idx, cfg)).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="card p-3">
        <h5 class="fw-bold">Học sinh chưa xếp (${unassigned.length})</h5>
        ${
          unassigned.length
            ? unassigned.map(s => `<div class="d-flex align-items-center gap-2 border-bottom py-2" draggable="true" ondragstart="window.app.dragStudent(event, '${s.id}')" style="cursor:grab">${renderAvatar(s, 'mini-avatar')}<strong>${esc(s.name)}</strong></div>`).join('')
            : '<div class="alert alert-success">✓ Tất cả học sinh đã có chỗ ngồi!</div>'
        }
      </div>
    </div>
  `;
}

export function setSeatMode(m) {
  seatingCfg().mode = m;
  saveState(false);
  window.app.renderPage();
}

export function setLanes(n) {
  seatingCfg().lanes = n;
  saveState(false);
  window.app.renderPage();
}

export function setSeatCount(n) {
  const cfg = seatingCfg();
  cfg.seats = n;
  Object.keys(cfg.assignments).forEach(k => {
    if (+k >= n) delete cfg.assignments[k];
  });
  saveState(false);
  window.app.renderPage();
}

export function randomSeat() {
  const cfg = seatingCfg();
  const ids = classStudents().map(s => s.id).sort(() => Math.random() - 0.5);
  cfg.assignments = {};
  ids.slice(0, cfg.seats).forEach((id, i) => (cfg.assignments[i] = id));
  saveState();
  window.app.renderPage();
  toast('Đã xếp chỗ ngẫu nhiên');
}

export function clearSeats() {
  seatingCfg().assignments = {};
  saveState();
  window.app.renderPage();
}

export async function chooseSeat(idx) {
  const cfg = seatingCfg();
  const used = new Set(Object.values(cfg.assignments));
  const options = classStudents().filter(s => !used.has(s.id) || cfg.assignments[idx] === s.id);
  const { value } = await Swal.fire({
    title: 'Chọn học sinh cho bàn ' + (idx + 1),
    input: 'select',
    inputOptions: Object.fromEntries([['', '-- Bàn trống --'], ...options.map(s => [s.id, s.name])]),
    inputValue: cfg.assignments[idx] || '',
    showCancelButton: true,
    confirmButtonText: 'Xếp chỗ'
  });

  if (value === undefined) return;
  if (value) cfg.assignments[idx] = value;
  else delete cfg.assignments[idx];

  saveState();
  window.app.renderPage();
}

export async function exportSeatingPNG() {
  if (!window.html2canvas) return;
  const el = document.getElementById('seatingExport');
  
  // Hide delete buttons before export
  el.querySelectorAll('.delete-seat-btn, .btn-danger.position-absolute').forEach(btn => btn.style.display = 'none');
  
  const c = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  
  // Restore delete buttons
  el.querySelectorAll('.delete-seat-btn, .btn-danger.position-absolute').forEach(btn => btn.style.display = '');

  const a = document.createElement('a');
  a.download = `so-do-lop-${activeClass().name}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
  toast('Đã xuất ảnh sơ đồ');
}

let currentDragData = null;

export function dragStudent(e, studentId, fromIdx = null) {
  currentDragData = { studentId, fromIdx };
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'move';
  }
}

export function dropStudent(e, toIdx) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!currentDragData) return;
  
  try {
    const { studentId, fromIdx } = currentDragData;
    currentDragData = null; // reset
    
    const cfg = seatingCfg();
    const existingStudentId = cfg.assignments[toIdx];
    
    if (fromIdx !== null) {
      if (existingStudentId) cfg.assignments[fromIdx] = existingStudentId;
      else delete cfg.assignments[fromIdx];
    }
    
    cfg.assignments[toIdx] = studentId;
    saveState();
    window.app.renderPage();
  } catch (err) {
    console.error('Drop error', err);
  }
}

export function removeSeat(idx) {
  const cfg = seatingCfg();
  delete cfg.assignments[idx];
  saveState();
  window.app.renderPage();
}
