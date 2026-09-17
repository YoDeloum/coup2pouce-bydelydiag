// ─────────────────────────────────────────────
// AGENT-FACTURES.JS — Factures de commission (15%)
// Coup 2 Pouce — DELY DIAG
//
// L'agent génère une facture de commission par diagnostiqueur
// pour chaque devis signé. Montant = 15% HT du devis.
//
// Clés localStorage :
//   dd_agent_own_profil     → profil de l'agent elle-même (nom, SIRET, IBAN…)
//   dd_agent_comm_factures  → liste de toutes ses factures de commission
// ─────────────────────────────────────────────

// ─── Storage ─────────────────────────────────

function getAgentOwnProfil() {
  try { return JSON.parse(localStorage.getItem('dd_agent_own_profil') || '{}'); }
  catch(e) { return {}; }
}
function saveAgentOwnProfil(data) {
  localStorage.setItem('dd_agent_own_profil', JSON.stringify(data));
}

function getAgentCommFactures() {
  try { return JSON.parse(localStorage.getItem('dd_agent_comm_factures') || '[]'); }
  catch(e) { return []; }
}
function saveAgentCommFactures(list) {
  localStorage.setItem('dd_agent_comm_factures', JSON.stringify(list));
}

function genAgentFactureNumero() {
  var year = new Date().getFullYear();
  var all  = getAgentCommFactures();
  var seq  = all.filter(function(f) {
    return f.numero && f.numero.startsWith('COM-' + year + '-');
  }).length + 1;
  return 'COM-' + year + '-' + String(seq).padStart(3, '0');
}

// ─── Point d'entrée principal ─────────────────
// Remplace le placeholder défini dans agent.js
function openAgentFactures() {
  var body = document.getElementById('agent-body');
  if (!body) return;
  var agentProfil = getAgentOwnProfil();

  // Si l'agent n'a pas encore renseigné son profil → formulaire de config
  if (!agentProfil.nom) {
    body.innerHTML = _agentOwnProfilFormHtml({});
    return;
  }
  renderAgentFacturesScreen();
}

// ─── Formulaire profil de l'agent ────────────
function _agentOwnProfilFormHtml(data) {
  return `
    <button onclick="renderAgentScreen()"
      style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>

    <div style="background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:#C2410C;margin-bottom:4px">📋 Ton profil (1 seule fois)</div>
      <div style="font-size:12px;color:#92400E;line-height:1.6">
        Ces informations apparaîtront sur tes factures de commission.<br>
        Tu es l'<strong>émetteur</strong>, le diagnostiqueur est le <strong>client</strong>.
      </div>
    </div>

    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#059669;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">👤 Ton identité</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1/-1">
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Ton nom / Nom commercial *</label>
          <input id="aop-nom" type="text" value="${data.nom||''}" placeholder="Ex : Marie Dupont Agent Commercial"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Téléphone</label>
          <input id="aop-telephone" type="tel" value="${data.telephone||''}" placeholder="06 00 00 00 00"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Email</label>
          <input id="aop-email" type="email" value="${data.email||localStorage.getItem('fb_email')||''}" placeholder="ton@email.fr"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div style="grid-column:1/-1">
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Adresse</label>
          <input id="aop-adresse" type="text" value="${data.adresse||''}" placeholder="12 rue de la Paix, 75001 Paris"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">SIRET</label>
          <input id="aop-siret" type="text" value="${data.siret||''}" placeholder="123 456 789 00012"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">TVA</label>
          <select id="aop-tva" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#fff">
            <option value="non" ${(data.tva||'non')==='non'?'selected':''}>Non assujetti (HT)</option>
            <option value="oui" ${data.tva==='oui'?'selected':''}>Assujetti TVA 20%</option>
          </select>
        </div>
      </div>
    </div>

    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="font-size:12px;font-weight:800;color:#059669;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">🏦 Coordonnées bancaires</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1/-1">
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">IBAN</label>
          <input id="aop-iban" type="text" value="${data.iban||''}" placeholder="FR76 3000 4000 0100 0000 0000 000"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">BIC</label>
          <input id="aop-bic" type="text" value="${data.bic||''}" placeholder="BNPAFRPP"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;display:block;margin-bottom:4px">Banque</label>
          <input id="aop-banque" type="text" value="${data.banque||''}" placeholder="BNP Paribas"
            style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box"/>
        </div>
      </div>
    </div>

    <button onclick="saveAgentOwnProfilForm()"
      style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#059669,#10B981);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit">
      💾 Enregistrer mon profil
    </button>
  `;
}

