/**
 * Sağdan açılan "Destek Talebi Oluştur" paneli (drawer).
 * Shadow DOM içinde render edilir; Paketçi'nin CSS'i panele sızmaz.
 *
 * Bu dosya DOM'u DOĞRUDAN okumaz — paket verisi `open(snapshot)` ile
 * dışarıdan (content.js → paketciAdapter.js) verilir. Sadece panelin
 * kendi formunun DOM'unu (input/select/textarea) okur/yazar.
 */
(function (global) {
  'use strict';

  var domUtils = global.PSupport.domUtils;
  var constants = global.PSupport.constants;
  var ISSUE_TYPES = constants.ISSUE_TYPES;
  var PRIORITIES = constants.PRIORITIES;
  var MESSAGES = constants.MESSAGES;
  var UI = MESSAGES.ui;
  var ERRORS = MESSAGES.errors;
  var validator = global.PSupport.supportFormValidator;
  var apiClient = global.PSupport.apiClient;
  var toast = global.PSupport.toast;
  var config = global.PSupport.config;

  var STYLESHEET_URL = chrome.runtime.getURL('src/styles.css');
  var HOST_ID = 'psupport-panel-host';

  // Paket özetinde "Manuel doldur" linkiyle elle düzeltilebilen alanlar.
  var EDITABLE_SUMMARY_FIELDS = [
    { key: 'paketciPackageId', label: 'Paket ID' },
    { key: 'orderNumber', label: 'Sipariş No' },
    { key: 'restaurantName', label: 'Restoran' },
    { key: 'branchName', label: 'Şube' },
    { key: 'courierName', label: 'Kurye' },
    { key: 'packageStatus', label: 'Paket Durumu' },
    { key: 'deliveryStatus', label: 'Teslimat Durumu' },
    { key: 'paymentType', label: 'Ödeme Tipi' },
    { key: 'packageTotal', label: 'Tutar' },
    { key: 'packageCreatedAt', label: 'Oluşturulma Tarihi' }
  ];

  // Salt okunur (manuel düzenlenemeyen) özet alanları — maskeli/otomatik veriler.
  var READONLY_SUMMARY_FIELDS = [
    { key: 'customerNameMasked', label: 'Müşteri (maskeli)' },
    { key: 'customerPhoneMasked', label: 'Müşteri Tel (maskeli)' },
    { key: 'customerAddressMasked', label: 'Adres (maskeli)' }
  ];

  var hostEl = null;
  var shadowRoot = null;
  var mountEl = null;
  var escListener = null;
  var focusTrapListener = null;
  var previouslyFocusedEl = null;

  // ───────────────────────────────────────────────────────────────────
  // Host / Shadow DOM kurulumu
  // ───────────────────────────────────────────────────────────────────

  function ensureHost() {
    if (hostEl && document.body.contains(hostEl)) return shadowRoot;

    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    domUtils.loadStylesheetText(STYLESHEET_URL).then(function (cssText) {
      domUtils.injectStyleTagOnce(shadowRoot, 'psupport-panel-style', cssText);
    });

    mountEl = document.createElement('div');
    mountEl.className = 'psupport-scope';
    shadowRoot.appendChild(mountEl);

    return shadowRoot;
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'text') {
          node.textContent = attrs[key];
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    return node;
  }

  // ───────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────

  /**
   * @param {object|null} snapshot - Tek paket bağlamı (satır/detaydan). Paket
   *   seçici modunda (packageOptions doluyken) null geçilir.
   * @param {object[]|null} packageOptions - Liste sayfasında birden fazla
   *   paket görünüyorsa, kullanıcının panel içinden seçebileceği paketler.
   */
  function open(snapshot, packageOptions) {
    ensureHost();
    mountEl.innerHTML = '';

    var hasPicker = Array.isArray(packageOptions) && packageOptions.length > 0;

    var state = {
      snapshot: hasPicker ? {} : (snapshot || {}),
      packageOptions: hasPicker ? packageOptions : null,
      packageSelected: !hasPicker,
      manualOverrides: {},
      selectedFile: null,
      userTouchedPriority: false,
      submitting: false,
      submitted: false
    };

    var overlay = el('div', 'psupport-overlay');
    var drawer = el('div', 'psupport-drawer', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': UI.panelTitle
    });

    overlay.addEventListener('mousedown', function () {
      requestClose(overlay, drawer, state);
    });

    mountEl.appendChild(overlay);
    mountEl.appendChild(drawer);

    renderFormView(drawer, state);

    requestAnimationFrame(function () {
      overlay.classList.add('psupport-overlay--visible');
      drawer.classList.add('psupport-drawer--visible');
    });

    previouslyFocusedEl = document.activeElement;
    attachKeyHandlers(overlay, drawer, state);

    var firstField = drawer.querySelector('select, input, textarea');
    if (firstField) firstField.focus();
  }

  function attachKeyHandlers(overlay, drawer, state) {
    detachKeyHandlers();

    escListener = function (evt) {
      if (evt.key === 'Escape') {
        evt.stopPropagation();
        requestClose(overlay, drawer, state);
      }
    };

    focusTrapListener = function (evt) {
      if (evt.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call(
        drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(function (node) {
        return !node.disabled && node.offsetParent !== null;
      });
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (evt.shiftKey && document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      } else if (!evt.shiftKey && document.activeElement === last) {
        evt.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', escListener, true);
    drawer.addEventListener('keydown', focusTrapListener);
  }

  function detachKeyHandlers() {
    if (escListener) document.removeEventListener('keydown', escListener, true);
    escListener = null;
    focusTrapListener = null;
  }

  function isDirty(state) {
    if (!mountEl) return false;
    var fields = mountEl.querySelectorAll('.psupport-field-input');
    var dirty = false;
    fields.forEach(function (field) {
      if (field.value && field.value.trim()) dirty = true;
    });
    if (state.selectedFile) dirty = true;
    return dirty;
  }

  function requestClose(overlay, drawer, state) {
    if (state.submitted || !isDirty(state)) {
      closeNow(overlay, drawer);
      return;
    }
    showCloseConfirm(overlay, drawer, state);
  }

  function showCloseConfirm(overlay, drawer, state) {
    var confirmOverlay = el('div', 'psupport-confirm-dialog');
    var box = el('div', 'psupport-confirm-box');
    var text = el('p', 'psupport-confirm-text', { text: UI.closeConfirm });
    var actions = el('div', 'psupport-confirm-actions');

    var yesBtn = el('button', 'psupport-btn psupport-btn--primary', { type: 'button', text: UI.closeConfirmYes });
    var noBtn = el('button', 'psupport-btn psupport-btn--secondary', { type: 'button', text: UI.closeConfirmNo });

    yesBtn.addEventListener('click', function () {
      confirmOverlay.remove();
      closeNow(overlay, drawer);
    });
    noBtn.addEventListener('click', function () {
      confirmOverlay.remove();
    });

    actions.appendChild(noBtn);
    actions.appendChild(yesBtn);
    box.appendChild(text);
    box.appendChild(actions);
    confirmOverlay.appendChild(box);
    mountEl.appendChild(confirmOverlay);
    yesBtn.focus();
  }

  function closeNow(overlay, drawer) {
    detachKeyHandlers();
    overlay.classList.remove('psupport-overlay--visible');
    drawer.classList.remove('psupport-drawer--visible');
    setTimeout(function () {
      if (mountEl) mountEl.innerHTML = '';
    }, 260);
    if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === 'function') {
      previouslyFocusedEl.focus();
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // Form görünümü
  // ───────────────────────────────────────────────────────────────────

  function renderFormView(drawer, state) {
    drawer.innerHTML = '';

    var header = buildHeader(drawer, state);
    var body = el('div', 'psupport-drawer-body');
    var footer = el('div', 'psupport-drawer-footer');

    if (state.packageOptions) {
      var pickerRefs = buildPackagePicker(state);
      body.appendChild(pickerRefs.wrapper);
      state.packagePickerSelect = pickerRefs.select;
      state.packagePickerError = pickerRefs.errorEl;
    }

    var summaryWrap = el('div', 'psupport-summary-wrap');
    renderSummaryInto(summaryWrap, state);
    body.appendChild(summaryWrap);
    state.summaryWrapEl = summaryWrap;

    var formRefs = buildFormFields(body, state);

    var cancelBtn = el('button', 'psupport-btn psupport-btn--secondary', { type: 'button', text: UI.cancelButton });
    var submitBtn = el('button', 'psupport-btn psupport-btn--primary', { type: 'button' });
    submitBtn.textContent = UI.submitButton;

    cancelBtn.addEventListener('click', function () {
      requestClose(drawer.previousSibling, drawer, state);
    });

    submitBtn.addEventListener('click', function () {
      handleSubmit(drawer, state, formRefs, submitBtn);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);

    drawer.appendChild(header);
    drawer.appendChild(body);
    drawer.appendChild(footer);
  }

  function buildHeader(drawer, state) {
    var header = el('div', 'psupport-drawer-header');
    var title = el('h2', 'psupport-drawer-title', { text: UI.panelTitle });
    var closeBtn = el('button', 'psupport-drawer-close', { type: 'button', 'aria-label': 'Kapat' });
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function () {
      requestClose(drawer.previousSibling, drawer, state);
    });
    header.appendChild(title);
    header.appendChild(closeBtn);
    return header;
  }

  function hasMissingCoreFields(snapshot) {
    return !snapshot.paketciPackageId && !snapshot.orderNumber;
  }

  function shouldShowManualHint(state) {
    // Paket seçici modunda, kullanıcı henüz bir paket seçmediyse "otomatik
    // okunamadı" uyarısı yanıltıcı olur — seçim yapılana kadar gösterilmez.
    if (state.packageOptions && !state.packageSelected) return false;
    return hasMissingCoreFields(state.snapshot);
  }

  function renderSummaryInto(container, state) {
    container.innerHTML = '';
    container.appendChild(buildSummarySection(state));
    if (shouldShowManualHint(state)) {
      container.appendChild(el('div', 'psupport-manual-hint', { text: UI.manualEditHint }));
    }
  }

  function packageOptionLabel(pkg) {
    var parts = [];
    if (pkg.paketciPackageId) parts.push(pkg.paketciPackageId);
    else if (pkg.orderNumber) parts.push(pkg.orderNumber);
    if (pkg.restaurantName) parts.push(pkg.restaurantName);
    if (pkg.courierName) parts.push(pkg.courierName);
    return parts.length ? parts.join(' — ') : 'Paket';
  }

  function buildPackagePicker(state) {
    var field = buildFieldWrapper(UI.packagePickerLabel, true);
    var select = el('select', 'psupport-select psupport-field-input', { 'aria-label': UI.packagePickerLabel });

    var placeholder = el('option', null, { value: '' });
    placeholder.textContent = UI.packagePickerPlaceholder;
    select.appendChild(placeholder);

    state.packageOptions.forEach(function (pkg, index) {
      var option = el('option', null, { value: String(index) });
      // pkg alanları paketciAdapter.js içinde zaten escapeHtml ile
      // kaçışlanmış; innerHTML ataması buildSummaryItem ile aynı kuralı izler.
      option.innerHTML = packageOptionLabel(pkg);
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      var idx = select.value;
      state.snapshot = idx !== '' ? state.packageOptions[Number(idx)] : {};
      state.packageSelected = idx !== '';
      if (state.packageSelected) setFieldError(select, field.errorEl, null);
      renderSummaryInto(state.summaryWrapEl, state);
    });

    field.input.appendChild(select);
    return { wrapper: field.wrapper, select: select, errorEl: field.errorEl };
  }

  function buildSummarySection(state) {
    var section = el('div', 'psupport-summary');
    var title = el('p', 'psupport-summary-title', { text: UI.packageSummaryTitle });
    var grid = el('div', 'psupport-summary-grid');

    section.appendChild(title);

    EDITABLE_SUMMARY_FIELDS.concat(READONLY_SUMMARY_FIELDS).forEach(function (field) {
      grid.appendChild(buildSummaryItem(field, state));
    });

    var detailUrl = state.snapshot.paketciDetailUrl;
    if (detailUrl) {
      var linkItem = el('div', 'psupport-summary-item');
      var linkLabel = el('p', 'psupport-summary-label', { text: 'Paket Detay Linki' });
      var link = el('a', 'psupport-summary-value', { href: detailUrl, target: '_blank', rel: 'noopener noreferrer' });
      link.textContent = 'Detayı Aç ↗';
      linkItem.appendChild(linkLabel);
      linkItem.appendChild(link);
      grid.appendChild(linkItem);
    }

    section.appendChild(grid);
    return section;
  }

  function buildSummaryItem(field, state) {
    var item = el('div', 'psupport-summary-item');
    var label = el('p', 'psupport-summary-label', { text: field.label });
    item.appendChild(label);

    var rawValue = state.snapshot[field.key];
    var isEditable = EDITABLE_SUMMARY_FIELDS.some(function (f) {
      return f.key === field.key;
    });

    if (rawValue) {
      var value = el('p', 'psupport-summary-value');
      // snapshot değerleri paketciAdapter.js içinde zaten escapeHtml ile
      // kaçışlanmış; bu nedenle innerHTML ataması güvenlidir (decode edilerek
      // doğru şekilde görüntülenir, yeniden HTML olarak parse edilmez).
      value.innerHTML = rawValue;
      item.appendChild(value);
      return item;
    }

    if (!isEditable) {
      var emptyValue = el('p', 'psupport-summary-value psupport-summary-value--empty', { text: 'Belirtilmemiş' });
      item.appendChild(emptyValue);
      return item;
    }

    var fillLink = el('button', 'psupport-summary-value psupport-summary-value--empty', {
      type: 'button',
      style: 'background:none;border:none;padding:0;text-decoration:underline;cursor:pointer;color:var(--psupport-primary);'
    });
    fillLink.textContent = 'Manuel doldur';
    fillLink.addEventListener('click', function () {
      var input = el('input', 'psupport-input', { type: 'text', placeholder: field.label });
      input.addEventListener('input', function () {
        state.manualOverrides[field.key] = input.value.trim();
      });
      item.replaceChild(input, fillLink);
      input.focus();
    });
    item.appendChild(fillLink);
    return item;
  }

  function buildFormFields(body, state) {
    var refs = {};

    // Sorun tipi
    var issueTypeField = buildFieldWrapper(UI.issueTypeLabel, true);
    var issueTypeSelect = el('select', 'psupport-select psupport-field-input', { 'aria-label': UI.issueTypeLabel });
    issueTypeSelect.appendChild(el('option', null, { value: '', text: 'Seçiniz…' }));
    ISSUE_TYPES.forEach(function (item) {
      issueTypeSelect.appendChild(el('option', null, { value: item.value, text: item.label }));
    });
    issueTypeField.input.appendChild(issueTypeSelect);
    body.appendChild(issueTypeField.wrapper);
    refs.issueType = issueTypeSelect;
    refs.issueTypeError = issueTypeField.errorEl;

    // Öncelik
    var priorityField = buildFieldWrapper(UI.priorityLabel, true);
    var prioritySelect = el('select', 'psupport-select psupport-field-input', { 'aria-label': UI.priorityLabel });
    PRIORITIES.forEach(function (item) {
      prioritySelect.appendChild(el('option', null, { value: item.value, text: item.label }));
    });
    prioritySelect.value = 'normal';
    priorityField.input.appendChild(prioritySelect);
    body.appendChild(priorityField.wrapper);
    refs.priority = prioritySelect;

    issueTypeSelect.addEventListener('change', function () {
      var selected = ISSUE_TYPES.filter(function (item) {
        return item.value === issueTypeSelect.value;
      })[0];
      if (selected && !state.userTouchedPriority) {
        prioritySelect.value = selected.suggestedPriority;
      }
    });
    prioritySelect.addEventListener('change', function () {
      state.userTouchedPriority = true;
    });

    // Başlık
    var titleField = buildFieldWrapper(UI.titleLabel, true);
    var titleInput = el('input', 'psupport-input psupport-field-input', {
      type: 'text',
      placeholder: UI.titlePlaceholder,
      maxlength: '120'
    });
    titleField.input.appendChild(titleInput);
    body.appendChild(titleField.wrapper);
    refs.title = titleInput;
    refs.titleError = titleField.errorEl;

    // Açıklama
    var descField = buildFieldWrapper(UI.descriptionLabel, true);
    var descTextarea = el('textarea', 'psupport-textarea psupport-field-input', {
      rows: '4',
      'aria-label': UI.descriptionLabel
    });
    descField.input.appendChild(descTextarea);
    body.appendChild(descField.wrapper);
    refs.description = descTextarea;
    refs.descriptionError = descField.errorEl;

    // Gönderen ad-soyad
    var nameField = buildFieldWrapper(UI.senderNameLabel, true);
    var nameInput = el('input', 'psupport-input psupport-field-input', { type: 'text' });
    nameField.input.appendChild(nameInput);
    body.appendChild(nameField.wrapper);
    refs.senderName = nameInput;
    refs.senderNameError = nameField.errorEl;

    // Gönderen e-posta
    var emailField = buildFieldWrapper(UI.senderEmailLabel, true);
    var emailInput = el('input', 'psupport-input psupport-field-input', { type: 'email' });
    emailField.input.appendChild(emailInput);
    body.appendChild(emailField.wrapper);
    refs.senderEmail = emailInput;
    refs.senderEmailError = emailField.errorEl;

    // Gönderen telefon (opsiyonel)
    var phoneField = buildFieldWrapper(UI.senderPhoneLabel, false);
    var phoneInput = el('input', 'psupport-input psupport-field-input', { type: 'tel' });
    phoneField.input.appendChild(phoneInput);
    body.appendChild(phoneField.wrapper);
    refs.senderPhone = phoneInput;

    // Dosya eki
    var fileField = buildFieldWrapper('Dosya Eki (opsiyonel)', false);
    var dropzone = buildDropzone(state, fileField.errorEl);
    fileField.input.appendChild(dropzone);
    body.appendChild(fileField.wrapper);
    refs.fileError = fileField.errorEl;

    // İstek seviyesi hata banner'ı (submit sonrası ağ/sunucu hataları için)
    var requestErrorBanner = el('div', 'psupport-field-error', { style: 'display:none;margin-bottom:12px;' });
    body.insertBefore(requestErrorBanner, body.firstChild.nextSibling);
    refs.requestErrorBanner = requestErrorBanner;

    return refs;
  }

  function buildFieldWrapper(labelText, required) {
    var wrapper = el('div', 'psupport-field');
    var label = el('label', 'psupport-label');
    label.textContent = labelText;
    if (required) {
      var star = el('span', 'psupport-required', { text: '*' });
      label.appendChild(star);
    }
    var inputHolder = el('div', null);
    var errorEl = el('div', 'psupport-field-error', { style: 'display:none;' });

    wrapper.appendChild(label);
    wrapper.appendChild(inputHolder);
    wrapper.appendChild(errorEl);

    return { wrapper: wrapper, input: inputHolder, errorEl: errorEl };
  }

  function buildDropzone(state, errorEl) {
    var dropzone = el('div', 'psupport-dropzone', { tabindex: '0' });
    var hint = el('p', null, { text: UI.dropzoneHint });
    var hiddenInput = el('input', null, { type: 'file', accept: '.jpg,.jpeg,.png,.webp,.pdf' });
    var preview = el('div', 'psupport-file-preview', { style: 'display:none;' });
    var previewName = el('span', 'psupport-file-preview-name');
    var removeBtn = el('button', 'psupport-file-remove', { type: 'button', text: UI.removeFile });

    preview.appendChild(previewName);
    preview.appendChild(removeBtn);

    dropzone.appendChild(hint);
    dropzone.appendChild(hiddenInput);
    dropzone.appendChild(preview);

    function setError(message) {
      if (message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      } else {
        errorEl.style.display = 'none';
      }
    }

    function applyFile(file) {
      var fileErrors = validator.validateFile(file);
      if (fileErrors.file) {
        setError(fileErrors.file);
        state.selectedFile = null;
        preview.style.display = 'none';
        hint.style.display = 'block';
        return;
      }
      setError(null);
      state.selectedFile = file;
      previewName.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      preview.style.display = 'flex';
      hint.style.display = 'none';
    }

    dropzone.addEventListener('click', function (evt) {
      if (evt.target === removeBtn) return;
      hiddenInput.click();
    });

    hiddenInput.addEventListener('change', function () {
      if (hiddenInput.files && hiddenInput.files[0]) applyFile(hiddenInput.files[0]);
    });

    dropzone.addEventListener('dragover', function (evt) {
      evt.preventDefault();
      dropzone.classList.add('psupport-dropzone--dragover');
    });
    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('psupport-dropzone--dragover');
    });
    dropzone.addEventListener('drop', function (evt) {
      evt.preventDefault();
      dropzone.classList.remove('psupport-dropzone--dragover');
      if (evt.dataTransfer.files && evt.dataTransfer.files[0]) applyFile(evt.dataTransfer.files[0]);
    });

    removeBtn.addEventListener('click', function (evt) {
      evt.stopPropagation();
      state.selectedFile = null;
      hiddenInput.value = '';
      preview.style.display = 'none';
      hint.style.display = 'block';
      setError(null);
    });

    return dropzone;
  }

  // ───────────────────────────────────────────────────────────────────
  // Submit akışı
  // ───────────────────────────────────────────────────────────────────

  function setFieldError(inputEl, errorEl, message) {
    if (message) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      inputEl.classList.add(inputEl.tagName === 'SELECT' ? 'psupport-select--error' : inputEl.tagName === 'TEXTAREA' ? 'psupport-textarea--error' : 'psupport-input--error');
    } else {
      errorEl.style.display = 'none';
      inputEl.classList.remove('psupport-input--error', 'psupport-select--error', 'psupport-textarea--error');
    }
  }

  function handleSubmit(drawer, state, refs, submitBtn) {
    if (state.submitting) return;

    var pickerValid = true;
    if (state.packageOptions) {
      pickerValid = !!state.packageSelected;
      setFieldError(state.packagePickerSelect, state.packagePickerError, pickerValid ? null : ERRORS.missingPackageSelection);
    }

    var formData = {
      issueType: refs.issueType.value,
      title: refs.title.value,
      description: refs.description.value,
      senderName: refs.senderName.value,
      senderEmail: refs.senderEmail.value,
      file: state.selectedFile
    };

    var result = validator.validateSupportForm(formData);

    setFieldError(refs.issueType, refs.issueTypeError, result.errors.issueType);
    setFieldError(refs.title, refs.titleError, result.errors.title);
    setFieldError(refs.description, refs.descriptionError, result.errors.description);
    setFieldError(refs.senderName, refs.senderNameError, result.errors.senderName);
    setFieldError(refs.senderEmail, refs.senderEmailError, result.errors.senderEmail);
    if (result.errors.file) refs.fileError.textContent = result.errors.file;
    refs.fileError.style.display = result.errors.file ? 'block' : 'none';

    if (!result.valid || !pickerValid) {
      refs.requestErrorBanner.style.display = 'none';
      return;
    }

    var snapshot = state.snapshot;
    function fieldValue(key) {
      return state.manualOverrides[key] || snapshot[key] || null;
    }

    var payload = {
      source: 'chrome_extension',
      extensionVersion: config.extensionVersion,
      sender: {
        name: refs.senderName.value.trim(),
        email: refs.senderEmail.value.trim(),
        phone: refs.senderPhone.value.trim() || null
      },
      package: {
        paketciPackageId: fieldValue('paketciPackageId'),
        orderNumber: fieldValue('orderNumber'),
        restaurantName: fieldValue('restaurantName'),
        branchName: fieldValue('branchName'),
        courierName: fieldValue('courierName'),
        packageStatus: fieldValue('packageStatus'),
        deliveryStatus: fieldValue('deliveryStatus'),
        paymentType: fieldValue('paymentType'),
        packageTotal: fieldValue('packageTotal'),
        customerNameMasked: snapshot.customerNameMasked || null,
        customerPhoneMasked: snapshot.customerPhoneMasked || null,
        customerAddressMasked: snapshot.customerAddressMasked || null,
        packageCreatedAt: fieldValue('packageCreatedAt'),
        paketciDetailUrl: snapshot.paketciDetailUrl || null
      },
      ticket: {
        category: refs.issueType.value,
        priority: refs.priority.value,
        title: refs.title.value.trim(),
        description: refs.description.value.trim()
      },
      page: {
        url: snapshot.pageUrl || window.location.href,
        title: snapshot.pageTitle || document.title || null
      }
    };

    state.submitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '';
    var spinner = el('span', 'psupport-spinner');
    submitBtn.appendChild(spinner);
    submitBtn.appendChild(document.createTextNode(' ' + UI.submitButtonLoading));
    refs.requestErrorBanner.style.display = 'none';

    apiClient.submitSupportRequest(payload, state.selectedFile).then(function (response) {
      state.submitting = false;
      submitBtn.disabled = false;

      if (response.ok && response.data && response.data.success) {
        state.submitted = true;
        renderSuccessView(drawer, response.data);
        return;
      }

      submitBtn.textContent = UI.retryButton;
      refs.requestErrorBanner.textContent = response.errorMessage || ERRORS.requestFailed;
      refs.requestErrorBanner.style.display = 'block';
      toast.error(response.errorMessage || ERRORS.requestFailed);
    });
  }

  function renderSuccessView(drawer, data) {
    var overlay = drawer.previousSibling;
    var body = drawer.querySelector('.psupport-drawer-body');
    var footer = drawer.querySelector('.psupport-drawer-footer');

    body.innerHTML = '';
    footer.innerHTML = '';

    var resultWrap = el('div', 'psupport-result');
    var icon = el('div', 'psupport-result-icon psupport-result-icon--success', { text: '✓' });
    var message = el('p', 'psupport-result-message');
    message.textContent = MESSAGES.successTemplate.replace('{{ticketNumber}}', data.ticketNumber || '');

    resultWrap.appendChild(icon);
    resultWrap.appendChild(message);
    body.appendChild(resultWrap);

    var closeBtn = el('button', 'psupport-btn psupport-btn--primary', { type: 'button', text: 'Kapat' });
    closeBtn.addEventListener('click', function () {
      closeNow(overlay, drawer);
    });
    footer.appendChild(closeBtn);

    toast.success(message.textContent, 6000);
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.supportPanel = {
    open: open
  };
})(typeof window !== 'undefined' ? window : self);
