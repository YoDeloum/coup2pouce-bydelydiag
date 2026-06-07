// ─────────────────────────────────────────────
// FACTURE.JS — Conversion devis → facture + CRUD
// ─────────────────────────────────────────────

var _factureFromDevis = null; // devis source quand on convertit
var _factureEdit      = null; // index facture en édition
var _factureView      = 'list';

// ─── STORAGE ───
function getAllFactures() {
  try { return JSON.parse(localStorage.getItem('dd_factures_list') || '[]'); } catch(e) { return []; }
}
function saveAllFactures(list) {
  localStorage.setItem('dd_factures_list', JSON.stringify(list));
}
function genFactureNumero() {
  var year = new Date().getFullYear();
  var all  = getAllFactures();
  var seq  = all.filter(function(f) { return f.numero_facture && f.numero_facture.startsWith('F' + year + '-'); }).length + 1;
  return 'F' + year + '-' + String(seq).padStart(3, '0');
}

// ─── ÉCRAN FACTURE ───
function openFacture() {
  document.getElementById('facture-screen').classList.add('open');
  renderFactureScreen(_factureFromDevis ? 'form' : 'list');
}
function closeFacture() {
  document.getElementById('facture-screen').classList.remove('open');
  _factureFromDevis = null;
}

function renderFactureScreen(view) {
  _factureView = view || _factureView;
  var body = document.getElementById('facture-body');
  if (_factureView === 'form') renderFactureForm(body);
  else                         renderFactureList(body);
}

