// ─────────────────────────────────────────────
// NETLIFY FUNCTION — chat.js
// Proxy sécurisé vers l'API Claude (Jeffrey)
// Variable requise : CLAUDE_API_KEY (Netlify env)
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

  var CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { message: 'CLAUDE_API_KEY non configurée dans les variables Netlify.' } })
    };
  }

  var payload;
  try {
    payload = JSON.parse(event.body);
  } catch(e) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { message: 'JSON invalide' } })
    };
  }

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: payload.model || 'claude-sonnet-4-6',
        max_tokens: payload.max_tokens || 2048,
        system: payload.system,
        tools: payload.tools || [],
        messages: payload.messages
      })
    });

    var rawText = await res.text();
    var data;
    try { data = JSON.parse(rawText); } catch(e) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: { message: 'Réponse invalide de Claude : ' + rawText.substring(0, 200) } })
      };
    }

    return {
      statusCode: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { message: 'Erreur réseau : ' + e.message } })
    };
  }
};
