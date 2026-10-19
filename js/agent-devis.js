// ─────────────────────────────────────────────
// AGENT-DEVIS.JS — Création de devis par l'agent commercial
// Coup 2 Pouce — DELY DIAG
//
// Fonctions exportées (appelées depuis agent.js / index.html) :
//   openAgentDevisForm()       — ouvre le formulaire de création
//   saveAgentDevisForm()       — valide et enregistre le devis
//   agentUpdateDevisTotal()    — recalcule le total en temps réel
//   agentToggleDiag(el, nom)   — coche/décoche un diagnostic
//   telechargerPDFAgentDevis(devisId)  — PDF download
//   agentEnvoyerDevis(devisId)         — envoi mail + signature
// ─────────────────────────────────────────────

// ─── Numérotation des devis agent ────────────
// Format : AG-YYYY-NNN  (par diagnostiqueur)
function genAgentDevisNumero(diagUid) {
  var year    = new Date().getFullYear();
  var allDev  = getAgentDevis();
  var prefix  = 'AG-' + year + '-';
  var count   = allDev.filter(function(d) {
    return d.diag_uid === diagUid && d.numero && d.numero.startsWith(prefix);
  }).length + 1;
  return prefix + String(count).padStart(3, '0');
}

// ─── Ouvrir le formulaire de création ────────
// Remplace le contenu de agent-body par le formulaire.
// devisId : si fourni → édition d'un brouillon existant.
function openAgentDevisForm(devisId) {
  var body    = document.getElementById('agent-body');
  if (!body) return;
  var profil  = getAgentActiveProfil();
  if (!profil) {
    alert('Aucun diagnostiqueur sélectionné. Importe un profil .c2p d\'abord.');
    return;
  }
  // Récupérer le devis existant si édition, sinon objet vide
  var devis = {};
  if (devisId) {
    var allDev = getAgentDevis();
    devis = allDev.find(function(d) { return d.id === devisId; }) || {};
    // Rediriger vers le formulaire spécial si nécessaire
    if (devis.type === 'special') {
      openAgentDevisSpecialForm(devisId);
      return;
    }
  }
  window._agentDevisEdit = devisId || null;
  body.innerHTML = _agentDevisFormHtml(devis, profil);
  // Recalculer total immédiatement si édition
  agentUpdateDevisTotal();
  // Auto-check si les données du bien sont déjà renseignées (mode édition)
  if (devisId && devis.typeBien) agentAutoCheckDiags();
}

