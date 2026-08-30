// ─────────────────────────────────────────────
// NETLIFY FUNCTION — get-slots.js
// Retourne les créneaux occupés pour un code prescripteur
// Variables requises : FIREBASE_API_KEY (Netlify env)
// ─────────────────────────────────────────────

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  var code = (event.queryStringParameters || {}).code;
  if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Code manquant' }) };

  var FS_PROJECT = 'coup2pouce-by-delydiag';
  var FS_KEY     = process.env.FIREBASE_API_KEY;
  var FS_BASE    = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  try {
    // 1. Valider le code prescripteur
    var codeRes = await fetch(FS_BASE + '/codes/' + code + '?key=' + FS_KEY);
    var codeDoc = await codeRes.json();

    if (!codeDoc.fields) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Code invalide' }) };
    }

    var actif = codeDoc.fields.actif && codeDoc.fields.actif.booleanValue;
    if (!actif) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Accès désactivé' }) };
    }

    var uid       = codeDoc.fields.uid.stringValue;
    var agence    = codeDoc.fields.agence.stringValue;
    var nom       = (codeDoc.fields.nom && codeDoc.fields.nom.stringValue) || '';
    var emailDiag = (codeDoc.fields.email_diag && codeDoc.fields.email_diag.stringValue) || '';

    // 2. Récupérer les créneaux occupés
    var slotsRes = await fetch(FS_BASE + '/public_slots/' + uid + '?key=' + FS_KEY);
    var slotsDoc = await slotsRes.json();

    var busy = [];
    if (slotsDoc.fields && slotsDoc.fields.busy &&
        slotsDoc.fields.busy.arrayValue &&
        slotsDoc.fields.busy.arrayValue.values) {
      busy = slotsDoc.fields.busy.arrayValue.values.map(function(v) {
        return {
          date:  v.mapValue.fields.date.stringValue,
          heure: v.mapValue.fields.heure.stringValue
        };
      });
    }

    // 3. Lire les tarifs depuis public_slots (déjà fetchés)
    var tarifsObj = {};
    if (slotsDoc.fields && slotsDoc.fields.tarifs && slotsDoc.fields.tarifs.stringValue) {
      try { tarifsObj = JSON.parse(slotsDoc.fields.tarifs.stringValue); } catch(e) {}
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ valid: true, agence: agence, nom: nom, email_diag: emailDiag, busy: busy, tarifs: tarifsObj })
    };

  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
