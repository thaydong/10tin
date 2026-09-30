'use strict';

import { GOOGLESHEET_CONFIG_KEY } from './config.js';

export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwCr32N7DWfut7urjl1h5lCs-a_-2f9WA0FmAFfrmbgvL21_FPLDaH6EatN3A2MRMo8/exec';

export function normalizeGoogleSheetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_WEB_APP_URL;

  let url = rawUrl.trim();
  if (!url) return DEFAULT_WEB_APP_URL;

  if (url.includes('/edit')) {
    url = url.replace(/\/edit.*$/, '/exec');
  }

  if (url.includes('/exec')) {
    return url;
  }

  if (url.includes('/macros/s/')) {
    return url.replace(/\?.*$/, '').replace(/\/$/, '') + '/exec';
  }

  return url;
}

export function getGoogleSheetConfig() {
  try {
    const raw = localStorage.getItem(GOOGLESHEET_CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg && cfg.webAppUrl && cfg.webAppUrl.trim()) {
        return cfg;
      }
    }
  } catch (e) {
    console.warn('Google Sheet config invalid, resetting to default:', e);
  }

  const defaultCfg = {
    webAppUrl: normalizeGoogleSheetUrl(DEFAULT_WEB_APP_URL),
    enabled: true
  };

  try {
    localStorage.setItem(GOOGLESHEET_CONFIG_KEY, JSON.stringify(defaultCfg));
  } catch (e) {
    console.warn('Unable to save default Google Sheet config to localStorage:', e);
  }

  return defaultCfg;
}

export function saveGoogleSheetConfig(webAppUrl) {
  const url = normalizeGoogleSheetUrl(webAppUrl || DEFAULT_WEB_APP_URL);
  const cfg = { webAppUrl: url, enabled: Boolean(url) };
  localStorage.setItem(GOOGLESHEET_CONFIG_KEY, JSON.stringify(cfg));
  return cfg;
}

export async function fetchStateFromGoogleSheet() {
  const cfg = getGoogleSheetConfig();
  const url = normalizeGoogleSheetUrl(cfg.webAppUrl);
  if (!cfg.enabled || !url) return null;

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('Google Sheet fetch http error:', response.status, response.statusText, url);
      return null;
    }

    const text = await response.text();
    if (!text) return null;

    const data = JSON.parse(text);
    if (data && data.status === 'success' && data.state) {
      return data.state;
    }
    console.warn('Google Sheet response did not contain a valid state payload:', data);
    return null;
  } catch (e) {
    console.error('Error fetching state from Google Sheet:', e, url);
    return null;
  }
}

export async function saveStateToGoogleSheet(state) {
  const cfg = getGoogleSheetConfig();
  const url = normalizeGoogleSheetUrl(cfg.webAppUrl);
  if (!cfg.enabled || !url) return false;

  const payload = JSON.stringify(state);

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
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
    console.warn('CORS request failed, fallback to no-cors mode...', e);
  }

  try {
    await fetch(url, {
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
