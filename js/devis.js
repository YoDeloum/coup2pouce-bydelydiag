// ─────────────────────────────────────────────
// DEVIS.JS — Système de devis complet
// ─────────────────────────────────────────────

var DEVIS_DIAGNOSTICS_LIST = ['DPE','Amiante','Plomb','Électricité','Gaz','Termites','ERP','Carrez','Boutin','Avant travaux','Avant démolition','Frais déplacement'];

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
        + '<div class="devis-card-sub">👤 '+(d.client_prenom||'')+' '+(d.client_nom||'')+''+(d.client_tel ? ' — <a href="tel:'+d.client_tel+'" onclick="event.stopPropagation()" style="color:#059669;font-weight:600;text-decoration:none">📞 '+d.client_tel+'</a>' : '')+'</div>'
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
          <a href="https://termite.com.fr/rechercher/" target="_blank" style="display:inline-flex;align-items:center;gap:4px;margin-top:5px;font-size:11px;color:#059669;font-weight:600;text-decoration:none">🐜 Vérifier zone termites</a>
        </div>
        <div class="devis-field">
          <label class="devis-label">Type de bien</label>
          <select class="devis-select" id="dv-bien_type">
            ${['Maison','Appartement','Local commercial','Immeuble','Partie commune','Cave / Box','Dépendance'].map(function(t) { return '<option ' + ((devis.bien_type||'Maison')===t?'selected':'') + '>' + t + '</option>'; }).join('')}
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
          var tarif_manuel = devis.tarifs_manuels && devis.tarifs_manuels[d] !== undefined ? devis.tarifs_manuels[d] : (tarifs[d]||0);
          return '<div class="diag-item ' + (isSel?'selected':'') + '" onclick="toggleDevisDiag(this,\'' + d + '\')" style="' + (isSel?'border-color:#059669;background:#05966912':'') + '">'
            + '<input type="checkbox" ' + (isSel?'checked':'') + ' readonly style="accent-color:#059669;pointer-events:none"/>'
            + '<span style="font-size:13px;flex:1">' + d + '</span>'
            + '<input type="number" class="dv-tarif-input" data-diag="' + d + '" value="' + tarif_manuel + '" min="0" step="5" onclick="event.stopPropagation()" onchange="updateDevisTotal()" style="width:52px;font-size:11px;color:#059669;font-weight:700;text-align:right;border:none;border-bottom:1px dashed #A7F3D0;background:transparent;outline:none;padding:0 2px"/>'
            + '<span style="font-size:11px;color:#9ca3af;margin-left:1px">€</span>'
            + '</div>';
        }).join('')}
      </div>
      <div style="margin-top:6px;font-size:11px;color:#9ca3af;text-align:right">✏️ Prix modifiable par diagnostic pour ce devis uniquement</div>
      <div style="margin-top:10px;padding:14px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;font-weight:700;color:#065F46">Sous-total HT</span>
          <span id="dv-subtotal-display" style="font-size:15px;font-weight:800;color:#059669">${parseFloat(devis.total_ht_brut||devis.total_ht||0).toFixed(2)} €</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:#6B7280;white-space:nowrap">🏷️ Remise</span>
          <input id="dv-remise-pct" type="number" min="0" max="100" step="1" value="${devis.remise_pct||0}" onchange="updateDevisRemisePct()" style="width:54px;padding:5px 7px;border-radius:6px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;text-align:center;outline:none"/>
          <span style="font-size:12px;color:#6B7280">%</span>
          <span style="font-size:12px;color:#9ca3af">ou</span>
          <input id="dv-remise-eur" type="number" min="0" step="1" value="${parseFloat(devis.remise_eur||0).toFixed(2)}" onchange="updateDevisRemiseEur()" style="width:64px;padding:5px 7px;border-radius:6px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;text-align:center;outline:none"/>
          <span style="font-size:12px;color:#6B7280">€</span>
        </div>
        <div id="dv-remise-line" style="${(devis.remise_eur||0)>0?'':'display:none'};font-size:12px;color:#EF4444;text-align:right;margin-bottom:4px">
          - <span id="dv-remise-display">${parseFloat(devis.remise_eur||0).toFixed(2)}</span> € de remise
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #BBF7D0">
          <span style="font-size:14px;font-weight:700;color:#065F46">Total HT</span>
          <span id="dv-total-display" style="font-size:18px;font-weight:800;color:#059669">${parseFloat(devis.total_ht||0).toFixed(2)} €</span>
        </div>
      </div>
    </div>

    <!-- ── Actions ── -->
    <button class="devis-btn-primary" onclick="saveDevisForm()">💾 Enregistrer le devis</button>
    <button onclick="if(_devisEdit!==null && getAllDevis()[_devisEdit]) genererPDFDevis(getAllDevis()[_devisEdit])" style="width:100%;padding:12px;border-radius:10px;border:2px solid #059669;background:#fff;color:#059669;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4;cursor:not-allowed"':''}>📄 Générer PDF devis</button>
    <button onclick="if(_devisEdit!==null && getAllDevis()[_devisEdit]) envoyerMailDevis(getAllDevis()[_devisEdit])" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:#fff;color:#0891B2;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>✉️ Envoyer par mail</button>
    <button onclick="if(_devisEdit!==null) openSignature(_devisEdit)" style="width:100%;padding:12px;border-radius:10px;border:2px solid #1B4332;background:#fff;color:#1B4332;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>✍️ Signature / Acceptation client</button>
    <button onclick="convertirEnFacture()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #5B21B6;background:#fff;color:#5B21B6;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>📋 Convertir en facture</button>
    <button onclick="convertirEnMission()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #E8650A;background:#fff;color:#E8650A;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>🏠 Créer une mission depuis ce devis</button>
    <button onclick="ouvrirRelance()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #6366F1;background:#fff;color:#6366F1;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>📨 Relancer le client</button>
    <button onclick="ouvrirEnvoiDocuments()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:#fff;color:#0891B2;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_devisEdit===null?'disabled style="opacity:.4"':''}>📄 Envoyer les documents réglementaires</button>
    <button onclick="ouvrirOCR()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #D97706;background:#fff;color:#D97706;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">📷 Préremplir depuis une photo</button>
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

// ─── CALCUL TOTAL ───
function updateDevisTotal() {
  // Calcule le sous-total en lisant les prix manuels des inputs
  var subtotal = 0;
  document.querySelectorAll('#dv-diags-grid .diag-item.selected').forEach(function(el) {
    var inp = el.querySelector('.dv-tarif-input');
    subtotal += inp ? (parseFloat(inp.value) || 0) : 0;
  });
  var remisePct  = parseFloat(document.getElementById('dv-remise-pct')?.value) || 0;
  var remiseEur  = subtotal * remisePct / 100;
  // Si l'utilisateur a saisi une remise en € manuellement, l'utiliser
  var remiseEurInput = parseFloat(document.getElementById('dv-remise-eur')?.value) || 0;
  if (document.activeElement && document.activeElement.id === 'dv-remise-eur') {
    remiseEur = remiseEurInput;
  }
  var total = Math.max(0, subtotal - remiseEur);
  var sub   = document.getElementById('dv-subtotal-display');
  var disp  = document.getElementById('dv-total-display');
  var rDisp = document.getElementById('dv-remise-display');
  var rLine = document.getElementById('dv-remise-line');
  if (sub)   sub.textContent  = subtotal.toFixed(2) + ' €';
  if (disp)  disp.textContent = total.toFixed(2) + ' €';
  if (rDisp) rDisp.textContent = remiseEur.toFixed(2);
  if (rLine) rLine.style.display = remiseEur > 0 ? '' : 'none';
}

f