// ─────────────────────────────────────────────
// AGENT.JS — Module Agent Commercial
// Coup 2 Pouce — DELY DIAG
//
// Clés localStorage utilisées (isolées, propres à l'agent) :
//   dd_agent_role      → 'agent' si ce compte est un agent
//   dd_agent_profiles  → tableau des profils diagnostiqueurs importés
//   dd_agent_active    → diag_uid du diagnostiqueur actuellement sélectionné
//   dd_agent_devis     → tableau de tous les devis créés par cet agent
//
// AUCUNE interférence avec les clés des diagnostiqueurs.
// ─────────────────────────────────────────────

// ─── Helpers données agent ───────────────────

function isAgentAccount() {
  return localStorage.getItem('dd_agent_role') === 'agent';
}

function getAgentProfiles() {
  try { return JSON.parse(localStorage.getItem('dd_agent_profiles') || '[]'); }
  catch(e) { return []; }
}

function saveAgentProfiles(profiles) {
  localStorage.setItem('dd_agent_profiles', JSON.stringify(profiles));
}

function getAgentActiveUid() {
  return localStorage.getItem('dd_agent_active') || '';
}

function getAgentActiveProfil() {
  var uid      = getAgentActiveUid();
  var profiles = getAgentProfiles();
  if (!uid && profiles.length > 0) uid = profiles[0].diag_uid;
  return profiles.find(function(p) { return p.diag_uid === uid; }) || null;
}

function getAgentDevis() {
  try { return JSON.parse(localStorage.getItem('dd_agent_devis') || '[]'); }
  catch(e) { return []; }
}

function saveAgentDevis(list) {
  localStorage.setItem('dd_agent_devis', JSON.stringify(list));
}

// ─── Import d'un profil diagnostiqueur (.c2p) ─

