// ─────────────────────────────────────────────
// NETLIFY FUNCTION — handle-consentement.js
// GET  ?token=XX       → valide le token, retourne infos client/diag
// POST { token, ... }  → enregistre le consentement signé en Firestore
// Variables requises : FIREBASE_API_KEY (Netlify env)
// Collection Firestore utilisée : signatures/{token} (type='consentement')
// ─────────────────────────────────────────────

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  var FS_PROJECT = 'coup2pouce-by-delydiag';
  var FS_KEY     = process.env.FIREBASE_API_KEY;
  var FS_BASE    = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  // ── GET : validation du token, retourne infos pour pré-remplissage ──
  if (event.httpMethod === 'GET') {
    var token = (event.queryStringParameters || {}).token;
    if (!token) return { statusCode: 400, headers: CORS, body: JSON.stringify({ valid: false, error: 'Token manquant' }) };

    try {
      var docRes = await fetch(FS_BASE + '/signatures/' + token + '?key=' + FS_KEY);
      var doc    = await docRes.json();

      if (!doc.fields) {
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ valid: false, error: 'Lien invalide' }) };
      }

      var fields = doc.fields;

      // Vérifier que c'est bien un token de consentement
      var type = fields.type && fields.type.stringValue;
      if (type !== 'consentement') {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ valid: false, error: 'Lien invalide' }) };
      }

      var actif = fields.actif && fields.actif.booleanValue;
      if (!actif) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ valid: false, error: 'Lien désactivé' }) };
      }

      var signe    = fields.signe && fields.signe.booleanValue;
      var signedAt = fields.signed_at && fields.signed_at.stringValue;

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          valid:         true,
          signe:         signe || false,
          signed_at:     signedAt || null,
          nom_diag:      (fields.nom_diag      && fields.nom_diag.stringValue)      || '',
          email_client:  (fields.email_client  && fields.email_client.stringValue)  || '',
          nom_client:    (fields.nom_client     && fields.nom_client.stringValue)    || '',
          prenom_client: (fields.prenom_client  && fields.prenom_client.stringValue) || '',
          tel_client:    (fields.tel_client     && fields.tel_client.stringValue)    || '',
          adresse_bien:  (fields.adresse_bien   && fields.adresse_bien.stringValue)  || ''
        })
      };
    } catch(e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ valid: false, error: e.message }) };
    }
  }

  // ── POST : enregistrement du consentement signé ──
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  var payload;
  try { payload = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  var token = payload.token;
  if (!token) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Token manquant' }) };

  try {
    // 1. Lire le document pour vérifier qu'il est valide et non encore signé
    var docRes2 = await fetch(FS_BASE + '/signatures/' + token + '?key=' + FS_KEY);
    var doc2    = await docRes2.json();

    if (!doc2.fields) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Token invalide' }) };
    }

    var type2 = doc2.fields.type && doc2.fields.type.stringValue;
    if (type2 !== 'consentement') {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Token invalide' }) };
    }

    var actif2 = doc2.fields.actif && doc2.fields.actif.booleanValue;
    if (!actif2) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Lien désactivé' }) };
    }

    // Déjà signé ?
    if (doc2.fields.signe && doc2.fields.signe.booleanValue) {
      return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Formulaire déjà signé' }) };
    }

    // 2. Écrire les données de signature (PATCH)
    var updateFields = {
      fields: {
        signe:          { booleanValue: true },
        reponse:        { stringValue: payload.reponse        || 'non' },
        nom:            { stringValue: payload.nom            || '' },
        prenom:         { stringValue: payload.prenom         || '' },
        email:          { stringValue: payload.email          || '' },
        tel:            { stringValue: payload.tel            || '' },
        date_signature: { stringValue: payload.date_signature || '' },
        lieu_signature: { stringValue: payload.lieu_signature || '' },
        signature_img:  { stringValue: payload.signature_img  || '' },
        signed_at:      { stringValue: new Date().toISOString() }
      }
    };

    // Paramètre updateMask pour ne mettre à jour que ces champs
    var updateMask = Object.keys(updateFields.fields)
      .map(function(k) { return 'updateMask.fieldPaths=' + k; })
      .join('&');

    var patchRes = await fetch(
      FS_BASE + '/signatures/' + token + '?' + updateMask + '&key=' + FS_KEY,
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updateFields)
      }
    );

    if (!patchRes.ok) {
      var errText = await patchRes.text();
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Erreur Firestore : ' + errText.substring(0, 200) }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
