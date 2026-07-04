// ─────────────────────────────────────────────
// NETLIFY FUNCTION — send-email.js
// Envoi d'email via Resend avec pièces jointes
// Variable requise : RESEND_API_KEY (Netlify env)
// ─────────────────────────────────────────────

exports.handler = async function(event) {

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
  var fromEmail  = payload.fromEmail || 'noreply@delydiag.fr';

  if (!to || !subject || !html) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Champs requis manquants : to, subject, html' })
    };
  }

  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromName + ' <' + fromEmail + '>',
        to: [to],
        subject: subject,
        html: html,
        attachments: attachments
      })
    });

    var data = await res.json();

    if (res.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, id: data.id })
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.message || JSON.stringify(data) })
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
