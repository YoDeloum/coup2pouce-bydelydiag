// ─────────────────────────────────────────────
// IAN.JS — Ian, l'IA Terrain DELY DIAG
// Spécialiste identification matériaux + aide sur site
// ─────────────────────────────────────────────

var IAN_SYSTEM = `Tu es IAN, l'assistant terrain expert de DELY DIAG. Tu aides les diagnostiqueurs sur le terrain, principalement par l'analyse de photos et l'aide à l'identification des matériaux du bâti. Tu es direct, précis, et tes réponses sont courtes car l'utilisateur est sur un chantier.

⚠️ RÈGLE ABSOLUE : Tes réponses doivent être COURTES (3-5 lignes max sauf demande explicite). Tu es consulté en mobilité sur un chantier. Pas de longs discours. Va droit au but.

══════════ ANALYSE PHOTO — MÉTHODOLOGIE ══════════

Quand on t'envoie une photo, tu dois systématiquement :
1. Identifier le matériau visible (nature, aspect, texture, couleur, état)
2. Donner ton niveau de suspicion pour chaque risque :
   🔴 FORT RISQUE (prélèvement indispensable)
   🟠 RISQUE MODÉRÉ (prélèvement recommandé)
   🟡 FAIBLE RISQUE (à surveiller, prélèvement optionnel)
   🟢 PAS DE RISQUE APPARENT (mais précise tes limites)
3. Recommander l'action concrète : prélèvement / archivage photo / annotation rapport

IMPORTANT : Tu analyses ce que tu vois, mais tu rappelles que seul un prélèvement COFRAC confirme la présence d'amiante. Tu ne certifies jamais l'absence d'amiante sans analyse.

══════════ MATÉRIAUX SUSPECTS — GUIDE VISUEL ══════════

🔬 AMIANTE — Matériaux à identifier sur photo :

PLAQUES FIBROCIMENT (risque élevé avant 1997) :
- Aspect : ondulées ou plates, gris clair/anthracite, texture légèrement granuleuse
- Couleur : gris uniforme ou vieilli avec traces vertes (mousse/lichen)
- Présence : toiture, bardage, bac évacuation eau, clôture, appentis
- Indice : cassure en éclats (pas en fibres comme le bois)

DALLES DE SOL VINYLE (risque fort années 60-80) :
- Format typique : 9×9, 18×18 ou 20×20 pouces (≈ 22×22 ou 45×45 ou 50×50 cm)
- Aspect : motif géométrique ou marbré, bords droits, épaisseur 2-3 mm
- Couleur : beige, vert pâle, bordeaux, marron, crème, brun foncé
- Colle : colle noire en dessous = forte suspicion amiante (colle bitumineuse)
- Indice : tuiles très régulières, format carré strict

COLLE CARRELAGE / CARRELAGE SOL (risque jusqu'en 1997) :
- Aspect : couche fine gris-beige sous le carrelage, épaisseur 2-5 mm
- Visible lors de la dépose ou aux arrachements

FLOCAGE ET CALORIFUGEAGE (risque très élevé) :
- Flocage : matière pulvérulente projetée sur poutres/plafonds, aspect duveteux cotonneux
- Couleur : gris, beige, blanc cassé
- Calorifugeage : enveloppe autour des tuyauteries, blanc/beige/gris, aspect plâtré ou fibreux

PLAQUES INTÉRIEURES (cloisons, plafonds) :
- Plaques de plâtre + amiante : aspect identique au plâtre normal, indétectable visuellement
- Plaques Klingerit (joints) : matière noire ou grise compressée entre les brides de tuyauterie

ENDUITS PROJETÉS (Mandolit, Calofort) :
- Aspect : crépi rugueux sur parois, couleur beige/ocre/gris, irrégulier
- Souvent dans les sous-sols, caves, locaux techniques des années 60-80

CORDONS DE FOURS / JOINTS :
- Cordons tissés autour des portes de chaudières, fours industriels, poêles anciens

══════════ PLOMB — IDENTIFICATION TERRAIN ══════════

🔴 PEINTURE AU PLOMB (bâtiments avant 1949) :
- Aspect visuel : souvent sous couches successives de peinture, indétectable à l'œil
- Signes de dégradation : écaillage, cloquage, farinage, griffures, zones humides
- Zones prioritaires : boiseries (fenêtres, portes, volets), radiateurs fonte, garde-corps, balustrades, murs (couche de base)
- Appareil XRF : seul moyen de confirmer. Seuil ≥ 1 mg/cm²
- Sur photo : si peinture vieille et dégradée sur bâtiment avant 1949 → classe 2 ou 3 probable

══════════ ÉLECTRICITÉ — ANOMALIES TERRAIN ══════════

⚡ ANOMALIES PRIORITAIRES visibles sur photo :
- Tableau électrique avec fusibles à cartouche ou fil (pas de disjoncteurs) → vétuste
- Fils tisés (enveloppe textile) → très anciens, risque
- Prises 2 broches sans terre → anomalie
- Tableau sans différentiel 30mA visible → anomalie prioritaire
- Fils apparents non gainés → anomalie
- Tableau rempli de multiprises → surcharge potentielle

══════════ GAZ — ANOMALIES TERRAIN ══════════

🔥 ÉLÉMENTS À VÉRIFIER SUR PHOTO :
- Tuyauterie en plomb ou plomb/étain → à remplacer immédiatement (DGI potentiel)
- Flexibles métalliques craquelés ou corrodés → remplacement urgent
- Absence de robinet d'arrêt avant appareil → anomalie
- Joint d'étanchéité visible dégradé → fuite potentielle
- Chaudière sans évacuation visible (type B non raccordé) → risque CO

══════════ RÉGLEMENTATION COMPLÈTE ══════════

📋 OBLIGATIONS PAR TYPE DE TRANSACTION :
- VENTE avant 1949 : CREP + Amiante + Élec (>15 ans) + Gaz (>15 ans) + DPE + Termites (zone) + ERP
- VENTE 1949-1997 : Amiante + Élec + Gaz + DPE + Termites + ERP
- VENTE après 1997 : Élec (>15 ans) + Gaz (>15 ans) + DPE + Termites (zone) + ERP
- LOCATION : CREP (avant 1949) + Élec (>15 ans) + Gaz (>15 ans) + DPE + ERP
- AVANT TRAVAUX (DAAT) : obligatoire pour tout bâtiment avant 1997
- AVANT DÉMOLITION (DAAD) : repérage exhaustif obligatoire

⏱️ DURÉES DE VALIDITÉ :
- Amiante : illimitée / Plomb : 1 an vente / 6 ans location (si présence) / illimitée si absence
- Élec/Gaz : 3 ans vente / 6 ans location / DPE : 10 ans / ERP-Termites : 6 mois

🔬 SEUILS :
- Amiante : < 5 f/L = conservation ; 5-25 f/L = surveillance ; > 25 f/L = travaux SS3/SS4
- Plomb : ≥ 1 mg/cm² = présence → évaluation état conservation (classes 0/1/2/3)
- Radon : > 300 Bq/m³ = travaux correctifs recommandés

══════════ PÉRIODES DE CONSTRUCTION ══════════

📅 REPÈRES CLÉS :
- Avant 1949 : risque plomb (peintures), charpente bois massif, planchers bois
- 1950-1970 : béton armé, dalles vinyle (amiante), fibrociment amiante, premières chaudières
- 1970-1997 : flocages amiante, colles amiante, calorifugeage amiante, plaques fibro
- Après 1997 : interdiction amiante → laine de verre, laine de roche, polystyrène

══════════ RÈGLES IAN ══════════
- Réponds TOUJOURS en français
- Sois COURT et DIRECT — tu parles à quelqu'un sur un chantier
- Pour les photos : analyse précisément ce que tu vois, cite le matériau, le niveau de risque, et l'action recommandée
- N'invente JAMAIS un diagnostic — si la photo n'est pas assez claire, dis-le et demande une meilleure photo
- Tu peux compléter avec la réglementation pertinente si utile, mais reste concis
- Si la question n'est pas terrain → renvoie vers MIIA ("Pour ça, consulte MIIA !")`;

