'use strict';

import { NAV, PAGE_META } from './config.js';
import { getState, saveState, activeClass, classStudents, classStudentsFor, syncFromGoogleSheet, getTheme, applyTheme, toggleTheme, setTheme } from './state.js';
import { esc, renderAvatar, toast, beep, toggleSidebar, classBadgeName } from './utils.js';

import { renderHome, drawHomeChart, rankRow, setHomeHistoryFilter } from './views/home.js';
import { renderClasses, openClassModal, saveClass, deleteClass } from './views/classes.js';
import {
  renderStudents, studentCard, filterStudents, openStudentModal, saveStudent, deleteStudent,
  toggleFavorite, adjustCoins, quickAdjustCoins, resetCoins, pasteStudentList, exportStudentList
} from './views/students.js';
import {
  renderTeachers, openTeacherModal, saveTeacherRecord, deleteTeacherRecord, importTeacherList, toggleTeacherStatus, exportTeacherList
} from './views/teachers.js';
import { renderAttendance, changeAttendanceDate, setAttendance, exportAttendanceData as exportAttendance } from './views/attendance.js';
import { renderViolations, changeViolationsDate, toggleViolation, saveViolationsManually, exportViolationsData as exportViolations } from './views/violations.js';
import { renderCommendations, changeCommendationsDate, toggleCommendation, saveCommendationsManually, exportCommendationsData as exportCommendations } from './views/commendations.js';
import {
  renderSeating, setSeatMode, setLanes, setSeatCount, randomSeat, clearSeats, chooseSeat, exportSeatingPNG,
  dragStudent, dropStudent, removeSeat
} from './views/seating.js';
import {
  renderTimetable, openTimetableConfig, saveTimetableConfig, openLessonModal, saveLesson, deleteLesson
} from './views/timetable.js';
import { renderRewards, openRewardModal, saveReward, deleteReward, redeemReward } from './views/rewards.js';
import {
  renderWheel, positionWheelBalls, selectWheelEffect, setWheelGroup, setWheelExclude,
  spinWheel, showWinner, awardWinner, restoreWheel, restoreAllWheel, clearWheelHistory
} from './views/wheel.js';
import { renderFilm, setFilmExclude, restoreAllFilm, spinFilm, awardFilm } from './views/film.js';
import { renderNoise, classAlert, startQuiet, toggleMic, stopMic } from './views/noise.js';
import {
  renderCountdown, updateCountdownUI, setCountdown, applyTimerInputs, adjustCountdown,
  resetCountdown, toggleCountdown, setTimerColor, setTickLast10
} from './views/countdown.js';
import { renderLinks, openSafeUrl, openLinkModal, saveLink, deleteLink } from './views/links.js';
import { renderStats, drawStatsCharts, filterTxTable, exportStatsXlsx, exportStatsPDF } from './views/stats.js';
import { renderData, exportJSON, importJSON, resetAllData } from './views/data.js';
import { renderSettings, saveTeacher, saveGoogleSheetForm, editSubjects } from './views/settings.js';

let chartRefs = [];
let mainModal = null;

export function buildNav() {
  const state = getState();
  const n = classStudents().length;
  const sideNav = document.getElementById('sideNav');
  if (!sideNav) return;

  const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';

  sideNav.innerHTML = NAV.map(
    ([id, ic, label, b]) => {
      const isDisabled = !isLogged && id !== 'home';
      return `
    <a class="nav-link ${state.currentPage === id ? 'active' : ''}" data-page="${id}" 
       ${isDisabled ? `style="opacity: 0.5; cursor: not-allowed;" onclick="window.app.toast('Vui lòng đăng nhập để sử dụng chức năng này!')"` : `onclick="window.app.navigate('${id}')"`}>
      <i class="fa-solid ${ic}"></i>
      <span>${label}</span>
      ${
        b === 'count'
          ? `<span class="mini-badge new">${n}</span>`
          : b
          ? `<span class="mini-badge ${b === 'NEW' ? 'new' : ''}">${b}</span>`
          : ''
      }
    </a>
  `;
    }
  ).join('');
}

