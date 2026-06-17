/**
 * Backend ile HTTP iletişimini tek bu dosya yönetir.
 * supportPanel.js veya başka bir dosya doğrudan fetch() ÇAĞIRMAZ.
 *
 * GÜVENLİK: Bu dosyada hiçbir gizli/şifre bilgisi YOKTUR ve olmamalıdır.
 * Backend adresi config.js'ten okunur.
 */
(function (global) {
  'use strict';

  var config = global.PSupport.config;
  var ERRORS = global.PSupport.constants.MESSAGES.errors;

  /**
   * AbortController ile zaman aşımı uygulanan fetch sarmalayıcısı.
   */
  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || config.requestTimeoutMs);

    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .then(function (response) {
        clearTimeout(timer);
        return response;
      })
      .catch(function (err) {
        clearTimeout(timer);
        throw err;
      });
  }

  /**
   * Backend'den dönen hata gövdesini, kullanıcıya gösterilecek Türkçe
   * mesaja çevirir. Backend `errorCode` alanı döndürürse onunla eşler,
   * yoksa HTTP durum koduna göre genel bir mesaj seçer.
   */
  function mapErrorResponse(httpStatus, body) {
    var code = body && body.errorCode;

    var byCode = {
      DUPLICATE_TICKET: ERRORS.duplicateTicket,
      UNAUTHORIZED: ERRORS.unauthorized,
      RATE_LIMITED: ERRORS.rateLimited,
      FILE_TOO_LARGE: ERRORS.fileTooLarge,
      FILE_TYPE_NOT_SUPPORTED: ERRORS.fileTypeNotSupported,
      VALIDATION_ERROR: body && body.message ? body.message : ERRORS.requestFailed
    };

    if (code && byCode[code]) return byCode[code];

    if (httpStatus === 401 || httpStatus === 403) return ERRORS.unauthorized;
    if (httpStatus === 429) return ERRORS.rateLimited;
    if (httpStatus >= 500) return ERRORS.requestFailed;
    return ERRORS.requestFailed;
  }

  /**
   * Destek talebini backend'e gönderir.
   * @param {Object} payload - support-requests endpoint'inin beklediği JSON gövde.
   * @param {File|null} attachment - opsiyonel dosya eki.
   * @returns {Promise<{ok: boolean, data: (Object|null), errorMessage: (string|null)}>}
   */
  function submitSupportRequest(payload, attachment) {
    var formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (attachment) {
      formData.append('attachment', attachment, attachment.name);
    }

    return fetchWithTimeout(config.supportRequestEndpoint, {
      method: 'POST',
      body: formData
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return null;
          })
          .then(function (body) {
            if (!response.ok) {
              return {
                ok: false,
                data: null,
                errorMessage: mapErrorResponse(response.status, body)
              };
            }
            return { ok: true, data: body, errorMessage: null };
          });
      })
      .catch(function (err) {
        var message = err && err.name === 'AbortError' ? ERRORS.networkError : ERRORS.networkError;
        return { ok: false, data: null, errorMessage: message };
      });
  }

  /**
   * Backend sağlık kontrolü (popup.js bağlantı durumunu göstermek için kullanır).
   * @returns {Promise<boolean>}
   */
  function checkHealth() {
    return fetchWithTimeout(config.healthEndpoint, { method: 'GET' }, 5000)
      .then(function (response) {
        return response.ok;
      })
      .catch(function () {
        return false;
      });
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.apiClient = {
    submitSupportRequest: submitSupportRequest,
    checkHealth: checkHealth
  };
})(typeof window !== 'undefined' ? window : self);