// Initialisation des styles du switch au chargement
document.addEventListener('DOMContentLoaded', function() {
  var btnMiia = document.getElementById('switch-miia');
  var btnIan  = document.getElementById('switch-ian');
  if (btnMiia) btnMiia.style.cssText = 'flex:1;padding:8px 4px;border:none;background:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:1;border-bottom:2px solid #fff';
  if (btnIan)  btnIan.style.cssText  = 'flex:1;padding:8px 4px;border:none;background:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:0.6;border-bottom:2px solid transparent';
});

// ─────────────────────────────────────────────
// HISTORIQUE CHAT IAN (séparé de MIIA)
// ─────────────────────────────────────────────
var ianChatHistory = [];
var _ianPendingImage = null; // { base64, mediaType }

// ─────────────────────────────────────────────
// MODE CHAT — switch MIIA / IAN
// ─────────────────────────────────────────────
var _chatMode = 'miia'; // 'miia' | 'ian'

function switchChatMode(mode) {
  _chatMode = mode;

  // Mise à jour des boutons du switch (styles inline car pas de <style> dans l'app)
  var btnMiia = document.getElementById('switch-miia');
  var btnIan  = document.getElementById('switch-ian');
  var activeStyle   = 'flex:1;padding:8px 4px;border:none;background:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:1;border-bottom:2px solid #fff';
  var inactiveStyle = 'flex:1;padding:8px 4px;border:none;background:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:0.6;border-bottom:2px solid transparent';
  if (btnMiia) btnMiia.style.cssText = (mode === 'miia') ? activeStyle : inactiveStyle;
  if (btnIan)  btnIan.style.cssText  = (mode === 'ian')  ? activeStyle : inactiveStyle;

  // Mise à jour du header
  var nameEl   = document.getElementById('chat-ai-name');
  var statusEl = document.getElementById('chat-ai-status');
  var avatarEl = document.getElementById('chat-ai-avatar');
  var voiceBtn = document.getElementById('miia-voice-toggle');
  var photoBtnEl = document.getElementById('ian-photo-btn');
  var dictBtn  = document.getElementById('voice-miia-btn');
  var inputEl  = document.getElementById('chat-input');

  if (mode === 'ian') {
    if (nameEl) nameEl.textContent = 'IAN';
    if (statusEl) statusEl.textContent = 'Assistant Terrain • Identification matériaux';
    if (avatarEl) avatarEl.innerHTML = '<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0E7490,#0891B2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;letter-spacing:-0.5px;border:2px solid rgba(255,255,255,0.4)">IAN</div>';
    if (photoBtnEl) photoBtnEl.style.display = 'flex';
    if (voiceBtn) voiceBtn.style.display = 'none';
    if (dictBtn) dictBtn.style.display = 'none';
    if (inputEl) { inputEl.placeholder = 'Question à IAN ou décris la photo...'; }
    // Message d'accueil IAN si chat vide
    var msgs = document.getElementById('chat-messages');
    if (msgs && ianChatHistory.length === 0) {
      msgs.innerHTML = '<div class="msg bot">🔬 Salut, c\'est IAN !<br>Envoie-moi une photo ou pose ta question terrain 📸</div>';
    } else if (msgs) {
      _renderIanHistory();
    }
  } else {
    // Retour MIIA
    if (nameEl) nameEl.textContent = 'Miia';
    if (statusEl) statusEl.textContent = 'Assistante DELY DIAG • Diagnostics immobiliers';
    if (avatarEl) {
      // Restaurer l'avatar MIIA (image inline en base64, on prend le src depuis le chat button)
      var chatBtnImg = document.querySelector('#chat-btn img');
      if (chatBtnImg) {
        avatarEl.innerHTML = '<img src="' + chatBtnImg.src + '" width="38" height="38" alt="Miia" style="border-radius:50%;object-fit:cover;object-position:center 25%;border:2px solid rgba(255,255,255,0.4);display:block"/>';
      }
    }
    if (photoBtnEl) photoBtnEl.style.display = 'none';
    if (voiceBtn) voiceBtn.style.display = '';
    if (dictBtn) dictBtn.style.display = '';
    if (inputEl) { inputEl.placeholder = 'Pose ta question à Miia...'; }
    // Réafficher l'historique MIIA
    _renderMiiaHistory();
  }

  // Vider l'image en attente si on change de mode
  _ianPendingImage = null;
  var preview = document.getElementById('ian-photo-preview');
  if (preview) preview.remove();
}

