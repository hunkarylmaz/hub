/**
 * Sayfanın sağ üst köşesinde kısa ömürlü bildirimler (toast) gösterir.
 * Panel kapandıktan sonra da (örn. başarı mesajı) görünür kalabilmesi için
 * panelin Shadow DOM'undan bağımsız, kendi küçük Shadow Root'unu kullanır.
 */
(function (global) {
  'use strict';

  var domUtils = global.PSupport.domUtils;
  var HOST_ID = 'psupport-toast-host';
  var STYLESHEET_URL = chrome.runtime.getURL('src/styles.css');

  var hostEl = null;
  var shadowRoot = null;

  function ensureHost() {
    if (hostEl && document.body.contains(hostEl)) return shadowRoot;

    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    domUtils.loadStylesheetText(STYLESHEET_URL).then(function (cssText) {
      domUtils.injectStyleTagOnce(shadowRoot, 'psupport-toast-style', cssText);
    });

    var container = document.createElement('div');
    container.className = 'psupport-toast-container';
    shadowRoot.appendChild(container);

    return shadowRoot;
  }

  function show(message, type, durationMs) {
    var root = ensureHost();
    var container = root.querySelector('.psupport-toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'psupport-toast psupport-toast--' + (type || 'info');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('psupport-toast--visible');
    });

    var removeAfter = durationMs || 4000;
    setTimeout(function () {
      toast.classList.remove('psupport-toast--visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, removeAfter);
  }

  function success(message, durationMs) {
    show(message, 'success', durationMs);
  }

  function error(message, durationMs) {
    show(message, 'error', durationMs);
  }

  function info(message, durationMs) {
    show(message, 'info', durationMs);
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.toast = {
    show: show,
    success: success,
    error: error,
    info: info
  };
})(typeof window !== 'undefined' ? window : self);
