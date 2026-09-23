// ─────────────────────────────────────────────
// NETLIFY FUNCTION — send-devis-request.js
// GET  ?code=XX        → valide le lien, retourne le nom du diagnostiqueur
// POST { code, ... }  → envoie la demande de devis par mail au diagnostiqueur
// Variables requises : FIREBASE_API_KEY, RESEND_API_KEY (Netlify env)
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
  var RESEND_KEY = process.env.RESEND_API_KEY;
  var FS_BASE    = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  // ── GET : validation du code, retourne le nom du diagnostiqueur ──
  if (event.httpMethod === 'GET') {
    var code = (event.queryStringParameters || {}).code;
    if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ valid: false, error: 'Code manquant' }) };

    try {
      var docRes = await fetch(FS_BASE + '/codes/' + code + '?key=' + FS_KEY);
      var doc    = await docRes.json();

      if (!doc.fields) {
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ valid: false, error: 'Lien invalide' }) };
      }
      var actif = doc.fields.actif && doc.fields.actif.booleanValue;
      if (!actif) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ valid: false, error: 'Lien désactivé' }) };
      }
      var nomDiag = (doc.fields.nom_diag && doc.fields.nom_diag.stringValue) || 'Votre diagnostiqueur';
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ valid: true, nom_diag: nomDiag })
      };
    } catch(e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ valid: false, error: e.message }) };
    }
  }

  // ── POST : envoi de la demande de devis ──
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  if (!RESEND_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'RESEND_API_KEY non configurée' }) };
  }

  var payload;
  try { payload = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  var code = payload.code;
  if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Code manquant' }) };

  try {
    // 1. Valider le code et récupérer l'email du diagnostiqueur
    var docRes2 = await fetch(FS_BASE + '/codes/' + code + '?key=' + FS_KEY);
    var doc2    = await docRes2.json();

    if (!doc2.fields) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Lien invalide' }) };
    }
    var actif2 = doc2.fields.actif && doc2.fields.actif.booleanValue;
    if (!actif2) {
      return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Lien désactivé' }) };
    }

    var emailDiag = (doc2.fields.email_diag && doc2.fields.email_diag.stringValue) || '';
    var nomDiag2  = (doc2.fields.nom_diag   && doc2.fields.nom_diag.stringValue)   || 'Diagnostiqueur';

    if (!emailDiag) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Email du diagnostiqueur non configuré' }) };
    }

    // 2. Calculer les diagnostics obligatoires
    var diags = calcDiags(payload);

    // 3. Construire l'email HTML
    var html = buildEmail(payload, diags, nomDiag2);

    // 4. Envoyer via Resend
    var emailPayload = {
      from:    'Coup 2 Pouce <noreply@coup2pouce-pro.fr>',
      to:      [emailDiag],
      subject: '📋 Nouvelle demande de devis — ' + payload.prenom + ' ' + payload.nom,
      html:    html
    };
    if (payload.email) emailPayload.reply_to = payload.email;

    var resEnd = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify(emailPayload)
    });

    var rawText = await resEnd.text();
    var resData;
    try { resData = JSON.parse(rawText); } catch(e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Resend HTTP ' + resEnd.status }) };
    }

    if (resEnd.ok) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: resData.message || 'Erreur Resend' }) };
    }

  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};

// ── Calcul des diagnostics obligatoires ──
function calcDiags(d) {
  var avant1949 = (d.periode === 'avant1949');
  var avant1997 = (avant1949 || d.periode === '1949-1997');
  var vente     = (d.transaction === 'vente');
  var location  = (d.transaction === 'location');
  var appart    = (d.bien === 'appartement');
  var maison    = (d.bien === 'maison');

  var res = ['DPE (Diagnostic de Performance Énergétique)'];
  if (d.elec === 'plus15')      res.push('Diagnostic électricité');
  if (d.gaz  === 'oui-plus15') res.push('Diagnostic gaz');
  if (avant1949)                res.push('Plomb — CREP');
  if (avant1997 && !(location && maison)) res.push('Amiante');
  res.push('État des Risques et Pollutions (ERP)');
  if (vente && appart)  res.push('Mesurage — Loi Carrez');
  if (location)         res.push('Mesurage — Loi Boutin');
  return res;
}

