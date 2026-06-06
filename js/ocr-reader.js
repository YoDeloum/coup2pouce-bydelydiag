// ─────────────────────────────────────────────
// OCR-READER.JS
// Lecture photo / capture d'écran → préremplissage devis
// Utilise Tesseract.js (chargé depuis CDN)
// Isolé — ne modifie aucun autre module
// ─────────────────────────────────────────────

function ouvrirOCR() {
  var modal = document.createElement('div');
  modal.id  = 'ocr-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:440px;max-height:92vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'
    + '<h3 style="font-size:16px;font-weight:800;color:#1B4332">📷 Lire depuis une photo</h3>'
    + '<button onclick="document.getElementById(\'ocr-modal\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af">✕</button>'
    + '</div>'
    + '<p style="font-size:13px;color:#374151;margin-bottom:14px">Importe une photo ou capture d\'écran contenant les infos du client. L\'application tentera de préremplir le formulaire. Tu pourras vérifier et corriger avant d\'enregistrer.</p>'
    + '<div style="border:2px dashed #BBF7D0;border-radius:10px;padding:24px;text-align:center;margin-bottom:14px;cursor:pointer" onclick="document.getElementById(\'ocr-file-input\').click()">'
    + '<div style="font-size:32px;margin-bottom:8px">📎</div>'
    + '<div style="font-size:14px;font-weight:700;color:#2D6A4F">Choisir une image</div>'
    + '<div style="font-size:12px;color:#9ca3af;margin-top:4px">JPG, PNG, WEBP — depuis téléphone ou ordinateur</div>'
    + '<input type="file" id="ocr-file-input" accept="image/*" style="display:none" onchange="lancerOCR(this)"/>'
    + '</div>'
    + '<div id="ocr-status" style="display:none;text-align:center;padding:16px">'
    + '<div style="font-size:24px;margin-bottom:8px">⏳</div>'
    + '<div id="ocr-status-text" style="font-size:13px;color:#6B7280">Analyse en cours...</div>'
    + '<div style="margin-top:10px;height:6px;background:#E2E5F0;border-radius:999px;overflow:hidden">'
    + '<div id="ocr-progress" style="height:100%;background:#2D6A4F;width:0%;transition:width .3s;border-radius:999px"></div>'
    + '</div>'
    + '</div>'
    + '<div id="ocr-results" style="display:none"></div>'
    + '</div>';

  document.body.appendChild(modal);
}

function lancerOCR(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];

  // Vérifier que Tesseract est disponible
  if (typeof Tesseract === 'undefined') {
    document.getElementById('ocr-status').style.display = 'block';
    document.getElementById('ocr-status-text').textContent = '⏳ Chargement du moteur OCR...';
    document.getElementById('ocr-progress').style.width = '10%';
    // Charger Tesseract dynamiquement
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
    s.onload  = function() { _runOCR(file); };
    s.onerror = function() { _ocrEchec('Le moteur OCR n\'a pas pu être chargé (connexion internet requise).'); };
    document.head.appendChild(s);
  } else {
    _runOCR(file);
  }
}

function _runOCR(file) {
  document.getElementById('ocr-status').style.display  = 'block';
  document.getElementById('ocr-results').style.display = 'none';
  document.getElementById('ocr-status-text').textContent = 'Analyse de l\'image...';
  document.getElementById('ocr-progress').style.width = '20%';

  Tesseract.recognize(file, 'fra', {
    logger: function(m) {
      if (m.status === 'recognizing text') {
        var pct = Math.round((m.progress || 0) * 80) + 20;
        document.getElementById('ocr-progress').style.width = pct + '%';
        document.getElementById('ocr-status-text').textContent = 'Lecture en cours... ' + pct + '%';
      }
    }
  }).then(function(result) {
    document.getElementById('ocr-progress').style.width = '100%';
    document.getElementById('ocr-status-text').textContent = '✅ Lecture terminée';
    setTimeout(function() {
      document.getElementById('ocr-status').style.display = 'none';
      _afficherResultatsOCR(result.data.text);
    }, 500);
  }).catch(function(err) {
    _ocrEchec('Échec de la lecture : ' + (err.message || 'erreur inconnue'));
  });
}

function _ocrEchec(msg) {
  document.getElementById('ocr-status').style.display = 'none';
  var res = document.getElementById('ocr-results');
  res.style.display = 'block';
  res.innerHTML = '<div style="background:#FEF2F2;border-radius:10px;padding:12px 14px;color:#DC2626;font-size:13px">❌ ' + msg + '</div>';
}