function agentImporterProfil(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);

      // Validation du format
      if (!data || data.type !== 'coup2pouce_agent_profile') {
        alert('Fichier invalide. Ce fichier n\'est pas un profil agent Coup 2 Pouce (.c2p).');
        return;
      }
      if (!data.profil || !data.diag_uid) {
        alert('Fichier incomplet. Demande au diagnostiqueur de ré-exporter son profil.');
        return;
      }

      var profiles = getAgentProfiles();
      var existing = profiles.findIndex(function(p) { return p.diag_uid === data.diag_uid; });

      var entry = {
        diag_uid:    data.diag_uid,
        profil:      data.profil,
        tarifs:      data.tarifs || {},
        imported_at: new Date().toISOString(),
        nom_affiche: data.profil.nom_societe || data.profil.nom_responsable || 'Diagnostiqueur'
      };

      if (existing >= 0) {
        // Mise à jour d'un profil existant
        profiles[existing] = entry;
        alert('✅ Profil de ' + entry.nom_affiche + ' mis à jour !');
      } else {
        profiles.push(entry);
        alert('✅ Profil de ' + entry.nom_affiche + ' ajouté !');
      }

      saveAgentProfiles(profiles);

      // Activer ce profil si c'est le premier importé
      if (!getAgentActiveUid() || profiles.length === 1) {
        localStorage.setItem('dd_agent_active', data.diag_uid);
      }

      // Marquer ce compte comme agent
      localStorage.setItem('dd_agent_role', 'agent');

      renderAgentScreen();

    } catch(err) {
      alert('Erreur lors de la lecture du fichier : ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ─── Supprimer un profil diagnostiqueur ──────

function agentSupprimerProfil(diagUid) {
  var profiles = getAgentProfiles();
  var entry    = profiles.find(function(p) { return p.diag_uid === diagUid; });
  if (!entry) return;
  if (!confirm('Supprimer le profil de ' + entry.nom_affiche + ' ? Ses devis resteront dans la liste.')) return;
  profiles = profiles.filter(function(p) { return p.diag_uid !== diagUid; });
  saveAgentProfiles(profiles);
  if (getAgentActiveUid() === diagUid) {
    localStorage.setItem('dd_agent_active', profiles.length > 0 ? profiles[0].diag_uid : '');
  }
  renderAgentScreen();
}

// ─── Sélectionner le diagnostiqueur actif ────

function agentSwitchDiag(diagUid) {
  localStorage.setItem('dd_agent_active', diagUid);
  renderAgentScreen();
}

// ─── Ouvrir / Fermer / Rendre l'écran agent ──

function openAgentScreen() {
  document.getElementById('agent-screen').style.display = 'flex';
  renderAgentScreen();
}

function closeAgentScreen() {
  document.getElementById('agent-screen').style.display = 'none';
}

function renderAgentScreen() {
  var body     = document.getElementById('agent-body');
  if (!body) return;
  var profiles = getAgentProfiles();
  var activeUid = getAgentActiveUid();
  var activeProfil = getAgentActiveProfil();
  var allDevis = getAgentDevis();

  // ─── Pas de profil importé → écran d'accueil vide
  if (profiles.length === 0) {
    body.innerHTML = _agentHtmlEmpty();
    return;
  }

  // ─── Calcul statistiques pour le tableau de bord
  var now     = new Date();
  var moisCur = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var devisActif = allDevis.filter(function(d) { return d.diag_uid === activeUid; });
  var caMois = devisActif.filter(function(d) {
    return (d.date || '').startsWith(moisCur) && d.statut_signature === 'accepte';
  }).reduce(function(s, d) { return s + parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0); }, 0);
  var caTotal = devisActif.filter(function(d) {
    return d.statut_signature === 'accepte';
  }).reduce(function(s, d) { return s + parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0); }, 0);
  var nbEnvoyes = devisActif.filter(function(d) { return d.envoye; }).length;
  var nbSignes  = devisActif.filter(function(d) { return d.statut_signature === 'accepte'; }).length;
  var commission = caTotal * 0.15;

  body.innerHTML = `
    <!-- ── Sélecteur diagnostiqueur ── -->
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">Je travaille pour</div>
      ${profiles.map(function(p) {
        var isActive = p.diag_uid === activeUid;
        return '<div onclick="agentSwitchDiag(\'' + p.diag_uid + '\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:2px solid ' + (isActive ? '#6366F1' : '#E2E5F0') + ';background:' + (isActive ? '#EEF2FF' : '#FAFAFA') + ';margin-bottom:8px;cursor:pointer">'
          + (p.profil.logo ? '<img src="' + p.profil.logo + '" style="width:36px;height:36px;object-fit:contain;border-radius:6px;background:#fff;border:1px solid #E2E5F0"/>' : '<div style="width:36px;height:36px;border-radius:6px;background:#6366F1;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px">' + (p.nom_affiche[0]||'?') + '</div>')
          + '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:#1B4332">' + p.nom_affiche + '</div>'
          + '<div style="font-size:11px;color:#6B7280">' + (p.profil.email || '') + '</div></div>'
          + (isActive ? '<span style="font-size:18px">✓</span>' : '')
          + '</div>';
      }).join('')}
      <label style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;border:2px dashed #6366F1;color:#6366F1;font-size:13px;font-weight:600;cursor:pointer;background:#EEF2FF">
        ➕ Ajouter un diagnostiqueur
        <input type="file" accept=".c2p,application/json" style="display:none" onchange="agentImporterProfil(event)"/>
      </label>
    </div>

    ${activeProfil ? `
    <!-- ── Dashboard CA ── -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:22px;font-weight:800;color:#6366F1">${caMois.toFixed(0)} €</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600;margin-top:2px">CA ce mois</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:22px;font-weight:800;color:#059669">${commission.toFixed(0)} €</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600;margin-top:2px">Ma commission (15%)</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:22px;font-weight:800;color:#0891B2">${nbEnvoyes}</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600;margin-top:2px">Devis envoyés</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:22px;font-weight:800;color:#22C55E">${nbSignes}</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600;margin-top:2px">Devis signés</div>
      </div>
    </div>

    <!-- ── Boutons d'action ── -->
    <button onclick="openAgentDevisForm()" style="width:100%;padding:16px;border-radius:12px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px">
      📝 Créer un devis pour ${activeProfil.nom_affiche}
    </button>
    <button onclick="renderAgentDevisList()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #6366F1;background:#fff;color:#6366F1;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">
      📋 Voir mes devis (${devisActif.length})
    </button>
    <button onclick="openAgentFactures()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #059669;background:#fff;color:#059669;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px">
      🧾 Mes factures de commission
    </button>

    <!-- ── Profil actif résumé ── -->
    <div style="background:#F8F9FB;border-radius:12px;padding:12px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:.5px;margin-bottom:8px">PROFIL ACTIF</div>
      <div style="font-size:13px;font-weight:700;color:#1B4332;margin-bottom:2px">${activeProfil.profil.nom_societe || ''}</div>
      <div style="font-size:12px;color:#6B7280">${activeProfil.profil.adresse || ''}</div>
      <div style="font-size:12px;color:#6B7280">${activeProfil.profil.telephone || ''} — ${activeProfil.profil.email || ''}</div>
      ${activeProfil.profil.siret ? '<div style="font-size:11px;color:#9CA3AF;margin-top:4px">SIRET : ' + activeProfil.profil.siret + '</div>' : ''}
      <button onclick="agentSupprimerProfil('${activeUid}')" style="margin-top:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #EF4444;background:#fff;color:#EF4444;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">
        🗑️ Supprimer ce profil
      </button>
    </div>
    ` : ''}
  `;
}