// Réaffiche l'historique MIIA dans le panel
function _renderMiiaHistory() {
  var msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  msgs.innerHTML = '';
  if (!chatHistory || chatHistory.length === 0) {
    msgs.innerHTML = '<div class="msg bot">👋 Salut, moi c\'est Miia !<br>Dis-moi tout 😊</div>';
    return;
  }
  chatHistory.forEach(function(msg) {
    if (msg.role === 'user') {
      var content = typeof msg.content === 'string' ? msg.content : '[message]';
      addMsgRaw(content, 'user');
    } else if (msg.role === 'assistant') {
      var text = '';
      if (Array.isArray(msg.content)) {
        msg.content.forEach(function(b) { if (b.type === 'text') text += b.text; });
      } else if (typeof msg.content === 'string') {
        text = msg.content;
      }
      if (text) addMsgRaw(text, 'bot');
    }
  });
  msgs.scrollTop = msgs.scrollHeight;
}

// Réaffiche l'historique IAN
function _renderIanHistory() {
  var msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  msgs.innerHTML = '';
  if (ianChatHistory.length === 0) {
    msgs.innerHTML = '<div class="msg bot">🔬 Salut, c\'est IAN !<br>Envoie-moi une photo ou pose ta question terrain 📸</div>';
    return;
  }
  ianChatHistory.forEach(function(msg) {
    if (msg.role === 'user') {
      // Peut contenir image + texte
      var text = '';
      if (typeof msg.content === 'string') {
        text = msg.content;
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(function(b) {
          if (b.type === 'text') text += b.text;
          if (b.type === 'image') text += ' [📸 photo]';
        });
      }
      addMsgRaw(text, 'user');
    } else if (msg.role === 'assistant') {
      var text = '';
      if (Array.isArray(msg.content)) {
        msg.content.forEach(function(b) { if (b.type === 'text') text += b.text; });
      }
      if (text) addMsgRaw(text, 'bot');
    }
  });
  msgs.scrollTop = msgs.scrollHeight;
}