function saveAgentOwnProfilForm() {
  var nom = (document.getElementById('aop-nom') || {}).value || '';
  if (!nom.trim()) { alert('Ton nom est obligatoire.'); return; }
  var data = {
    nom:       nom.trim(),
    telephone: (document.getElementById('aop-telephone') || {}).value || '',
    email:     (document.getElementById('aop-email')     || {}).value || '',
    adresse:   (document.getElementById('aop-adresse')   || {}).value || '',
    siret:     (document.getElementById('aop-siret')     || {}).value || '',
    tva:       (document.getElementById('aop-tva')       || {}).value || 'non',
    iban:      (document.getElementById('aop-iban')      || {}).value || '',
    bic:       (document.getElementById('aop-bic')       || {}).value || '',
    banque:    (document.getElementById('aop-banque')    || {}).value || ''
  };
  saveAgentOwnProfil(data);
  renderAgentFacturesScreen();
}

// ─── Écran principal des factures commission ──
function renderAgentFacturesScreen() {
  var body      = document.getElementById('agent-body');
  if (!body) return;
  var profiles  = getAgentProfiles();
  var allFact   = getAgentCommFactures();
  var allDevis  = getAgentDevis();
  var agentP    = getAgentOwnProfil();

  body.innerHTML = `
    <button onclick="renderAgentScreen()"
      style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:15px;font-weight:800;color:#1B4332">🧾 Commissions (15%)</div>
      <button onclick="openAgentFactures_editProfil()"
        style="padding:6px 12px;border-radius:8px;border:1.5px solid #059669;background:#fff;color:#059669;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
        ✏️ Mon profil
      </button>
    </div>

    <!-- Profil résumé -->
    <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#065F46">
      <strong>${agentP.nom||''}</strong>${agentP.siret?' — SIRET : '+agentP.siret:''}
      ${agentP.iban ? '<br>IBAN : ' + agentP.iban : ''}
    </div>

    <!-- Une section par diagnostiqueur -->
    ${profiles.length === 0
      ? '<div style="text-align:center;padding:30px;color:#9CA3AF">Aucun diagnostiqueur importé.</div>'
      : profiles.map(function(profil) {
          var diagUid     = profil.diag_uid;
          var diagNom     = profil.nom_affiche || profil.profil.nom_societe || '?';
          var devisSignes = allDevis.filter(function(d) {
            return d.diag_uid === diagUid && d.statut_signature === 'accepte';
          });
          var devisFactures = allFact
            .filter(function(f) { return f.diag_uid === diagUid; })
            .reduce(function(acc, f) { return acc.concat(f.devis_ids || []); }, []);
          var devisNonFactures = devisSignes.filter(function(d) {
            return !devisFactures.includes(d.id);
          });
          var totalNonFacture = devisNonFactures.reduce(function(s, d) {
            return s + parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0);
          }, 0);
          var commissionDue = totalNonFacture * 0.15;
          var facturesDiag  = allFact.filter(function(f) { return f.diag_uid === diagUid; })
                                     .sort(function(a,b) { return (b.date||'').localeCompare(a.date||''); });

          return '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
            + '<div style="font-size:14px;font-weight:800;color:#1B4332;margin-bottom:4px">' + diagNom + '</div>'
            + '<div style="font-size:11px;color:#6B7280;margin-bottom:10px">'
            + devisSignes.length + ' devis signés — '
            + devisNonFactures.length + ' non encore facturés</div>'

            // Décompte à facturer
            + (devisNonFactures.length > 0
              ? '<div style="background:#EEF2FF;border-radius:10px;padding:12px;margin-bottom:10px">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
                + '<span style="font-size:12px;color:#4338CA;font-weight:700">À facturer</span>'
                + '<span style="font-size:11px;color:#6366F1">' + devisNonFactures.length + ' devis</span>'
                + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
                + '<span style="font-size:12px;color:#6B7280">Total devis HT</span>'
                + '<span style="font-size:13px;font-weight:700;color:#1B4332">' + totalNonFacture.toFixed(2) + ' €</span>'
                + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
                + '<span style="font-size:13px;font-weight:800;color:#6366F1">Commission 15%</span>'
                + '<span style="font-size:18px;font-weight:800;color:#6366F1">' + commissionDue.toFixed(2) + ' €</span>'
                + '</div>'
                + '<button onclick="creerFactureCommission(\'' + diagUid + '\')"'
                + ' style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">'
                + '🧾 Générer la facture de commission'
                + '</button>'
                + '</div>'
              : '<div style="padding:10px;text-align:center;font-size:12px;color:#9CA3AF;margin-bottom:10px">✅ Tous les devis sont facturés</div>')

            // Liste des factures existantes
            + (facturesDiag.length > 0
              ? '<div style="font-size:11px;font-weight:700;color:#9CA3AF;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Factures émises</div>'
                + facturesDiag.map(function(f) {
                    var isPaye = f.statut === 'payee';
                    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid #F3F4F6">'
                      + '<div style="flex:1">'
                      + '<div style="font-size:12px;font-weight:700;color:#1B4332">' + f.numero + '</div>'
                      + '<div style="font-size:11px;color:#9CA3AF">' + new Date(f.date).toLocaleDateString('fr-FR') + ' — ' + (f.devis_ids||[]).length + ' devis</div>'
                      + '</div>'
                      + '<span style="font-size:13px;font-weight:800;color:#6366F1">' + parseFloat(f.commission_ht||0).toFixed(2) + ' €</span>'
                      + '<span style="font-size:10px;font-weight:700;padding:3px 7px;border-radius:20px;background:' + (isPaye?'#D1FAE5':'#EEF2FF') + ';color:' + (isPaye?'#065F46':'#4338CA') + '">'
                      + (isPaye ? '✅ Payée' : '⏳ En attente') + '</span>'
                      + '<button onclick="telechargerPDFCommission(\'' + f.id + '\')" title="Télécharger PDF"'
                      + ' style="padding:5px 8px;border-radius:7px;border:1.5px solid #E2E5F0;background:#fff;font-size:13px;cursor:pointer">📄</button>'
                      + '<button onclick="envoyerMailCommission(\'' + f.id + '\')" title="Envoyer par mail"'
                      + ' style="padding:5px 8px;border-radius:7px;border:1.5px solid #E2E5F0;background:#fff;font-size:13px;cursor:pointer">✉️</button>'
                      + (!isPaye ? '<button onclick="marquerCommissionPayee(\'' + f.id + '\')" title="Marquer payée"'
                        + ' style="padding:5px 8px;border-radius:7px;border:1.5px solid #A7F3D0;background:#F0FDF4;font-size:13px;cursor:pointer">💶</button>' : '')
                      + '</div>';
                  }).join('')
              : '')
            + '</div>';
        }).join('')
    }
  `;
}

