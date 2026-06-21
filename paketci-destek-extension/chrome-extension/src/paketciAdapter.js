/**
 * PAKETÇİ DOM ADAPTER
 * ===================
 * Paketçi'nin ekran yapısı (class adları, DOM hiyerarşisi) değişebilir.
 * Bu dosya, "ekran değişti, tek bu dosyayı güncelle" prensibiyle yazılmıştır:
 * TÜM CSS selector'ları aşağıdaki SELECTORS haritasında toplanmıştır.
 * content.js veya başka bir dosya İÇİNDE asla doğrudan selector yazılmaz.
 *
 * Her selector alanı bir DİZİ olarak tanımlanır (aday selector listesi);
 * ilk eşleşen ve boş olmayan sonuç kullanılır. Bu, Paketçi'nin farklı
 * görünümlerinde (liste/detay, eski/yeni tasarım) tek bir adaptörle
 * çalışabilmeyi sağlar.
 *
 * Hiçbir extractor exception fırlatmaz; bulunamayan alan için her zaman
 * `null` döner — panelde bu alanlar kullanıcı tarafından manuel doldurulur.
 */
(function (global) {
  'use strict';

  var domUtils = global.PSupport.domUtils;

  // ───────────────────────────────────────────────────────────────────────
  // 1) SELECTOR HARİTASI — Paketçi ekranı değişirse SADECE burayı güncelleyin
  // ───────────────────────────────────────────────────────────────────────
  var SELECTORS = {
    // Paket/sipariş listesindeki her satırı temsil eden eleman adayları.
    listRowCandidates: [
      '[data-testid="package-row"]',
      'table tbody tr.package-row',
      'table tbody tr[data-package-id]',
      '.package-list-item',
      '.siparis-satiri'
    ],

    // Detay sayfasında geniş bilgi okumak için kök konteyner (bulunamazsa document kullanılır).
    detailRootCandidates: [
      '[data-testid="package-detail-root"]',
      '.package-detail',
      '.siparis-detay'
    ],

    fields: {
      paketciPackageId: {
        rowSelfAttr: 'data-package-id',
        rowText: ['.col-package-id', '.package-id'],
        detailText: ['[data-testid="package-id"]', '.detail-package-id']
      },
      orderNumber: {
        rowSelfAttr: 'data-order-number',
        rowText: ['.col-order-number', '.order-number', '.siparis-no'],
        detailText: ['[data-testid="order-number"]', '.detail-order-number']
      },
      restaurantName: {
        rowText: ['.col-restaurant', '.restaurant-name', '.restoran-adi'],
        detailText: ['[data-testid="restaurant-name"]', '.detail-restaurant-name']
      },
      branchName: {
        rowText: ['.col-branch', '.branch-name', '.sube-adi'],
        detailText: ['[data-testid="branch-name"]', '.detail-branch-name']
      },
      courierName: {
        rowText: ['.col-courier', '.courier-name', '.kurye-adi'],
        detailText: ['[data-testid="courier-name"]', '.detail-courier-name']
      },
      packageStatus: {
        rowText: ['.col-status', '.package-status', '.paket-durumu'],
        detailText: ['[data-testid="package-status"]', '.detail-package-status']
      },
      deliveryStatus: {
        rowText: ['.col-delivery-status', '.delivery-status', '.teslimat-durumu'],
        detailText: ['[data-testid="delivery-status"]', '.detail-delivery-status']
      },
      paymentType: {
        rowText: ['.col-payment-type', '.payment-type', '.odeme-tipi'],
        detailText: ['[data-testid="payment-type"]', '.detail-payment-type']
      },
      packageTotal: {
        rowText: ['.col-total', '.package-total', '.tutar'],
        detailText: ['[data-testid="package-total"]', '.detail-package-total']
      },
      customerNameMasked: {
        rowText: ['.col-customer-name', '.customer-name', '.musteri-adi'],
        detailText: ['[data-testid="customer-name"]', '.detail-customer-name']
      },
      customerPhoneMasked: {
        rowText: ['.col-customer-phone', '.customer-phone', '.musteri-telefon'],
        detailText: ['[data-testid="customer-phone"]', '.detail-customer-phone']
      },
      customerAddressMasked: {
        rowText: [],
        detailText: ['[data-testid="customer-address"]', '.detail-customer-address', '.musteri-adres']
      },
      packageCreatedAt: {
        rowText: ['.col-created-at', '.package-created-at', '.olusturma-tarihi'],
        detailText: ['[data-testid="package-created-at"]', '.detail-created-at']
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // 2) GENEL ÇIKARMA (extraction) YARDIMCILARI
  // ───────────────────────────────────────────────────────────────────────

  function extractField(root, fieldDef, scope) {
    if (!fieldDef) return null;

    if (scope === 'row' && fieldDef.rowSelfAttr && root && root.getAttribute) {
      var attrVal = root.getAttribute(fieldDef.rowSelfAttr);
      if (attrVal && attrVal.trim()) return attrVal.trim();
    }

    var selectors = scope === 'row' ? fieldDef.rowText : fieldDef.detailText;
    if (selectors && selectors.length) {
      var value = domUtils.textOf(root, selectors);
      if (value) return value;
    }
    return null;
  }

  function findFirstMatch(root, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var el = domUtils.qs(root, candidates[i]);
      if (el) return el;
    }
    return null;
  }

  function findAllMatches(root, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var list = domUtils.qsa(root, candidates[i]);
      if (list.length) return list;
    }
    return [];
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3) KVKK MASKELEME — ekrandan ne okunursa okunsun, gönderim öncesi
  //    müşteri kişisel verisi mutlaka maskelenir (savunma derinliği).
  // ───────────────────────────────────────────────────────────────────────

  function maskName(value) {
    if (!value) return null;
    var parts = value.trim().split(/\s+/);
    return parts
      .map(function (part) {
        if (part.length <= 1) return part + '*';
        return part.charAt(0) + Array(part.length).join('*');
      })
      .join(' ');
  }

  function maskPhone(value) {
    if (!value) return null;
    var digits = value.replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return digits.slice(0, 2) + '*'.repeat(digits.length - 4) + digits.slice(-2);
  }

  function maskAddress(value) {
    if (!value) return null;
    var trimmed = value.trim();
    if (trimmed.length <= 12) return trimmed.slice(0, 4) + '***';
    return trimmed.slice(0, 12) + '… (devamı gizli)';
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4) PUBLIC API
  // ───────────────────────────────────────────────────────────────────────

  function findPackageRows(root) {
    return findAllMatches(root || document, SELECTORS.listRowCandidates);
  }

  function findDetailRoot() {
    return findFirstMatch(document, SELECTORS.detailRootCandidates) || document;
  }

  function isDetailPage() {
    return !!findFirstMatch(document, SELECTORS.detailRootCandidates);
  }

  /** Bir satırdan paket bilgisi okur (liste sayfası bağlamı). */
  function extractFromRow(rowEl) {
    return buildSnapshot(rowEl, 'row');
  }

  /** Sayfada şu an görünen tüm paketleri okur (paket seçici için). */
  function listPackages() {
    return findPackageRows(document)
      .map(extractFromRow)
      .filter(function (snapshot) {
        return !!(snapshot.paketciPackageId || snapshot.orderNumber);
      });
  }

  /** Detay sayfasından daha geniş paket bilgisi okur. */
  function extractFromDetail() {
    var root = findDetailRoot();
    return buildSnapshot(root, 'detail');
  }

  function buildSnapshot(root, scope) {
    var fields = SELECTORS.fields;
    var snapshot = {
      paketciPackageId: extractField(root, fields.paketciPackageId, scope),
      orderNumber: extractField(root, fields.orderNumber, scope),
      restaurantName: extractField(root, fields.restaurantName, scope),
      branchName: extractField(root, fields.branchName, scope),
      courierName: extractField(root, fields.courierName, scope),
      packageStatus: extractField(root, fields.packageStatus, scope),
      deliveryStatus: extractField(root, fields.deliveryStatus, scope),
      paymentType: extractField(root, fields.paymentType, scope),
      packageTotal: extractField(root, fields.packageTotal, scope),
      customerNameMasked: maskName(extractField(root, fields.customerNameMasked, scope)),
      customerPhoneMasked: maskPhone(extractField(root, fields.customerPhoneMasked, scope)),
      customerAddressMasked: maskAddress(extractField(root, fields.customerAddressMasked, scope)),
      packageCreatedAt: extractField(root, fields.packageCreatedAt, scope),
      paketciDetailUrl: isDetailPage() ? window.location.href : null,
      pageUrl: window.location.href,
      pageTitle: document.title || null
    };

    return normalizeSnapshot(snapshot);
  }

  function normalizeSnapshot(raw) {
    var normalized = {};
    Object.keys(raw).forEach(function (key) {
      var value = raw[key];
      if (typeof value === 'string') {
        var trimmed = value.replace(/\s+/g, ' ').trim();
        // HTML enjeksiyon riskine karşı görüntü amaçlı escape; gönderim
        // sırasında ayrıca backend'de sanitize-html ile temizlenir.
        normalized[key] = trimmed ? domUtils.escapeHtml(trimmed) : null;
      } else {
        normalized[key] = value || null;
      }
    });
    return normalized;
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.paketciAdapter = {
    SELECTORS: SELECTORS,
    findPackageRows: findPackageRows,
    findDetailRoot: findDetailRoot,
    isDetailPage: isDetailPage,
    extractFromRow: extractFromRow,
    extractFromDetail: extractFromDetail,
    listPackages: listPackages
  };
})(typeof window !== 'undefined' ? window : self);
