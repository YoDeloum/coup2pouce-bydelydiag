// ─────────────────────────────────────────────
// STORAGE.JS — Synchronisation Firestore
// Intercepte localStorage → sync cloud auto
// ─────────────────────────────────────────────

var _FS_PROJECT = 'coup2pouce-by-delydiag';
var _FS_BASE    = 'https://firestore.googleapis.com/v1/projects/' + _FS_PROJECT + '/databases/(default)/documents/users/';

// Clés à synchroniser (données métier uniquement — jamais les tokens d'auth)
var _FS_KEYS = [
  'dd_company_profile',
  'dd_tarifs',
  'dd_devis_list',
  'dd_missions',
  'dd_factures_list',
  'dd_docs_reglementaires',
  'dd_avatar',
  'dd_avatar_color',
  'dd_prenom',
  'dd_avis_lien',
  'dd_avis_msg',
  'certif_planning',
  'dd_dark'
];

// Sauvegarde de la méthode originale avant interception
var _lsSetItem = Storage.prototype.setItem;

// ─── Interception de localStorage.setItem ───
// Tous les modules existants continuent de fonctionner sans modification.
// Chaque écriture sur une clé métier déclenche une sync Firestore silencieuse.
Storage.prototype.setItem = function(key, value) {
  _lsSetItem.call(this, key, value);
  if (this === localStorage && _FS_KEYS.indexOf(key) !== -1) {
    _fsPush(key, value);
  }
};

// ─── Helpers auth ───
function _fsGetAuth() {
  return {
    uid:   localStorage.getItem('fb_uid'),
    token: localStorage.getItem('fb_token')
  };
}

// ─── Écriture d'une clé vers Firestore ───
function _fsPush(key, value) {
  var a = _fsGetAuth();
  if (!a.uid || !a.token) return;

  fetch(_FS_BASE + a.uid + '/data/' + key, {
    method:  'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + a.token
    },
    body: JSON.stringify({
      fields: { value: { stringValue: String(value) } }
    })
  }).catch(function() {
    // Silencieux : la donnée reste dans localStorage même si Firestore est injoignable
  });
}

// ─── Lecture complète depuis Firestore → localStorage ───
// Appelée à chaque connexion (login) et à chaque ouverture de l'app (checkLogin).
// Garantit que les données cloud écrasent localStorage si différentes
// (utile quand l'utilisateur change d'appareil).
function syncFromFirestore(callback) {
  var a = _fsGetAuth();
  if (!a.uid || !a.token) {
    if (callback) callback();
    return;
  }

  fetch(_FS_BASE + a.uid + '/data', {
    headers: { 'Authorization': 'Bearer ' + a.token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.documents && data.documents.length) {
      data.documents.forEach(function(doc) {
        var key = doc.name.split('/').pop();
        var val = doc.fields && doc.fields.value && doc.fields.value.stringValue;
        if (val !== undefined && _FS_KEYS.indexOf(key) !== -1) {
          // Écriture directe via la méthode originale (sans re-déclencher la sync)
          _lsSetItem.call(localStorage, key, val);
        }
      });
    }
    if (callback) callback();
  })
  .catch(function() {
    // En cas d'erreur réseau : l'app continue avec les données locales
    if (callback) callback();
  });
}
