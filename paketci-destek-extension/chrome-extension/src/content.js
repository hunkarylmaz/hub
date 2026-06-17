/**
 * İçerik script orkestratörü — sayfaya buton enjekte eder, tıklamaları
 * paketciAdapter + supportPanel'e bağlar. manifest.json'da bu dosya EN SON
 * yüklenir; diğer tüm window.PSupport.* modüllerinin hazır olduğunu varsayar.
 */
(function () {
  'use strict';

  var domUtils = window.PSupport.domUtils;
  var adapter = window.PSupport.paketciAdapter;
  var panel = window.PSupport.supportPanel;
  var config = window.PSupport.config;
  var UI = window.PSupport.constants.MESSAGES.ui;

  var PAGE_STYLE_ID = 'psupport-page-style';
  var ROW_BUTTON_ATTR = 'data-psupport-row-injected';
  var DETAIL_BUTTON_ATTR = 'data-psupport-detail-injected';
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
      window.PSupport.toast.info(window.PSupport.constants.MESSAGES.errors.packageDataNotRead);
    }
    panel.open(snapshot);
  }

  // ─────────────────────────────────────────────────────────────────
  // Liste sayfası: her satıra buton ekle
  // ─────────────────────────────────────────────────────────────────

  function injectRowButtons() {
    var rows = adapter.findPackageRows(document);
    rows.forEach(function (row) {
      if (row.getAttribute(ROW_BUTTON_ATTR)) return;

      var slot = adapter.findRowActionSlot(row) || row;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'psupport-row-action-btn';
      btn.appendChild(buildIcon());
      btn.appendChild(document.createTextNode(UI.rowButtonLabelFull));
      btn.setAttribute('aria-label', UI.rowButtonLabelFull);

      btn.addEventListener('click', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        openPanelFor(adapter.extractFromRow(row));
      });

      slot.appendChild(btn);
      row.setAttribute(ROW_BUTTON_ATTR, '1');
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Detay sayfası: üst aksiyon alanına veya floating action button olarak ekle
  // ─────────────────────────────────────────────────────────────────

  function injectDetailButton() {
    if (!adapter.isDetailPage()) {
      removeFloatingButton();
      return;
    }
    if (document.querySelector('[' + DETAIL_BUTTON_ATTR + ']')) return;

    var actionBar = adapter.findDetailActionBar(document);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.appendChild(buildIcon());
    btn.appendChild(document.createTextNode(UI.detailButtonLabel));
    btn.setAttribute(DETAIL_BUTTON_ATTR, '1');
    btn.setAttribute('aria-label', UI.detailButtonLabel);

    btn.addEventListener('click', function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      openPanelFor(adapter.extractFromDetail());
    });

    if (actionBar) {
      btn.className = 'psupport-detail-action-btn';
      actionBar.appendChild(btn);
    } else {
      btn.className = 'psupport-detail-action-btn psupport-fab';
      btn.style.position = 'fixed';
      btn.style.right = '24px';
      btn.style.bottom = '24px';
      btn.style.zIndex = '2147482999';
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      document.body.appendChild(btn);
    }
  }

  function removeFloatingButton() {
    var existing = document.querySelector('[' + DETAIL_BUTTON_ATTR + ']');
    if (existing) existing.remove();
  }

  // ─────────────────────────────────────────────────────────────────
  // Çalıştırma döngüsü
  // ─────────────────────────────────────────────────────────────────

  function runInjection() {
    injectRowButtons();
    injectDetailButton();
  }

  // popup.js'in "Yeni Destek Talebi" hızlı aksiyonundan gelen, pakete bağlı
  // olmayan manuel panel açma isteğini dinler.
  chrome.runtime.onMessage.addListener(function (message) {
    if (message && message.type === 'PSUPPORT_OPEN_MANUAL') {
      openPanelFor(adapter.isDetailPage() ? adapter.extractFromDetail() : {});
    }
  });

  function init() {
    if (!isAllowedHost()) return;

    injectPageStylesheet();
    runInjection();

    domUtils.observeMutations(document.body, runInjection, 200);

    domUtils.watchUrlChange(function () {
      // SPA route değişiminde detay/liste durumu değişebilir; önceki
      // detay butonunu (varsa) sıfırlamak için tag'i temizleyip yeniden dene.
      var oldDetailBtn = document.querySelector('[' + DETAIL_BUTTON_ATTR + ']');
      if (oldDetailBtn && !adapter.isDetailPage()) oldDetailBtn.remove();
      runInjection();
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
