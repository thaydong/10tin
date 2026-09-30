"use strict";

/*
  Frontend JavaScript không thể bảo vệ tuyệt đối mã nguồn đã gửi tới trình duyệt.
  Đây chỉ là lớp hạn chế thao tác người dùng phổ thông.

  Không đặt trong frontend:
  - API secret
  - database password
  - service role key
  - private key
  - admin password
  - token bí mật

  Các dữ liệu nhạy cảm phải đặt ở server/backend/Edge Function.
*/

(function () {
  var globalScope = typeof window !== "undefined" ? window : undefined;

  if (!globalScope || !globalScope.document) {
    return;
  }

  var existing = globalScope.WebProtection || {};
  var DEFAULT_CONFIG = {
    disableRightClick: true,
    disableDevToolsShortcuts: true,
    disableViewSource: true,
    disableSavePage: true,
    disableDrag: true,
    disableCopy: false,
    detectDevTools: true,
    showWarning: true,
    warningDuration: 1800
  };

  var state = {
    enabled: true,
    initialized: false,
    devToolsDetected: false,
    devToolsCheckCount: 0,
    overlay: null,
    toast: null,
    toastTimer: null,
    devToolsTimer: null,
    config: {}
  };

  function mergeConfig(source) {
    var target = Object.assign({}, DEFAULT_CONFIG);

    if (!source || typeof source !== "object") {
      return target;
    }

    Object.keys(source).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = source[key];
      }
    });

    return target;
  }

  function isMobileDevice() {
    var userAgent = navigator.userAgent || "";
    var mobileRegex = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;
    var touchSupport = "ontouchstart" in window;
    var widthLow = window.innerWidth <= 768;

    return mobileRegex.test(userAgent) || (touchSupport && widthLow);
  }

  function isAutomationEnvironment() {
    return !!(navigator && navigator.webdriver) || !!window.__PLAYWRIGHT__ || !!window.__automation__ || !!window.__devtools;
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }

    var element = target.nodeType === 1 ? target : target.parentElement;

    if (!element) {
      return false;
    }

    if (element.matches) {
      if (element.matches("input, textarea, select, [contenteditable='true'], [contenteditable=''], [contenteditable]")) {
        return true;
      }
    }

    if (element.closest) {
      return !!element.closest("input, textarea, select, [contenteditable='true'], [contenteditable=''], [contenteditable]");
    }

    return false;
  }

  function createStyleTag() {
    if (document.getElementById("web-protection-styles")) {
      return;
    }

    var style = document.createElement("style");
    style.id = "web-protection-styles";
    style.textContent = "" +
      ".web-protection-toast {" +
      "  position: fixed;" +
      "  right: 20px;" +
      "  bottom: 20px;" +
      "  z-index: 2147483647;" +
      "  max-width: 320px;" +
      "  padding: 12px 16px;" +
      "  border-radius: 12px;" +
      "  background: rgba(15, 23, 42, 0.9);" +
      "  color: #f8fafc;" +
      "  border: 1px solid rgba(148, 163, 184, 0.25);" +
      "  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.35);" +
      "  font-family: Inter, 'Segoe UI', sans-serif;" +
      "  font-size: 14px;" +
      "  line-height: 1.5;" +
      "  opacity: 0;" +
      "  transform: translateY(12px);" +
      "  transition: opacity 0.2s ease, transform 0.2s ease;" +
      "  pointer-events: none;" +
      "}" +
      ".web-protection-toast.visible {" +
      "  opacity: 1;" +
      "  transform: translateY(0);" +
      "}" +
      ".web-protection-overlay {" +
      "  position: fixed;" +
      "  inset: 0;" +
      "  z-index: 2147483647;" +
      "  display: none;" +
      "  align-items: center;" +
      "  justify-content: center;" +
      "  padding: 20px;" +
      "  background: rgba(2, 6, 23, 0.68);" +
      "  backdrop-filter: blur(6px);" +
      "  -webkit-backdrop-filter: blur(6px);" +
      "  animation: webProtectionFade 0.25s ease;" +
      "}" +
      ".web-protection-overlay.visible {" +
      "  display: flex;" +
      "}" +
      ".web-protection-card {" +
      "  width: min(100%, 460px);" +
      "  background: rgba(15, 23, 42, 0.94);" +
      "  border: 1px solid rgba(148, 163, 184, 0.2);" +
      "  border-radius: 18px;" +
      "  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.5);" +
      "  padding: 28px 24px 20px;" +
      "  color: #f8fafc;" +
      "  font-family: Inter, 'Segoe UI', sans-serif;" +
      "  text-align: center;" +
      "  box-sizing: border-box;" +
      "}" +
      ".web-protection-title {" +
      "  margin: 0 0 12px;" +
      "  font-size: clamp(20px, 2vw, 28px);" +
      "  font-weight: 700;" +
      "  letter-spacing: 0.02em;" +
      "}" +
      ".web-protection-text {" +
      "  margin: 0;" +
      "  font-size: 15px;" +
      "  line-height: 1.6;" +
      "  color: #dfe7f3;" +
      "}" +
      ".web-protection-button {" +
      "  margin-top: 22px;" +
      "  appearance: none;" +
      "  border: 0;" +
      "  border-radius: 10px;" +
      "  background: linear-gradient(135deg, #22c55e, #16a34a);" +
      "  color: #ffffff;" +
      "  font-weight: 600;" +
      "  font-size: 15px;" +
      "  padding: 12px 18px;" +
      "  cursor: pointer;" +
      "  transition: transform 0.2s ease, filter 0.2s ease;" +
      "}" +
      ".web-protection-button:hover {" +
      "  transform: translateY(-1px);" +
      "  filter: brightness(1.05);" +
      "}" +
      ".web-protection-button:active {" +
      "  transform: translateY(0);" +
      "}" +
      "@keyframes webProtectionFade {" +
      "  from { opacity: 0; }" +
      "  to { opacity: 1; }" +
      "}" +
      "@media (max-width: 480px) {" +
      "  .web-protection-card {" +
      "    padding: 22px 18px 16px;" +
      "  }" +
      "  .web-protection-text {" +
      "    font-size: 14px;" +
      "  }" +
      "}";

    document.head.appendChild(style);
  }

  function ensureToast() {
    if (!state.toast) {
      state.toast = document.createElement("div");
      state.toast.className = "web-protection-toast";
      state.toast.setAttribute("role", "status");
      state.toast.setAttribute("aria-live", "polite");
      document.body.appendChild(state.toast);
    }

    return state.toast;
  }

  function ensureOverlay() {
    if (!state.overlay) {
      state.overlay = document.createElement("div");
      state.overlay.className = "web-protection-overlay";
      state.overlay.id = "web-protection-overlay";

      var card = document.createElement("div");
      card.className = "web-protection-card";

      var title = document.createElement("h2");
      title.className = "web-protection-title";
      title.textContent = "Developer Tools đang được mở";

      var text = document.createElement("p");
      text.className = "web-protection-text";
      text.textContent = "Vui lòng đóng Developer Tools để tiếp tục sử dụng trang web.";

      var button = document.createElement("button");
      button.type = "button";
      button.className = "web-protection-button";
      button.textContent = "Đã đóng Developer Tools";
      button.addEventListener("click", function () {
        hideDevToolsOverlay();
      });

      card.appendChild(title);
      card.appendChild(text);
      card.appendChild(button);
      state.overlay.appendChild(card);
      document.body.appendChild(state.overlay);
    }

    return state.overlay;
  }

  function showWarning(message) {
    if (!state.enabled || !state.config.showWarning) {
      return;
    }

    var toast = ensureToast();
    toast.textContent = message || "Chức năng này không được phép.";
    toast.classList.add("visible");

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }

    state.toastTimer = setTimeout(function () {
      toast.classList.remove("visible");
    }, state.config.warningDuration || 1800);
  }

  function showDevToolsOverlay() {
    if (!state.enabled || !state.config.detectDevTools || isMobileDevice() || isAutomationEnvironment()) {
      return;
    }

    state.devToolsCheckCount += 1;

    if (state.devToolsCheckCount < 2) {
      return;
    }

    var overlay = ensureOverlay();
    state.devToolsDetected = true;
    overlay.classList.add("visible");
  }

  function hideDevToolsOverlay() {
    state.devToolsCheckCount = 0;

    if (!state.overlay) {
      return;
    }

    state.devToolsDetected = false;
    state.overlay.classList.remove("visible");
  }

  function handleContextMenu(event) {
    if (!state.enabled || !state.config.disableRightClick) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    showWarning("Chức năng này không được phép.");
  }

  function handleKeydown(event) {
    if (!state.enabled) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    var key = event.key ? event.key.toLowerCase() : "";
    var ctrl = event.ctrlKey || event.metaKey;
    var meta = event.metaKey;
    var alt = event.altKey;
    var shift = event.shiftKey;

    if (event.key === "F12") {
      event.preventDefault();
      showWarning("Chức năng này không được phép.");
      return;
    }

    if (state.config.disableDevToolsShortcuts) {
      var isDevToolsShortcut =
        (ctrl && shift && (key === "i" || key === "j" || key === "c")) ||
        (ctrl && key === "u") ||
        (ctrl && key === "s") ||
        (meta && alt && (key === "i" || key === "j" || key === "c")) ||
        (meta && key === "u") ||
        (meta && alt && key === "u");

      if (isDevToolsShortcut) {
        event.preventDefault();
        showWarning("Chức năng này không được phép.");
        return;
      }
    }

    if (state.config.disableViewSource && ctrl && key === "u") {
      event.preventDefault();
      showWarning("Chức năng này không được phép.");
      return;
    }

    if (state.config.disableSavePage && ctrl && key === "s") {
      event.preventDefault();
      showWarning("Chức năng này không được phép.");
      return;
    }
  }

  function handleCopyCut(event) {
    if (!state.enabled || !state.config.disableCopy) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    showWarning("Chức năng này không được phép.");
  }

  function handleDragStart(event) {
    if (!state.enabled || !state.config.disableDrag) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    showWarning("Chức năng này không được phép.");
  }

  function attachEventListeners() {
    if (state.initialized && state.listenersAttached) {
      return;
    }

    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("copy", handleCopyCut, true);
    document.addEventListener("cut", handleCopyCut, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("dragover", function (event) {
      if (!state.enabled || !state.config.disableDrag) {
        return;
      }

      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    }, true);
    document.addEventListener("drop", function (event) {
      if (!state.enabled || !state.config.disableDrag) {
        return;
      }

      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    }, true);

    state.listenersAttached = true;
    state.initialized = true;
  }

  function removeEventListeners() {
    if (!state.listenersAttached) {
      return;
    }

    document.removeEventListener("contextmenu", handleContextMenu, true);
    document.removeEventListener("keydown", handleKeydown, true);
    document.removeEventListener("copy", handleCopyCut, true);
    document.removeEventListener("cut", handleCopyCut, true);
    document.removeEventListener("dragstart", handleDragStart, true);

    state.listenersAttached = false;
    state.initialized = false;
  }

  function startDevToolsMonitoring() {
    if (isMobileDevice() || isAutomationEnvironment()) {
      return;
    }

    if (state.devToolsTimer) {
      clearInterval(state.devToolsTimer);
    }

    state.devToolsTimer = setInterval(function () {
      if (!state.enabled || !state.config.detectDevTools) {
        return;
      }

      var widthDiff = window.outerWidth - window.innerWidth;
      var heightDiff = window.outerHeight - window.innerHeight;
      var isLikelyDevTools = widthDiff > 180 && heightDiff > 90;

      if (isLikelyDevTools) {
        showDevToolsOverlay();
        return;
      }

      if (state.devToolsDetected) {
        hideDevToolsOverlay();
      }
    }, 2000);
  }

  function stopDevToolsMonitoring() {
    if (state.devToolsTimer) {
      clearInterval(state.devToolsTimer);
      state.devToolsTimer = null;
    }

    hideDevToolsOverlay();
  }

  function init(customConfig) {
    if (!globalScope || !globalScope.document) {
      return;
    }

    state.config = mergeConfig(customConfig || existing.config || {});
    createStyleTag();

    if (!state.initialized || !state.listenersAttached) {
      attachEventListeners();
    }

    if (state.config.detectDevTools) {
      startDevToolsMonitoring();
    }

    return state;
  }

  function destroy() {
    removeEventListeners();
    stopDevToolsMonitoring();

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }

    if (state.toast) {
      state.toast.remove();
      state.toast = null;
    }

    if (state.overlay) {
      state.overlay.remove();
      state.overlay = null;
    }

    state.enabled = false;
    state.initialized = false;
    state.devToolsDetected = false;
  }

  function enable() {
    state.enabled = true;
    state.config = mergeConfig(state.config || DEFAULT_CONFIG);

    if (!state.listenersAttached) {
      attachEventListeners();
    }

    if (state.config.detectDevTools) {
      startDevToolsMonitoring();
    }
  }

  function disable() {
    state.enabled = false;
    hideDevToolsOverlay();
    removeEventListeners();
    stopDevToolsMonitoring();
  }

  function getStatus() {
    return {
      enabled: !!state.enabled,
      devToolsDetected: !!state.devToolsDetected
    };
  }

  var WebProtection = {
    config: DEFAULT_CONFIG,
    init: init,
    destroy: destroy,
    enable: enable,
    disable: disable,
    getStatus: getStatus
  };

  globalScope.WebProtection = Object.assign(existing, WebProtection);
  globalScope.WebProtection.config = mergeConfig(existing.config || DEFAULT_CONFIG);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init(globalScope.WebProtection.config);
    }, { once: true });
  } else {
    init(globalScope.WebProtection.config);
  }
})();
