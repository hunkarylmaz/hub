/**
 * Destek talebi formunun DOM'dan bağımsız doğrulama mantığı.
 * Hiçbir yerde document/window erişimi YOKTUR — supportPanel.js bu
 * fonksiyonları çağırıp dönen hata mesajlarını forma yansıtır.
 */
(function (global) {
  'use strict';

  var constants = global.PSupport.constants;
  var VALIDATION_RULES = constants.VALIDATION_RULES;
  var FILE_RULES = constants.FILE_RULES;
  var ERRORS = constants.MESSAGES.errors;

  /** @param {string} email */
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return VALIDATION_RULES.emailRegex.test(email.trim());
  }

  /** @param {string} description */
  function isValidDescription(description) {
    if (!description || typeof description !== 'string') return false;
    return description.trim().length >= VALIDATION_RULES.descriptionMinLength;
  }

  /** @param {string} title */
  function isValidTitle(title) {
    if (!title || typeof title !== 'string') return false;
    return title.trim().length >= VALIDATION_RULES.titleMinLength;
  }

  /** @param {string} senderName */
  function isValidSenderName(senderName) {
    if (!senderName || typeof senderName !== 'string') return false;
    return senderName.trim().length >= VALIDATION_RULES.senderNameMinLength;
  }

  /** @param {string} issueType */
  function isValidIssueType(issueType) {
    if (!issueType) return false;
    return constants.ISSUE_TYPES.some(function (item) {
      return item.value === issueType;
    });
  }

  /**
   * Tek bir File nesnesini boyut + tür açısından doğrular.
   * Dosya opsiyoneldir; null/undefined geçerli sayılır (errors objesi boş döner).
   */
  function validateFile(file) {
    var errors = {};
    if (!file) return errors;

    if (typeof file.size === 'number' && file.size > FILE_RULES.maxSizeBytes) {
      errors.file = ERRORS.fileTooLarge;
      return errors;
    }

    var mimeOk = FILE_RULES.allowedMimeTypes.indexOf(file.type) !== -1;
    var extOk = false;
    if (file.name) {
      var ext = file.name.split('.').pop().toLowerCase();
      extOk = FILE_RULES.allowedExtensions.indexOf(ext) !== -1;
    }

    if (!mimeOk && !extOk) {
      errors.file = ERRORS.fileTypeNotSupported;
    }

    return errors;
  }

  /**
   * Tüm form alanlarını doğrular.
   * @param {{issueType: string, title: string, description: string, senderName: string, senderEmail: string, file: (File|null)}} formData
   * @returns {{valid: boolean, errors: Object<string,string>}}
   */
  function validateSupportForm(formData) {
    var errors = {};
    formData = formData || {};

    if (!isValidIssueType(formData.issueType)) {
      errors.issueType = ERRORS.missingIssueType;
    }

    if (!isValidTitle(formData.title)) {
      errors.title = ERRORS.missingTitle;
    }

    if (!isValidDescription(formData.description)) {
      errors.description = ERRORS.emptyDescription;
    }

    if (!isValidSenderName(formData.senderName)) {
      errors.senderName = ERRORS.missingSenderName;
    }

    if (!isValidEmail(formData.senderEmail)) {
      errors.senderEmail = ERRORS.invalidEmail;
    }

    var fileErrors = validateFile(formData.file);
    Object.keys(fileErrors).forEach(function (key) {
      errors[key] = fileErrors[key];
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  global.PSupport = global.PSupport || {};
  global.PSupport.supportFormValidator = {
    isValidEmail: isValidEmail,
    isValidDescription: isValidDescription,
    isValidTitle: isValidTitle,
    isValidSenderName: isValidSenderName,
    isValidIssueType: isValidIssueType,
    validateFile: validateFile,
    validateSupportForm: validateSupportForm
  };
})(typeof window !== 'undefined' ? window : self);