// ─── Écran vide (aucun profil importé) ───────

function _agentHtmlEmpty() {
  return `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:16px">🤝</div>
      <div style="font-size:18px;font-weight:800;color:#1B4332;margin-bottom:8px">Bienvenue Agent Commercial</div>
      <p style="font-size:13px;color:#6B7280;line-height:1.7;margin-bottom:24px">
        Pour commencer, importe le fichier profil (.c2p)<br>
        fourni par le diagnostiqueur pour lequel tu travailles.
      </p>
      <label style="display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">
        📥 Importer un profil (.c2p)
        <input type="file" accept=".c2p,application/json" style="display:none" onchange="agentImporterProfil(event)"/>
      </label>
      <p style="font-size:11px;color:#9CA3AF;margin-top:16px">
        Demande à ton diagnostiqueur d'aller dans<br>
        son Profil → "Exporter mon profil pour l'agent"
      </p>
    </div>
  `;
}

// ─── Liste des devis de l'agent ──────────────

function renderAgentDevisList() {
  var body     = document.getElementById('agent-body');
  if (!body) return;
  var activeUid = getAgentActiveUid();
  var allDevis  = getAgentDevis();
  var list      = allDevis.filter(function(d) { return d.diag_uid === activeUid; })
                          .sort(function(a,b) { return (b.date||'').localeCompare(a.date||''); });

  body.innerHTML = `
    <button onclick="renderAgentScreen()" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>
    <div style="font-size:15px;font-weight:800;color:#1B4332;margin-bottom:14px">📋 Mes devis</div>
    ${list.length === 0 ? '<div style="text-align:center;padding:40px;color:#9CA3AF;font-size:14px">Aucun devis créé pour le moment</div>' : ''}
    ${list.map(function(d) {
      var signe   = d.statut_signature === 'accepte';
      var montant = parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0);
      var cls     = signe ? '#059669' : (d.envoye ? '#0891B2' : '#9CA3AF');
      var lbl     = signe ? '✅ Signé' : (d.envoye ? '📤 Envoyé' : '📝 Brouillon');
      return '<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
        + '<div><div style="font-size:13px;font-weight:800;color:#1B4332">' + (d.client_nom||'') + ' ' + (d.client_prenom||'') + '</div>'
        + '<div style="font-size:11px;color:#6B7280">' + (d.bien_adresse||'') + '</div>'
        + '<div style="font-size:11px;color:#9CA3AF">' + (d.numero||'') + ' — ' + (d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '') + '</div></div>'
        + '<span style="font-size:11px;font-weight:700;color:' + cls + ';white-space:nowrap;padding:4px 8px;border-radius:20px;background:' + cls + '18">' + lbl + '</span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">'
        + '<span style="font-size:16px;font-weight:800;color:#6366F1">' + montant.toFixed(2) + ' € HT</span>'
        + '<div style="display:flex;gap:6px">'
        + (signe ? '<button onclick="agentTransfererMission(\'' + d.id + '\')" style="padding:6px 10px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">📨 Transférer</button>' : '')
        + (!d.envoye ? '<button onclick="agentEnvoyerDevis(\'' + d.id + '\')" style="padding:6px 10px;border-radius:8px;border:2px solid #6366F1;background:#fff;color:#6366F1;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✉️ Envoyer</button>' : '')
        + '<button onclick="agentVerifierSignature(\'' + d.id + '\')" style="padding:6px 10px;border-radius:8px;border:2px solid #6B7280;background:#fff;color:#6B7280;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">🔄</button>'
        + '</div></div>'
        + '</div>';
    }).join('')}
  `;
}