// ─── HTML du formulaire de devis agent ───────
function _agentDevisFormHtml(devis, profil) {
  var tarifs      = Object.assign({}, profil.tarifs || {});
  var selDiags    = devis.diagnostics  || [];
  var tarManuel   = devis.tarifs_manuels || {};
  var societe     = (profil.profil && profil.profil.nom_societe) || profil.nom_affiche || '';
  var diagsList   = [
    'DPE','DPE Projeté','DPE Immeuble','Amiante','Prélèvement Amiante',
    'Plomb','Prélèvement Plomb','Électricité','Gaz','Termites',
    'ERP','Carrez','Boutin','Avant travaux','Avant démolition','Audit énergétique','Frais déplacement'
  ];

  var periodOptions = ['Avant 1949','1949-1997','1997-2011','Après 2011'];
  var typeBienOptions = ['Appartement','Maison','Immeuble','Commerce','Local','Terrain','Autre'];

  function sel(v, match) { return v === match ? 'selected' : ''; }

  var diagsHtml = diagsList.map(function(nom) {
    var isSel   = selDiags.includes(nom);
    var prix    = tarManuel[nom] !== undefined ? tarManuel[nom] : (tarifs[nom] || 0);
    var border  = isSel ? 'border-color:#6366F1;background:#EEF2FF' : '';
    return '<div class="ag-diag-item" onclick="agentToggleDiag(this,\'' + nom + '\')" '
      + 'data-nom="' + nom + '" '
      + 'style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;border:2px solid '
      + (isSel ? '#6366F1' : '#E2E5F0') + ';background:' + (isSel ? '#EEF2FF' : '#FAFAFA')
      + ';cursor:pointer;margin-bottom:6px">'
      + '<input type="checkbox" ' + (isSel ? 'checked' : '') + ' readonly style="accent-color:#6366F1;pointer-events:none;width:16px;height:16px"/>'
      + '<span style="flex:1;font-size:13px;color:#1B4332">' + nom + '</span>'
      + '<input type="number" class="ag-tarif-input" data-diag="' + nom + '" value="' + prix + '" min="0" step="5" '
      + 'onclick="event.stopPropagation()" onchange="agentUpdateDevisTotal()" '
      + 'style="width:56px;padding:4px 6px;border-radius:6px;border:1px dashed #A5B4FC;font-size:12px;font-weight:700;color:#6366F1;text-align:right;background:transparent;outline:none;font-family:inherit"/>'
      + '<span style="font-size:11px;color:#9ca3af">€</span>'
      + '</div>';
  }).join('');

  var isEdit   = !!(devis.id);
  var isSent   = !!(devis.envoye);
  var headerTxt = isEdit
    ? (isSent ? '✏️ Modifier le devis ' + (devis.numero || '') : '📝 Modifier le devis ' + (devis.numero || ''))
    : '📝 Nouveau devis';
  var backFn = isEdit ? 'renderAgentDevisList()' : 'renderAgentScreen()';

  return `
    <!-- ── En-tête formulaire ── -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:${isSent ? '8' : '16'}px">
      <button onclick="${backFn}"
        style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;padding:0;font-family:inherit">← Retour</button>
      <div style="flex:1;font-size:15px;font-weight:800;color:#1B4332">${headerTxt}</div>
    </div>

    ${isSent ? '<div style="background:#FEF3C7;border:1.5px solid #FCD34D;border-radius:10px;padding:9px 13px;margin-bottom:12px;font-size:12px;color:#92400E;font-weight:600">⚠️ Ce devis a déjà été envoyé au client. Après modification, pensez à le renvoyer via "↩️ Renvoyer".</div>' : ''}

    <!-- ── Pour qui ── -->
    <div style="background:#EEF2FF;border:1.5px solid #A5B4FC;border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#4338CA;font-weight:600">
      🏢 Devis au nom de : <strong>${societe}</strong>
    </div>

    <!-- ── Client ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">👤 Le client</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">NOM *</label>
          <input id="ag-client_nom" type="text" value="${devis.client_nom||''}" placeholder="Dupont"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Prénom</label>
          <input id="ag-client_prenom" type="text" value="${devis.client_prenom||''}" placeholder="Jean"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Téléphone</label>
          <input id="ag-client_tel" type="tel" value="${devis.client_tel||''}" placeholder="06 00 00 00 00"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Email *</label>
          <input id="ag-client_email" type="email" value="${devis.client_email||''}" placeholder="jean@email.fr"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div style="grid-column:1/-1">
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Société (optionnel)</label>
          <input id="ag-client_societe" type="text" value="${devis.client_societe||''}" placeholder="Entreprise XYZ"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
      </div>
    </div>

    <!-- ── Le Bien ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">🏠 Le bien</div>
      <div style="margin-bottom:10px">
        <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Adresse du bien *</label>
        <input id="ag-bien_adresse" type="text" value="${devis.bien_adresse||''}" placeholder="12 rue de la Paix, 75001 Paris"
          style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        <div style="margin-top:7px;padding:8px 11px;background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:8px;display:flex;align-items:center;gap:8px">
          <span style="font-size:13px">🐜</span>
          <span style="font-size:12px;color:#92400E">Vérifier si la zone est soumise aux termites :</span>
          <a href="https://termite.com.fr/rechercher/" target="_blank" rel="noopener"
            style="font-size:12px;font-weight:700;color:#B45309;text-decoration:underline;white-space:nowrap">termite.com.fr →</a>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Type de bien</label>
          <select id="ag-typeBien" onchange="agentAutoCheckDiags()" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="">— Choisir —</option>
            ${typeBienOptions.map(function(t) { return '<option value="' + t + '" ' + sel(devis.typeBien, t) + '>' + t + '</option>'; }).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Type de transaction</label>
          <select id="ag-type_transaction" onchange="agentAutoCheckDiags()" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="">— Choisir —</option>
            <option value="Vente" ${sel(devis.type_transaction,'Vente')}>Vente</option>
            <option value="Location" ${sel(devis.type_transaction,'Location')}>Location</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Période de construction</label>
          <select id="ag-periode_construction" onchange="agentAutoCheckDiags()" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="">— Choisir —</option>
            ${periodOptions.map(function(p) { return '<option value="' + p + '" ' + sel(devis.periode_construction, p) + '>' + p + '</option>'; }).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Nombre de pièces</label>
          <input id="ag-nb_pieces" type="number" min="1" max="99" value="${devis.nb_pieces||''}" placeholder="Ex : 4"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Surface (m²)</label>
          <input id="ag-surface" type="number" min="1" max="9999" value="${devis.surface||''}" placeholder="Ex : 85"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Année de construction</label>
          <input id="ag-annee" type="number" min="1800" max="2030" value="${devis.annee||''}" placeholder="Ex : 1985"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div style="grid-column:1/-1">
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:6px">🔥 Présence de gaz</label>
          <div style="display:flex;gap:8px">
            <button type="button" id="ag-gaz-oui"
              onclick="agentSetGaz('oui')"
              style="flex:1;padding:9px;border-radius:8px;border:2px solid ${devis.has_gaz==='oui'?'#EF4444':'#E2E5F0'};background:${devis.has_gaz==='oui'?'#FEF2F2':'#FAFAFA'};color:${devis.has_gaz==='oui'?'#EF4444':'#6B7280'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              🔥 Oui, présence de gaz
            </button>
            <button type="button" id="ag-gaz-non"
              onclick="agentSetGaz('non')"
              style="flex:1;padding:9px;border-radius:8px;border:2px solid ${devis.has_gaz==='non'||!devis.has_gaz?'#6366F1':'#E2E5F0'};background:${devis.has_gaz==='non'||!devis.has_gaz?'#EEF2FF':'#FAFAFA'};color:${devis.has_gaz==='non'||!devis.has_gaz?'#4338CA':'#6B7280'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              🚫 Pas de gaz
            </button>
          </div>
          <input type="hidden" id="ag-has_gaz" value="${devis.has_gaz||'non'}"/>
        </div>
      </div>
    </div>

    <!-- ── Prestations ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase">🔬 Prestations</div>
        <button onclick="agentAutoCheckDiags()" style="padding:5px 10px;border-radius:8px;border:1.5px solid #6366F1;background:#EEF2FF;color:#4338CA;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
          🤖 Auto-sélectionner
        </button>
      </div>
      <div style="font-size:11px;color:#9CA3AF;margin-bottom:6px">Coche les diagnostics — tarifs du diagnostiqueur · Le bouton "Auto" sélectionne les obligatoires selon le bien</div>
      <div id="ag-auto-info" style="display:none;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:6px 10px;font-size:11px;color:#059669;font-weight:600;margin-bottom:8px"></div>
      ${diagsHtml}
      <!-- Total avec remise -->
      <div style="background:#EEF2FF;border-radius:10px;padding:12px;margin-top:8px;border:1px solid #A5B4FC">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;font-weight:600;color:#6B7280">Sous-total</span>
          <span id="ag-total-display" style="font-size:14px;font-weight:700;color:#6366F1">0.00 €</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:12px;color:#EF4444;white-space:nowrap;font-weight:600">− Remise</span>
          <input id="ag-remise" type="number" min="0" step="5"
            value="${devis.remise && devis.remise > 0 ? parseFloat(devis.remise) : ''}"
            placeholder="0"
            onchange="agentUpdateDevisTotal()"
            style="width:72px;padding:5px 8px;border-radius:7px;border:1.5px solid #FCA5A5;font-size:13px;font-family:inherit;outline:none;color:#EF4444;font-weight:700;text-align:right"/>
          <span style="font-size:12px;color:#6B7280">€</span>
          <span id="ag-remise-display" style="font-size:11px;color:#EF4444;font-weight:600;margin-left:4px"></span>
        </div>
        <div style="border-top:1px dashed #A5B4FC;padding-top:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;font-weight:800;color:#4338CA">Total HT</span>
          <span id="ag-net-total-display" style="font-size:20px;font-weight:800;color:#6366F1">0.00 €</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:#9CA3AF;white-space:nowrap;font-weight:600">Prix forfaitaire (override)</span>
          <input id="ag-prix_final" type="number" min="0" step="1"
            value="${devis.prix_final && devis.prix_final > 0 ? parseFloat(devis.prix_final) : ''}"
            placeholder="Vide = calcul auto"
            onchange="agentUpdateDevisTotal()"
            style="flex:1;padding:5px 8px;border-radius:7px;border:1.5px dashed #A5B4FC;font-size:13px;font-family:inherit;outline:none;color:#6366F1;font-weight:700"/>
          <span style="font-size:12px;color:#6B7280">€ HT</span>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:4px">Si renseigné, remplace le total HT dans le PDF</div>
      </div>
    </div>

    <!-- ── Notes ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">📝 Notes</div>
      <textarea id="ag-notes" rows="3" placeholder="Informations complémentaires..."
        style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box">${devis.notes||''}</textarea>
    </div>

    <!-- ── Actions ── -->
    <button onclick="saveAgentDevisForm()"
      style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:8px">
      💾 Enregistrer le devis
    </button>
    <button onclick="saveAgentDevisForm(true)"
      style="width:100%;padding:12px;border-radius:12px;border:2px solid #6366F1;background:#fff;color:#6366F1;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">
      💾 Enregistrer &amp; envoyer par mail
    </button>
    <button onclick="renderAgentScreen()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #E2E5F0;background:#fff;color:#6B7280;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
      ✕ Annuler
    </button>
  `;
}

// ─── Recalculer le total du formulaire ────────
function agentUpdateDevisTotal() {
  var subtotal = 0;
  document.querySelectorAll('.ag-diag-item').forEach(function(el) {
    var cb = el.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) {
      var inp = el.querySelector('.ag-tarif-input');
      subtotal += parseFloat(inp ? inp.value : 0) || 0;
    }
  });

  var remise  = parseFloat((document.getElementById('ag-remise') || {}).value) || 0;
  var net     = Math.max(0, subtotal - remise);
  var override = parseFloat((document.getElementById('ag-prix_final') || {}).value) || 0;
  var display  = override > 0 ? override : net;

  var dispSub  = document.getElementById('ag-total-display');
  var dispRem  = document.getElementById('ag-remise-display');
  var dispNet  = document.getElementById('ag-net-total-display');

  if (dispSub)  dispSub.textContent  = subtotal.toFixed(2) + ' €';
  if (dispRem)  dispRem.textContent  = remise > 0 ? ('(−' + remise.toFixed(2) + ' €)') : '';
  if (dispNet)  {
    dispNet.textContent = display.toFixed(2) + ' €';
    dispNet.style.color = override > 0 ? '#059669' : '#6366F1';
  }

  window._agentDevisTotal = display;
}

// ─── Cocher/décocher un diagnostic ───────────
function agentToggleDiag(el, nom) {
  var cb = el.querySelector('input[type="checkbox"]');
  if (!cb) return;
  cb.checked = !cb.checked;
  var isSel = cb.checked;
  el.style.borderColor  = isSel ? '#6366F1' : '#E2E5F0';
  el.style.background   = isSel ? '#EEF2FF' : '#FAFAFA';
  agentUpdateDevisTotal();
}

