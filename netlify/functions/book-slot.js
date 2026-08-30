// ─────────────────────────────────────────────
// NETLIFY FUNCTION — book-slot.js
// Reçoit une demande de RDV prescripteur et envoie un email au diagnostiqueur
// Variables requises : RESEND_API_KEY, FIREBASE_API_KEY (Netlify env)
// ─────────────────────────────────────────────

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  var RESEND_KEY = process.env.RESEND_API_KEY;
  var FS_PROJECT = 'coup2pouce-by-delydiag';
  var FS_KEY     = process.env.FIREBASE_API_KEY;
  var FS_BASE    = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  var payload;
  try { payload = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  var code          = payload.code;
  var date          = payload.date;
  var heure         = payload.heure;
  var adresse       = payload.adresse;
  var type_bien     = payload.type_bien     || '';
  var transaction   = payload.transaction   || '';
  var periode       = payload.periode       || '';
  var surface       = payload.surface       || '';
  var nb_pieces     = payload.nb_pieces     || '';
  var gaz           = payload.gaz           || '';
  var dependances   = payload.dependances   || '';
  var contact_nom   = payload.contact_nom   || '';
  var contact_tel   = payload.contact_tel   || '';
  var contact_email = payload.contact_email || '';
  var notes         = payload.notes         || '';
  var diagnostics   = payload.diagnostics   || '';
  var total_ht      = payload.total_ht      || '';

  if (!code || !date || !heure || !adresse) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Champs requis manquants' }) };
  }

  try {
    // Valider le code
    var codeRes = await fetch(FS_BASE + '/codes/' + code + '?key=' + FS_KEY);
    var codeDoc = await codeRes.json();
    if (!codeDoc.fields || !codeDoc.fields.actif.booleanValue) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Code invalide ou désactivé' }) };
    }

    var emailDiag  = (codeDoc.fields.email_diag && codeDoc.fields.email_diag.stringValue) || '';
    var agenceName = (codeDoc.fields.agence && codeDoc.fields.agence.stringValue) || '';

    if (!emailDiag) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email diagnostiqueur non configuré' }) };
    }

    // Formater la date en français
    var parts  = date.split('-');
    var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    var dateFr = parseInt(parts[2]) + ' ' + months[parseInt(parts[1])-1] + ' ' + parts[0];

    var subject = '📅 Nouvelle demande de RDV — ' + agenceName;
    var html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#E8650A;padding:24px 32px;border-radius:8px 8px 0 0">'
      + '<h1 style="color:#fff;margin:0;font-size:20px">Nouvelle demande de RDV</h1>'
      + '<p style="color:#FED7AA;margin:6px 0 0;font-size:13px">via l\'Espace Prescripteur Coup 2 Pouce</p>'
      + '</div>'
      + '<div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:10px;padding:16px 20px;margin-bottom:20px">'
      + '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#C2410C">📅 Créneau demandé</p>'
      + '<p style="margin:0;font-size:20px;font-weight:800;color:#1A1D2E">' + dateFr + ' à ' + heure + '</p>'
      + '</div>'
      + '<p style="color:#374151"><strong>🏢 Prescripteur :</strong> ' + agenceName + '</p>'
      + '<hr style="border:none;border-top:1px solid #E5E7EB;margin:12px 0"/>'
      + '<p style="font-weight:700;color:#1A1D2E;margin:0 0 8px">🏠 Informations sur le bien</p>'
      + '<p style="color:#374151"><strong>📍 Adresse :</strong> ' + adresse + '</p>'
      + (type_bien   ? '<p style="color:#374151"><strong>Type :</strong> ' + type_bien + '</p>' : '')
      + (transaction ? '<p style="color:#374151"><strong>Transaction :</strong> ' + transaction + '</p>' : '')
      + (periode     ? '<p style="color:#374151"><strong>Période de construction :</strong> ' + periode + '</p>' : '')
      + (surface     ? '<p style="color:#374151"><strong>Surface :</strong> ' + surface + ' m²</p>' : '')
      + (nb_pieces   ? '<p style="color:#374151"><strong>Nb de pièces :</strong> ' + nb_pieces + '</p>' : '')
      + (gaz         ? '<p style="color:#374151"><strong>Gaz :</strong> ' + gaz + '</p>' : '')
      + (dependances ? '<p style="color:#374151"><strong>Dépendances :</strong> ' + dependances + '</p>' : '')
      + '<hr style="border:none;border-top:1px solid #E5E7EB;margin:12px 0"/>'
      + '<p style="font-weight:700;color:#1A1D2E;margin:0 0 8px">👤 Contact</p>'
      + (contact_nom   ? '<p style="color:#374151"><strong>Nom :</strong> ' + contact_nom + '</p>' : '')
      + (contact_tel   ? '<p style="color:#374151"><strong>📞 Téléphone :</strong> <a href="tel:' + contact_tel + '">' + contact_tel + '</a></p>' : '')
      + (contact_email ? '<p style="color:#374151"><strong>✉️ Email :</strong> ' + contact_email + '</p>' : '')
      + (notes        ? '<hr style="border:none;border-top:1px solid #E5E7EB;margin:12px 0"/><p style="color:#374151"><strong>💬 Commentaires :</strong><br>' + notes.replace(/\n/g,'<br>') + '</p>' : '')
      + (diagnostics  ? '<hr style="border:none;border-top:1px solid #E5E7EB;margin:12px 0"/><p style="font-weight:700;color:#1A1D2E;margin:0 0 6px">💰 Estimation tarifaire (remise -10%)</p><p style="color:#374151"><strong>Diagnostics :</strong> ' + diagnostics + '</p>' + (total_ht ? '<p style="color:#059669;font-weight:800;font-size:15px">Total net HT : ' + total_ht + ' €</p>' : '') : '')
      + '<p style="color:#6B7280;font-size:13px;margin-top:24px;border-top:1px solid #E5E7EB;padding-top:16px">'
      + 'Connectez-vous à Coup 2 Pouce pour confirmer ce rendez-vous et créer la mission.</p>'
      + '</div></div>';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Coup 2 Pouce <noreply@coup2pouce-pro.fr>',
        to: [emailDiag],
        subject: subject,
        html: html
      })
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