// ── Construction de l'email HTML ──
function buildEmail(d, diags, nomDiag) {
  var depLabels = { cave: 'Cave', garage: 'Garage', grenier: 'Grenier', piscine: 'Piscine' };
  var deps = (d.dependances || []).map(function(dep) { return depLabels[dep] || dep; }).join(', ') || 'Aucune';

  var tranLabel    = d.transaction === 'vente' ? 'Vente' : 'Location';
  var bienLabel    = { appartement: 'Appartement', maison: 'Maison', local: 'Local commercial', autre: 'Autre' }[d.bien] || (d.bien || '—');
  var periodeLabel = { avant1949: 'Avant 1949', '1949-1997': '1949 – 1997', apres1997: 'Après 1997' }[d.periode] || (d.periode || '—');
  var elecLabel    = { plus15: '+ de 15 ans', moins15: '- de 15 ans' }[d.elec] || '—';
  var gazLabel     = { 'oui-plus15': 'Oui, + de 15 ans', 'oui-moins15': 'Oui, - de 15 ans', 'non': 'Non' }[d.gaz] || '—';
  var surfLabel    = { 'moins50': 'Moins de 50 m²', '50-100': '50 à 100 m²', '100-150': '100 à 150 m²', '150-200': '150 à 200 m²', 'plus200': 'Plus de 200 m²' }[d.surface] || '—';

  var diagRows = diags.map(function(diag) {
    return '<tr>'
      + '<td style="padding:8px 12px;border-bottom:1px solid #D1FAE5;vertical-align:middle">'
      + '<span style="color:#059669;font-size:16px;margin-right:8px">✓</span>'
      + '<span style="font-size:14px;font-weight:600;color:#065F46">' + diag + '</span>'
      + '</td></tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#F0F4F0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 16px">'

    // Header
    + '<div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);border-radius:14px;padding:28px 24px;margin-bottom:16px;text-align:center">'
    + '<div style="font-size:36px;margin-bottom:10px">📋</div>'
    + '<h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 6px">Nouvelle demande de devis</h1>'
    + '<p style="color:#A7F3D0;font-size:13px;margin:0">Reçue via votre lien personnel Coup 2 Pouce</p>'
    + '</div>'

    // Coordonnées client
    + '<div style="background:#fff;border-radius:14px;padding:20px;margin-bottom:12px;border:1.5px solid #E8F5F0">'
    + '<h2 style="font-size:12px;font-weight:800;color:#1B4332;margin:0 0 14px;text-transform:uppercase;letter-spacing:.8px">👤 Coordonnées du client</h2>'
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280;width:130px">Nom complet</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#1A1D2E">' + d.prenom + ' ' + d.nom + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Téléphone</td><td style="padding:6px 0"><a href="tel:' + d.tel + '" style="font-size:14px;font-weight:700;color:#059669;text-decoration:none">' + d.tel + '</a></td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Email</td><td style="padding:6px 0"><a href="mailto:' + d.email + '" style="font-size:14px;font-weight:700;color:#059669;text-decoration:none">' + d.email + '</a></td></tr>'
    + '</table></div>'

    // Informations sur le bien
    + '<div style="background:#fff;border-radius:14px;padding:20px;margin-bottom:12px;border:1.5px solid #E8F5F0">'
    + '<h2 style="font-size:12px;font-weight:800;color:#1B4332;margin:0 0 14px;text-transform:uppercase;letter-spacing:.8px">🏠 Informations sur le bien</h2>'
    + '<table width="100%" cellpadding="0" cellspacing="0">'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280;width:130px">Adresse</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + d.adresse + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Transaction</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + tranLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Type de bien</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + bienLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Construction</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + periodeLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Surface</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + surfLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Électricité</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + elecLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Gaz</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + gazLabel + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:12px;color:#6B7280">Dépendances</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A1D2E">' + deps + '</td></tr>'
    + '</table></div>'

    // Diagnostics obligatoires
    + '<div style="background:linear-gradient(135deg,#F0FDF4,#ECFDF5);border:2px solid #6EE7B7;border-radius:14px;padding:20px;margin-bottom:12px">'
    + '<h2 style="font-size:12px;font-weight:800;color:#065F46;margin:0 0 12px;text-transform:uppercase;letter-spacing:.8px">⚡ Diagnostics obligatoires demandés</h2>'
    + '<table width="100%" cellpadding="0" cellspacing="0">' + diagRows + '</table>'
    + '</div>'

    // Notes (si présentes)
    + (d.notes ? '<div style="background:#fff;border-radius:14px;padding:20px;margin-bottom:12px;border:1.5px solid #E2E5F0">'
      + '<h2 style="font-size:12px;font-weight:800;color:#1B4332;margin:0 0 10px;text-transform:uppercase;letter-spacing:.8px">💬 Notes du client</h2>'
      + '<p style="font-size:13px;color:#374151;margin:0;line-height:1.6">' + d.notes + '</p>'
      + '</div>' : '')

    // Footer
    + '<p style="text-align:center;font-size:11px;color:#9CA3AF;margin:16px 0 0;line-height:1.7">'
    + 'Demande reçue via <strong>Coup 2 Pouce</strong> — DELY DIAG<br>'
    + 'Répondez directement à cet email pour contacter le client.'
    + '</p>'

    + '</td></tr></table></body></html>';
}