function renderFactureList(body) {
  var list   = getAllFactures();
  var sorted = list.slice().reverse();
  var statuts = {
    'Devis': 'statut-devis', 'Accepté': 'statut-accepte',
    'Intervention réalisée': 'statut-realise',
    'Facturé': 'statut-facture', 'Payé': 'statut-paye', 'Annulé': 'statut-annule'
  };

  body.innerHTML = `
    <button onclick="_factureEdit=null;_factureFromDevis=null;renderFactureScreen('form')" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#1B4332,#2D6A4F);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px">
      ➕ Nouvelle facture
    </button>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px;font-weight:600">${list.length} facture${list.length>1?'s':''} enregistrée${list.length>1?'s':''}</div>
    ${sorted.length === 0 ? '<div style="text-align:center;padding:40px;color:#6B7280">Aucune facture créée</div>' : ''}
    ${sorted.map((f, i) => {
      var realIdx = list.length - 1 - i;
      var cls = statuts[f.statut] || 'statut-devis';
      return `
        <div class="devis-card" onclick="_factureEdit=${realIdx};_factureFromDevis=null;renderFactureScreen('form')">
          <div class="devis-card-accent" style="background:#1B4332"></div>
          <div style="padding-left:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <div class="devis-card-title">${f.numero_facture}</div>
              <span class="statut-badge ${cls}">${f.statut||'Facturé'}</span>
            </div>
            <div class="devis-card-sub">👤 ${f.client_prenom||''} ${f.client_nom||''}</div>
            <div class="devis-card-sub">📍 ${f.bien_adresse||''}</div>
            ${f.numero ? '<div class="devis-card-sub" style="color:#9ca3af">Réf. devis : ' + f.numero + '</div>' : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
              <div style="font-size:11px;color:#9ca3af">${f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : ''}</div>
              <div style="font-size:16px;font-weight:800;color:#1B4332">${f.total_ht ? parseFloat(f.total_ht).toFixed(2) + ' € HT' : ''}</div>
            </div>
          </div>
        </div>`;
    }).join('')}`;
}

function renderFactureForm(body) {
  var src    = _factureFromDevis || (_factureEdit !== null ? getAllFactures()[_factureEdit] : {});
  var p      = getCompanyProfile();
  var today  = new Date().toISOString().split('T')[0];
  var statuts = ['Facturé','Payé','Annulé'];
  var diags   = src.diagnostics || [];

  body.innerHTML = `
    <button onclick="renderFactureScreen('list');_factureFromDevis=null;" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#1B4332;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>

    ${_factureFromDevis ? '<div style="background:#D1FAE5;border:1px solid #6EE7B7;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#065F46;font-weight:600">✅ Conversion depuis le devis N° ' + (_factureFromDevis.numero||'') + '</div>' : ''}

    <div class="devis-section">
      <div class="devis-section-title" style="color:#1B4332">📋 Informations facture</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="devis-field">
          <label class="devis-label">N° Facture</label>
          <input class="devis-input" id="fc-numero_facture" type="text" value="${src.numero_facture || genFactureNumero()}" readonly style="background:#F5F6FA;color:#6B7280"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Date facture</label>
          <input class="devis-input" id="fc-date_facture" type="date" value="${src.date_facture || today}"/>
        </div>
        <div class="devis-field">
          <label class="devis-label">Statut</label>
          <select class="devis-select" id="fc-statut">
            ${statuts.map(s => `<option ${(src.statut||'Facturé')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="devis-field">
          <label class="devis-label">Date intervention</label>
          <input class="devis-input" id="fc-date_mission" type="date" value="${src.date_mission || src.date || today}"/>
        </div>
        ${src.numero ? '<div class="devis-field" style="grid-column:1/-1"><label class="devis-label">Réf. devis</label><input class="devis-input" value="'+src.numero+'" readonly style="background:#F5F6FA;color:#6B7280"/></div>' : ''}
      </div>
    </div>

    <div class="devis-section">
      <div class="devis-section-title" style="color:#1B4332">👤 Client</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="devis-field"><label class="devis-label">Nom</label><input class="devis-input" id="fc-client_nom" type="text" value="${src.client_nom||''}"/></div>
        <div class="devis-field"><label class="devis-label">Prénom</label><input class="devis-input" id="fc-client_prenom" type="text" value="${src.client_prenom||''}"/></div>
        <div class="devis-field"><label class="devis-label">Téléphone</label><input class="devis-input" id="fc-client_tel" type="tel" value="${src.client_tel||''}"/></div>
        <div class="devis-field"><label class="devis-label">Email</label><input class="devis-input" id="fc-client_email" type="email" value="${src.client_email||''}"/></div>
        <div class="devis-field" style="grid-column:1/-1"><label class="devis-label">Adresse du bien</label><input class="devis-input" id="fc-bien_adresse" type="text" value="${src.bien_adresse||''}"/></div>
        <div class="devis-field"><label class="devis-label">Type de bien</label>
          <select class="devis-select" id="fc-bien_type">
            ${['Maison','Appartement','Local commercial','Immeuble'].map(t => `<option ${(src.bien_type||'Maison')===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="devis-field"><label class="devis-label">Statut fiscal</label>
          <select class="devis-select" id="fc-statut_fiscal">
            <option ${(src.statut_fiscal||p.statut_fiscal||'HT')==='HT'?'selected':''} value="HT">HT</option>
            <option ${(src.statut_fiscal||p.statut_fiscal||'HT')==='TTC'?'selected':''} value="TTC">TTC</option>
          </select>
        </div>
      </div>
    </div>

    <div class="devis-section">
      <div class="devis-section-title" style="color:#1B4332">🔬 Prestations réalisées</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="fc-diags-grid">
        ${DEVIS_DIAGNOSTICS_LIST.map(d => {
          var isSel = diags.includes(d);
          var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
          return `<div class="diag-item ${isSel?'selected':''}" onclick="toggleFactureDiag(this,'${d}')" style="${isSel?'border-color:#1B4332;background:#1B433212':''}">
            <input type="checkbox" ${isSel?'checked':''} readonly style="accent-color:#1B4332"/>
            <span style="font-size:13px">${d}</span>
            <span style="font-size:11px;color:#1B4332;font-weight:700;margin-left:auto">${tarifs[d]||0}€</span>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:14px;padding:14px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px;font-weight:700;color:#065F46">Total HT</span>
        <span id="fc-total-display" style="font-size:18px;font-weight:800;color:#1B4332">${parseFloat(src.total_ht||0).toFixed(2)} €</span>
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #BBF7D0">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#6B7280;white-space:nowrap;font-weight:600">Prix forfaitaire</span>
          <input id="fc-prix_final" type="number" min="0" step="1"
            value="${src.prix_final && src.prix_final > 0 ? parseFloat(src.prix_final) : ''}"
            placeholder="Vide = calcul auto"
            style="flex:1;padding:5px 7px;border-radius:6px;border:1.5px solid #BBF7D0;font-size:13px;font-family:inherit;outline:none;color:#1B4332;font-weight:700"/>
          <span style="font-size:12px;color:#6B7280">€ HT</span>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:3px">Si renseigné, remplace le total dans le PDF et l'e-mail</div>
      </div>
    </div>

    <button class="facture-btn-primary" onclick="saveFactureForm()">💾 Enregistrer la facture</button>
    <button onclick="var f=(_factureEdit!==null?getAllFactures()[_factureEdit]:null);if(f)genererPDFFacture(f)" style="width:100%;padding:12px;border-radius:10px;border:2px solid #1B4332;background:#fff;color:#1B4332;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_factureEdit===null?'disabled style="opacity:.4"':''}>📄 Générer PDF facture</button>
    <button onclick="var f=(_factureEdit!==null?getAllFactures()[_factureEdit]:null);if(f)envoyerMailFacture(f)" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:#fff;color:#0891B2;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px" ${_factureEdit===null?'disabled style="opacity:.4"':''}>✉️ Envoyer par mail</button>
    ${(function(){ var pp=getCompanyProfile(); return pp.lien_paiement ? '<button onclick="window.open(\''+pp.lien_paiement+'\',\'_blank\')" style="width:100%;padding:12px;border-radius:10px;border:2px solid #0891B2;background:linear-gradient(135deg,#0891B2,#0E7490);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">💳 Lien de paiement en ligne</button>' : ''; })()}
    ${_factureEdit !== null ? '<button onclick="supprimerFacture()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #EF4444;background:#fff;color:#EF4444;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🗑️ Supprimer cette facture</button>' : ''}`;

  updateFactureTotal();
}

function toggleFactureDiag(el, diag) {
  el.classList.toggle('selected');
  var isSel = el.classList.contains('selected');
  el.querySelector('input').checked = isSel;
  el.style.borderColor = isSel ? '#1B4332' : '';
  el.style.background  = isSel ? '#1B433212' : '';
  updateFactureTotal();
}

function updateFactureTotal() {
  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var sel    = Array.from(document.querySelectorAll('#fc-diags-grid .diag-item.selected')).map(function(el) {
    return el.querySelector('span').textContent;
  });
  var total = sel.reduce(function(s, d) { return s + (parseFloat(tarifs[d]) || 0); }, 0);
  var disp  = document.getElementById('fc-total-display');
  if (disp) disp.textContent = total.toFixed(2) + ' €';
}

function getFactureFormData() {
  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var sel    = Array.from(document.querySelectorAll('#fc-diags-grid .diag-item.selected')).map(function(el) {
    return el.querySelector('span').textContent;
  });
  var totalHt = sel.reduce(function(s, d) { return s + (parseFloat(tarifs[d]) || 0); }, 0);
  var p       = getCompanyProfile();
  var src     = _factureFromDevis || {};
  return {
    numero_facture: document.getElementById('fc-numero_facture')?.value || '',
    numero:         src.numero || '',
    date_facture:   document.getElementById('fc-date_facture')?.value   || '',
    date_mission:   document.getElementById('fc-date_mission')?.value   || '',
    statut:         document.getElementById('fc-statut')?.value         || 'Facturé',
    client_nom:     document.getElementById('fc-client_nom')?.value     || '',
    client_prenom:  document.getElementById('fc-client_prenom')?.value  || '',
    client_tel:     document.getElementById('fc-client_tel')?.value     || '',
    client_email:   document.getElementById('fc-client_email')?.value   || '',
    bien_adresse:   document.getElementById('fc-bien_adresse')?.value   || '',
    bien_type:      document.getElementById('fc-bien_type')?.value      || '',
    statut_fiscal:        document.getElementById('fc-statut_fiscal')?.value || p.statut_fiscal || 'HT',
    // Champs propagés depuis le devis source
    periode_construction: src.periode_construction || '',
    nb_pieces:            src.nb_pieces            || '',
    dependances:          src.dependances           || [],
    dep_custom:           src.dep_custom            || '',
    taux_tva:             p.taux_tva || 20,
    diagnostics:          sel,
    total_ht:             totalHt,
    total_ttc:            totalHt * (1 + (p.taux_tva || 20) / 100),
    prix_final:           parseFloat(document.getElementById('fc-prix_final')?.value) || 0,
    savedAt:              new Date().toISOString(),
  };
}

function saveFactureForm() {
  var data = getFactureFormData();
  var list = getAllFactures();
  if (_factureEdit !== null) list[_factureEdit] = data;
  else { list.push(data); _factureEdit = list.length - 1; }
  saveAllFactures(list);
  _factureFromDevis = null;
  var btn = document.querySelector('.facture-btn-primary');
  if (btn) { btn.textContent = '✅ Enregistrée !'; btn.style.background = '#22C55E'; }
  setTimeout(function() { renderFactureScreen('form'); }, 1200);
}

function supprimerFacture() {
  if (!confirm('Supprimer cette facture ?')) return;
  var list = getAllFactures();
  list.splice(_factureEdit, 1);
  saveAllFactures(list);
  _factureEdit = null;
  renderFactureScreen('list');
}
