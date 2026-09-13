'use strict';

import { getState, activeClass, classStudents } from '../state.js';
import { esc, downloadXlsx, toast } from '../utils.js';
import { rankRow } from './home.js';

export function txRow(x) {
  return `
    <tr data-subject="${esc(x.subject)}" data-search="${esc((x.studentName + ' ' + x.reason).toLowerCase())}">
      <td>${new Date(x.time).toLocaleString('vi-VN')}</td>
      <td>${esc(x.studentName)}</td>
      <td>${esc(x.subject)}</td>
      <td>${esc(x.reason)}</td>
      <td><span class="badge ${x.amount >= 0 ? 'bg-success' : 'bg-danger'}">${x.amount >= 0 ? '+' : ''}${x.amount}</span></td>
    </tr>
  `;
}

export function filterTxTable() {
  const sub = document.getElementById('txSubjectFilter').value;
  const q = document.getElementById('txSearch').value.toLowerCase();
  document.querySelectorAll('#txTable tbody tr').forEach(r => {
    r.style.display = (!sub || r.dataset.subject === sub) && r.dataset.search.includes(q) ? '' : 'none';
  });
}

export function drawStatsCharts(chartRefs) {
  const state = getState();
  const isWarm = document.documentElement.getAttribute('data-theme') === 'warm';
  const ss = classStudents();
  const tx = state.transactions.filter(x => x.classId === state.activeClassId);
  const m = ss.filter(s => s.gender === 'Nam').length;
  const f = ss.filter(s => s.gender === 'Nữ').length;
  const o = ss.length - m - f;

  const g = document.getElementById('genderChart');
  if (g && window.Chart) {
    const genderColors = isWarm ? ['#ea580c', '#fbbf24', '#78350f'] : ['#0ea5e9', '#f472b6', '#94a3b8'];
    chartRefs.push(
      new Chart(g, {
        type: 'doughnut',
        data: {
          labels: ['Nam', 'Nữ', 'Khác'],
          datasets: [{ data: [m, f, o], backgroundColor: genderColors }]
        },
        options: { maintainAspectRatio: false }
      })
    );
  }

  const map = {};
  tx.forEach(x => (map[x.subject] = (map[x.subject] || 0) + x.amount));
  const sc = document.getElementById('subjectChart');
  if (sc && window.Chart) {
    const subjectBg = isWarm ? 'rgba(234, 88, 12, 0.75)' : 'rgba(20,184,166,.7)';
    chartRefs.push(
      new Chart(sc, {
        type: 'bar',
        data: {
          labels: Object.keys(map),
          datasets: [{ label: 'Xu ròng', data: Object.values(map), backgroundColor: subjectBg, borderRadius: 7 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
      })
    );
  }

  const cc = document.getElementById('coinChart');
  if (cc && window.Chart) {
    const lineBorder = isWarm ? '#ea580c' : '#0d9488';
    const lineBg = isWarm ? 'rgba(234, 88, 12, 0.18)' : 'rgba(13,148,136,.12)';
    chartRefs.push(
      new Chart(cc, {
        type: 'line',
        data: {
          labels: ss.map(s => s.name.split(' ').slice(-2).join(' ')),
          datasets: [
            { label: 'Xu', data: ss.map(s => s.coins), borderColor: lineBorder, backgroundColor: lineBg, fill: true, tension: 0.3 }
          ]
        },
        options: { maintainAspectRatio: false }
      })
    );
  }
}

export function exportStatsXlsx() {
  const state = getState();
  const ss = classStudents().map((s, i) => ({ STT: i + 1, 'Học sinh': s.name, 'Giới tính': s.gender, 'Xu': s.coins }));
  const tx = state.transactions
    .filter(x => x.classId === state.activeClassId)
    .map(x => ({
      'Thời gian': new Date(x.time).toLocaleString('vi-VN'),
      'Học sinh': x.studentName,
      'Môn': x.subject,
      'Lý do': x.reason,
      'Xu': x.amount
    }));
  const red = state.redemptions
    .filter(x => x.classId === state.activeClassId)
    .map(x => ({
      'Thời gian': new Date(x.time).toLocaleString('vi-VN'),
      'Học sinh': x.studentName,
      'Quà': x.rewardName,
      'Chi phí xu': x.cost
    }));

  downloadXlsx([['Xếp hạng', ss], ['Cộng trừ xu', tx], ['Đổi quà', red]], `bao-cao-${activeClass().name}.xlsx`);
}

export async function exportStatsPDF() {
  if (!window.html2canvas || !window.jspdf) return;
  const el = document.getElementById('statsReport');
  const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: '#fff' });
  const img = canvas.toDataURL('image/jpeg', 0.92);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const w = 190;
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(img, 'JPEG', 10, 10, w, h);
  pdf.save(`bao-cao-${activeClass().name}.pdf`);
  toast('Đã tạo PDF');
}

export function renderStats() {
  const state = getState();
  const ss = classStudents();
  const tx = state.transactions.filter(x => x.classId === state.activeClassId);
  const total = ss.reduce((a, s) => a + s.coins, 0);
  const plus = tx.filter(x => x.amount > 0).length;
  const minus = tx.filter(x => x.amount < 0).length;
  const male = ss.filter(s => s.gender === 'Nam').length;
  const female = ss.filter(s => s.gender === 'Nữ').length;

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-chart-column text-primary me-2"></i>Thống Kê Điểm Xu & Lịch Sử Tích Đổi</h2>
        <p>Tổng hợp thi đua theo lớp, theo môn và nhật ký cộng/trừ điểm.</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" onclick="window.app.exportStatsXlsx()"><i class="fa-solid fa-file-excel me-1"></i>Xuất Excel đầy đủ</button>
        <button class="btn btn-primary" onclick="window.app.exportStatsPDF()"><i class="fa-solid fa-file-pdf me-1"></i>Xuất PDF</button>
      </div>
    </div>
    <div id="statsReport">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Sĩ số học sinh</div>
          <div class="value">${ss.length}</div>
          <small>${male} Nam · ${female} Nữ</small>
          <i class="fa-solid fa-users"></i>
        </div>
        <div class="stat-card">
          <div class="label">Tổng xu thi đua</div>
          <div class="value">${total}</div>
          <small>${ss.length ? Math.round(total / ss.length) : 0} xu TB/HS</small>
          <i class="fa-solid fa-coins"></i>
        </div>
        <div class="stat-card">
          <div class="label">Lượt cộng (+xu)</div>
          <div class="value">${plus}</div>
          <small>Khen thưởng ghi nhận</small>
          <i class="fa-solid fa-plus"></i>
        </div>
        <div class="stat-card">
          <div class="label">Lượt trừ (-xu)</div>
          <div class="value">${minus}</div>
          <small>Nhắc nhở nề nếp</small>
          <i class="fa-solid fa-minus"></i>
        </div>
      </div>
      <div class="grid-equal mt-3">
        <div class="card p-3">
          <h5 class="fw-bold">Bảng Xếp Hạng Xu Thi Đua</h5>
          ${[...ss].sort((a, b) => b.coins - a.coins).map((s, i) => rankRow(s, i)).join('')}
        </div>
        <div class="card p-3">
          <h5 class="fw-bold">Cơ Cấu Học Sinh & Tỷ Lệ Thi Đua</h5>
          <div style="height:280px"><canvas id="genderChart"></canvas></div>
        </div>
      </div>
      <div class="grid-equal mt-3">
        <div class="card p-3">
          <h5 class="fw-bold">Thống kê theo môn học</h5>
          <div style="height:300px"><canvas id="subjectChart"></canvas></div>
        </div>
        <div class="card p-3">
          <h5 class="fw-bold">Xu theo học sinh</h5>
          <div style="height:300px"><canvas id="coinChart"></canvas></div>
        </div>
      </div>
    </div>
    <div class="card p-3 mt-3">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <h5 class="fw-bold">Lịch sử Cộng / Trừ Chi Tiết (${tx.length})</h5>
        <div class="d-flex gap-2">
          <select id="txSubjectFilter" class="form-select form-select-sm" onchange="window.app.filterTxTable()">
            <option value="">Tất cả môn</option>
            ${state.subjects.map(x => `<option>${esc(x)}</option>`).join('')}
          </select>
          <input id="txSearch" class="form-control form-control-sm" placeholder="Tìm tên / lý do" oninput="window.app.filterTxTable()">
        </div>
      </div>
      <div class="table-responsive">
        <table class="table mt-2" id="txTable">
          <thead>
            <tr><th>Thời gian</th><th>Học sinh</th><th>Môn</th><th>Lý do</th><th>Xu</th></tr>
          </thead>
          <tbody>${tx.map(txRow).join('')}</tbody>
        </table>
      </div>
    </div>
  `;
}