// ─── Collecter les données du formulaire ─────
function _collectAgentDevisForm() {
  var selDiags    = [];
  var tarifsMan   = {};
  document.querySelectorAll('.ag-diag-item').forEach(function(el) {
    var cb  = el.querySelector('input[type="checkbox"]');
    var nom = el.getAttribute('data-nom');
    var inp = el.querySelector('.ag-tarif-input');
    var val = parseFloat(inp ? inp.value : 0) || 0;
    tarifsMan[nom] = val;
    if (cb && cb.checked) selDiags.push(nom);
  });
  var subtotal  = selDiags.reduce(function(s, nom) { return s + (tarifsMan[nom] || 0); }, 0);
  var remise    = parseFloat((document.getElementById('ag-remise') || {}).value) || 0;
  var total     = Math.max(0, subtotal - remise);
  var prixFinal = parseFloat((document.getElementById('ag-prix_final') || {}).value) || 0;

  return {
    client_nom:           (document.getElementById('ag-client_nom')            || {}).value || '',
    client_prenom:        (document.getElementById('ag-client_prenom')         || {}).value || '',
    client_tel:           (document.getElementById('ag-client_tel')            || {}).value || '',
    client_email:         (document.getElementById('ag-client_email')          || {}).value || '',
    client_societe:       (document.getElementById('ag-client_societe')        || {}).value || '',
    bien_adresse:         (document.getElementById('ag-bien_adresse')          || {}).value || '',
    typeBien:             (document.getElementById('ag-typeBien')              || {}).value || '',
    type_transaction:     (document.getElementById('ag-type_transaction')      || {}).value || '',
    periode_construction: (document.getElementById('ag-periode_construction')  || {}).value || '',
    nb_pieces:            (document.getElementById('ag-nb_pieces')             || {}).value || '',
    surface:              (document.getElementById('ag-surface')               || {}).value || '',
    annee:                (document.getElementById('ag-annee')                 || {}).value || '',
    notes:                (document.getElementById('ag-notes')                 || {}).value || '',
    has_gaz:              (document.getElementById('ag-has_gaz') || {}).value || 'non',
    diagnostics:          selDiags,
    tarifs_manuels:       tarifsMan,
    remise:               remise,
    total_ht:             total,
    prix_final:           prixFinal > 0 ? prixFinal : 0
  };
}

// ─── Enregistrer le devis agent ──────────────
// envoyer : si true, déclenche l'envoi mail juste après la sauvegarde
function saveAgentDevisForm(envoyer) {
  var data   = _collectAgentDevisForm();
  var profil = getAgentActiveProfil();
  if (!profil) { alert('Aucun diagnostiqueur actif.'); return; }

  // Validations minimales
  if (!data.client_nom.trim()) {
    alert('Le nom du client est obligatoire.'); return;
  }
  if (!data.bien_adresse.trim()) {
    alert('L\'adresse du bien est obligatoire.'); return;
  }
  if (data.diagnostics.length === 0) {
    alert('Sélectionne au moins un diagnostic.'); return;
  }
  if (envoyer && !data.client_email.trim()) {
    alert('L\'email du client est obligatoire pour envoyer le devis.'); return;
  }

  var allDev   = getAgentDevis();
  var diagUid  = profil.diag_uid;
  var editId   = window._agentDevisEdit || null;

  if (editId) {
    // Mise à jour d'un devis existant
    var idx = allDev.findIndex(function(d) { return d.id === editId; });
    if (idx >= 0) {
      allDev[idx] = Object.assign(allDev[idx], data, { updated_at: new Date().toISOString() });
      saveAgentDevis(allDev);
      if (envoyer) { agentEnvoyerDevis(editId); } else { renderAgentDevisList(); }
      return;
    }
  }

  // Nouveau devis
  var newDevis = Object.assign({
    id:               'ag-' + diagUid + '-' + Date.now(),
    numero:           genAgentDevisNumero(diagUid),
    diag_uid:         diagUid,
    date:             new Date().toISOString(),
    envoye:           false,
    statut_signature: null,
    signature_token:  null,
    signature_url:    null,
    signature_new:    false
  }, data);

  allDev.push(newDevis);
  saveAgentDevis(allDev);
  window._agentDevisEdit = newDevis.id;

  if (envoyer) {
    agentEnvoyerDevis(newDevis.id);
  } else {
    alert('✅ Devis ' + newDevis.numero + ' enregistré !');
    renderAgentDevisList();
  }
}

// ─── Génération PDF avec profil du diagnostiqueur ──
// Effectue un swap temporaire de dd_company_profile SANS déclencher
// la synchro Firestore (utilise _lsSetItem qui est la fonction native
// capturée dans storage.js avant l'override du prototype).
function genererPDFAgentDevis(devis, returnBlob, opts) {
  opts = opts || {};
  var profil = getAgentProfiles().find(function(p) { return p.diag_uid === devis.diag_uid; });
  if (!profil) {
    alert('Profil diagnostiqueur introuvable pour ce devis.');
    return null;
  }

  // ── Swap temporaire SANS sync Firestore ──
  var origProfile = localStorage.getItem('dd_company_profile') || '';
  var diagProfile = JSON.stringify(profil.profil || {});

  // _lsSetItem est la fonction native avant l'override dans storage.js
  if (typeof _lsSetItem === 'function') {
    _lsSetItem.call(localStorage, 'dd_company_profile', diagProfile);
  } else {
    // Fallback (ne devrait pas arriver)
    Object.getPrototypeOf(localStorage).setItem.call(localStorage, 'dd_company_profile', diagProfile);
  }

  // ── Adapter le devis au format attendu par genererPDFDevis ──
  // genererPDFDevis lit devis.diagnostics (array de noms) + devis.tarifs_manuels
  var devisForPDF = Object.assign({}, devis, {
    bien_type:       devis.typeBien || '',
    periode_construction: devis.periode_construction || '',
    type_transaction: devis.type_transaction || ''
  });

  var result;
  try {
    result = genererPDFDevis(devisForPDF, returnBlob || false, opts);
  } finally {
    // ── Restauration immédiate, quoi qu'il arrive ──
    if (typeof _lsSetItem === 'function') {
      _lsSetItem.call(localStorage, 'dd_company_profile', origProfile);
    } else {
      Object.getPrototypeOf(localStorage).setItem.call(localStorage, 'dd_company_profile', origProfile);
    }
  }

  return result;
}

// ─── Télécharger le PDF d'un devis agent ─────
function telechargerPDFAgentDevis(devisId) {
  var allDev = getAgentDevis();
  var devis  = allDev.find(function(d) { return d.id === devisId; });
  if (!devis) { alert('Devis introuvable.'); return; }
  if (devis.type === 'special') {
    genererPDFAgentDevisSpecial(devis, false, {});
  } else {
    genererPDFAgentDevis(devis, false, {});
  }
}

