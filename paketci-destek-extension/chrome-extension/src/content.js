/**
 * İçerik script orkestratörü — sayfaya tek bir "Destek Talep Et" butonu
 * (sağ-altta sabit) enjekte eder, tıklamaları paketciAdapter + supportPanel'e
 * bağlar. manifest.json'da bu dosya EN SON yüklenir; diğer tüm
 * window.PSupport.* modüllerinin hazır olduğunu varsayar.
 */
(function () {
  'use strict';

  var domUtils = window.PSupport.domUtils;
  var adapter = window.PSupport.paketciAdapter;
  var panel = window.PSupport.supportPanel;
  var config = window.PSupport.config;
  var toast = window.PSupport.toast;
  var MESSAGES = window.PSupport.constants.MESSAGES;
  var UI = MESSAGES.ui;

  var PAGE_STYLE_ID = 'psupport-page-style';
  var FAB_ATTR = 'data-psupport-fab-injected';
  var STYLESHEET_URL = chrome.runtime.getURL('src/styles.css');

  function isAllowedHost() {
    var hostname = window.location.hostname;
    return config.allowedHostnames.some(function (allowed) {
      return hostname === allowed || hostname.endsWith('.' + allowed);
    });
  }

  function injectPageStylesheet() {
    domUtils.loadStylesheetText(STYLESHEET_URL).then(function (cssText) {
      domUtils.injectStyleTagOnce(document.head, PAGE_STYLE_ID, cssText);
    });
  }

  function buildIcon() {
    var span = document.createElement('span');
    span.className = 'psupport-icon';
    span.textContent = '🎫';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  function openPanelFor(snapshot) {
    if (!snapshot || (!snapshot.paketciPackageId && !snapshot.orderNumber)) {
      toast.info(MESSAGES.errors.packageDataNotRead);
    }
    panel.open(snapshot);
  }

  // ─────────────────────────────────────────────────────────────────
  // Tek akış: detay sayfasındaysa o paket için panel direkt açılır;
  // liste sayfasındaysa kullanıcı paketi panel içindeki seçiciden seçer.
  // ─────────────────────────────────────────────────────────────────

  function openSupportFlow() {
    if (adapter.isDetailPage()) {
      openPanelFor(adapter.extractFromDetail());
      return;
    }

    var packages = adapter.listPackages();
    if (packages.length === 0) {
      toast.info(UI.noPackagesFoundHint);
      panel.open({});
      return;
    }
    if (packages.length === 1) {
      openPanelFor(packages[0]);
      return;
    }
    panel.open(null, packages);
  }

  // ─────────────────────────────────────────────────────────────────
  // Sağ-altta sabit, tek "Destek Talep Et" butonu
  // ─────────────────────────────────────────────────────────────────

  function ensureFloatingButton() {
    if (document.querySelector('[' + FAB_ATTR + ']')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'psupport-fab-btn';
    btn.appendChild(buildIcon());
    btn.appendChild(document.createTextNode(UI.fabButtonLabel));
    btn.setAttribute(FAB_ATTR, '1');
    btn.setAttribute('aria-label', UI.fabButtonLabel);

    btn.addEventListener('click', function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      openSupportFlow();
    });

    document.body.appendChild(btn);
  }

  // popup.js'in "Yeni Destek Talebi" hızlı aksiyonundan gelen, butona
  // tıklanmadan manuel panel açma isteğini dinler.
  chrome.runtime.onMessage.addListener(function (message) {
    if (message && message.type === 'PSUPPORT_OPEN_MANUAL') {
      openSupportFlow();
    }
  });

  function init() {
    if (!isAllowedHost()) return;

    injectPageStylesheet();
    ensureFloatingButton();

    // Bazı SPA'lar `document.body` içeriğini tamamen yeniden render eder;
    // bu durumda buton DOM'dan düşer, MutationObserver ile geri eklenir.
    domUtils.observeMutations(document.body, ensureFloatingButton, 200);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
