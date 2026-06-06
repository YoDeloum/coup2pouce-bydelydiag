// ─────────────────────────────────────────────
// DEVIS.JS — Système de devis complet
// ─────────────────────────────────────────────

var DEVIS_DIAGNOSTICS_LIST = ['DPE','Amiante','Plomb','Électricité','Gaz','Termites','ERP','Carrez','Boutin','Frais déplacement'];

var DEVIS_DEPS_LIST = ['Garage','Cave','Grenier','Box','Parking','Local annexe','Sous-sol','Dépendance extérieure'];

// ─── STORAGE ───
function getAllDevis() {
  try { return JSON.parse(localStorage.getItem('dd_devis_list') || '[]'); } catch(e) { return []; }
}
function saveAllDevis(list) {
  localStorage.setItem('dd_devis_list', JSON.stringify(list));
}
function genDevisNumero() {
  var year  = new Date().getFullYear();
  var all   = getAllDevis();
  var seq   = all.filter(function(d) { return d.numero && d.numero.startsWith(year + '-'); }).length + 1;
  return year + '-' + String(seq).padStart(3, '0');
}

// ─── ÉCRAN DEVIS ───
function openDevis() {
  document.getElementById('devis-screen').classList.add('open');
  renderDevisScreen('list');
}
function closeDevis() {
  document.getElementById('devis-screen').classList.remove('open');
}

var _devisView = 'list'; // 'list' | 'form'
var _devisEdit = null;   // index du devis en cours d'édition

function renderDevisScreen(view) {
  _devisView = view || _devisView;
  var body = document.getElementById('devis-body');
  if (_devisView === 'form') renderDevisForm(body);
  else                       renderDevisList(body);
}

function renderDevisList(body) {
  var list   = getAllDevis();
  var sorted = list.slice().reverse();

  body.innerHTML = `
    <button onclick="_devisEdit=null;renderDevisScreen('form')" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#059669,#10B981);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px">
      ➕ Nouveau devis
    </button>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px;font-weight:600">${list.length} devis enregistré${list.length>1?'s':''}</div>
    ${sorted.length === 0 ? '<div style="text-align:center;padding:40px;color:#6B7280">Aucun devis créé</div>' : ''}
    ${sorted.map(function(d, i) {
      var realIdx = list.length - 1 - i;
      var statutClass = 'statut-' + (d.statut||'devis').toLowerCase()
        .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
        .replace(/\s+/g,'_');
      return '<div class="devis-card" onclick="_devisEdit='+realIdx+';renderDevisScreen(\'form\')">'
        + '<div class="devis-card-accent" style="background:#059669"></div>'
        + '<div style="padding-left:12px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
        + '<div class="devis-card-title">Devis N° '+(d.numero||'')+'</div>'
        + '<span class="statut-badge '+statutClass+'">'+(d.statut||'Devis')+'</span>'
        + '</div>'
        + '<div class="devis-card-sub">👤 '+(d.client_prenom||'')+' '+(d.client_nom||'')+'</div>'
        + '<div class="devis-card-sub">📍 '+(d.bien_adresse||'')+'</div>'
        + (d.mission_creee ? '<div class="devis-card-sub" style="color:#2D6A4F;font-weight:600">🏠 Mission créée</div>' : '')
        + (d.signature && d.signature.accepte ? '<div class="devis-card-sub" style="color:#1B4332;font-weight:600">✍️ Signé par '+d.signature.signataire+'</div>' : '')
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">'
        + '<div style="font-size:11px;color:#9ca3af">'+(d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '')+'</div>'
        + '<div class="devis-card-amount">'+(d.total_ht ? parseFloat(d.total_ht).toFixed(2)+' € HT' : '')+'</div>'
        + '</div></div></div>';
    }).join('')}`;
}