// ─── Envoyer le devis par email + lien de signature ──
function agentEnvoyerDevis(devisId) {
  var allDev = getAgentDevis();
  var idx    = allDev.findIndex(function(d) { return d.id === devisId; });
  if (idx < 0) { alert('Devis introuvable.'); return; }
  var devis  = allDev[idx];

  if (!devis.client_email) {
    alert('Renseigne d\'abord l\'email du client dans le devis avant d\'envoyer.');
    return;
  }

  var profil = getAgentProfiles().find(function(p) { return p.diag_uid === devis.diag_uid; });
  if (!profil) { alert('Profil diagnostiqueur introuvable.'); return; }
  var p      = profil.profil || {};

  // Trouver le bouton pour feedback visuel
  var btn = document.querySelector('[onclick*="agentEnvoyerDevis(\'' + devisId + '\')"]');
  if (btn) { btn.textContent = '⏳ Préparation...'; btn.disabled = true; }

  // ── 1. Générer le token de signature ─────────────────────────────
  var token   = _generateUUID();
  var signUrl = 'https://coup2pouce-bydelydiag.netlify.app/sign.html?token=' + token;

  // ── 2. Préparer les données Firestore pour la page de signature ──
  var montant   = devis.prix_final > 0 ? devis.prix_final : (devis.total_ht || 0);
  var fsData    = {
    devisNumero:      devis.numero    || '',
    clientPrenom:     devis.client_prenom || '',
    clientNom:        devis.client_nom    || '',
    clientEmail:      devis.client_email  || '',
    bienAdresse:      devis.bien_adresse  || '',
    bienType:         devis.typeBien      || '',
    typeTransaction:  devis.type_transaction || '',
    diagnostics:      devis.diagnostics   || [],
    totalHt:          montant,
    prixFinal:        devis.prix_final    || 0,
    statut_fiscal:    'HT',
    nomSociete:       p.nom_societe       || '',
    telephoneSociete: p.telephone         || '',
    emailSociete:     p.email             || '',
    uid:              'agent-' + (devis.diag_uid || ''),
    owner_uid:        localStorage.getItem('fb_uid') || '',
    token:            token,
    signed:           false,
    createdAt:        new Date().toISOString(),
    isAgent:          true
  };

  var _FS_PROJECT = 'coup2pouce-by-delydiag';
  var _FS_KEY     = 'AIzaSy' + 'ATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
  var fsUrl       = 'https://firestore.googleapis.com/v1/projects/' + _FS_PROJECT
    + '/databases/(default)/documents/signatures/' + token + '?key=' + _FS_KEY;

  // ── 3. Sauvegarder token dans le devis local ──────────────────────
  allDev[idx].signature_token = token;
  allDev[idx].signature_url   = signUrl;
  saveAgentDevis(allDev);

  // ── 4. Écrire dans Firestore ──────────────────────────────────────
  fetch(fsUrl, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: { value: { stringValue: JSON.stringify(fsData) } } })
  })
  .catch(function() {})  // Silencieux — le mail sera envoyé quand même
  .then(function() {
    // ── 5. Compresser logo du diagnostiqueur + générer PDF ────────
    return new Promise(function(resolve) {
      var logoSrc = p.logo || '';
      _compressLogoForEmail(logoSrc, function(compressedLogo) {
        var _pdfFn    = allDev[idx].type === 'special' ? genererPDFAgentDevisSpecial : genererPDFAgentDevis;
        var pdfResult = _pdfFn(
          allDev[idx],
          true,
          compressedLogo ? { compressedLogo: compressedLogo } : { skipLogo: true }
        );
        if (!pdfResult || !pdfResult.blob) {
          if (btn) { btn.textContent = '✉️ Envoyer'; btn.disabled = false; }
          alert('Erreur lors de la génération du PDF devis.');
          resolve(null);
          return;
        }
        var reader  = new FileReader();
        reader.onload = function(e) {
          var attachments = [{ filename: pdfResult.filename, content: e.target.result.split(',')[1] }];
          // Ajouter les docs réglementaires du diagnostiqueur
          // (ils sont dans le profil du diagnostiqueur importé via .c2p)
          // Note : les docs réglementaires ne sont pas exportés dans le .c2p pour l'instant,
          // mais si le diagnostiqueur les a fournis, on les ajoute.
          resolve(attachments);
        };
        reader.readAsDataURL(pdfResult.blob);
      });
    });
  })
  .then(function(attachments) {
    if (!attachments) return null;
    if (btn) btn.textContent = '⏳ Envoi en cours...';

    var societe  = p.nom_societe  || 'Coup 2 Pouce';
    var d        = allDev[idx];
    var montantDisplay = parseFloat(montant).toFixed(2);
    var subject  = 'Votre devis N° ' + (d.numero || '') + ' — ' + (d.bien_adresse || '');
    var diagsList = (d.diagnostics || []).join(', ') || '';

    // ── 6. HTML de l'email ────────────────────────────────────────
    var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">'
      + '<div style="background:linear-gradient(135deg,#6366F1,#4F46E5);padding:24px 32px;border-radius:12px 12px 0 0">'
      + '<h1 style="color:#fff;margin:0;font-size:22px">' + societe + '</h1>'
      + (p.telephone ? '<p style="color:#C7D2FE;margin:4px 0;font-size:13px">' + p.telephone + '</p>' : '')
      + (p.email     ? '<p style="color:#C7D2FE;margin:4px 0;font-size:13px">' + p.email     + '</p>' : '')
      + '</div>'
      + '<div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<p style="font-size:15px;color:#111827">Bonjour ' + (d.client_prenom ? d.client_prenom : '') + ',</p>'
      + '<p style="color:#374151">Veuillez trouver ci-joint votre devis pour la réalisation '
      + 'de diagnostics immobiliers au <strong>' + (d.bien_adresse || '') + '</strong>.</p>'
      + '<div style="background:#fff;border:2px solid #E5E7EB;border-radius:10px;padding:16px 20px;margin:20px 0">'
      + '<p style="margin:0 0 6px;font-size:13px;color:#6B7280">N° Devis</p>'
      + '<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#4F46E5">' + (d.numero || '') + '</p>'
      + '<p style="margin:0 0 4px;font-size:13px;color:#6B7280">Montant HT</p>'
      + '<p style="margin:0 0 12px;font-size:22px;font-weight:800;color:#4F46E5">' + montantDisplay + ' €</p>'
      + (diagsList ? '<p style="margin:0;font-size:12px;color:#6B7280">Diagnostics : ' + diagsList + '</p>' : '')
      + '</div>'
      + (p.lien_paiement
        ? '<a href="' + p.lien_paiement + '" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:16px">💳 Payer en ligne</a><br>'
        : '')
      + '<div style="text-align:center;margin:24px 0">'
      + '<a href="' + signUrl + '" style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#059669,#10B981);color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700">'
      + '✅ Accepter &amp; signer ce devis</a>'
      + '</div>'
      + '<p style="font-size:12px;color:#9CA3AF;text-align:center">Ce lien vous permet de signer électroniquement votre accord.</p>'
      + '<p style="color:#374151;margin-top:24px">Cordialement,<br><strong>' + (p.nom_responsable || societe) + '</strong></p>'
      + '</div>'
      + '<div style="padding:12px 32px;font-size:11px;color:#9ca3af;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;background:#fff">'
      + societe + (p.adresse ? ' — ' + p.adresse : '') + (p.siret ? ' — SIRET : ' + p.siret : '')
      + '</div>'
      + '</div>';

    // Vérifier taille payload (limite Netlify ~6 Mo)
    var totalB64 = attachments.reduce(function(s, a) { return s + (a.content ? a.content.length : 0); }, 0);
    if (totalB64 > 4 * 1024 * 1024) {
      attachments = attachments.slice(0, 1);
    }

    // ── 7. Appel Netlify Function send-email ─────────────────────
    return fetch('/.netlify/functions/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:          d.client_email,
        subject:     subject,
        html:        html,
        attachments: attachments,
        fromName:    societe,
        fromEmail:   'noreply@coup2pouce-pro.fr',
        replyTo:     p.email || '',
        cc:          p.email || ''   // copie au diagnostiqueur
      })
    });
  })
  .then(function(res) {
    if (!res) return null;
    var status = res.status;
    return res.text().then(function(text) {
      if (!text || !text.trim()) throw new Error('Réponse vide (HTTP ' + status + ')');
      try { return JSON.parse(text); } catch(e) { throw new Error('HTTP ' + status + ' — ' + text.substring(0, 300)); }
    });
  })
  .then(function(data) {
    if (btn) { btn.textContent = '✉️ Envoyer'; btn.disabled = false; }
    if (!data) return;
    if (data.success) {
      // Marquer comme envoyé
      var all2 = getAgentDevis();
      var i2   = all2.findIndex(function(d) { return d.id === devisId; });
      if (i2 >= 0) { all2[i2].envoye = true; saveAgentDevis(all2); }
      alert('✅ Devis envoyé à ' + allDev[idx].client_email
        + '\n\nLe client peut signer via le lien dans l\'email.\nUtilise 🔄 pour vérifier la signature.');
      renderAgentDevisList();
    } else {
      alert('⚠️ Erreur envoi : ' + (data.error || JSON.stringify(data)));
    }
  })
  .catch(function(err) {
    if (btn) { btn.textContent = '✉️ Envoyer'; btn.disabled = false; }
    alert('❌ Erreur : ' + err.message);
  });
}

// ─── Basculer présence de gaz ─────────────────────────────────────
function agentSetGaz(val) {
  var inp = document.getElementById('ag-has_gaz');
  if (inp) inp.value = val;

  var btnOui = document.getElementById('ag-gaz-oui');
  var btnNon = document.getElementById('ag-gaz-non');
  if (val === 'oui') {
    if (btnOui) { btnOui.style.borderColor='#EF4444'; btnOui.style.background='#FEF2F2'; btnOui.style.color='#EF4444'; }
    if (btnNon) { btnNon.style.borderColor='#E2E5F0'; btnNon.style.background='#FAFAFA'; btnNon.style.color='#6B7280'; }
  } else {
    if (btnNon) { btnNon.style.borderColor='#6366F1'; btnNon.style.background='#EEF2FF'; btnNon.style.color='#4338CA'; }
    if (btnOui) { btnOui.style.borderColor='#E2E5F0'; btnOui.style.background='#FAFAFA'; btnOui.style.color='#6B7280'; }
  }
  agentAutoCheckDiags();
}

