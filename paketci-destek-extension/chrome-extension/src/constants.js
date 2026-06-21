/**
 * Sorun tipleri, öncelikler, dosya/metin kısıtları ve kullanıcıya gösterilen
 * tüm Türkçe metinler tek bu dosyada toplanır. UI metni değiştirmek için
 * başka dosyaya gidilmez.
 */
(function (global) {
  'use strict';

  var ISSUE_TYPES = [
    { value: 'courier_not_arrived', label: 'Kurye gelmedi', suggestedPriority: 'urgent' },
    { value: 'package_ready_waiting_courier', label: 'Paket hazır ama kurye bekleniyor', suggestedPriority: 'urgent' },
    { value: 'courier_wrong_package', label: 'Kurye yanlış paketi aldı', suggestedPriority: 'high' },
    { value: 'courier_marked_delivered_issue', label: 'Kurye teslim edildi işaretledi ama sorun var', suggestedPriority: 'high' },
    { value: 'customer_unreachable', label: 'Müşteri ulaşılamıyor', suggestedPriority: 'normal' },
    { value: 'address_problem', label: 'Adres problemi', suggestedPriority: 'normal' },
    { value: 'payment_problem', label: 'Ödeme problemi', suggestedPriority: 'high' },
    { value: 'cancel_refund_problem', label: 'Paket iptal/iade problemi', suggestedPriority: 'high' },
    { value: 'restaurant_preparation_problem', label: 'Restoran hazırlık problemi', suggestedPriority: 'normal' },
    { value: 'technical_problem', label: 'Teknik problem', suggestedPriority: 'normal' },
    { value: 'other', label: 'Diğer', suggestedPriority: 'normal' }
  ];

  var PRIORITIES = [
    { value: 'low', label: 'Düşük', color: '#6b7280', bg: '#f3f4f6' },
    { value: 'normal', label: 'Normal', color: '#1d4ed8', bg: '#dbeafe' },
    { value: 'high', label: 'Yüksek', color: '#b45309', bg: '#fef3c7' },
    { value: 'urgent', label: 'Acil', color: '#b91c1c', bg: '#fee2e2' },
    { value: 'critical', label: 'Kritik', color: '#ffffff', bg: '#991b1b' }
  ];

  var MESSAGES = {
    successTemplate:
      'Destek talebiniz başarıyla oluşturuldu. Ticket No: {{ticketNumber}}. ' +
      'Talebiniz operasyon ekibimize iletildi ve e-posta adresinize bilgilendirme gönderildi.',

    errors: {
      packageDataNotRead: 'Paket verisi okunamadı. Lütfen bilgileri manuel tamamlayın.',
      invalidEmail: 'Lütfen geçerli bir e-posta adresi girin.',
      emptyDescription: 'Lütfen açıklama alanını doldurun.',
      missingIssueType: 'Lütfen bir sorun tipi seçin.',
      missingTitle: 'Lütfen talep için kısa bir başlık girin.',
      missingSenderName: 'Lütfen ad soyad girin.',
      requestFailed: 'Talep oluşturulamadı. Lütfen tekrar deneyin.',
      networkError: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
      duplicateTicket: 'Bu paket için zaten açık bir talep var.',
      missingPackageSelection: 'Lütfen bir paket seçin.',
      mailQueuedNotice: 'Mail gönderimi sıraya alındı fakat henüz tamamlanmadı.',
      unauthorized: 'Yetkisiz işlem.',
      rateLimited: 'Çok fazla talep gönderdiniz. Lütfen kısa süre sonra tekrar deneyin.',
      fileTooLarge: 'Dosya boyutu çok büyük. Lütfen 5 MB altında bir dosya seçin.',
      fileTypeNotSupported: 'Desteklenmeyen dosya türü. jpg, png, webp veya pdf yükleyin.',
      genericUnknown: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
    },

    ui: {
      panelTitle: 'Destek Talebi Oluştur',
      packageSummaryTitle: 'Paket Bilgileri',
      manualEditHint: 'Bazı alanlar otomatik okunamadı, gerekirse düzenleyebilirsiniz.',
      submitButton: 'Talebi Gönder',
      submitButtonLoading: 'Gönderiliyor…',
      retryButton: 'Tekrar Dene',
      closeConfirm: 'Girdiğiniz bilgiler kaybolacak. Paneli kapatmak istediğinize emin misiniz?',
      closeConfirmYes: 'Evet, kapat',
      closeConfirmNo: 'Vazgeç',
      fabButtonLabel: 'Destek Talep Et',
      packagePickerLabel: 'Paket Seçin',
      packagePickerPlaceholder: 'Seçiniz…',
      noPackagesFoundHint: 'Sayfada okunabilir bir paket bulunamadı. Bilgileri manuel girebilirsiniz.',
      dropzoneHint: 'Dosyayı buraya sürükleyin veya seçmek için tıklayın (jpg, png, webp, pdf — max 5 MB)',
      removeFile: 'Dosyayı kaldır',
      titleLabel: 'Başlık',
      titlePlaceholder: 'Örn: Kurye 30 dakikadır gelmedi',
      descriptionLabel: 'Açıklama',
      issueTypeLabel: 'Sorun Tipi',
      priorityLabel: 'Öncelik',
      senderNameLabel: 'Ad Soyad',
      senderEmailLabel: 'E-posta',
      senderPhoneLabel: 'Telefon (opsiyonel)',
      cancelButton: 'Vazgeç',
      backToFormButton: 'Forma Dön'
    }
  };

  var FILE_RULES = {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  };

  var VALIDATION_RULES = {
    descriptionMinLength: 10,
    titleMinLength: 5,
    senderNameMinLength: 2,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  };

  global.PSupport = global.PSupport || {};
  global.PSupport.constants = {
    ISSUE_TYPES: ISSUE_TYPES,
    PRIORITIES: PRIORITIES,
    MESSAGES: MESSAGES,
    FILE_RULES: FILE_RULES,
    VALIDATION_RULES: VALIDATION_RULES
  };
})(typeof window !== 'undefined' ? window : self);
