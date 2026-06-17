/**
 * Popup, Paketçi sayfasının DOM'una erişemez (ayrı bir uzantı sayfasıdır).
 * Sadece: (1) aktif domain Paketçi mi, (2) backend sağlık durumu, ve
 * pakete bağlı OLMAYAN bir "Yeni Destek Talebi" kısayolunu gösterir.
 * Kısayol, içerik scriptine `chrome.runtime.sendMessage`/`chrome.tabs.sendMessage`
 * ile manuel panel açma sinyali gönderir.
 */
(function () {
  'use strict';

  var config = window.PSupport.config;
  var apiClient = window.PSupport.apiClient;

  var domainDot = document.getElementById('psupport-domain-dot');
  var domainText = document.getElementById('psupport-domain-text');
  var backendDot = document.getElementById('psupport-backend-dot');
  var backendText = document.getElementById('psupport-backend-text');
  var quickActionBtn = document.getElementById('psupport-quick-action');
  var quickHint = document.getElementById('psupport-quick-hint');
  var versionText = document.getElementById('psupport-version-text');
  var envText = document.getElementById('psupport-env-text');

  versionText.textContent = 'v' + config.extensionVersion;
  envText.textContent = config.environment === 'production' ? 'Production' : 'Development';

  function isAllowedHostname(hostname) {
    return config.allowedHostnames.some(function (allowed) {
      return hostname === allowed || hostname.endsWith('.' + allowed);
    });
  }

  function setDomainStatus(active, label) {
    domainDot.className = 'psupport-popup-dot ' + (active ? 'psupport-popup-dot--ok' : 'psupport-popup-dot--bad');
    domainText.textContent = label;
  }

  function setBackendStatus(ok) {
    backendDot.className = 'psupport-popup-dot ' + (ok ? 'psupport-popup-dot--ok' : 'psupport-popup-dot--bad');
    backendText.textContent = ok ? 'Backend bağlantısı çalışıyor' : 'Backend\'e ulaşılamıyor';
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs && tabs[0];
    if (!tab || !tab.url) {
      setDomainStatus(false, 'Bu sayfada eklenti aktif değil');
      quickHint.textContent = 'Yalnızca Paketçi paneli sayfalarında kullanılabilir.';
      return;
    }

    var hostname;
    try {
      hostname = new URL(tab.url).hostname;
    } catch (err) {
      hostname = '';
    }

    var allowed = isAllowedHostname(hostname);
    setDomainStatus(allowed, allowed ? 'Bu sayfada eklenti aktif' : 'Bu sayfada eklenti aktif değil');

    if (allowed) {
      quickActionBtn.disabled = false;
      quickHint.textContent = '';
      quickActionBtn.addEventListener('click', function () {
        chrome.tabs.sendMessage(tab.id, { type: 'PSUPPORT_OPEN_MANUAL' }, function () {
          if (chrome.runtime.lastError) {
            quickHint.textContent = 'Panel açılamadı, sayfayı yenileyip tekrar deneyin.';
            return;
          }
          window.close();
        });
      });
    } else {
      quickHint.textContent = 'Yalnızca Paketçi paneli sayfalarında kullanılabilir.';
    }
  });

  apiClient.checkHealth().then(setBackendStatus);
})();
