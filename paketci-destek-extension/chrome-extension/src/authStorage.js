/**
 * v2 için ayrılmış JWT/oturum saklama arayüzü.
 * v1'de extension login/JWT YOKTUR — support-requests endpoint'i kimlik
 * bilgisi taşımadan çağrılır. Bu dosya, v2'de auth eklenince apiClient.js'in
 * Authorization header'ı için kullanacağı sabit arayüzü şimdiden tanımlar.
 *
 * GÜVENLİK: Burada SADECE token saklanır; Google SMTP şifresi gibi backend
 * sırları bu dosyaya ASLA yazılmaz/okunmaz.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'psupport_auth_token';

  /** @returns {Promise<string|null>} */
  function getToken() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        resolve(result && result[STORAGE_KEY] ? result[STORAGE_KEY] : null);
      });
    });
  }

  /** @param {string} token */
  function setToken(token) {
    return new Promise(function (resolve) {
      var data = {};
      data[STORAGE_KEY] = token;
      chrome.storage.local.set(data, resolve);
    });
  }

  function clearToken() {
    return new Promise(function (resolve) {
      chrome.storage.local.remove([STORAGE_KEY], resolve);
    });
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.authStorage = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken
  };
})(typeof window !== 'undefined' ? window : self);
