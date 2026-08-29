// ─────────────────────────────────────────────
// STORAGE.JS — Synchronisation Firestore
// Chaque écriture localStorage → sync cloud
// Token Firebase rafraîchi automatiquement
// ─────────────────────────────────────────────

var _FS_PROJECT = 'coup2pouce-by-delydiag';
var _FS_API_KEY = 'AIzaSy' + 'ATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
var _FS_COL     = 'https://firestore.googleapis.com/v1/projects/' + _FS_PROJECT + '/databases/(default)/documents/userdata/';

// Clés à synchroniser (données métier uniquement)
var _FS_KEYS = [
  'dd_company_profile',
  'dd_tarifs',
  'dd_devis_list',
  'dd_missions',
  'dd_factures_list',
  // 'dd_docs_reglementaires' exclu du sync Firestore : les PDFs en base64 sont trop volumineux
  // et Firestore écrase les données locales à chaque login. Ces docs restent en localStorage uniquement.
  'dd_avatar',
  'dd_avatar_color',
  'dd_prenom',
  'dd_avis_lien',
  'dd_avis_msg',
  'dd_stats_objectif',
  'certif_planning',
  'dd_dark',
  'dd_relance_log',
  'dd_relance_run',
  'dd_relance_settings',
  'dd_prescripteurs'
];

var _lsSetItem = Storage.prototype.setItem;

// ─── Interception localStorage.setItem ───
Storage.prototype.setItem = function(key, value) {
  _lsSetItem.call(this, key, value);
  if (this === localStorage && _FS_KEYS.indexOf(key) !== -1) {
    _fsPush(key, value);
  }
  // Sync créneaux publics pour les prescripteurs quand les missions changent
  if (this === localStorage && key === 'dd_missions') {
    if (typeof updatePublicSlots === 'function') updatePublicSlots();
  }
};

// ─── Rafraîchissement automatique du token ───
function _fsRefreshToken(callback) {
  var refresh = localStorage.getItem('fb_refresh');
  if (!refresh) { callback(null); return; }

  fetch('https://securetoken.googleapis.com/v1/token?key=' + _FS_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refresh })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.id_token) {
      _lsSetItem.call(localStorage, 'fb_token', data.id_token);
      if (data.refresh_token) _lsSetItem.call(localStorage, 'fb_refresh', data.refresh_token);
      callback(data.id_token);
    } else {
      callback(null);
    }
  })
  .catch(function() { callback(null); });
}

// ─── Écriture d'une clé vers Firestore ───
function _fsPush(key, value) {
  var uid   = localStorage.getItem('fb_uid');
  var token = localStorage.getItem('fb_token');
  if (!uid || !token) return;

  // Pour dd_company_profile : exclure logo/logo_w/logo_h (base64 trop volumineux pour Firestore)
  var valueToSync = value;
  if (key === 'dd_company_profile') {
    try {
      var _obj = JSON.parse(value);
      var _stripped = Object.assign({}, _obj);
      delete _stripped.logo; delete _stripped.logo_w; delete _stripped.logo_h;
      valueToSync = JSON.stringify(_stripped);
    } catch(e) {}
  }

  var fields = {};
  fields[key] = { stringValue: String(valueToSync) };

  var url = _FS_COL + uid + '?updateMask.fieldPaths=' + key;
  var opts = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ fields: fields })
  };

  fetch(url, opts).then(function(res) {
    if (res.status === 401 || res.status === 403) {
      // Token expiré — rafraîchir et réessayer
      _fsRefreshToken(function(newToken) {
        if (!newToken) return;
        opts.headers['Authorization'] = 'Bearer ' + newToken;
        fetch(url, opts).catch(function() {});
      });
    }
  }).catch(function() {});
}

// ─── Traitement des données reçues de Firestore ───
function _processSync(data, uid, callback) {
  var cloudKeys = {};
  if (data && data.fields) {
    _FS_KEYS.forEach(function(key) {
      var field = data.fields[key];
      if (field && field.stringValue !== undefined) {
        if (key === 'dd_company_profile') {
          // Préserver logo/logo_w/logo_h locaux — Firestore ne les stocke pas (trop volumineux)
          try {
            var _cloud = JSON.parse(field.stringValue);
            var _local = JSON.parse(localStorage.getItem(key) || '{}');
            if (_local.logo)   _cloud.logo   = _local.logo;
            if (_local.logo_w) _cloud.logo_w = _local.logo_w;
            if (_local.logo_h) _cloud.logo_h = _local.logo_h;
            _lsSetItem.call(localStorage, key, JSON.stringify(_cloud));
          } catch(e) {
            _lsSetItem.call(localStorage, key, field.stringValue);
          }
        } else {
          _lsSetItem.call(localStorage, key, field.stringValue);
        }
        cloudKeys[key] = true;
      }
    });
  }
  // Pousser vers le cloud les clés locales absentes
  _FS_KEYS.forEach(function(key) {
    if (!cloudKeys[key]) {
      var val = localStorage.getItem(key);
      if (val) _fsPush(key, val);
    }
  });
  if (callback) callback();
}

// ─── Lecture complète depuis Firestore ───
function _doSync(uid, token, callback) {
  fetch(_FS_COL + uid, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.error && (data.error.code === 401 || data.error.code === 403)) {
      // Token invalide — rafraîchir et réessayer une fois
      _fsRefreshToken(function(newToken) {
        if (!newToken) { if (callback) callback(); return; }
        fetch(_FS_COL + uid, { headers: { 'Authorization': 'Bearer ' + newToken } })
        .then(function(r) { return r.json(); })
        .then(function(d) { _processSync(d, uid, callback); })
        .catch(function() { if (callback) callback(); });
      });
      return;
    }
    _processSync(data, uid, callback);
  })
  .catch(function() { if (callback) callback(); });
}

// ─── Point d'entrée : sync au login ───
function syncFromFirestore(callback) {
  var uid   = localStorage.getItem('fb_uid');
  var token = localStorage.getItem('fb_token');
  if (!uid) { if (callback) callback(); return; }

  if (!token) {
    _fsRefreshToken(function(newToken) {
      if (newToken) { _doSync(uid, newToken, callback); }
      else { if (callback) callback(); }
    });
    return;
  }
  _doSync(uid, token, callback);
}
