// ─────────────────────────────────────────────
// NETLIFY FUNCTION — analyze-plan.js
// Analyse d'un croquis DPE via Claude Vision
// Variable requise : CLAUDE_API_KEY (Netlify env)
// ─────────────────────────────────────────────

exports.handler = async function(event) {

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
      body: JSON.stringify({ error: 'CLAUDE_API_KEY non configurée dans Netlify.' })
    };
  }

  var payload;
  try { payload = JSON.parse(event.body); }
  catch(e) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'JSON invalide' })
    };
  }

  var imageBase64 = payload.imageBase64 || '';
  // Extraire le type MIME et la donnée brute
  var mediaType = 'image/jpeg';
  var rawData = imageBase64;
  var match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (match) { mediaType = match[1]; rawData = match[2]; }

  var SYSTEM_PROMPT = `Tu es un expert en analyse de relevés terrains pour les diagnostics de performance énergétique (DPE) en France, méthode 3CL-DPE 2021.

Le diagnostiqueur utilise un code couleur sur ses croquis papier :
- NOIR : murs, cloisons, structure du bâtiment
- ROUGE : linéaires de murs en mètres (mesures)
- VERT : menuiseries (fenêtres, portes-fenêtres, portes)
- BLEU : surfaces en m² (pièce par pièce ou global)
- Annotations autour du plan : informations complémentaires (exposition, isolation, type de vitrage, chauffage, ECS, ventilation)

IMPORTANT : Analyse TOUT ce que tu vois sur l'image. Lis chaque chiffre, chaque lettre, chaque annotation. En cas de doute sur une valeur, indique-le avec "?".

Fournis le récapitulatif UNIQUEMENT dans cet ordre, avec ce formatage exact :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 RELEVÉ DPE — RÉCAPITULATIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧱 MURS
Pour chaque orientation (N / S / E / O) :
• Exposition [N/S/E/O] : [linéaire] ml — Isolé : [Oui/Non/?] — Matériau : [si visible]
Total linéaire murs : [X] ml

📐 SURFACE PLAFOND
• Total : [X] m²
• Par pièce si détaillé : [pièce] : [X] m²

🏠 SURFACE PLANCHER BAS
• Total : [X] m²
• Par pièce si détaillé : [pièce] : [X] m²

🪟 FENÊTRES
Pour chaque fenêtre ou groupe :
• [N° ou nom] — Dimensions : [l×h] m — Surface : [X] m² — Vitrage : [simple/double/triple/?] — Exposition : [N/S/E/O] — Volets : [Oui/Non/?]
Nombre total : [X] — Surface totale : [X] m²

🚪 PORTES
Pour chaque porte :
• [N° ou nom] — Dimensions : [l×h] m — Matériau : [bois/métal/?] — Exposition : [N/S/E/O/?]
Nombre total : [X]

🔥 CHAUFFAGE
• Type : [chaudière gaz/PAC/électrique/fioul/bois/granulés/?]
• Énergie : [gaz/électricité/fioul/bois/?]
• Émetteurs : [radiateurs/plancher chauffant/convecteurs/?]
• Année approximative : [si visible]

🚿 ECS (EAU CHAUDE SANITAIRE)
• Type : [chauffe-eau électrique/ballon gaz/thermodynamique/instantané/?]
• Énergie : [électricité/gaz/?]
• Volume : [si visible] L

💨 VENTILATION
• Type : [naturelle/VMC simple flux/VMC hygro A/VMC hygro B/VMC double flux/VMI/?]
• Présence bouches d'extraction : [Oui/Non/?]

📝 NOTES COMPLÉMENTAIRES
[Toute autre information visible sur le croquis non couverte ci-dessus]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si une information n'est pas visible ou lisible sur le croquis, indique "Non renseigné" ou "?" selon le contexte. Ne jamais inventer de valeurs.`;

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: rawData
              }
            },
            {
              type: 'text',
              text: 'Analyse ce croquis de relevé terrain DPE et fournis le récapitulatif structuré complet.'
            }
          ]
        }]
      })
    });

    var data = await res.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error.message || 'Erreur Claude API' })
      };
    }

    var resultText = '';
    if (data.content && Array.isArray(data.content)) {
      for (var block of data.content) {
        if (block.type === 'text') resultText += block.text;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: resultText })
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erreur réseau : ' + e.message })
    };
  }
};
