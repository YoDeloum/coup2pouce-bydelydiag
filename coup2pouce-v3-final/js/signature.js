// ─────────────────────────────────────────────
// SIGNATURE.JS — Acceptation électronique devis
// ─────────────────────────────────────────────
// Note : simple preuve d'acceptation avec signature
// dessinée + horodatage. Pour une signature certifiée
// légalement (eIDAS), un service externe (Yousign,
// DocuSign, Stripe Signatures) peut être branché ici.
// ─────────────────────────────────────────────

var _signatureDevisIdx = null;

// ─── OUVERTURE / FERMETURE ───────────────────
function openSignature(devisIdx) {
  _signatureDevisIdx = devisIdx;
  document.getElementById('signature-screen').classList.add('open');
  renderSignatureScreen();
}

function closeSignature() {
  document.getElementById('signature-screen').classList.remove('open');
  _signatureDevisIdx = null;
}

// ─── RENDU ───────────────────────────────────
function renderSignatureScreen() {
  var devis = (typeof getAllDevis === 'function' ? getAllDevis() : [])[_signatureDevisIdx] || {};
  var body  = document.getElementById('signature-body');
  var sig   = devis.signature || null;

  body.innerHTML = `
    <!-- Infos devis -->
    <div class="sig-info-box">
      <h3>📄 Devis N° ${devis.numero || '—'}</h3>
      <p>👤 ${devis.client_prenom || ''} ${devis.client_nom || ''}</p>
      <p>📍 ${devis.bien_adresse || ''}</p>
      <p>💶 ${devis.total_ht ? parseFloat(devis.total_ht).toFixed(2) + ' € HT' : ''}</p>
    </div>

    ${sig ? `<div class="sig-already-signed">
      ✅ Déjà signé par <strong>${sig.signataire}</strong><br>
      le ${new Date(sig.date_signature).toLocaleString('fr-FR')}
    </div>` : ''}

    <!-- Nom signataire -->
    <div class="sig-canvas-wrap">
      <div class="sig-field">
        <label class="sig-label">Nom complet du signataire</label>
        <input class="sig-input" id="sig-nom" type="text"
          value="${sig ? sig.signataire : ((devis.client_prenom||'') + ' ' + (devis.client_nom||'')).trim()}"
          placeholder="Prénom Nom"/>
      </div>

      <!-- Zone de signature -->
      <span class="sig-canvas-label">Signature (tracer ici)</span>
      <canvas id="sig-canvas" width="600" height="180"></canvas>
      <button class="sig-clear-btn" onclick="clearSignatureCanvas()">🗑️ Effacer la signature</button>
    </div>

    <p style="font-size:11px;color:#9ca3af;text-align:center;margin-bottom:14px">
      En validant, le client confirme avoir pris connaissance du devis et l'accepte.<br>
      Date et heure d'acceptation enregistrées automatiquement.
    </p>

    <button class="sig-save-btn" onclick="saveDevisSignature()">✅ Valider l'acceptation du devis</button>
    <button onclick="closeSignature()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #E2E5F0;background:#fff;color:#6B7280;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>`;

  // Initialiser le canvas après rendu
  setTimeout(initSignatureCanvas, 50);
}

// ─── CANVAS DRAWING ──────────────────────────
function initSignatureCanvas() {
  var canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1B4332';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  var drawing = false;

  function getPos(e) {
    var rect   = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / rect.width;
    var scaleY = canvas.height / rect.height;
    var cx = e.touches ? e.touches[0].clientX : e.clientX;
    var cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    var p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!drawing) return;
    var p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
  });
  canvas.addEventListener('mouseup',   function() { drawing = false; });
  canvas.addEventListener('mouseleave',function() { drawing = false; });

  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); drawing = true;
    var p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
  }, { passive: false });
  canvas.addEventListener('touchend', function() { drawing = false; });
}

function clearSignatureCanvas() {
  var canvas = document.getElementById('sig-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function isCanvasBlank(canvas) {
  var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  return !Array.prototype.some.call(data, function(v) { return v !== 0; });
}

// ─── SAUVEGARDE ──────────────────────────────
function saveDevisSignature() {
  var canvas = document.getElementById('sig-canvas');
  var nom    = (document.getElementById('sig-nom')?.value || '').trim();

  if (!nom) { alert('Saisis le nom complet du signataire.'); return; }
  if (!canvas || isCanvasBlank(canvas)) {
    alert('La signature est vide. Trace ta signature dans le cadre avant de valider.'); return;
  }

  var list = getAllDevis();
  list[_signatureDevisIdx].statut    = 'Accepté';
  list[_signatureDevisIdx].signature = {
    image:          canvas.toDataURL('image/png'),
    signataire:     nom,
    date_signature: new Date().toISOString(),
    accepte:        true
  };
  saveAllDevis(list);
  closeSignature();

  // Rafraîchir l'écran devis si ouvert
  if (typeof renderDevisScreen === 'function') {
    var screen = document.getElementById('devis-screen');
    if (screen && screen.classList.contains('open')) renderDevisScreen('form');
  }

  alert('✅ Devis accepté et signé par ' + nom + ' !\nStatut mis à jour : Accepté.');
}
