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
  const sub = document.getElementById('txSubjectFilter')?.value || '';
  const q = (document.getElementById('txSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#txTable tbody tr').forEach(r => {
    const show = (!sub || r.dataset.subject === sub) && r.dataset.search.includes(q);
    r.style.display = show ? '' : 'none';
  });
}

export function drawStatsCharts(chartRefs) {
  const state = getState();
  const isWarm = document.documentElement.getAttribute('data-theme') === 'warm';
  const ss = classStudents();
  const tx = (state.transactions || []).filter(x => x.classId === state.activeClassId);
  const m = ss.filter(s => s.gender === 'Nam').length;
  const f = ss.filter(s => s.gender === 'Nữ').length;
  const o = Math.max(0, ss.length - m - f);

  const g = document.getElementById('genderChart');
  if (g && window.Chart) {
    const genderColors = isWarm ? ['#ea580c', '#fbbf24', '#78350f'] : ['#0ea5e9', '#f472b6', '#94a3b8'];
    chartRefs.push(new Chart(g, {
      type: 'doughnut',
      data: {
        labels: ['Nam', 'Nữ', 'Khác'],
        datasets: [{ data: [m, f, o], backgroundColor: genderColors }]
      },
      options: { maintainAspectRatio: false }
    }));
  }

  const map = {};
  tx.forEach(x => {
    map[x.subject] = (map[x.subject] || 0) + x.amount;
  });

  const sc = document.getElementById('subjectChart');
  if (sc && window.Chart) {
    const subjectBg = isWarm ? 'rgba(234, 88, 12, 0.75)' : 'rgba(20,184,166,.7)';
    chartRefs.push(new Chart(sc, {
      type: 'bar',
      data: {
        labels: Object.keys(map),
        datasets: [{ label: 'Xu ròng', data: Object.values(map), backgroundColor: subjectBg, borderRadius: 7 }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }));
  }
}

export function renderStats() {
  const state = getState();
  const ss = classStudents();
  const tx = (state.transactions || []).filter(x => x.classId === state.activeClassId).slice(0, 18);
  const winner = [...ss].sort((a, b) => (b.coins || 0) - (a.coins || 0))[0] || null;
  const totalCoins = ss.reduce((sum, s) => sum + (s.coins || 0), 0);
  const subjectOptions = [...new Set((state.transactions || []).filter(x => x.classId === state.activeClassId).map(x => x.subject))]
    .map(subject => `<option value="${esc(subject)}">${esc(subject)}</option>`)
    .join('');

  const rowsHtml = tx.length ? tx.map(x => txRow(x)).join('') : '<tr><td colspan="5" class="text-center text-muted">Chưa có giao dịch nào</td></tr>';

  return `
    <div class="section-head">
      <div>
        <h2><i class="fa-solid fa-chart-column text-primary me-2"></i>Thống kê & Báo cáo</h2>
        <p>Theo dõi xu thi đua, học lực và tiến độ của lớp học.</p>
      </div>
    </div>

    <div class="stats-grid mb-3">
      <div class="stat-card">
        <div class="label">Sĩ số</div>
        <div class="value">${ss.length}</div>
        <small>${activeClass()?.name || 'Lớp học'}</small>
        <i class="fa-solid fa-users"></i>
      </div>
      <div class="stat-card">
        <div class="label">Tổng xu</div>
        <div class="value">${totalCoins}</div>
        <small>${tx.length} giao dịch gần đây</small>
        <i class="fa-solid fa-coins"></i>
      </div>
      <div class="stat-card">
        <div class="label">Top học sinh</div>
        <div class="value">${winner ? esc(winner.name) : '—'}</div>
        <small>${winner ? `${winner.coins || 0} xu` : 'Chưa có dữ liệu'}</small>
        <i class="fa-solid fa-award"></i>
      </div>
      <div class="stat-card">
        <div class="label">Đang theo dõi</div>
        <div class="value">${new Set((state.transactions || []).map(x => x.subject)).size}</div>
        <small>môn / nhóm</small>
        <i class="fa-solid fa-chart-simple"></i>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-6">
        <div class="card p-3">
          <h5 class="fw-bold mb-3">Phân bổ giới tính</h5>
          <div style="height: 240px;">
            <canvas id="genderChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card p-3">
          <h5 class="fw-bold mb-3">Xu theo môn / nhóm</h5>
          <div style="height: 240px;">
            <canvas id="subjectChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-3">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h5 class="fw-bold m-0">Bảng giao dịch</h5>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <select id="txSubjectFilter" class="form-select form-select-sm" style="width: 180px;">
            <option value="">Tất cả</option>
            ${subjectOptions}
          </select>
          <input id="txSearch" class="form-control form-control-sm" style="width: 220px;" placeholder="Tìm học sinh / lý do" />
        </div>
      </div>

      <div class="table-responsive">
        <table id="txTable" class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Học sinh</th>
              <th>Môn</th>
              <th>Lý do</th>
              <th>Xu</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function exportStatsXlsx() {
  const state = getState();
  const rows = (state.transactions || []).filter(x => x.classId === state.activeClassId).map(x => ({
    Thời_gian: new Date(x.time).toLocaleString('vi-VN'),
    Học_sinh: x.studentName,
    Môn: x.subject,
    Lý_do: x.reason,
    Xu: x.amount
  }));

  if (!rows.length) {
    toast('Chưa có dữ liệu để xuất Excel', 'info');
    return;
  }

  downloadXlsx([['Giao dịch', rows]], 'bao-cao-thong-ke.xlsx');
}

export function exportStatsPDF() {
  if (!window.jspdf) {
    toast('Trình duyệt chưa hỗ trợ PDF', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const state = getState();
  const rows = (state.transactions || []).filter(x => x.classId === state.activeClassId);

  doc.setFontSize(16);
  doc.text('Báo cáo thống kê lớp học', 14, 16);
  doc.setFontSize(10);
  doc.text(`Tổng giao dịch: ${rows.length}`, 14, 26);
  let y = 38;
  rows.slice(0, 20).forEach(x => {
    const text = `${new Date(x.time).toLocaleDateString('vi-VN')} - ${x.studentName} - ${x.amount} xu`;
    doc.text(text, 14, y);
    y += 8;
  });
  doc.save('bao-cao-thong-ke.pdf');
}