function renderDevisForm(body) {
  var devis  = _devisEdit !== null ? (getAllDevis()[_devisEdit] || {}) : {};
  var p      = getCompanyProfile();
  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var sel    = devis.diagnostics || [];
  var selDeps = devis.dependances || [];
  var today  = new Date().toISOString().split('T')[0];
  var statuts = ['Devis','Accepté','Intervention réalisée','Facturé','Payé','Annulé'];

  body.innerHTML = `
    <button onclick="renderDevisScreen('list')" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#059669;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>

    ${devis.signature && devis.signature.accepte ? '<div style="background:#D1FAE5;border:1px solid #6EE7B7;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#065F46">✍️ <strong>Accepté</strong> par ' + devis.signature.signataire + ' le ' + new Date(devis.signature.date_signature).toLocaleString('fr-FR') + '</div>' : ''}

    ${devis.mission_creee ? '<div style="background:#EDE9FE;border:1px solid #C4B5FD;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#5B21B6">🏠 Ce devis a déjà été transformé en mission.</div>' : ''}

    <!-- ── Informations devis ── -->
    <div class="devis-section">
      <div class="devis-section-title">📄 Informations devis</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="devis-field">
          <label class="devis-label">Numéro</label>
          <input class="devis-input" id="dv-numero" type="text" value="${devis.numero || genDevisNumero()}" readonly style="background:#F5F6FA;color:#6B7280"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Date du devis</label>
          <input class="devis-input" id="dv-date" type="date" value="${devis.date || today}"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Statut</label>
          <select class="devis-select" id="dv-statut">
            ${statuts.map(function(s) { return '<option ' + ((devis.statut||'Devis')===s?'selected':'') + '>' + s + '</option>'; }).join('')}
          </select>
        </div>
        <div class="devis-field">
          <label class="devis-label">Date intervention prévue</label>
          <input class="devis-input" id="dv-date_mission" type="date" value="${devis.date_mission || today}"/>
        </div>
      </div>
    </div>

    <!-- ── Client ── -->
    <div class="devis-section">
      <div class="devis-section-title">👤 Client</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="devis-field">
          <label class="devis-label">Nom</label>
          <input class="devis-input" id="dv-client_nom" type="text" value="${devis.client_nom||''}" placeholder="Dupont"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Prénom</label>
          <input class="devis-input" id="dv-client_prenom" type="text" value="${devis.client_prenom||''}" placeholder="Jean"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Téléphone</label>
          <input class="devis-input" id="dv-client_tel" type="tel" value="${devis.client_tel||''}"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Email</label>
          <input class="devis-input" id="dv-client_email" type="email" value="${devis.client_email||''}"/>
        </div>
        <div class="devis-field" style="grid-column:1/-1">
          <label class="devis-label">Adresse du bien</label>
          <input class="devis-input" id="dv-bien_adresse" type="text" value="${devis.bien_adresse||''}" placeholder="12 rue des Acacias, 75001 Paris"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Type de bien</label>
          <select class="devis-select" id="dv-bien_type">
            ${['Maison','Appartement','Local commercial','Immeuble'].map(function(t) { return '<option ' + ((devis.bien_type||'Maison')===t?'selected':'') + '>' + t + '</option>'; }).join('')}
          </select>
        </div>
        <div class="devis-field">
          <label class="devis-label">Statut fiscal</label>
          <select class="devis-select" id="dv-statut_fiscal">
            <option ${(devis.statut_fiscal||p.statut_fiscal||'HT')==='HT'?'selected':''} value="HT">HT</option>
            <option ${(devis.statut_fiscal||p.statut_fiscal||'HT')==='TTC'?'selected':''} value="TTC">TTC</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ── Le Bien ── -->
    <div class="devis-section">
      <div class="devis-section-title">🏠 Le Bien</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="devis-field">
          <label class="devis-label">Période de construction</label>
          <select class="devis-select" id="dv-periode_construction">
            <option value="" ${!devis.periode_construction?'selected':''}>— Non renseignée —</option>
            <option value="Avant 1949"  ${devis.periode_construction==='Avant 1949' ?'selected':''}>Avant 1949</option>
            <option value="1949-1997"   ${devis.periode_construction==='1949-1997'  ?'selected':''}>1949 — 1997</option>
            <option value="1997-2011"   ${devis.periode_construction==='1997-2011'  ?'selected':''}>1997 — 2011</option>
            <option value="Après 2011"  ${devis.periode_construction==='Après 2011' ?'selected':''}>À partir de 2012</option>
          </select>
        </div>
        <div class="devis-field">
          <label class="devis-label">Nombre de pièces</label>
          <input class="devis-input" id="dv-nb_pieces" type="number" min="1" max="99" value="${devis.nb_pieces||''}" placeholder="Ex : 4"/>
        </div>
      </div>
    </div>

    <!-- ── Dépendances ── -->
    <div class="devis-section">
      <div class="devis-section-title">🏗️ Dépendances</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px" id="dv-deps-grid">
        ${DEVIS_DEPS_LIST.map(function(d) {
          var isSel = selDeps.includes(d);
          return '<div class="deps-item ' + (isSel?'selected':'') + '" onclick="toggleDevisDep(this)" data-dep="' + d + '" style="' + (isSel?'border-color:#059669;background:#05966912':'') + '">'
            + '<input type="checkbox" ' + (isSel?'checked':'') + ' readonly style="accent-color:#059669;pointer-events:none"/>'
            + '<span style="font-size:13px">' + d + '</span>'
            + '</div>';
        }).join('')}
      </div>
      <div class="devis-field">
        <label class="devis-label">Dépendance personnalisée</label>
        <input class="devis-input" id="dv-dep-custom" type="text" value="${devis.dep_custom||''}" placeholder="Ex : Grange, Piscine..."/>
      </div>
    </div>

    <!-- ── Prestations ── -->
    <div class="devis-section">
      <div class="devis-section-title">🔬 Prestations</div>
      <p style="font-size:12px;color:#6B7280;margin-bottom:12px">Sélectionne les diagnostics — tarifs depuis ton profil</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="dv-diags-grid">
        ${DEVIS_DIAGNOSTICS_LIST.map(function(d) {
          var isSel = sel.includes(d);
          return '<div class="diag-item ' + (isSel?'selected':'') + '" onclick="toggleDevisDiag(this,\'' + d + '\')" style="' + (isSel?'border-color:#059669;background:#05966912':'') + '">'
            + '<input type="checkbox" ' + (isSel?'checked':'') + ' readonly style="accent-color:#059669;pointer-events:none"/>'
            + '<span style="font-size:13px">' + d + '</span>'
            + '<span style="font-size:11px;color:#059669;font-weight:700;margin-left:auto">' + (tarifs[d]||0) + '€</span>'
            + '</div>';
        }).join('')}
      </div>
      <div style="margin-top:14px;padding:14px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px;font-weight:700;color:#065F46">Total HT</span>
        <span id="dv-total-display" style="font-size:18px;font-weight:800;color:#059669">${parseFloat(devis.total_ht||0).toFixed(2)} €</span>
      </div>
    </div>

    <!-- ── Actions ── -->
    <button class="devis-btn-primary" onclick="saveDevisForm()">💾 Enregistrer le devis</button>
    <button onclick="if(_devisEdit!==null && getAllDevis()[_devisEdit]) genererPDFDevis(getAllDevis()[_devisEdit])" style="width:100%;padding:12px;border-radius:10px;border:2px solid #059669;background:#fff;color:#059669;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4;cursor:not-allowed"':''}>📄 Générer PDF devis</button>
    <button onclick="if(_devisEdit!==null && getAllDevis()[_devisEdit]) envoyerMailDevis(getAllDevis()[_devisEdit])" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:#fff;color:#0891B2;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>✉️ Envoyer par mail</button>
    <button onclick="if(_devisEdit!==null) openSignature(_devisEdit)" style="width:100%;padding:12px;border-radius:10px;border:2px solid #1B4332;background:#fff;color:#1B4332;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>✍️ Signature / Acceptation client</button>
    <button onclick="convertirEnFacture()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #5B21B6;background:#fff;color:#5B21B6;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>📋 Convertir en facture</button>
    <button onclick="convertirEnMission()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #E8650A;background:#fff;color:#E8650A;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>🏠 Créer une mission depuis ce devis</button>
    ${p.lien_paiement ? '<button onclick="window.open(\'' + p.lien_paiement + '\',\'_blank\')" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:linear-gradient(135deg,#0891B2,#0E7490);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">💳 Lien de paiement en ligne</button>' : ''}
    ${_devisEdit !== null ? '<button onclick="supprimerDevis()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #EF4444;background:#fff;color:#EF4444;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🗑️ Supprimer ce devis</button>' : ''}`;

  updateDevisTotal();
}

