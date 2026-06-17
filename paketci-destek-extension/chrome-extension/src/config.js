/**
 * Tek değişiklik noktası: ortam, backend adresi ve izinli Paketçi domaini.
 * Bu dosya hem content script (isolated world, classic script) hem de
 * popup.html içinde classic <script> olarak kullanılabilmesi için
 * IIFE + global namespace deseniyle yazılmıştır (import/export YOK).
 *
 * GÜVENLİK: Bu dosyada hiçbir gizli/şifre/anahtar bilgisi BULUNMAMALIDIR.
 * Google SMTP şifresi sadece backend .env içinde yaşar.
 */
(function (global) {
  'use strict';

  // "production" | "development" — backend URL ve log seviyesini belirler.
  var ENVIRONMENT = 'development';

  var BACKEND_BASE_URL = {
    development: 'http://localhost:3001',
    production: 'https://destek-api.sizin-domaininiz.com'
  }[ENVIRONMENT];

  var CONFIG = {
    environment: ENVIRONMENT,
    extensionVersion: '1.0.0',

    // Backend API kökü. manifest.json > host_permissions ile eşleşmelidir.
    backendBaseUrl: BACKEND_BASE_URL,
    supportRequestEndpoint: BACKEND_BASE_URL + '/api/extension/support-requests',
    healthEndpoint: BACKEND_BASE_URL + '/api/health',

    // İstek zaman aşımı (ms).
    requestTimeoutMs: 20000,

    // Eklentinin "aktif" sayılacağı host'lar. manifest.json > content_scripts.matches
    // ile TUTARLI tutulmalıdır; burası popup.js gibi yerlerde çalışma zamanı
    // kontrolü için kullanılır (defense-in-depth — asıl kısıt manifest'tedir).
    allowedHostnames: [
      // GERÇEK PAKETÇİ DOMAİNİ BURAYA YAZILACAK (placeholder):
      'paketci-domaininiz.com',
      'localhost'
    ],

    // Dosya eki kısıtları (backend ile aynı limit kullanılmalı).
    maxAttachmentSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedAttachmentMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
  };

  global.PSupport = global.PSupport || {};
  global.PSupport.config = CONFIG;
})(typeof window !== 'undefined' ? window : self);
