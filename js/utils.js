'use strict';

export function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(x => x[0])
    .join('')
    .toUpperCase();
}

export function classBadgeName(name) {
  if (!name) return '10CT';
  if (name.length <= 4) return name;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const rest = parts.slice(1).map(x => x[0]).join('').toUpperCase();
    return (first + rest).slice(0, 5);
  }
  return name.slice(0, 4).toUpperCase();
}

export function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

export function renderAvatar(person, cls = '') {
  return person && person.avatar
    ? `<div class="${cls || 'avatar'}"><img src="${person.avatar}" alt=""></div>`
    : `<div class="${cls || 'avatar'}">${esc(initials(person ? person.name : ''))}</div>`;
}

export function toast(title, icon = 'success') {
  if (window.Swal) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 1600,
      timerProgressBar: true
    });
  }
}

export function beep(freq = 660, dur = 0.18, vol = 0.12) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ac.destination);
    g.gain.value = vol;
    o.start();
    setTimeout(() => {
      o.stop();
      ac.close();
    }, dur * 1000);
  } catch (e) {}
}

export function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}

export function readFileData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function downloadBlob(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

export function downloadXlsx(sheets, filename) {
  if (!window.XLSX) return;
  const wb = XLSX.utils.book_new();
  sheets.forEach(([name, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

export function confettiLite() {
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('i');
    p.style.cssText = `position:fixed;z-index:100000;left:${Math.random() * 100}vw;top:-10px;width:8px;height:12px;background:hsl(${Math.random() * 360} 80% 55%);transform:rotate(${Math.random() * 180}deg);transition:all ${1 + Math.random() * 1.4}s ease-in;pointer-events:none`;
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      p.style.top = '105vh';
      p.style.transform += ` translateX(${(Math.random() - 0.5) * 160}px) rotate(720deg)`;
    });
    setTimeout(() => p.remove(), 2600);
  }
}

export function isDateInWeek(dateStr, weekStr) {
  if (!dateStr || !weekStr) return false;
  const [yearStr, weekNumStr] = weekStr.split('-W');
  const d = new Date(dateStr);
  const startOfYear = new Date(yearStr, 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((d.getDay() + 1 + days) / 7);
  return weekNum === parseInt(weekNumStr, 10) && d.getFullYear() === parseInt(yearStr, 10);
}
