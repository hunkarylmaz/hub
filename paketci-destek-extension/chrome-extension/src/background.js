/**
 * Service worker — v1'de minimal yaşam döngüsü yönetimi.
 * Mail/şifre gibi hiçbir gizli bilgi burada YOKTUR ve olmayacaktır;
 * tüm backend iletişimi content script üzerinden apiClient.js ile yapılır.
 */
'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.info('[Paketçi Destek] Eklenti kuruldu.');
  } else if (details.reason === 'update') {
    console.info('[Paketçi Destek] Eklenti güncellendi:', chrome.runtime.getManifest().version);
  }
});
