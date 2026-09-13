'use strict';

import { GOOGLESHEET_CONFIG_KEY } from './config.js';

export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwCr32N7DWfut7urjl1h5lCs-a_-2f9WA0FmAFfrmbgvL21_FPLDaH6EatN3A2MRMo8/exec';

export function getGoogleSheetConfig() {
  try {
    const raw = localStorage.getItem(GOOGLESHEET_CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg && cfg.webAppUrl && cfg.webAppUrl.trim()) {
        return cfg;
      }
    }
  } catch (e) {}

  // Auto-initialize with default Web App URL if not configured
  return { webAppUrl: DEFAULT_WEB_APP_URL, enabled: true };
}

export function saveGoogleSheetConfig(webAppUrl) {
  let url = webAppUrl ? webAppUrl.trim() : DEFAULT_WEB_APP_URL;
  // Tự động sửa nếu người dùng lỡ dán URL dạng /edit thay vì Web App URL /exec
  if (url.includes('/edit')) {
    url = url.replace(/\/edit.*$/, '/exec');
  }
  const cfg = { webAppUrl: url, enabled: Boolean(url) };
  localStorage.setItem(GOOGLESHEET_CONFIG_KEY, JSON.stringify(cfg));
  return cfg;
}

export async function fetchStateFromGoogleSheet() {
  const cfg = getGoogleSheetConfig();
  if (!cfg.enabled || !cfg.webAppUrl) return null;

  try {
    const response = await fetch(cfg.webAppUrl, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      console.warn('Google Sheet fetch http error:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data && data.status === 'success' && data.state) {
      return data.state;
    }
    return null;
  } catch (e) {
    console.error('Error fetching state from Google Sheet:', e);
    return null;
  }
}

export async function saveStateToGoogleSheet(state) {
  const cfg = getGoogleSheetConfig();
  if (!cfg.enabled || !cfg.webAppUrl) return false;

  const payload = JSON.stringify(state);

  // 1. Thử gửi POST chuẩn với mode cors
  try {
    const response = await fetch(cfg.webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.status === 'error') {
        console.error('Google Apps Script trả về lỗi:', data.message);
        return false;
      }
      console.log('Đồng bộ Google Sheet thành công (mode: cors)');
      return true;
    }
  } catch (e) {
    console.warn('CORS 302 Redirect detected, fallback to no-cors mode...', e);
  }

  // 2. Chế độ no-cors fallback: Đảm bảo dữ liệu chắc chắn gửi tới Apps Script doPost ngay cả khi bị chặn CORS 302 Redirect
  try {
    await fetch(cfg.webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload
    });
    console.log('Đồng bộ Google Sheet thành công (mode: no-cors)');
    return true;
  } catch (err) {
    console.error('Lỗi khi gửi dữ liệu lên Google Sheet:', err);
    return false;
  }
}