// Ajoute un message dans le panel sans passer par addMsg() (qui gère les blocs devis)
function addMsgRaw(text, type) {
  var msgs = document.getElementById('chat-messages');
  var div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = text.replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ─────────────────────────────────────────────
// GESTION PHOTO IAN
// ─────────────────────────────────────────────
function handleIanPhoto(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result; // data:image/jpeg;base64,...
    var match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) { console.warn('[IAN] Format image non supporté'); return; }

    var mediaType = match[1]; // ex: image/jpeg
    var base64    = match[2];

    // Valider le type supporté par Claude
    var supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (supported.indexOf(mediaType) === -1) {
      // Convertir en JPEG via canvas si besoin
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var MAX = 1024;
        var ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        var jpegB64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        _ianPendingImage = { base64: jpegB64, mediaType: 'image/jpeg' };
        _showIanPhotoPreview(dataUrl);
      };
      img.src = dataUrl;
    } else {
      // Redimensionner si nécessaire (max 1024px, qualité 0.85 pour JPEG)
      if (mediaType === 'image/jpeg' || mediaType === 'image/png') {
        var img2 = new Image();
        img2.onload = function() {
          var canvas2 = document.createElement('canvas');
          var MAX2 = 1024;
          var ratio2 = Math.min(MAX2 / img2.width, MAX2 / img2.height, 1);
          canvas2.width  = Math.round(img2.width * ratio2);
          canvas2.height = Math.round(img2.height * ratio2);
          canvas2.getContext('2d').drawImage(img2, 0, 0, canvas2.width, canvas2.height);
          var finalB64 = canvas2.toDataURL('image/jpeg', 0.85).split(',')[1];
          _ianPendingImage = { base64: finalB64, mediaType: 'image/jpeg' };
          _showIanPhotoPreview(dataUrl);
        };
        img2.src = dataUrl;
      } else {
        _ianPendingImage = { base64: base64, mediaType: mediaType };
        _showIanPhotoPreview(dataUrl);
      }
    }

    // Réinitialiser l'input pour pouvoir renvoyer la même photo
    input.value = '';
  };
  reader.readAsDataURL(file);
}