// ─── Éditer son propre profil ────────────────
function openAgentFactures_editProfil() {
  var body = document.getElementById('agent-body');
  if (!body) return;
  body.innerHTML = _agentOwnProfilFormHtml(getAgentOwnProfil());
}

// ─── Créer une facture de commission ─────────
function creerFactureCommission(diagUid) {
  var allDevis  = getAgentDevis();
  var allFact   = getAgentCommFactures();
  var profil    = getAgentProfiles().find(function(p) { return p.diag_uid === diagUid; });
  if (!profil) { alert('Profil diagnostiqueur introuvable.'); return; }

  // Devis déjà facturés
  var dejaFactures = allFact
    .filter(function(f) { return f.diag_uid === diagUid; })
    .reduce(function(acc, f) { return acc.concat(f.devis_ids || []); }, []);

  // Devis signés non encore facturés
  var devisNF = allDevis.filter(function(d) {
    return d.diag_uid === diagUid
      && d.statut_signature === 'accepte'
      && !dejaFactures.includes(d.id);
  });

  if (devisNF.length === 0) {
    alert('Aucun devis signé à facturer pour ce diagnostiqueur.');
    return;
  }

  var totalDevis    = devisNF.reduce(function(s, d) {
    return s + parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0);
  }, 0);
  var commissionHT  = totalDevis * 0.15;
  var agentP        = getAgentOwnProfil();
  var assujetti     = agentP.tva === 'oui';
  var commissionTTC = assujetti ? commissionHT * 1.20 : commissionHT;

  var nouvFact = {
    id:             'comf-' + Date.now(),
    numero:         genAgentFactureNumero(),
    diag_uid:       diagUid,
    date:           new Date().toISOString(),
    devis_ids:      devisNF.map(function(d) { return d.id; }),
    devis_details:  devisNF.map(function(d) {
      return {
        numero:  d.numero,
        client:  (d.client_prenom || '') + ' ' + (d.client_nom || ''),
        adresse: d.bien_adresse || '',
        montant: parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0)
      };
    }),
    total_devis_ht: totalDevis,
    taux_commission: 15,
    commission_ht:  commissionHT,
    tva:            assujetti ? 20 : 0,
    commission_ttc: commissionTTC,
    statut:         'emise',
    date_paiement:  null
  };

  allFact.push(nouvFact);
  saveAgentCommFactures(allFact);

  alert('✅ Facture ' + nouvFact.numero + ' créée !\n'
    + devisNF.length + ' devis — Commission : ' + commissionHT.toFixed(2) + ' € HT');

  renderAgentFacturesScreen();
}

