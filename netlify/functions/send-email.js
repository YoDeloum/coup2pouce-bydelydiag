// ─────────────────────────────────────────────
// NETLIFY FUNCTION — send-email.js
// Envoi d'email via Resend avec pièces jointes
// Variable requise : RESEND_API_KEY (Netlify env)
// ─────────────────────────────────────────────

exports.handler = async function(event) {

  // Log taille payload pour diagnostique
  var bodySize = event.body ? event.body.length : 0;
  console.log('[send-email] Méthode:', event.httpMethod, '| Taille payload:', Math.round(bodySize/1024), 'Ko');

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'RESEND_API_KEY non configurée dans les variables Netlify.' })
    };
  }

  var payload;
  try {
    payload = JSON.parse(event.body);
  } catch(e) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'JSON invalide' })
    };
  }

  var to         = payload.to;
  var subject    = payload.subject;
  var html       = payload.html;
  var attachments = payload.attachments || [];
  var fromName   = payload.fromName  || 'Coup 2 Pouce';
  var fromEmail  = payload.fromEmail || 'noreply@coup2pouce-pro.fr';
  var replyTo    = payload.replyTo   || '';
  var cc         = payload.cc        || '';

  if (!to || !subject || !html) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Champs requis manquants : to, subject, html' })
    };
  }

  // Vérifier taille des pièces jointes
  var totalAttachSize = attachments.reduce(function(s, a) { return s + (a.content ? a.content.length : 0); }, 0);
  console.log('[send-email] Nombre PJ:', attachments.length, '| Taille PJ base64:', Math.round(totalAttachSize/1024), 'Ko');
  if (totalAttachSize > 4 * 1024 * 1024) { // > 4 Mo base64
    return {
      statusCode: 413,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Pièces jointes trop volumineuses (' + Math.round(totalAttachSize/1024/1024) + ' Mo). Limite : 4 Mo. Retire les documents réglementaires ou réduis le PDF.' })
    };
  }

  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.assign({
        from: fromName + ' <' + fromEmail + '>',
        to: [to],
        subject: subject,
        html: html,
        attachments: attachments
      }, replyTo ? { reply_to: replyTo } : {},
         cc      ? { cc: [cc] }          : {}))
    });

    var rawText = await res.text();
    console.log('[send-email] Resend HTTP', res.status, '| Réponse:', rawText.substring(0, 300));
    var data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Resend HTTP ' + res.status + ' — ' + (rawText.substring(0, 400) || '(réponse vide)') })
      };
    }

    if (res.ok) {
      console.log('[send-email] Succès, id:', data.id);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, id: data.id })
      };
    } else {
      var errMsg = data.message || data.name || data.error || JSON.stringify(data);
      console.log('[send-email] Erreur Resend:', errMsg);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: errMsg })
      };
    }

  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