// ─── Vérifier signature d'un devis agent ─────

function agentVerifierSignature(devisId) {
  var allDevis = getAgentDevis();
  var idx      = allDevis.findIndex(function(d) { return d.id === devisId; });
  if (idx < 0) return;
  var d = allDevis[idx];
  if (!d.signature_token) {
    alert('Ce devis n\'a pas encore été envoyé pour signature.');
    return;
  }
  // Réutilise le même endpoint que pour les devis diagnostiqueur
  var _FS_PROJECT = 'coup2pouce-by-delydiag';
  var _FS_API_KEY = 'AIzaSy' + 'ATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
  var url = 'https://firestore.googleapis.com/v1/projects/' + _FS_PROJECT + '/databases/(default)/documents/signatures/' + d.signature_token + '?key=' + _FS_API_KEY;

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(doc) {
      if (doc && doc.fields && doc.fields.accepte && doc.fields.accepte.booleanValue === true) {
        allDevis[idx].statut_signature = 'accepte';
        allDevis[idx].signature_img    = doc.fields.signature_img ? doc.fields.signature_img.stringValue : '';
        allDevis[idx].signature_date   = doc.fields.date ? doc.fields.date.stringValue : '';
        saveAgentDevis(allDevis);
        alert('✅ Devis signé par ' + (d.client_nom||'le client') + ' !');
        renderAgentDevisList();
      } else {
        alert('⏳ Le client n\'a pas encore signé ce devis.');
      }
    })
    .catch(function() { alert('Erreur de connexion. Réessaie.'); });
}

// ─── Transférer devis signé au diagnostiqueur ─

