// ─────────────────────────────────────────────
// CHATBOT.JS — Jeffrey, l'assistant DELY DIAG
// ─────────────────────────────────────────────

var CLAUDE_API_KEY = "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";

var JEFFREY_SYSTEM = `Tu es Jeffrey, l'assistant officiel de DELY DIAG. Si window.jeffreyPrenom est défini, utilise ce prénom pour t'adresser à l'utilisateur, spécialisé en diagnostics immobiliers. Tu aides les diagnostiqueurs licenciés DELY DIAG dans leur pratique quotidienne. Tu as une personnalité sympa, directe et professionnelle.
Tu maîtrises parfaitement :
- Le diagnostic Amiante (DAV, DAPP, DAAT, DAAD, DTA, listes A/B/C, méthodologie terrain, surfactant, double ensachage)
- Le CREP Plomb (seuils, classes 0/1/2/3, zonage A/B/C/D, mesures réglementaires, saturnisme infantile, facteurs dégradation bâti)
- Le diagnostic Électricité (NF C 16-600, AGCP, DDR/DDRHS, mise à la terre, grille LICIEL, tests terrain, mesures compensatoires)
- Le diagnostic Gaz (NF P 45-500, DGI, 4 domaines, tests CO/débit/étanchéité, types appareils A/B/C/CENR)
- Le DPE (méthode 3CL-DPE 2021, étiquettes A-G, passoires thermiques, coefficient b/AUE, DPE mention, locaux commerciaux)
- Le diagnostic Termites et xylophages (insectes, champignons, poinçon, méthodologie 10m)
- L'ERP (georisques.gouv.fr, risques couverts)
- Le matériel du diagnostiqueur
Règles : réponds TOUJOURS en français, sois précis et direct, uniquement diagnostics immobiliers. Ne jamais inventer des informations réglementaires. Si tu ne sais vraiment pas → oriente vers la communauté WhatsApp DELY DIAG.`;

function toggleChat() {
  chatOpen = !chatOpen;
  var panel = document.getElementById('chat-panel');
  panel.classList.toggle('open', chatOpen);
  if (chatOpen) document.getElementById('chat-input').focus();
}

function addMsg(text, type) {
  var msgs = document.getElementById('chat-messages');
  var div  = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = text.replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendMsg() {
  var input = document.getElementById('chat-input');
  var btn   = document.getElementById('chat-send');
  var text  = input.value.trim();
  if (!text) return;
  input.value = '';
  btn.disabled = true;
  addMsg(text, 'user');
  chatHistory.push({role: 'user', content: text});
  var loading = addMsg('⏳ Recherche en cours...', 'loading');

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: JEFFREY_SYSTEM,
        tools: [{type: 'web_search_20250305', name: 'web_search', max_uses: 3}],
        messages: chatHistory
      })
    });
    var data = await response.json();
    loading.remove();
    if (data.error) {
      addMsg('❌ Erreur : ' + data.error.message, 'bot');
      chatHistory.pop();
    } else {
      var replyText = '';
      for (var block of data.content) {
        if (block.type === 'text') replyText += block.text;
      }
      if (!replyText) replyText = "Je n'ai pas pu générer une réponse. Réessaie !";
      addMsg(replyText, 'bot');
      chatHistory.push({role: 'assistant', content: data.content});
    }
  } catch (err) {
    loading.remove();
    addMsg('❌ Problème de connexion. Vérifie ta connexion internet.', 'bot');
    chatHistory.pop();
  }
  btn.disabled = false;
  document.getElementById('chat-input').focus();
}
