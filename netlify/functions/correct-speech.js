// ─────────────────────────────────────────────
// NETLIFY FUNCTION — correct-speech.js
// Correction vocale spécialisée diagnostic immobilier
// Variable requise : CLAUDE_API_KEY (Netlify env)
// ─────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const SYSTEM_PROMPT = `Tu es un expert en diagnostic immobilier (DPE, Amiante, Plomb, Électricité, Gaz, Termites, ERP, Carrez, Boutin).
Tu reçois un texte dicté à voix haute par un diagnostiqueur sur le terrain.
La reconnaissance vocale fait des erreurs : mots mal orthographiés, termes techniques mal reconnus, ponctuation absente.

Ta tâche :
1. Corrige UNIQUEMENT les erreurs évidentes de reconnaissance vocale
2. Remplace les approximations par les termes techniques exacts du diagnostic immobilier
3. Ajoute une ponctuation minimale pour la lisibilité
4. Conserve TOUJOURS les mots-clés de module : "module DPE", "module Amiante", "module Plomb", "module Électricité", "module Gaz", "module Termites", "module ERP", "module Carrez", "module Boutin", "module Général"
5. Ne résume pas, ne reformule pas, ne commente pas — corrige seulement
6. Retourne UNIQUEMENT le texte corrigé, sans explication

Vocabulaire courant à corriger :
- fibro / fibrociments / fibrociment en → fibrociment
- bu anderie / buand erie → buanderie
- sous plafond / sous-plafond → hauteur sous plafond
- plak → plaque
- ba treize / ba13 / bâ 13 → BA13
- pars → parpaing
- pars pain → parpaing
- osc → ossature
- dv / dv simple / dv double → double vitrage / simple vitrage
- pvc / pévi cé → PVC
- alu → aluminium
- tgbt / tgpt → TGBT (Tableau Général Basse Tension)
- dis joncteur → disjoncteur
- dif érentiel → différentiel
- chau dière → chaudière
- vanne → vanne de coupure
- con duit → conduit de fumée
- am iante → amiante
- flo cage → flocage
- calo rifugeage → calorifugeage
- tuba ge → tubage
- ter mites / termie → termites
- xilo phages → xylophages
- arp → ERP
- plan de prévention / ppr → Plan de Prévention des Risques
- mètre carré / m carré → m²
- nord / nort / nor → Nord
- su est / sudest → Sud-Est
- nor ouest / nordouest → Nord-Ouest
- expo sition → exposition
- ori entation → orientation`;

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  var key = process.env.CLAUDE_API_KEY;
  if (!key) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'CLAUDE_API_KEY manquante' }) };
  }

  var body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) }; }

  var rawText = (body.text || '').trim();
  if (!rawText) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ corrected: '' }) };
  }

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // Rapide + économique pour de la correction
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: rawText }]
      })
    });

    var data = await res.json();
    var corrected = (data.content && data.content[0] && data.content[0].text)
      ? data.content[0].text.trim()
      : rawText;  // Si erreur API → retourner le texte brut

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ corrected: corrected })
    };

  } catch(e) {
    // En cas d'erreur réseau → retourner le texte brut (pas de perte de données)
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ corrected: rawText })
    };
  }
};