export function renderHeader() {
  applyTheme();
  const state = getState();
  const [t, s] = PAGE_META[state.currentPage] || PAGE_META.home;
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const classSwitcher = document.getElementById('classSwitcher');
  const teacherNameMini = document.getElementById('teacherNameMini');
  const teacherRoleMini = document.getElementById('teacherRoleMini');

  if (pageTitle) pageTitle.textContent = t;
  if (pageSubtitle) pageSubtitle.textContent = s;
  if (classSwitcher) {
    classSwitcher.innerHTML = state.classes
      .map(c => `<option value="${c.id}" ${c.id === state.activeClassId ? 'selected' : ''}>${esc(c.name)} · ${classStudentsFor(c.id).length} HS</option>`)
      .join('');
  }
  if (teacherNameMini) teacherNameMini.textContent = state.teacher.name;
  if (teacherRoleMini) teacherRoleMini.textContent = state.teacher.role + ' · ' + state.teacher.subject;

  const brandLogo = document.querySelector('.brand-logo');
  if (brandLogo) {
    brandLogo.textContent = classBadgeName(activeClass().name);
  }

  const tAvatarMini = document.getElementById('teacherAvatarMini');
  if (tAvatarMini) {
    tAvatarMini.outerHTML = renderAvatar(state.teacher, 'avatar').replace('class="avatar"', 'class="avatar" id="teacherAvatarMini"');
  }

  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLogged) {
      authBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket me-2"></i>Đăng xuất';
    } else {
      authBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i>Đăng nhập';
    }
  }
}

export function navigate(page) {
  const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';
  if (!isLogged && page !== 'home') {
    toast('Vui lòng đăng nhập để sử dụng chức năng này!');
    return;
  }
  const state = getState();
  if (state.currentPage === 'noise' && page !== 'noise') {
    stopMic();
  }
  state.currentPage = page;
  saveState(false);
  buildNav();
  renderHeader();
  renderPage();
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function switchClass(id) {
  const state = getState();
  state.activeClassId = id;
  state.wheelExcluded = [];
  state.filmExcluded = [];
  saveState();
  buildNav();
  renderHeader();
  renderPage();
}

export function renderPage() {
  chartRefs.forEach(c => {
    try {
      c.destroy();
    } catch (e) {}
  });
  chartRefs = [];

  const state = getState();
  const root = document.getElementById('appContent');
  if (!root) return;

  root.classList.remove('fade-in');
  void root.offsetWidth;
  root.classList.add('fade-in');

  const fn =
    {
      home: renderHome,
      classes: renderClasses,
      teachers: renderTeachers,
      students: renderStudents,
      attendance: renderAttendance,
      violations: renderViolations,
      commendations: renderCommendations,
      seating: renderSeating,
      timetable: renderTimetable,
      rewards: renderRewards,
      wheel: renderWheel,
      film: renderFilm,
      noise: renderNoise,
      countdown: renderCountdown,
      links: renderLinks,
      stats: renderStats,
      data: renderData,
      settings: renderSettings
    }[state.currentPage] || renderHome;

  root.innerHTML = fn();
  setTimeout(afterRender, 0);
}

export function afterRender() {
  const state = getState();
  if (state.currentPage === 'home') drawHomeChart(chartRefs);
  if (state.currentPage === 'stats') drawStatsCharts(chartRefs);
  if (state.currentPage === 'wheel') positionWheelBalls();
  if (state.currentPage === 'countdown') updateCountdownUI();
}

export function toggleAuth() {
  const isLogged = sessionStorage.getItem('isLoggedIn') === 'true';
  if (isLogged) {
    sessionStorage.removeItem('isLoggedIn');
    navigate('home');
    buildNav();
    renderHeader();
    toast('Đã đăng xuất!');
  } else {
    const html = `
      <form onsubmit="window.app.processLogin(event)">
        <div class="mb-3">
          <label class="form-label fw-bold">Tài khoản</label>
          <input type="text" id="loginUser" class="form-control" required placeholder="Nhập tài khoản quản trị">
        </div>
        <div class="mb-4">
          <label class="form-label fw-bold">Mật khẩu</label>
          <input type="password" id="loginPass" class="form-control" required placeholder="Nhập mật khẩu">
        </div>
        <div class="text-end">
          <button type="submit" class="btn btn-primary px-4">Đăng nhập</button>
        </div>
      </form>
    `;
    showModal('Đăng nhập hệ thống', html);
  }
}

export function processLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;
  
  if (u === 'admin' && p === 'chuyenltt123') {
    sessionStorage.setItem('isLoggedIn', 'true');
    buildNav();
    renderHeader();
    if (mainModal) mainModal.hide();
    toast('Đăng nhập thành công!');
  } else {
    toast('Tài khoản hoặc mật khẩu không đúng!');
  }
}