// ─── Auto-sélection des diagnostics obligatoires ──────────────────
// Appelée automatiquement quand type de bien / période / transaction change,
// ou via le bouton "🤖 Auto-sélectionner".
// N'efface PAS les diagnostics déjà cochés manuellement.

function agentAutoCheckDiags() {
  var typeBien = (document.getElementById('ag-typeBien') || {}).value || '';
  var periode  = (document.getElementById('ag-periode_construction') || {}).value || '';
  var transac  = (document.getElementById('ag-type_transaction') || {}).value || '';
  var hasGaz   = (document.getElementById('ag-has_gaz') || {}).value === 'oui';

  if (!typeBien && !periode && !transac) return; // Pas assez d'info

  // ── Règles obligatoires françaises ──
  var autoCheck = [];

  // DPE : toujours requis (Vente et Location)
  autoCheck.push('DPE');

  // ERP : toujours requis
  autoCheck.push('ERP');

  // Amiante : construction avant juillet 1997
  // - VENTE : obligatoire pour tous types de biens
  // - LOCATION : uniquement pour les biens en copropriété (appartements, immeubles)
  //   → PAS pour une maison individuelle en location
  if (periode === 'Avant 1949' || periode === '1949-1997') {
    if (transac === 'Vente') {
      autoCheck.push('Amiante');
    } else if (transac === 'Location' && typeBien !== 'Maison') {
      autoCheck.push('Amiante');
    }
  }

  // Plomb : construction avant 1949 — vente ET location
  if (periode === 'Avant 1949') {
    autoCheck.push('Plomb');
  }

  // Électricité : installation > 15 ans (avant 2011)
  if (periode === 'Avant 1949' || periode === '1949-1997' || periode === '1997-2011') {
    autoCheck.push('Électricité');
  }

  // Gaz : installation > 15 ans ET présence de gaz déclarée
  if (hasGaz && (periode === 'Avant 1949' || periode === '1949-1997' || periode === '1997-2011')) {
    autoCheck.push('Gaz');
  }

  // Carrez : appartement / immeuble EN VENTE (copropriété uniquement, pas les maisons)
  if ((typeBien === 'Appartement' || typeBien === 'Immeuble') && transac === 'Vente') {
    autoCheck.push('Carrez');
  }

  // Boutin : LOCATION uniquement — TOUS types de biens (maison ET appartement)
  if (transac === 'Location') {
    autoCheck.push('Boutin');
  }

  // ── Appliquer sur les checkboxes ──
  var nbAdded = 0;
  document.querySelectorAll('.ag-diag-item').forEach(function(el) {
    var nom = el.getAttribute('data-nom');
    var cb  = el.querySelector('input[type="checkbox"]');
    if (!cb) return;
    if (autoCheck.indexOf(nom) !== -1 && !cb.checked) {
      cb.checked           = true;
      el.style.borderColor = '#6366F1';
      el.style.background  = '#EEF2FF';
      nbAdded++;
    }
  });

  agentUpdateDevisTotal();

  if (nbAdded > 0) {
    // Petit feedback visuel (pas d'alert, juste un message discret)
    var info = document.getElementById('ag-auto-info');
    if (info) {
      info.textContent = '✅ ' + nbAdded + ' diagnostic(s) ajouté(s) automatiquement';
      info.style.display = 'block';
      setTimeout(function() { info.style.display = 'none'; }, 3000);
    }
  }
}

// ─── Relance (email rappel court) ─────────────────────────────────
// Envoie un email simple rappelant au client qu'il n'a pas encore signé.

function agentRelancerDevis(devisId) {
  var allDev = getAgentDevis();
  var d      = allDev.find(function(x) { return x.id === devisId; });
  if (!d) { alert('Devis introuvable.'); return; }

  if (!d.client_email) {
    alert('Pas d\'email client sur ce devis.');
    return;
  }
  if (!d.signature_url) {
    alert('Ce devis n\'a pas encore été envoyé. Utilise "Envoyer" d\'abord.');
    return;
  }

  var profil = getAgentProfiles().find(function(p) { return p.diag_uid === d.diag_uid; });
  var p      = (profil && profil.profil) || {};
  var societe = p.nom_societe || 'Coup 2 Pouce';
  var montant = parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0).toFixed(2);

  var btn = document.querySelector('[onclick*="agentRelancerDevis(\'' + devisId + '\')"]');
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
    + '<div style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:20px 32px;border-radius:12px 12px 0 0">'
    + '<h2 style="color:#fff;margin:0;font-size:18px">⏰ Rappel — Votre devis attend votre signature</h2>'
    + '</div>'
    + '<div style="background:#FFFBEB;border:1px solid #FDE68A;padding:24px 32px;border-radius:0 0 12px 12px">'
    + '<p style="color:#374151">Bonjour ' + (d.client_prenom || '') + ',</p>'
    + '<p style="color:#374151">Nous n\'avons pas encore reçu votre accord pour le devis <strong>N° ' + (d.numero || '') + '</strong> — ' + (d.bien_adresse || '') + '.</p>'
    + '<div style="background:#fff;border:1px solid #FDE68A;border-radius:8px;padding:14px;margin:16px 0;text-align:center">'
    + '<div style="font-size:20px;font-weight:800;color:#D97706">' + montant + ' € HT</div>'
    + '<div style="font-size:12px;color:#9CA3AF;margin-top:4px">Diagnostics : ' + (d.diagnostics || []).join(', ') + '</div>'
    + '</div>'
    + '<div style="text-align:center;margin:20px 0">'
    + '<a href="' + d.signature_url + '" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#059669,#10B981);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700">'
    + '✅ Signer mon devis maintenant</a>'
    + '</div>'
    + '<p style="font-size:12px;color:#9CA3AF;text-align:center">Ce lien est unique et sécurisé. En cas de question, contactez-nous.</p>'
    + '<p style="color:#374151;margin-top:20px">Cordialement,<br><strong>' + (p.nom_responsable || societe) + '</strong></p>'
    + '</div></div>';

  fetch('/.netlify/functions/send-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to:        d.client_email,
      subject:   '⏰ Rappel — Devis N° ' + (d.numero || '') + ' en attente de signature',
      html:      html,
      fromName:  societe,
      fromEmail: 'noreply@coup2pouce-pro.fr',
      replyTo:   p.email || ''
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (btn) { btn.textContent = '📣 Relancer'; btn.disabled = false; }
    if (res.success || res.id) {
      alert('✅ Email de relance envoyé à ' + d.client_email);
    } else {
      alert('⚠️ Erreur : ' + (res.error || JSON.stringify(res)));
    }
  })
  .catch(function(err) {
    if (btn) { btn.textContent = '📣 Relancer'; btn.disabled = false; }
    alert('❌ Erreur réseau : ' + err.message);
  });
}

// ═══════════════════════════════════════════════════════════════════
// DEVIS SPÉCIAL AGENT (multi-lots / multi-biens)
// ═══════════════════════════════════════════════════════════════════

window._agLotCount = 0;

// ─── Ouvrir le formulaire devis spécial agent ─────────────────────
function openAgentDevisSpecialForm(devisId) {
  var body   = document.getElementById('agent-body');
  if (!body) return;
  var profil = getAgentActiveProfil();
  if (!profil) { alert('Aucun diagnostiqueur sélectionné. Importe un profil .c2p d\'abord.'); return; }

  var devis = {};
  if (devisId) {
    var allDev = getAgentDevis();
    devis = allDev.find(function(d) { return d.id === devisId; }) || {};
  }
  window._agentDevisEdit = devisId || null;
  window._agLotCount     = 0;

  body.innerHTML = _agentDevisSpecialFormHtml(devis, profil);

  // Pré-remplir les lots si édition
  var lots = devis.lots || [];
  if (lots.length === 0) {
    agAddLot({});  // Lot vide par défaut
  } else {
    lots.forEach(function(lot) { agAddLot(lot); });
  }
  agSpUpdateTotal();
}