// ─── TOGGLE ───
function toggleDevisDiag(el, diag) {
  el.classList.toggle('selected');
  var isSel = el.classList.contains('selected');
  el.querySelector('input').checked = isSel;
  el.style.borderColor = isSel ? '#059669' : '';
  el.style.background  = isSel ? '#05966912' : '';
  updateDevisTotal();
}

function toggleDevisDep(el) {
  el.classList.toggle('selected');
  var isSel = el.classList.contains('selected');
  el.querySelector('input').checked = isSel;
  el.style.borderColor = isSel ? '#059669' : '';
  el.style.background  = isSel ? '#05966912' : '';
}

// ─── NORMALISATION TARIFS ───
// TARIFS_DEFAULT utilise 'Electricite' (sans accent) mais les listes utilisent 'Électricité'
function _normaliseTarifs(tarifs) {
  if (!tarifs['Électricité'] && tarifs['Electricite']) tarifs['Électricité'] = tarifs['Electricite'];
  return tarifs;
}

// ─── CALCUL TOTAL ───
function updateDevisTotal() {
  var tarifs   = _normaliseTarifs(Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}')));
  var selDiags = Array.from(document.querySelectorAll('#dv-diags-grid .diag-item.selected')).map(function(el) {
    return el.querySelector('span').textContent;
  });
  var total = selDiags.reduce(function(s, d) { return s + (parseFloat(tarifs[d]) || 0); }, 0);
  var disp  = document.getElementById('dv-total-display');
  if (disp) disp.textContent = total.toFixed(2) + ' €';
}