export function showModal(title, html) {
  const modalTitle = document.getElementById('mainModalTitle');
  const modalBody = document.getElementById('mainModalBody');
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = html;
  if (mainModal) mainModal.show();
}

export function openExportModal(type) {
  const isAtt = type === 'attendance';
  const html = `
    <div class="mb-3">
      <label class="form-label fw-bold">Chọn phạm vi thời gian:</label>
      <select id="exportTimeType" class="form-select mb-3" onchange="window.app.changeExportTimeType(this.value)">
        <option value="day">Theo ngày (Bảng chi tiết)</option>
        <option value="week">Theo tuần (Bảng tổng hợp)</option>
        <option value="month">Theo tháng (Bảng tổng hợp)</option>
        <option value="year">Cả năm học (Bảng tổng hợp)</option>
      </select>
      
      <label class="form-label fw-bold">Chọn thời gian cụ thể:</label>
      <input type="date" id="exportTimeValue" class="form-control" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="text-end mt-4 border-top pt-3">
      <button class="btn btn-secondary me-2" data-bs-dismiss="modal">Hủy</button>
      <button class="btn btn-primary" onclick="window.app.processExport('${type}')">
        <i class="fa-solid fa-file-excel me-1"></i>Tải Excel
      </button>
    </div>
  `;
  const title = type === 'attendance' ? 'Xuất Excel Điểm Danh' : (type === 'violations' ? 'Xuất Excel Vi Phạm' : 'Xuất Excel Tuyên Dương');
  showModal(title, html);
}

export function changeExportTimeType(val) {
  const input = document.getElementById('exportTimeValue');
  if (!input) return;
  const d = new Date();
  if (val === 'day') {
    input.type = 'date';
    input.value = d.toISOString().split('T')[0];
  } else if (val === 'week') {
    input.type = 'week';
    // Format YYYY-Www, rough estimation for current week
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    input.value = d.getFullYear() + '-W' + weekNum.toString().padStart(2, '0');
  } else if (val === 'month') {
    input.type = 'month';
    input.value = d.toISOString().slice(0, 7);
  } else {
    input.type = 'number';
    input.min = '2000';
    input.max = '2100';
    input.value = d.getFullYear();
  }
}

export function processExport(type) {
  const timeType = document.getElementById('exportTimeType')?.value || 'day';
  const timeValue = document.getElementById('exportTimeValue')?.value;
  
  if (!timeValue) {
    toast('Vui lòng chọn thời gian hợp lệ');
    return;
  }

  if (type === 'attendance') {
    import('./views/attendance.js').then(m => m.exportAttendanceData(timeType, timeValue));
  } else if (type === 'violations') {
    import('./views/violations.js').then(m => m.exportViolationsData(timeType, timeValue));
  } else if (type === 'commendations') {
    import('./views/commendations.js').then(m => m.exportCommendationsData(timeType, timeValue));
  }
  
  const m = window.bootstrap.Modal.getInstance(document.getElementById('mainModal'));
  if (m) m.hide();
}

export function showGuide() {
  if (!window.Swal) return;
  Swal.fire({
    width: 760,
    title: 'Hướng dẫn nhanh',
    html: `
      <div class="text-start">
        <p><b>1. Lớp học:</b> tạo lớp và chọn lớp đang quản lý ở thanh trên.</p>
        <p><b>2. Học sinh:</b> thêm hồ sơ, ảnh, cộng/trừ xu theo môn và lý do.</p>
        <p><b>3. Điểm danh:</b> có 4 trạng thái: Có mặt, Đi muộn, Có phép, Không phép.</p>
        <p><b>4. Sơ đồ lớp:</b> xếp ngẫu nhiên hoặc chọn từng bàn, sau đó xuất PNG.</p>
        <p><b>5. Trò chơi:</b> Vòng quay và Cuộn phim chọn ngẫu nhiên, có thể loại người đã trúng và thưởng xu.</p>
        <p><b>6. Chống ồn:</b> cảnh báo toàn màn hình, timer im lặng, đo âm lượng microphone.</p>
        <p><b>7. Báo cáo:</b> thống kê theo học sinh/môn, xuất XLSX và PDF.</p>
        <p><b>8. Dữ liệu:</b> mọi thứ lưu trong <code>localStorage</code>; nên xuất JSON để sao lưu.</p>
      </div>
    `,
    confirmButtonText: 'Đã hiểu'
  });
}