// ─── HTML du formulaire devis spécial agent ───────────────────────
function _agentDevisSpecialFormHtml(devis, profil) {
  var societe   = (profil.profil && profil.profil.nom_societe) || profil.nom_affiche || '';
  var isEdit    = !!(devis.id);
  var isSent    = !!(devis.envoye);
  var headerTxt = isEdit ? '📦 Modifier le devis spécial ' + (devis.numero || '') : '📦 Nouveau devis spécial';
  var backFn    = isEdit ? 'renderAgentDevisList()' : 'renderAgentScreen()';

  return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:' + (isSent ? '8' : '16') + 'px">'
    + '<button onclick="' + backFn + '" style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;padding:0;font-family:inherit">← Retour</button>'
    + '<div style="flex:1;font-size:15px;font-weight:800;color:#1B4332">' + headerTxt + '</div>'
    + '</div>'
    + (isSent ? '<div style="background:#FEF3C7;border:1.5px solid #FCD34D;border-radius:10px;padding:9px 13px;margin-bottom:12px;font-size:12px;color:#92400E;font-weight:600">⚠️ Ce devis a déjà été envoyé. Pensez à le renvoyer après modification.</div>' : '')
    + '<div style="background:#EEF2FF;border:1.5px solid #A5B4FC;border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#4338CA;font-weight:600">🏢 Devis au nom de : <strong>' + societe + '</strong></div>'

    // Client
    + '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
    + '<div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">👤 Le client</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">NOM *</label>'
    + '<input id="ag-sp-client_nom" type="text" value="' + (devis.client_nom||'') + '" placeholder="Dupont" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Prénom</label>'
    + '<input id="ag-sp-client_prenom" type="text" value="' + (devis.client_prenom||'') + '" placeholder="Jean" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Téléphone</label>'
    + '<input id="ag-sp-client_tel" type="tel" value="' + (devis.client_tel||'') + '" placeholder="06 00 00 00 00" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Email *</label>'
    + '<input id="ag-sp-client_email" type="email" value="' + (devis.client_email||'') + '" placeholder="jean@email.fr" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '<div style="grid-column:1/-1"><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Société (optionnel)</label>'
    + '<input id="ag-sp-client_societe" type="text" value="' + (devis.client_societe||'') + '" placeholder="Entreprise XYZ" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '</div></div>'

    // Lots container
    + '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
    + '<div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">📦 Lots (biens / appartements)</div>'
    + '<div id="ag-lots-container"></div>'
    + '<button onclick="agAddLot({})" style="width:100%;padding:10px;border-radius:10px;border:2px dashed #A5B4FC;background:#F5F3FF;color:#6366F1;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px">+ Ajouter un lot</button>'
    + '</div>'

    // Notes
    + '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
    + '<div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">📝 Notes</div>'
    + '<textarea id="ag-sp-notes" rows="3" placeholder="Informations complémentaires..." style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box">' + (devis.notes||'') + '</textarea>'
    + '</div>'

    // Total
    + '<div style="background:#EEF2FF;border-radius:12px;padding:14px;margin-bottom:14px;border:1px solid #A5B4FC;text-align:center">'
    + '<div style="font-size:13px;font-weight:600;color:#6B7280;margin-bottom:4px">Total HT</div>'
    + '<div id="ag-sp-total-display" style="font-size:24px;font-weight:800;color:#6366F1">0.00 € HT</div>'
    + '</div>'

    // Actions
    + '<button onclick="saveAgentDevisSpecialForm()" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:8px">💾 Enregistrer le devis</button>'
    + '<button onclick="saveAgentDevisSpecialForm(true)" style="width:100%;padding:12px;border-radius:12px;border:2px solid #6366F1;background:#fff;color:#6366F1;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">💾 Enregistrer &amp; envoyer par mail</button>'
    + '<button onclick="renderAgentScreen()" style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #E2E5F0;background:#fff;color:#6B7280;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">✕ Annuler</button>';
}