function _parseOCR(text) {
  var data = {};

  // Email
  var emailM = text.match(/[\w.\-+]+@[\w\-]+\.[\w.]{2,}/);
  if (emailM) data.email = emailM[0];

  // Téléphone français
  var telM = text.match(/(?:0|\+33\s*)[1-9](?:[\s.\-]?\d{2}){4}/);
  if (telM) data.tel = telM[0].replace(/[\s.\-]/g,'').replace(/^\+33/, '0');

  // Code postal + ville
  var cpM = text.match(/\b([0-9]{5})\b\s+([A-ZÀ-Ÿa-zà-ÿ\-\s]{2,30})/);
  if (cpM) { data.code_postal = cpM[1]; data.ville = cpM[2].trim(); }

  // Surface (m²)
  var surfM = text.match(/(\d{2,4})\s*m[²2]/i);
  if (surfM) data.surface = surfM[1];

  // Nb pièces
  var piecesM = text.match(/(\d{1,2})\s*pi[eè]ces?/i);
  if (piecesM) data.nb_pieces = piecesM[1];

  // Nom (lignes courtes en MAJUSCULES)
  var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 1 && l.length < 40; });
  lines.forEach(function(l) {
    if (/^[A-ZÀ-Ÿ\s\-]{3,}$/.test(l) && !data.nom) data.nom = l;
  });

  // Adresse (ligne contenant rue / av / bd / allée / impasse...)
  var addrM = text.match(/\d+[,\s]+(?:rue|avenue|boulevard|av\.|bd\.|allée|chemin|place|impasse|voie)[^,\n]{5,60}/i);
  if (addrM) data.adresse = addrM[0].replace(/\s+/g,' ').trim();

  return data;
}

function _afficherResultatsOCR(text) {
  var parsed = _parseOCR(text);
  var res    = document.getElementById('ocr-results');
  res.style.display = 'block';

  var hasSomething = Object.keys(parsed).length > 0;

  var fields = [
    { key:'nom',          label:'Nom détecté',      id:'ocr-f-nom' },
    { key:'email',        label:'Email',             id:'ocr-f-email' },
    { key:'tel',          label:'Téléphone',         id:'ocr-f-tel' },
    { key:'adresse',      label:'Adresse',           id:'ocr-f-adresse' },
    { key:'code_postal',  label:'Code postal',       id:'ocr-f-cp' },
    { key:'ville',        label:'Ville',             id:'ocr-f-ville' },
    { key:'surface',      label:'Surface (m²)',      id:'ocr-f-surface' },
    { key:'nb_pieces',    label:'Nb pièces',         id:'ocr-f-pieces' },
  ];

  if (!hasSomething) {
    res.innerHTML = '<div style="background:#FEF3C7;border-radius:10px;padding:12px 14px;color:#92400E;font-size:13px">⚠️ Aucune information n\'a pu être extraite. Essaie avec une image plus nette ou un texte plus lisible.</div>';
    return;
  }

  var formHtml = fields.map(function(f) {
    if (!parsed[f.key]) return '';
    return '<div style="margin-bottom:8px">'
      + '<label style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;display:block;margin-bottom:3px">' + f.label + '</label>'
      + '<input id="' + f.id + '" type="text" value="' + (parsed[f.key] || '') + '" style="width:100%;padding:8px 11px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>'
      + '</div>';
  }).join('');

  res.innerHTML = '<div style="font-size:13px;font-weight:700;color:#1B4332;margin-bottom:10px">✅ Informations détectées — vérifie avant d\'appliquer :</div>'
    + formHtml
    + '<button onclick="_appliquerOCR()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#2D6A4F,#1B4332);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px">✅ Appliquer au formulaire</button>'
    + '<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:6px">Tu pourras modifier les champs après application.</p>';
}

function _appliquerOCR() {
  var map = {
    'ocr-f-nom':      function(v) {
      var parts = v.trim().split(/\s+/);
      var nomEl    = document.getElementById('dv-client_nom');
      var prenomEl = document.getElementById('dv-client_prenom');
      if (nomEl && parts.length >= 1)    nomEl.value    = parts[0];
      if (prenomEl && parts.length >= 2) prenomEl.value = parts.slice(1).join(' ');
    },
    'ocr-f-email':    function(v) { var el = document.getElementById('dv-client_email');   if (el) el.value = v; },
    'ocr-f-tel':      function(v) { var el = document.getElementById('dv-client_tel');     if (el) el.value = v; },
    'ocr-f-adresse':  function(v) { var el = document.getElementById('dv-bien_adresse');   if (el) el.value = v; },
    'ocr-f-surface':  function(v) { var el = document.getElementById('dv-surface');         if (el) el.value = v; },
    'ocr-f-pieces':   function(v) { var el = document.getElementById('dv-nb_pieces');       if (el) el.value = v; },
  };

  Object.keys(map).forEach(function(id) {
    var inp = document.getElementById(id);
    if (inp && inp.value.trim()) map[id](inp.value.trim());
  });

  document.getElementById('ocr-modal').remove();
  // Déclenche recalcul total si fonction disponible
  if (typeof updateDevisTotal === 'function') updateDevisTotal();
}