// Attach all methods to window for seamless inline event handlers
const appMethods = {
  navigate,
  switchClass,
  toggleTheme,
  applyTheme,
  setTheme,
  buildNav,
  renderHeader,
  renderPage,
  afterRender,
  showModal,
  showGuide,
  toggleAuth,
  processLogin,
  saveState,
  toast,
  beep,
  toggleSidebar,
  openExportModal,
  changeExportTimeType,
  processExport,
  openClassModal,
  saveClass,
  deleteClass,
  openTeacherModal,
  saveTeacherRecord,
  deleteTeacherRecord,
  importTeacherList,
  toggleTeacherStatus,
  exportTeacherList,
  studentCard,
  filterStudents,
  openStudentModal,
  saveStudent,
  deleteStudent,
  toggleFavorite,
  adjustCoins,
  quickAdjustCoins,
  resetCoins,
  pasteStudentList,
  exportStudentList,
  changeAttendanceDate,
  setAttendance,
  exportAttendance,
  changeViolationsDate,
  toggleViolation,
  saveViolationsManually,
  exportViolations,
  changeCommendationsDate,
  toggleCommendation,
  saveCommendationsManually,
  exportCommendations,
  setSeatMode,
  setLanes,
  setSeatCount,
  randomSeat,
  clearSeats,
  chooseSeat,
  exportSeatingPNG,
  dragStudent,
  dropStudent,
  removeSeat,
  openTimetableConfig,
  saveTimetableConfig,
  openLessonModal,
  saveLesson,
  deleteLesson,
  openRewardModal,
  saveReward,
  deleteReward,
  redeemReward,
  selectWheelEffect,
  setWheelGroup,
  setWheelExclude,
  setHomeHistoryFilter,
  spinWheel,
  showWinner,
  awardWinner,
  restoreWheel,
  restoreAllWheel,
  clearWheelHistory,
  setFilmExclude,
  restoreAllFilm,
  spinFilm,
  awardFilm,
  classAlert,
  startQuiet,
  toggleMic,
  stopMic,
  adjustCountdown,
  resetCountdown,
  toggleCountdown,
  setTickLast10,
  applyTimerInputs,
  setCountdown,
  setTimerColor,
  openLinkModal,
  saveLink,
  deleteLink,
  openSafeUrl,
  filterTxTable,
  exportStatsXlsx,
  exportStatsPDF,
  exportJSON,
  importJSON,
  resetAllData,
  saveTeacher,
  saveGoogleSheetForm,
  editSubjects
};

// Bind methods to window directly and window.app
Object.assign(window, appMethods);
window.app = appMethods;

function startApp() {
  const modalEl = document.getElementById('mainModal');
  if (modalEl && window.bootstrap) {
    mainModal = new bootstrap.Modal(modalEl);
    window.app.mainModal = mainModal;
  }

  // Tự động mở khoá quyền quản trị mặc định cho Giáo viên
  if (sessionStorage.getItem('isLoggedIn') === null) {
    sessionStorage.setItem('isLoggedIn', 'true');
  }

  buildNav();
  renderHeader();
  renderPage();

  // Background Google Sheet Sync check
  syncFromGoogleSheet(() => {
    buildNav();
    renderHeader();
    renderPage();
  });

  const hiddenImport = document.getElementById('hiddenImport');
  if (hiddenImport) {
    hiddenImport.addEventListener('change', e => {
      if (e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = '';
    });
  }
}

// Immediate check for document ready state to fix ES Module defer timing
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  startApp();
} else {
  document.addEventListener('DOMContentLoaded', startApp);
}
