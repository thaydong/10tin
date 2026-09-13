'use strict';

import { STORAGE_KEY, defaultState, uid } from './config.js';
import { nowTime } from './utils.js';
import { saveStateToGoogleSheet, fetchStateFromGoogleSheet } from './googlesheet.js';

let state = null;

export function loadState() {
  try {
    const x = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (x && x.version) {
      state = x;
      // Auto-migrate default class name if it was 9/1
      const c91 = state.classes?.find(c => c.name === '9/1');
      if (c91) {
        c91.name = '10 Chuyên Tin';
        c91.grade = 'Khối 10';
      }
      if (!state.timetable || !state.timetable.entries || state.timetable.entries.length === 0) {
        state.timetable = defaultState().timetable;
      }
      if (!state.teachers) state.teachers = [];
      if (!state.students) state.students = [];
      const defaultSts = defaultState().students;
      const cSts = state.students.filter(s => s.classId === (state.activeClassId || 'class_10ctin'));
      if (cSts.length < 15) {
        defaultSts.forEach(ds => {
          if (!state.students.some(s => s.id === ds.id || s.name === ds.name)) {
            state.students.push(ds);
          }
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch(e) {}
      }
      if (!state.classes) state.classes = defaultState().classes;
      if (!state.attendance) state.attendance = {};
      if (!state.violations) state.violations = {};
      if (!state.commendations) state.commendations = {};
      if (!state.links) state.links = [];
      if (!state.rewards) state.rewards = [];
      if (!state.transactions) state.transactions = [];
      if (!state.redemptions) state.redemptions = [];
      if (!state.wheelHistory) state.wheelHistory = [];
      if (!state.filmHistory) state.filmHistory = [];
    } else {
      state = defaultState();
    }
  } catch (e) {
    state = defaultState();
  }
  return state;
}

// Initialize state after variable declaration
state = loadState();

export function getState() {
  if (!state) {
    state = loadState();
  }
  return state;
}

export function getTheme() {
  const s = getState();
  return s.theme || (s.settings && s.settings.theme) || localStorage.getItem('gvcn_theme') || 'teal';
}

export function applyTheme(themeName) {
  const t = themeName || getTheme();
  document.documentElement.setAttribute('data-theme', t);
  const label = document.getElementById('themeToggleLabel');
  const btn = document.getElementById('themeToggleBtn');
  if (label) {
    label.textContent = t === 'warm' ? 'Theme Nâu Ấm' : 'Theme Xanh';
  }
  if (btn) {
    btn.setAttribute('title', t === 'warm' ? 'Chuyển sang Theme Xanh hệ thống' : 'Chuyển sang Theme Nâu Ấm mới');
  }
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'warm' ? 'teal' : 'warm';
  setTheme(next);
}

export function setTheme(nextTheme) {
  const s = getState();
  s.theme = nextTheme;
  if (!s.settings) s.settings = {};
  s.settings.theme = nextTheme;
  localStorage.setItem('gvcn_theme', nextTheme);
  applyTheme(nextTheme);
  saveState(false);
  if (window.renderHeader) window.renderHeader();
  if (window.renderPage) window.renderPage();
}

export function setState(newState) {
  state = newState;
  return state;
}

export async function syncFromGoogleSheet(onSuccessCallback) {
  const remoteState = await fetchStateFromGoogleSheet();
  if (remoteState && remoteState.version) {
    state = remoteState;
    if (!state.students) state.students = [];
    const defaultSts = defaultState().students;
    const cSts = state.students.filter(s => s.classId === (state.activeClassId || 'class_10ctin'));
    if (cSts.length < 15) {
      defaultSts.forEach(ds => {
        if (!state.students.some(s => s.id === ds.id || s.name === ds.name)) {
          state.students.push(ds);
        }
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveState(false);
    if (typeof onSuccessCallback === 'function') {
      onSuccessCallback();
    }
  }
}

export function saveState(show = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  const p = document.getElementById('savePill');
  if (p) {
    p.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>Đã lưu ${nowTime()}`;
  }

  // Sync to Google Sheet in background (non-blocking)
  saveStateToGoogleSheet(state).then(success => {
    if (success && p) {
      p.innerHTML = `<i class="fa-solid fa-cloud-check me-1"></i>Đã lưu Sheet ${nowTime()}`;
    }
  });
}

export function activeClass() {
  const s = getState();
  return s.classes.find(c => c.id === s.activeClassId) || s.classes[0];
}

export function classStudents() {
  const s = getState();
  return s.students.filter(x => x.classId === s.activeClassId);
}

export function classStudentsFor(id) {
  const s = getState();
  return s.students.filter(x => x.classId === id);
}

export function logTransaction(studentId, amount, reason = 'Điều chỉnh xu', subject = 'Ghi chung / Nề nếp') {
  const s = getState();
  const st = s.students.find(x => x.id === studentId);
  if (!st) return;
  st.coins = Math.max(0, (st.coins || 0) + amount);
  s.transactions.unshift({
    id: uid('tx'),
    classId: st.classId,
    studentId,
    studentName: st.name,
    amount,
    reason,
    subject,
    time: new Date().toISOString()
  });
  saveState(false);
}