// ─── Ajouter un lot au formulaire ─────────────────────────────────
function agAddLot(data) {
  data      = data || {};
  var idx   = window._agLotCount++;
  var container = document.getElementById('ag-lots-container');
  if (!container) return;

  var profil    = getAgentActiveProfil();
  var tarifs    = (profil && profil.tarifs) || {};
  var selDiags  = data.diagnostics || [];
  var diagsList = [
    'DPE','DPE Projeté','DPE Immeuble','Amiante','Prélèvement Amiante',
    'Plomb','Prélèvement Plomb','Électricité','Gaz','Termites',
    'ERP','Carrez','Boutin','Avant travaux','Avant démolition','Audit énergétique','Frais déplacement'
  ];
  var periodOptions   = ['Avant 1949','1949-1997','1997-2011','Après 2011'];
  var typeBienOptions = ['Appartement','Maison','Immeuble','Commerce','Local','Terrain','Autre'];
  function selOpt(val, match) { return val === match ? ' selected' : ''; }

  var FORFAITS_UNIQUES = ['ERP', 'Frais déplacement'];
  var diagsParBienList = diagsList.filter(function(n){ return FORFAITS_UNIQUES.indexOf(n) === -1; });
  var diagsForfaitList = diagsList.filter(function(n){ return FORFAITS_UNIQUES.indexOf(n) !== -1; });

  function buildDiagItem(nom) {
    var isSel    = selDiags.indexOf(nom) !== -1;
    var prix     = (data.tarifs_manuels && data.tarifs_manuels[nom] !== undefined)
                   ? data.tarifs_manuels[nom] : (tarifs[nom] || 0);
    var isForf   = FORFAITS_UNIQUES.indexOf(nom) !== -1;
    var borderC  = isSel ? (isForf ? '#F59E0B' : '#6366F1') : '#E2E5F0';
    var bgC      = isSel ? (isForf ? '#FFFBEB' : '#EEF2FF') : '#FAFAFA';
    var priceC   = isForf ? '#D97706' : '#6366F1';
    var priceBorder = isForf ? '#FCD34D' : '#A5B4FC';
    return '<div class="ag-sp-diag-item" data-nom="' + nom + '" data-lot="' + idx + '" onclick="agSpToggleDiag(this)"'
      + ' style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;border:1.5px solid ' + borderC + ';background:' + bgC + ';cursor:pointer;margin-bottom:4px">'
      + '<input type="checkbox"' + (isSel?' checked':'') + ' readonly style="accent-color:' + (isForf?'#D97706':'#6366F1') + ';pointer-events:none;width:14px;height:14px"/>'
      + '<span style="flex:1;font-size:12px">' + nom + '</span>'
      + '<input type="number" class="ag-sp-prix" data-diag="' + nom + '" value="' + prix + '" min="0" step="5"'
      + ' onclick="event.stopPropagation()" onchange="agSpUpdateLotTotal(' + idx + ')"'
      + ' style="width:56px;padding:3px 5px;border-radius:5px;border:1px dashed ' + priceBorder + ';font-size:11px;font-weight:700;color:' + priceC + ';text-align:right;background:transparent;outline:none;font-family:inherit"/> €</div>';
  }

  var diagsHtml =
    '<div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px">Diagnostics — tarif PAR BIEN (x quantité)</div>'
    + diagsParBienList.map(buildDiagItem).join('')
    + '<div style="font-size:11px;font-weight:700;color:#92400E;margin:8px 0 5px;text-transform:uppercase;letter-spacing:.4px;background:#FEF3C7;padding:4px 8px;border-radius:6px">Forfaits uniques — comptes UNE SEULE FOIS / mission</div>'
    + diagsForfaitList.map(buildDiagItem).join('');

  var card = document.createElement('div');
  card.id   = 'ag-lot-' + idx;
  card.style.cssText = 'background:#F8F9FF;border-radius:12px;padding:14px;margin-bottom:12px;border:2px solid #A5B4FC';
  card.innerHTML =
    // ── En-tête lot ──
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
    + '<div style="background:#6366F1;color:#fff;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;white-space:nowrap">Lot ' + (idx+1) + '</div>'
    + '<input id="ag-lot-' + idx + '-label" type="text" value="' + (data.label||'') + '" placeholder="Description libre (ex : Appt T3 Bât. A)"'
    + ' style="flex:1;padding:6px 10px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none"/>'
    + '<button onclick="agRemoveLot(' + idx + ')" style="background:none;border:none;color:#EF4444;font-size:18px;cursor:pointer;padding:2px 6px;line-height:1">✕</button>'
    + '</div>'

    // ── Adresse du bien ──
    + '<div style="margin-bottom:10px">'
    + '<label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Adresse du bien *</label>'
    + '<input id="ag-lot-' + idx + '-adresse" type="text" value="' + (data.adresse||data.bien_adresse||'') + '"'
    + ' placeholder="12 rue de la Paix, 75001 Paris" class="addr-autocomplete"'
    + ' style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>'
    + '</div>'

    // ── Type + Surface + Période ──
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Type de bien</label>'
    + '<select id="ag-lot-' + idx + '-type" style="width:100%;padding:7px 8px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none;background:#fff">'
    + '<option value="">—</option>'
    + typeBienOptions.map(function(t){ return '<option value="' + t + '"' + selOpt(data.typeBien, t) + '>' + t + '</option>'; }).join('')
    + '</select></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Surface (m²)</label>'
    + '<input id="ag-lot-' + idx + '-surface" type="number" min="1" value="' + (data.surface||'') + '" placeholder="85"'
    + ' style="width:100%;padding:7px 8px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none;box-sizing:border-box"/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Période construction</label>'
    + '<select id="ag-lot-' + idx + '-periode" style="width:100%;padding:7px 8px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none;background:#fff">'
    + '<option value="">—</option>'
    + periodOptions.map(function(p){ return '<option value="' + p + '"' + selOpt(data.periode, p) + '>' + p + '</option>'; }).join('')
    + '</select></div>'
    + '</div>'

    // ── Quantité ──
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#fff;border-radius:8px;padding:8px 12px;border:1px solid #E2E5F0">'
    + '<span style="font-size:12px;font-weight:700;color:#374151;white-space:nowrap">Quantité de biens identiques :</span>'
    + '<input id="ag-lot-' + idx + '-qte" type="number" min="1" step="1" value="' + (data.quantite||1) + '"'
    + ' onchange="agSpUpdateLotTotal(' + idx + ')"'
    + ' style="width:70px;padding:6px 8px;border-radius:7px;border:1.5px solid #6366F1;font-size:14px;font-weight:800;font-family:inherit;outline:none;text-align:center;color:#4F46E5"/>'
    + '<span style="font-size:12px;color:#6B7280">bien(s)</span>'
    + '</div>'

    // ── Diagnostics ──
    + '<div id="ag-lot-' + idx + '-diags">' + diagsHtml + '</div>'

    // ── Récapitulatif lot ──
    + '<div style="background:#EEF2FF;border-radius:10px;padding:10px 12px;margin-top:10px;border:1px solid #A5B4FC">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
    + '<span style="font-size:12px;color:#6B7280;font-weight:600">Sous-total (diags × quantité)</span>'
    + '<span id="ag-lot-' + idx + '-subtotal" style="font-size:13px;font-weight:700;color:#6366F1">0 € HT</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
    + '<span style="font-size:12px;color:#EF4444;font-weight:600;white-space:nowrap">− Remise</span>'
    + '<input id="ag-lot-' + idx + '-remise" type="number" min="0" step="5" value="' + (data.remise||'') + '" placeholder="0"'
    + ' onchange="agSpUpdateLotTotal(' + idx + ')"'
    + ' style="width:72px;padding:4px 7px;border-radius:6px;border:1.5px solid #FCA5A5;font-size:12px;font-weight:700;color:#EF4444;text-align:right;font-family:inherit;outline:none"/> €'
    + '</div>'
    + '<div style="border-top:1px dashed #A5B4FC;padding-top:8px;display:flex;justify-content:space-between;align-items:center">'
    + '<span style="font-size:12px;font-weight:800;color:#4338CA">Total HT lot ' + (idx+1) + '</span>'
    + '<span id="ag-lot-' + idx + '-total" style="font-size:16px;font-weight:800;color:#6366F1">0 € HT</span>'
    + '</div></div>'

    // ── Prix négocié global (optionnel) ──
    + '<div style="margin-top:8px;padding:10px 12px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE">'
    + '<div style="font-size:11px;font-weight:700;color:#2563EB;margin-bottom:6px">💰 Prix négocié global (optionnel — remplace le calcul ci-dessus)</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<input id="ag-lot-' + idx + '-manuel" type="number" min="0" step="1" value="' + (data.total_manuel_ht||'') + '"'
    + ' placeholder="Laisse vide = calcul auto" onchange="agSpUpdateLotTotal(' + idx + ')"'
    + ' style="flex:1;padding:6px 8px;border-radius:7px;border:1.5px solid #BFDBFE;font-size:13px;font-family:inherit;outline:none;color:#2563EB;font-weight:700"/>'
    + '<span style="font-size:12px;color:#6B7280">€ HT</span>'
    + '</div></div>';

  container.appendChild(card);
  agSpUpdateLotTotal(idx);
}

// ─── Supprimer un lot ──────────────────────────────────────────────
function agRemoveLot(idx) {
  var card = document.getElementById('ag-lot-' + idx);
  if (card) card.remove();
  agSpUpdateTotal();
}

// ─── Toggle diagnostic dans un lot ────────────────────────────────
function agSpToggleDiag(el) {
  var cb = el.querySelector('input[type="checkbox"]');
  if (!cb) return;
  cb.checked           = !cb.checked;
  el.style.borderColor = cb.checked ? '#6366F1' : '#E2E5F0';
  el.style.background  = cb.checked ? '#EEF2FF' : '#FAFAFA';
  var lotIdx = parseInt(el.getAttribute('data-lot'), 10);
  agSpUpdateLotTotal(lotIdx);
}

// ─── Recalculer le total d'un lot ─────────────────────────────────
// ERP et Frais déplacement sont comptés UNE SEULE FOIS (forfait unique)
// Tous les autres diagnostics sont multipliés par la quantité de biens
function agSpUpdateLotTotal(idx) {
  var container = document.getElementById('ag-lot-' + idx + '-diags');
  if (!container) return;
  var _FORFAITS = ['ERP', 'Frais déplacement'];
  var subParBien = 0;
  var subForfait = 0;
  container.querySelectorAll('.ag-sp-diag-item').forEach(function(el) {
    var cb = el.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) {
      var nom = el.getAttribute('data-nom');
      var inp = el.querySelector('.ag-sp-prix');
      var val = parseFloat(inp ? inp.value : 0) || 0;
      if (_FORFAITS.indexOf(nom) !== -1) {
        subForfait += val;
      } else {
        subParBien += val;
      }
    }
  });
  var qteEl    = document.getElementById('ag-lot-' + idx + '-qte');
  var qte      = Math.max(1, parseInt(qteEl ? qteEl.value : 1) || 1);
  var calc     = subParBien * qte + subForfait;
  var remiseEl = document.getElementById('ag-lot-' + idx + '-remise');
  var remise   = parseFloat(remiseEl ? remiseEl.value : '') || 0;
  var apresRemise = Math.max(0, calc - remise);
  var manuelEl = document.getElementById('ag-lot-' + idx + '-manuel');
  var manuel   = parseFloat(manuelEl ? manuelEl.value : '') || 0;
  var display  = manuel > 0 ? manuel : apresRemise;

  // Label sous-total : montre le détail du calcul
  var subEl = document.getElementById('ag-lot-' + idx + '-subtotal');
  if (subEl) {
    var subLabel = (subParBien * qte).toFixed(0) + ' €';
    if (subForfait > 0) subLabel += ' + forfaits ' + subForfait.toFixed(0) + ' €';
    subEl.textContent = '= ' + calc.toFixed(0) + ' € HT';
  }

  var dispEl = document.getElementById('ag-lot-' + idx + '-total');
  if (dispEl) {
    dispEl.textContent = display.toFixed(0) + ' € HT';
    dispEl.style.color = manuel > 0 ? '#2563EB' : '#6366F1';
  }
  agSpUpdateTotal();
}

