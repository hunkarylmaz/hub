/**
 * Genel amaçlı, Paketçi'ye özgü bilgi içermeyen DOM yardımcıları.
 * Paketçi'ye özgü selector mantığı burada DEĞİL, paketciAdapter.js'te yaşar.
 */
(function (global) {
  'use strict';

  function qs(root, selector) {
    if (!root || !selector) return null;
    try {
      return root.querySelector(selector);
    } catch (err) {
      return null;
    }
  }

  function qsa(root, selector) {
    if (!root || !selector) return [];
    try {
      return Array.prototype.slice.call(root.querySelectorAll(selector));
    } catch (err) {
      return [];
    }
  }

  /** Bir elemanın/selector listesinin metnini trimlenmiş şekilde döner, yoksa null. */
  function textOf(root, selectors) {
    var list = Array.isArray(selectors) ? selectors : [selectors];
    for (var i = 0; i < list.length; i++) {
      var el = qs(root, list[i]);
      if (el && typeof el.textContent === 'string') {
        var trimmed = el.textContent.replace(/\s+/g, ' ').trim();
        if (trimmed) return trimmed;
      }
    }
    return null;
  }

  /** Bir elemanın attribute değerini trimlenmiş şekilde döner, yoksa null. */
  function attrOf(root, selectors, attrName) {
    var list = Array.isArray(selectors) ? selectors : [selectors];
    for (var i = 0; i < list.length; i++) {
      var el = qs(root, list[i]);
      if (el) {
        var value = el.getAttribute(attrName);
        if (value && value.trim()) return value.trim();
      }
    }
    return null;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, waitMs) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, waitMs);
    };
  }

  /**
   * Bir konteynerdeki DOM değişikliklerini izler (yeni satırlar, SPA içerik
   * güncellemeleri). callback debounce'lu çalışır.
   */
  function observeMutations(target, callback, debounceMs) {
    if (!target) return null;
    var debounced = debounce(callback, debounceMs || 150);
    var observer = new MutationObserver(function () {
      debounced();
    });
    observer.observe(target, { childList: true, subtree: true });
    return observer;
  }

  /** Aynı stylesheet metnini birden çok hedefe (page head + shadow root) enjekte etmek için cache'li fetch. */
  var stylesheetCache = null;
  function loadStylesheetText(url) {
    if (stylesheetCache) return stylesheetCache;
    stylesheetCache = fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Stylesheet yüklenemedi: ' + res.status);
      return res.text();
    });
    return stylesheetCache;
  }

  function injectStyleTagOnce(targetRoot, id, cssText) {
    if (!targetRoot) return;
    var existing = targetRoot.querySelector ? targetRoot.querySelector('#' + id) : null;
    if (existing) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    targetRoot.appendChild(style);
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.domUtils = {
    qs: qs,
    qsa: qsa,
    textOf: textOf,
    attrOf: attrOf,
    escapeHtml: escapeHtml,
    debounce: debounce,
    observeMutations: observeMutations,
    loadStylesheetText: loadStylesheetText,
    injectStyleTagOnce: injectStyleTagOnce
  };
})(typeof window !== 'undefined' ? window : self);