// ─── LECTURE FORMULAIRE ───
function getDevisFormData() {
  var tarifs   = _normaliseTarifs(Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}')));
  var selDiags = Array.from(document.querySelectorAll('#dv-diags-grid .diag-item.selected')).map(function(el) {
    return el.querySelector('span').textContent;
  });
  var selDeps = Array.from(document.querySelectorAll('#dv-deps-grid .deps-item.selected')).map(function(el) {
    return el.getAttribute('data-dep');
  });
  var totalHt = selDiags.reduce(function(s, d) { return s + (parseFloat(tarifs[d]) || 0); }, 0);
  var p       = getCompanyProfile();
  return {
    numero:               document.getElementById('dv-numero')?.value              || '',
    date:                 document.getElementById('dv-date')?.value                || '',
    date_mission:         document.getElementById('dv-date_mission')?.value        || '',
    statut:               document.getElementById('dv-statut')?.value              || 'Devis',
    client_nom:           document.getElementById('dv-client_nom')?.value          || '',
    client_prenom:        document.getElementById('dv-client_prenom')?.value       || '',
    client_tel:           document.getElementById('dv-client_tel')?.value          || '',
    client_email:         document.getElementById('dv-client_email')?.value        || '',
    bien_adresse:         document.getElementById('dv-bien_adresse')?.value        || '',
    bien_type:            document.getElementById('dv-bien_type')?.value           || '',
    statut_fiscal:        document.getElementById('dv-statut_fiscal')?.value       || p.statut_fiscal || 'HT',
    periode_construction: document.getElementById('dv-periode_construction')?.value || '',
    nb_pieces:            document.getElementById('dv-nb_pieces')?.value            || '',
    dependances:          selDeps,
    dep_custom:           (document.getElementById('dv-dep-custom')?.value || '').trim(),
    taux_tva:             p.taux_tva || 20,
    diagnostics:          selDiags,
    total_ht:             totalHt,
    total_ttc:            totalHt * (1 + (p.taux_tva || 20) / 100),
    savedAt:              new Date().toISOString(),
    // Conserver les champs existants si en édition
    signature:            (_devisEdit !== null ? (getAllDevis()[_devisEdit]?.signature || null) : null),
    mission_creee:        (_devisEdit !== null ? (getAllDevis()[_devisEdit]?.mission_creee || false) : false),
  };
}

// ─── SAUVEGARDE ───
function saveDevisForm() {
  var data = getDevisFormData();
  var list = getAllDevis();
  if (_devisEdit !== null) list[_devisEdit] = data;
  else { list.push(data); _devisEdit = list.length - 1; }
  saveAllDevis(list);
  var btn = document.querySelector('.devis-btn-primary');
  if (btn) { btn.textContent = '✅ Enregistré !'; btn.style.background = '#22C55E'; }
  setTimeout(function() { renderDevisScreen('form'); }, 1200);
}

// ─── SUPPRESSION ───
function supprimerDevis() {
  if (!confirm('Supprimer ce devis définitivement ?')) return;
  var list = getAllDevis();
  list.splice(_devisEdit, 1);
  saveAllDevis(list);
  _devisEdit = null;
  renderDevisScreen('list');
}

// ─── CONVERTIR EN FACTURE ───
function convertirEnFacture() {
  var devis = getAllDevis()[_devisEdit];
  if (!devis) return;
  _factureFromDevis = devis;
  _factureEdit = null;
  closeDevis();
  openFacture();
}

// ─── CONVERTIR EN MISSION ───
function convertirEnMission() {
  var devis = getAllDevis()[_devisEdit];
  if (!devis) { alert('Enregistre d\'abord le devis avant de créer une mission.'); return; }
  if (devis.mission_creee) {
    if (!confirm('Une mission a déjà été créée depuis ce devis.\nEn créer une nouvelle quand même ?')) return;
  }
  // Marquer le devis comme "transformé en mission"
  var list = getAllDevis();
  if (list[_devisEdit].statut === 'Devis') list[_devisEdit].statut = 'Accepté';
  list[_devisEdit].mission_creee = true;
  saveAllDevis(list);
  // Passer les données au module mission
  window._devisToMission = devis;
  closeDevis();
  openMission();
}

  // Marquer             