// ─── Marquer une facture comme payée ─────────
function marquerCommissionPayee(factureId) {
  var all = getAgentCommFactures();
  var idx = all.findIndex(function(f) { return f.id === factureId; });
  if (idx < 0) return;
  if (!confirm('Marquer cette facture comme payée ?')) return;
  all[idx].statut        = 'payee';
  all[idx].date_paiement = new Date().toISOString();
  saveAgentCommFactures(all);
  renderAgentFacturesScreen();
}

// ─── Générer le PDF de commission ────────────
function _genPDFCommission(facture, returnBlob) {
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé.'); return null; }

  var agentP  = getAgentOwnProfil();
  var profil  = getAgentProfiles().find(function(p) { return p.diag_uid === facture.diag_uid; });
  var diagP   = profil ? (profil.profil || {}) : {};
  var assujetti = agentP.tva === 'oui';

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── En-tête violet agent ─────────────────────
  pdfRect(doc, 0, 0, 210, 42, [99, 102, 241]);
  pdfText(doc, agentP.nom || 'Agent Commercial', 15, 16, {bold:true, size:14, color:[255,255,255]});
  pdfText(doc, (agentP.adresse||'') + (agentP.siret ? '   SIRET : ' + agentP.siret : ''), 15, 24, {size:8, color:[199,210,254]});
  pdfText(doc, (agentP.telephone||'') + (agentP.email ? '   ' + agentP.email : ''), 15, 30, {size:8, color:[199,210,254]});
  if (!agentP.tva || agentP.tva === 'non') {
    pdfText(doc, 'TVA non applicable — art. 293 B du CGI', 15, 36, {size:7, color:[199,210,254]});
  }
  pdfText(doc, 'FACTURE', 195, 16, {bold:true, size:20, color:[255,255,255], align:'right'});
  pdfText(doc, 'N° ' + facture.numero, 195, 26, {bold:true, size:10, color:[199,210,254], align:'right'});
  pdfText(doc, new Date(facture.date).toLocaleDateString('fr-FR'), 195, 33, {size:9, color:[199,210,254], align:'right'});

  // ── Facturé à ────────────────────────────────
  var y = 52;
  pdfRect(doc, 120, y, 75, 38, [245,247,250]);
  pdfText(doc, 'FACTURÉ À', 122, y + 6, {bold:true, size:9, color:[107,114,128]});
  pdfText(doc, diagP.nom_societe || profil.nom_affiche || '', 122, y + 13, {bold:true, size:11, color:[30,30,30]});
  if (diagP.adresse) pdfText(doc, diagP.adresse, 122, y + 20, {size:8, color:[80,80,80]});
  if (diagP.telephone) pdfText(doc, 'Tél : ' + diagP.telephone, 122, y + 27, {size:8, color:[80,80,80]});
  if (diagP.email) pdfText(doc, diagP.email, 122, y + 33, {size:8, color:[80,80,80]});

  pdfText(doc, 'Objet :', 15, y + 6, {bold:true, size:9, color:[99,102,241]});
  pdfText(doc, 'Commission commerciale — 15% des devis signés', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Période : ' + new Date(facture.date).toLocaleDateString('fr-FR', {month:'long', year:'numeric'}), 15, y + 20, {size:9, color:[80,80,80]});

  // ── Tableau des devis ─────────────────────────
  y += 48;
  pdfRect(doc, 15, y, 180, 8, [99,102,241]);
  pdfText(doc, 'Réf. Devis',  17, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'Client',       55, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'Adresse',      100, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'Montant HT', 188, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  var details = facture.devis_details || [];
  details.forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 7, [248,249,251]);
    pdfText(doc, d.numero || '', 17, y + 4, {size:8, color:[30,30,30]});
    pdfText(doc, (d.client || '').substring(0, 22), 55, y + 4, {size:8, color:[30,30,30]});
    pdfText(doc, (d.adresse || '').substring(0, 28), 100, y + 4, {size:8, color:[80,80,80]});
    pdfText(doc, parseFloat(d.montant || 0).toFixed(2) + ' €', 188, y + 4, {size:9, color:[30,30,30], align:'right'});
    y += 8;
    if (y > 260) { doc.addPage(); y = 20; }
  });

  // ── Totaux ───────────────────────────────────
  y += 6;
  doc.setDrawColor(200, 200, 200); doc.line(120, y, 195, y);
  y += 6;
  pdfText(doc, 'Total HT des devis', 120, y, {size:9, color:[80,80,80]});
  pdfText(doc, parseFloat(facture.total_devis_ht||0).toFixed(2) + ' €', 193, y, {size:9, color:[30,30,30], align:'right'});
  y += 8;
  pdfRect(doc, 120, y - 2, 75, 10, [99,102,241]);
  pdfText(doc, 'Commission 15% HT', 122, y + 5, {bold:true, size:10, color:[255,255,255]});
  pdfText(doc, parseFloat(facture.commission_ht||0).toFixed(2) + ' €', 193, y + 5, {bold:true, size:12, color:[255,255,255], align:'right'});
  y += 14;

  if (assujetti) {
    pdfText(doc, 'TVA 20%', 120, y, {size:9, color:[80,80,80]});
    pdfText(doc, (parseFloat(facture.commission_ht||0) * 0.20).toFixed(2) + ' €', 193, y, {size:9, color:[30,30,30], align:'right'});
    y += 8;
    pdfRect(doc, 120, y - 2, 75, 10, [30,30,30]);
    pdfText(doc, 'TOTAL TTC', 122, y + 5, {bold:true, size:10, color:[255,255,255]});
    pdfText(doc, parseFloat(facture.commission_ttc||0).toFixed(2) + ' €', 193, y + 5, {bold:true, size:12, color:[199,210,254], align:'right'});
    y += 14;
  }

  // ── Mention TVA non assujetti ─────────────────
  if (!assujetti) {
    y += 4;
    pdfText(doc, 'TVA non applicable, art. 293 B du CGI', 15, y, {size:8, color:[150,150,150]});
    y += 6;
  }

  // ── RIB ──────────────────────────────────────
  if (agentP.iban) {
    y += 6;
    pdfRect(doc, 15, y, 100, 22, [248,249,251]);
    pdfText(doc, 'Règlement par virement bancaire', 17, y + 6, {bold:true, size:9, color:[99,102,241]});
    pdfText(doc, 'IBAN : ' + agentP.iban, 17, y + 13, {size:8, color:[30,30,30]});
    if (agentP.bic) pdfText(doc, 'BIC : ' + agentP.bic + (agentP.banque ? '  —  ' + agentP.banque : ''), 17, y + 19, {size:8, color:[80,80,80]});
  }

  // ── Pied de page ─────────────────────────────
  pdfText(doc, agentP.nom + (agentP.siret ? '  —  SIRET : ' + agentP.siret : ''), 105, 287, {size:8, color:[180,180,180], align:'center'});

  var filename = 'Commission_' + facture.numero + '_' + (diagP.nom_societe || '').replace(/\s/g,'_') + '.pdf';
  if (returnBlob) return { blob: doc.output('blob'), filename: filename };
  doc.save(filename);
  return null;
}