function agentTransfererMission(devisId) {
  var allDevis = getAgentDevis();
  var d        = allDevis.find(function(x) { return x.id === devisId; });
  if (!d) return;
  var profil   = getAgentActiveProfil();
  if (!profil) return;

  if (!profil.profil.email) {
    alert('Le profil du diagnostiqueur ne contient pas d\'email. Impossible d\'envoyer.');
    return;
  }

  // Préparer le deep link "Intégrer la mission"
  var missionData = {
    client_nom:           d.client_nom          || '',
    client_prenom:        d.client_prenom       || '',
    client_tel:           d.client_tel          || '',
    client_email:         d.client_email        || '',
    bien_adresse:         d.bien_adresse        || '',
    typeBien:             d.typeBien            || '',
    periode_construction: d.periode_construction|| '',
    nb_pieces:            d.nb_pieces           || '',
    surface:              d.surface             || '',
    annee:                d.annee               || '',
    type_transaction:     d.type_transaction    || '',
    diags:                d.diagnostics         || [],
    total:                d.prix_final > 0 ? d.prix_final : (d.total_ht || 0),
    devis_ref:            d.numero              || '',
    source:               'agent',
    agent_email:          localStorage.getItem('fb_uid') || ''
  };
  var encoded  = btoa(unescape(encodeURIComponent(JSON.stringify(missionData))));
  var appUrl   = window.location.origin + window.location.pathname;
  var deepLink = appUrl + '?import_mission=' + encoded;

  var montant  = parseFloat(d.prix_final > 0 ? d.prix_final : d.total_ht || 0);
  var diagsList = (d.diagnostics || []).join(', ');
  var agentNom = localStorage.getItem('dd_prenom') || 'Votre agent commercial';

  var htmlEmail = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:linear-gradient(135deg,#6366F1,#4F46E5);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;font-size:22px;margin:0">📅 Nouveau RDV à planifier</h1>
      </div>
      <div style="padding:24px">
        <p style="font-size:14px;color:#374151">Bonjour,</p>
        <p style="font-size:14px;color:#374151">
          <strong>${agentNom}</strong> vous transfère un devis signé.
          Un client souhaite bénéficier de vos services.
        </p>
        <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:10px;padding:16px;margin:16px 0">
          <div style="font-size:13px;margin-bottom:6px"><strong>Client :</strong> ${d.client_prenom||''} ${d.client_nom||''}</div>
          <div style="font-size:13px;margin-bottom:6px"><strong>Téléphone :</strong> ${d.client_tel||'—'}</div>
          <div style="font-size:13px;margin-bottom:6px"><strong>Email :</strong> ${d.client_email||'—'}</div>
          <div style="font-size:13px;margin-bottom:6px"><strong>Adresse du bien :</strong> ${d.bien_adresse||'—'}</div>
          <div style="font-size:13px;margin-bottom:6px"><strong>Diagnostics :</strong> ${diagsList}</div>
          <div style="font-size:15px;font-weight:700;color:#059669;margin-top:10px">Montant devis : ${montant.toFixed(2)} € HT</div>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${deepLink}"
             style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700">
            📅 Intégrer la mission
          </a>
        </div>
        <p style="font-size:12px;color:#9CA3AF;text-align:center">
          Ce bouton ouvre votre application Coup 2 Pouce avec toutes les informations pré-remplies.<br>
          Il ne vous restera qu'à saisir la date et l'heure du rendez-vous.
        </p>
        <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:16px">
          Référence devis : ${d.numero||'—'} | Signé le ${d.signature_date ? new Date(d.signature_date).toLocaleDateString('fr-FR') : '—'}
        </p>
      </div>
    </div>`;

  var payload = {
    to:        profil.profil.email,
    subject:   '📅 Nouveau RDV à planifier — ' + (d.client_prenom||'') + ' ' + (d.client_nom||'') + ' — ' + (d.bien_adresse||''),
    html:      htmlEmail,
    fromName:  agentNom,
    fromEmail: 'noreply@coup2pouce-pro.fr',
    replyTo:   localStorage.getItem('fb_email') || ''
  };

  fetch('/.netlify/functions/send-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (res.id || res.success) {
      alert('✅ Mission transférée à ' + profil.nom_affiche + ' !\nIl va recevoir un email avec le bouton "Intégrer la mission".');
    } else {
      alert('Erreur d\'envoi : ' + (res.error || JSON.stringify(res)));
    }
  })
  .catch(function() { alert('Erreur réseau. Réessaie.'); });
}

// ─── Placeholder — Factures commissions ───────
// Sera remplacé par agent-factures.js (Task #17)
function openAgentFactures() {
  var body = document.getElementById('agent-body');
  if (!body) return;
  body.innerHTML = `
    <button onclick="renderAgentScreen()"
      style="background:none;border:none;color:#6366F1;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:16px">🧾</div>
      <div style="font-size:16px;font-weight:800;color:#1B4332;margin-bottom:8px">Factures de commission</div>
      <p style="font-size:13px;color:#6B7280;line-height:1.7">
        Ce module est en cours de développement.<br>
        Il te permettra de générer tes factures de commission (15%)<br>
        pour chaque devis validé.
      </p>
    </div>
  `;
}