// ─── Recalculer le total global devis spécial ─────────────────────
function agSpUpdateTotal() {
  var total = 0;
  document.querySelectorAll('[id^="ag-lot-"][id$="-total"]').forEach(function(el) {
    total += parseFloat(el.textContent) || 0;
  });
  var dispEl = document.getElementById('ag-sp-total-display');
  if (dispEl) dispEl.textContent = total.toFixed(2) + ' € HT';
  window._agDevisSpTotal = total;
}

// ─── Collecter les lots depuis le DOM ─────────────────────────────
function _collectAgentLotsFromDOM() {
  var lots = [];
  for (var i = 0; i < window._agLotCount; i++) {
    var card = document.getElementById('ag-lot-' + i);
    if (!card) continue;  // Lot supprimé

    var labelEl   = document.getElementById('ag-lot-' + i + '-label');
    var adresseEl = document.getElementById('ag-lot-' + i + '-adresse');
    var typeEl    = document.getElementById('ag-lot-' + i + '-type');
    var surfaceEl = document.getElementById('ag-lot-' + i + '-surface');
    var periodeEl = document.getElementById('ag-lot-' + i + '-periode');
    var qteEl     = document.getElementById('ag-lot-' + i + '-qte');
    var remiseEl  = document.getElementById('ag-lot-' + i + '-remise');
    var manuelEl  = document.getElementById('ag-lot-' + i + '-manuel');

    var label    = labelEl   ? labelEl.value.trim()  : '';
    var adresse  = adresseEl ? adresseEl.value.trim() : '';
    var typeBien = typeEl    ? typeEl.value            : '';
    var surface  = surfaceEl ? surfaceEl.value         : '';
    var periode  = periodeEl ? periodeEl.value         : '';
    var qte      = Math.max(1, parseInt(qteEl ? qteEl.value : 1) || 1);
    var remise   = parseFloat(remiseEl ? remiseEl.value : '') || 0;
    var manuel   = parseFloat(manuelEl ? manuelEl.value : '') || 0;

    var diags       = [];
    var tarifsMan   = {};
    var subParBien  = 0;
    var subForfait  = 0;
    var _FORFAITS_C = ['ERP', 'Frais déplacement'];
    card.querySelectorAll('.ag-sp-diag-item').forEach(function(el) {
      var nom = el.getAttribute('data-nom');
      var cb  = el.querySelector('input[type="checkbox"]');
      var inp = el.querySelector('.ag-sp-prix');
      var val = parseFloat(inp ? inp.value : 0) || 0;
      tarifsMan[nom] = val;
      if (cb && cb.checked) {
        diags.push(nom);
        if (_FORFAITS_C.indexOf(nom) !== -1) { subForfait += val; }
        else                                 { subParBien += val; }
      }
    });

    // ERP et Frais déplacement : comptés UNE SEULE FOIS, pas × quantité
    var calcTotal = Math.max(0, subParBien * qte + subForfait - remise);
    var totalHt   = manuel > 0 ? manuel : calcTotal;

    lots.push({
      label:           label,
      adresse:         adresse,
      bien_adresse:    adresse,
      typeBien:        typeBien,
      surface:         surface,
      periode:         periode,
      quantite:        qte,
      diagnostics:     diags,
      tarifs_manuels:  tarifsMan,
      remise:          remise,
      total_manuel_ht: manuel > 0 ? manuel : 0,
      total_ht:        totalHt
    });
  }
  return lots;
}

// ─── Enregistrer le devis spécial agent ───────────────────────────
function saveAgentDevisSpecialForm(envoyer) {
  var profil = getAgentActiveProfil();
  if (!profil) { alert('Aucun diagnostiqueur actif.'); return; }

  var clientNom    = ((document.getElementById('ag-sp-client_nom')    || {}).value || '').trim();
  var clientPrenom = ((document.getElementById('ag-sp-client_prenom') || {}).value || '').trim();
  var clientTel    = ((document.getElementById('ag-sp-client_tel')    || {}).value || '').trim();
  var clientEmail  = ((document.getElementById('ag-sp-client_email')  || {}).value || '').trim();
  var clientSoc    = ((document.getElementById('ag-sp-client_societe')|| {}).value || '').trim();
  var notes        = ((document.getElementById('ag-sp-notes')         || {}).value || '').trim();

  if (!clientNom)   { alert('Le nom du client est obligatoire.'); return; }
  if (envoyer && !clientEmail) { alert('L\'email du client est obligatoire pour envoyer le devis.'); return; }

  var lots = _collectAgentLotsFromDOM();
  if (lots.length === 0 || lots.every(function(l){ return l.diagnostics.length === 0; })) {
    alert('Ajoute au moins un lot avec un diagnostic sélectionné.'); return;
  }

  var totalHt = lots.reduce(function(s, l) { return s + l.total_ht; }, 0);
  // Résumé de l'adresse pour l'affichage dans la liste
  var premAdresse = lots[0] && (lots[0].adresse || lots[0].label) ? (lots[0].adresse || lots[0].label) : '';
  var adresseSummary = lots.length + ' lot' + (lots.length > 1 ? 's' : '') + (premAdresse ? ' — ' + premAdresse : '');

  var data = {
    type:           'special',
    client_nom:     clientNom,
    client_prenom:  clientPrenom,
    client_tel:     clientTel,
    client_email:   clientEmail,
    client_societe: clientSoc,
    bien_adresse:   adresseSummary,
    notes:          notes,
    lots:           lots,
    total_ht:       totalHt,
    prix_final:     0
  };

  var allDev  = getAgentDevis();
  var diagUid = profil.diag_uid;
  var editId  = window._agentDevisEdit || null;

  if (editId) {
    var idx = allDev.findIndex(function(d) { return d.id === editId; });
    if (idx >= 0) {
      allDev[idx] = Object.assign(allDev[idx], data, { updated_at: new Date().toISOString() });
      saveAgentDevis(allDev);
      if (envoyer) { agentEnvoyerDevis(editId); } else { renderAgentDevisList(); }
      return;
    }
  }

  var newDevis = Object.assign({
    id:               'ag-' + diagUid + '-' + Date.now(),
    numero:           genAgentDevisNumero(diagUid),
    diag_uid:         diagUid,
    date:             new Date().toISOString(),
    envoye:           false,
    statut_signature: null,
    signature_token:  null,
    signature_url:    null,
    signature_new:    false
  }, data);

  allDev.push(newDevis);
  saveAgentDevis(allDev);
  window._agentDevisEdit = newDevis.id;

  if (envoyer) {
    agentEnvoyerDevis(newDevis.id);
  } else {
    alert('✅ Devis spécial ' + newDevis.numero + ' enregistré !');
    renderAgentDevisList();
  }
}

// ─── PDF devis spécial agent (swap profil + genererPDFDevisSpecial) ─
function genererPDFAgentDevisSpecial(devis, returnBlob, opts) {
  opts = opts || {};
  if (typeof genererPDFDevisSpecial !== 'function') {
    alert('Générateur PDF spécial non disponible.'); return null;
  }
  var profil = getAgentProfiles().find(function(p) { return p.diag_uid === devis.diag_uid; });
  if (!profil) { alert('Profil diagnostiqueur introuvable pour ce devis.'); return null; }

  var origProfile = localStorage.getItem('dd_company_profile') || '';
  var diagProfile = JSON.stringify(profil.profil || {});

  if (typeof _lsSetItem === 'function') {
    _lsSetItem.call(localStorage, 'dd_company_profile', diagProfile);
  } else {
    Object.getPrototypeOf(localStorage).setItem.call(localStorage, 'dd_company_profile', diagProfile);
  }

  var result;
  try {
    result = genererPDFDevisSpecial(devis, returnBlob || false, opts);
  } finally {
    if (typeof _lsSetItem === 'function') {
      _lsSetItem.call(localStorage, 'dd_company_profile', origProfile);
    } else {
      Object.getPrototypeOf(localStorage).setItem.call(localStorage, 'dd_company_profile', origProfile);
    }
  }
  return result;
}