// ─── Télécharger le PDF ───────────────────────
function telechargerPDFCommission(factureId) {
  var all    = getAgentCommFactures();
  var facture = all.find(function(f) { return f.id === factureId; });
  if (!facture) { alert('Facture introuvable.'); return; }
  _genPDFCommission(facture, false);
}

// ─── Envoyer la facture par mail ─────────────
function envoyerMailCommission(factureId) {
  var all    = getAgentCommFactures();
  var facture = all.find(function(f) { return f.id === factureId; });
  if (!facture) { alert('Facture introuvable.'); return; }

  var profil  = getAgentProfiles().find(function(p) { return p.diag_uid === facture.diag_uid; });
  if (!profil || !profil.profil.email) {
    alert('Email du diagnostiqueur introuvable dans son profil.');
    return;
  }

  var agentP  = getAgentOwnProfil();
  var diagP   = profil.profil || {};
  var btn     = document.querySelector('[onclick*="envoyerMailCommission(\'' + factureId + '\')"]');
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  // Générer le PDF (sans logo pour alléger)
  var pdfResult = _genPDFCommission(facture, true);
  if (!pdfResult || !pdfResult.blob) {
    if (btn) { btn.textContent = '✉️'; btn.disabled = false; }
    alert('Erreur lors de la génération du PDF.');
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var b64    = e.target.result.split(',')[1];
    var montant = parseFloat(facture.commission_ht || 0).toFixed(2);
    var subject = 'Facture de commission N° ' + facture.numero + ' — ' + (agentP.nom || 'Agent Commercial');
    var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">'
      + '<div style="background:linear-gradient(135deg,#6366F1,#4F46E5);padding:24px 32px;border-radius:12px 12px 0 0">'
      + '<h1 style="color:#fff;margin:0;font-size:20px">' + (agentP.nom || 'Agent Commercial') + '</h1>'
      + (agentP.email ? '<p style="color:#C7D2FE;margin:4px 0;font-size:13px">' + agentP.email + '</p>' : '')
      + '</div>'
      + '<div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<p style="font-size:15px;color:#111827">Bonjour ' + (diagP.nom_responsable || diagP.nom_societe || '') + ',</p>'
      + '<p style="color:#374151">Veuillez trouver ci-joint ma facture de commission pour les devis signés '
      + 'ce mois-ci au nom de <strong>' + (diagP.nom_societe || '') + '</strong>.</p>'
      + '<div style="background:#fff;border:2px solid #E5E7EB;border-radius:10px;padding:16px 20px;margin:20px 0">'
      + '<p style="margin:0 0 6px;font-size:13px;color:#6B7280">N° Facture</p>'
      + '<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#4F46E5">' + facture.numero + '</p>'
      + '<p style="margin:0 0 4px;font-size:13px;color:#6B7280">Commission HT (15%)</p>'
      + '<p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#4F46E5">' + montant + ' €</p>'
      + '<p style="margin:0;font-size:12px;color:#9CA3AF">'
      + (facture.devis_ids||[]).length + ' devis inclus</p>'
      + '</div>'
      + (agentP.iban ? '<p style="font-size:13px;color:#374151"><strong>IBAN :</strong> ' + agentP.iban + '</p>' : '')
      + (!agentP.tva || agentP.tva === 'non'
        ? '<p style="font-size:11px;color:#9CA3AF">TVA non applicable, art. 293 B du CGI</p>'
        : '')
      + '<p style="color:#374151;margin-top:20px">Cordialement,<br><strong>' + (agentP.nom || '') + '</strong></p>'
      + '</div>'
      + '<div style="padding:10px 32px;font-size:11px;color:#9ca3af;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;background:#fff">'
      + (agentP.nom || '') + (agentP.siret ? '  —  SIRET : ' + agentP.siret : '')
      + '</div>'
      + '</div>';

    fetch('/.netlify/functions/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:          diagP.email,
        subject:     subject,
        html:        html,
        attachments: [{ filename: pdfResult.filename, content: b64 }],
        fromName:    agentP.nom || 'Agent Commercial',
        fromEmail:   'noreply@coup2pouce-pro.fr',
        replyTo:     agentP.email || '',
        cc:          agentP.email || ''
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) { btn.textContent = '✉️'; btn.disabled = false; }
      if (data.success || data.id) {
        alert('✅ Facture envoyée à ' + diagP.email + ' !');
      } else {
        alert('⚠️ Erreur : ' + (data.error || JSON.stringify(data)));
      }
    })
    .catch(function(err) {
      if (btn) { btn.textContent = '✉️'; btn.disabled = false; }
      alert('❌ Erreur réseau : ' + err.message);
    });
  };
  reader.readAsDataURL(pdfResult.blob);
}
