// ─────────────────────────────────────────────
// STORAGE.JS — Synchronisation Firestore
// Intercepte localStorage → sync cloud auto
// ─────────────────────────────────────────────

var _FS_PROJECT = 'coup2pouce-by-delydiag';
var _FS_API_KEY = 'AIzaSyATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
var _FS_COL     = 'https://firestore.googleapis.com/v1/projects/' + _FS_PROJECT + '/databases/(default)/documents/userdata/';

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

// ─── Écriture d'une clé vers Firestore ───
// Utilise updateMask pour ne mettre à jour qu'un seul champ sans écraser les autres.
function _fsPush(key, value) {
  var uid = localStorage.getItem('fb_uid');
  if (!uid) return;

  var fields = {};
  fields[key] = { stringValue: String(value) };

  fetch(_FS_COL + uid + '?key=' + _FS_API_KEY + '&updateMask.fieldPaths=' + key, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields })
  }).catch(function() {
    // Silencieux : la donnée reste dans localStorage même si Firestore est injoignable
  });
}

// ─── Lecture complète depuis Firestore → localStorage ───
// Appelée à chaque connexion (login).
// Si Firestore n'a pas encore une clé mais localStorage l'a (migration),
// la donnée locale est poussée vers Firestore automatiquement.
function syncFromFirestore(callback) {
  var uid = localStorage.getItem('fb_uid');
  if (!uid) {
    if (callback) callback();
    return;
  }

  fetch(_FS_COL + uid + '?key=' + _FS_API_KEY)
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var cloudKeys = {};
    if (data && data.fields) {
      _FS_KEYS.forEach(function(key) {
        var field = data.fields[key];
        if (field && field.stringValue !== undefined) {
          // Donnée cloud → localStorage
          _lsSetItem.call(localStorage, key, field.stringValue);
          cloudKeys[key] = true;
        }
      });
    }

    // Migration unique : pousse les clés locales absentes du cloud
    if (!localStorage.getItem('_fs_migrated_v2')) {
      _FS_KEYS.forEach(function(key) {
        if (!cloudKeys[key]) {
          var val = localStorage.getItem(key);
          if (val) _fsPush(key, val);
        }
      });
      _lsSetItem.call(localStorage, '_fs_migrated_v2', '1');
    }

    if (callback) callback();
  })
  .catch(function() {
    // En cas d'erreur réseau : l'app continue avec les données locales
    if (callback) callback();
  });
}
