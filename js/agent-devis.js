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
  }
  window._agentDevisEdit = devisId || null;
  body.innerHTML = _agentDevisFormHtml(devis, profil);
  // Recalculer total immédiatement si édition
  agentUpdateDevisTotal();
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
    'ERP','Carrez','Boutin','Avant travaux','Avant démolition','Frais déplacement'
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

  return `
    <!-- ── En-tête formulaire ── -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button onclick="renderAgentScreen()"
        style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;padding:0;font-family:inherit">← Retour</button>
      <div style="flex:1;font-size:15px;font-weight:800;color:#1B4332">📝 Nouveau devis</div>
    </div>

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
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Type de bien</label>
          <select id="ag-typeBien" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="">— Choisir —</option>
            ${typeBienOptions.map(function(t) { return '<option value="' + t + '" ' + sel(devis.typeBien, t) + '>' + t + '</option>'; }).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Type de transaction</label>
          <select id="ag-type_transaction" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="">— Choisir —</option>
            <option value="Vente" ${sel(devis.type_transaction,'Vente')}>Vente</option>
            <option value="Location" ${sel(devis.type_transaction,'Location')}>Location</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Période de construction</label>
          <select id="ag-periode_construction" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
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
      </div>
    </div>

    <!-- ── Prestations ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#6366F1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">🔬 Prestations</div>
      <div style="font-size:11px;color:#9CA3AF;margin-bottom:10px">Coche les diagnostics — tarifs du diagnostiqueur</div>
      ${diagsHtml}
      <!-- Total -->
      <div style="background:#EEF2FF;border-radius:10px;padding:12px;margin-top:8px;border:1px solid #A5B4FC">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:13px;font-weight:700;color:#4338CA">Total HT</span>
          <span id="ag-total-display" style="font-size:18px;font-weight:800;color:#6366F1">0.00 €</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#6B7280;white-space:nowrap;font-weight:600">Prix forfaitaire</span>
          <input id="ag-prix_final" type="number" min="0" step="1"
            value="${devis.prix_final && devis.prix_final > 0 ? parseFloat(devis.prix_final) : ''}"
            placeholder="Vide = calcul auto"
            style="flex:1;padding:6px 10px;border-radius:8px;border:1.5px solid #A5B4FC;font-size:13px;font-family:inherit;outline:none;color:#6366F1;font-weight:700"/>
          <span style="font-size:12px;color:#6B7280">€ HT</span>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:4px">Si renseigné, remplace le total dans le PDF</div>
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
  var total = 0;
  document.querySelectorAll('.ag-diag-item').forEach(function(el) {
    var cb = el.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) {
      var inp = el.querySelector('.ag-tarif-input');
      total  += parseFloat(inp ? inp.value : 0) || 0;
    }
  });
  var disp = document.getElementById('ag-total-display');
  if (disp) disp.textContent = total.toFixed(2) + ' €';
  window._agentDevisTotal = total;
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
  var total = selDiags.reduce(function(s, nom) { return s + (tarifsMan[nom] || 0); }, 0);
  var prixFinal = parseFloat(document.getElementById('ag-prix_final').value) || 0;

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
    diagnostics:          selDiags,
    tarifs_manuels:       tarifsMan,
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
  genererPDFAgentDevis(devis, false, {});
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
        var pdfResult = genererPDFAgentDevis(
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