function _showIanPhotoPreview(dataUrl) {
  // Supprimer l'ancien aperçu si existant
  var old = document.getElementById('ian-photo-preview');
  if (old) old.remove();

  var wrap = document.getElementById('chat-input-wrap');
  if (!wrap) return;

  var prev = document.createElement('div');
  prev.id = 'ian-photo-preview';
  prev.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;background:#EFF6FF;border-radius:8px;margin:4px 10px 0;';
  prev.innerHTML = '<img src="' + dataUrl + '" style="width:44px;height:44px;border-radius:6px;object-fit:cover"/>'
    + '<span style="font-size:12px;color:#1E40AF;flex:1">📸 Photo prête — écris ta question ou envoie directement</span>'
    + '<button onclick="cancelIanPhoto()" style="background:none;border:none;cursor:pointer;font-size:16px;color:#6B7280;padding:2px 4px">✕</button>';
  wrap.parentNode.insertBefore(prev, wrap);
}

function cancelIanPhoto() {
  _ianPendingImage = null;
  var preview = document.getElementById('ian-photo-preview');
  if (preview) preview.remove();
}

// ─────────────────────────────────────────────
// ENVOI MESSAGE IAN (avec ou sans photo)
// ─────────────────────────────────────────────
async function sendIanMsg() {
  var input = document.getElementById('chat-input');
  var btn   = document.getElementById('chat-send');
  var text  = input.value.trim();

  // Il faut au moins une photo ou un texte
  if (!text && !_ianPendingImage) return;
  input.value = '';
  btn.disabled = true;

  // Construire le contenu du message utilisateur
  var userContent;
  if (_ianPendingImage) {
    userContent = [];
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: _ianPendingImage.mediaType,
        data: _ianPendingImage.base64
      }
    });
    if (text) {
      userContent.push({ type: 'text', text: text });
    } else {
      userContent.push({ type: 'text', text: 'Analyse cette photo et dis-moi ce que tu vois : matériau, risque potentiel, et action recommandée.' });
    }
    // Afficher dans le chat
    addMsgRaw((text || 'Analyse cette photo') + ' [📸]', 'user');
  } else {
    userContent = [{ type: 'text', text: text }];
    addMsgRaw(text, 'user');
  }

  ianChatHistory.push({ role: 'user', content: userContent });

  // Supprimer l'aperçu photo
  cancelIanPhoto();

  var loading = addMsgRaw('⏳ Analyse en cours...', 'loading');

  try {
    var response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: IAN_SYSTEM,
        tools: [],
        messages: ianChatHistory
      })
    });

    var data = await response.json();
    loading.remove();

    if (data.error) {
      addMsgRaw('❌ Erreur : ' + data.error.message, 'bot');
      ianChatHistory.pop();
    } else {
      var replyText = '';
      for (var block of data.content) {
        if (block.type === 'text') replyText += block.text;
      }
      if (!replyText) replyText = "Je n'ai pas pu analyser. Essaie de renvoyer la photo.";
      addMsgRaw(replyText, 'bot');
      _speakMiia(replyText); // IAN utilise aussi la synthèse vocale si activée
      ianChatHistory.push({ role: 'assistant', content: data.content });
    }
  } catch (err) {
    loading.remove();
    addMsgRaw('❌ Problème de connexion. Vérifie ta connexion internet.', 'bot');
    ianChatHistory.pop();
  }

  btn.disabled = false;
  document.getElementById('chat-input').focus();
}
