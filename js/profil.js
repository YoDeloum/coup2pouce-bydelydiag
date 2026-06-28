// ─────────────────────────────────────────────
// PROFIL.JS — Profil société / licencié
// ─────────────────────────────────────────────

function openProfil() {
  document.getElementById('profil-screen').classList.add('open');
  renderProfilScreen();
}

function closeProfil() {
  document.getElementById('profil-screen').classList.remove('open');
}

function renderProfilScreen() {
  var p    = getCompanyProfile();
  var body = document.getElementById('profil-body');

  body.innerHTML = `
    <!-- Identité -->
    <div class="profil-section">
      <div class="profil-section-title">🏢 Société</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="profil-field" style="grid-column:1/-1">
          <label class="profil-label">Nom de la société</label>
          <input class="profil-input" id="p-nom_societe" type="text" value="${p.nom_societe||''}" placeholder="DELY DIAG SARL"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">Nom du responsable</label>
          <input class="profil-input" id="p-nom_responsable" type="text" value="${p.nom_responsable||''}" placeholder="Jean Dupont"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">Forme juridique</label>
          <select class="profil-select" id="p-forme_juridique">
            ${['Auto-entrepreneur','SARL','SAS','SASU','EI','EIRL','SA'].map(f =>
              `<option ${p.forme_juridique===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="profil-field">
        <label class="profil-label">Logo de la société</label>
        <img id="profil-logo-preview" class="profil-logo-preview" src="${p.logo||''}" style="${p.logo?'display:block':'display:none'}"/>
        <input type="file" accept="image/*" onchange="loadProfilLogo(this)" style="font-size:13px"/>
        ${p.logo ? '<button onclick="removeLogo()" style="margin-top:6px;padding:6px 12px;border-radius:7px;border:1px solid #EF4444;background:#fff;color:#EF4444;font-size:12px;font-weight:600;cursor:pointer">🗑️ Supprimer le logo</button>' : ''}
      </div>
    </div>

    <!-- Coordonnées -->
    <div class="profil-section">
      <div class="profil-section-title">📍 Coordonnées</div>
      <div class="profil-field">
        <label class="profil-label">Adresse</label>
        <input class="profil-input" id="p-adresse" type="text" value="${p.adresse||''}" placeholder="12 rue des Acacias"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
        <div class="profil-field">
          <label class="profil-label">Code postal</label>
          <input class="profil-input" id="p-code_postal" type="text" value="${p.code_postal||''}" placeholder="75001"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">Ville</label>
          <input class="profil-input" id="p-ville" type="text" value="${p.ville||''}" placeholder="Paris"/>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="profil-field">
          <label class="profil-label">Téléphone</label>
          <input class="profil-input" id="p-telephone" type="tel" value="${p.telephone||''}" placeholder="06 00 00 00 00"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">Email</label>
          <input class="profil-input" id="p-email" type="email" value="${p.email||''}" placeholder="contact@delydiag.fr"/>
        </div>
      </div>
      <div class="profil-field">
        <label class="profil-label">Site web</label>
        <input class="profil-input" id="p-site_web" type="url" value="${p.site_web||''}" placeholder="https://delydiag.fr"/>
      </div>
    </div>

    <!-- Juridique -->
    <div class="profil-section">
      <div class="profil-section-title">⚖️ Juridique & Certification</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="profil-field">
          <label class="profil-label">SIRET</label>
          <input class="profil-input" id="p-siret" type="text" value="${p.siret||''}" placeholder="12345678900012"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">N° TVA intracommunautaire</label>
          <input class="profil-input" id="p-tva_intrac" type="text" value="${p.tva_intrac||''}" placeholder="FR12345678900"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">N° assurance RC Pro</label>
          <input class="profil-input" id="p-num_assurance" type="text" value="${p.num_assurance||''}" placeholder="Numéro de police"/>
        </div>
        <div class="profil-field">
          <label class="profil-label">Organisme certificateur</label>
          <input class="profil-input" id="p-organisme_certif" type="text" value="${p.organisme_certif||''}" placeholder="Certicer, Qualibat..."/>
        </div>
        <div class="profil-field" style="grid-column:1/-1">
          <label class="profil-label">Numéro de certification</label>
          <input class="profil-input" id="p-num_certif" type="text" value="${p.num_certif||''}" placeholder="DPE-XXXX-XXXX"/>
        </div>
      </div>
    </div>

    <!-- Facturation -->
    <div class="profil-section">
      <div class="profil-section-title">💶 Facturation</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="profil-field">
          <label class="profil-label">Statut fiscal</label>
          <select class="profil-select" id="p-statut_fiscal">
            <option ${p.statut_fiscal==='HT'?'selected':''} value="HT">Hors Taxe (HT)</option>
            <option ${p.statut_fiscal==='TTC'?'selected':''} value="TTC">Toutes Taxes Comprises (TTC)</option>
          </select>
        </div>
        <div class="profil-field">
          <label class="profil-label">Taux TVA (%)</label>
          <input class="profil-input" id="p-taux_tva" type="number" value="${p.taux_tva||20}" min="0" max="100" step="0.1"/>
        </div>
      </div>
      <div class="profil-field">
        <label class="profil-label">Conditions de paiement</label>
        <input class="profil-input" id="p-conditions_paiement" type="text" value="${p.conditions_paiement||''}" placeholder="Paiement à réception de facture"/>
      </div>
      <div class="profil-field">
        <label class="profil-label">💳 Lien de paiement en ligne</label>
        <input class="profil-input" id="p-lien_paiement" type="url" value="${p.lien_paiement||''}" placeholder="https://buy.stripe.com/..."/>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Colle ton lien Stripe, SumUp, PayPal ou Revolut — il apparaîtra dans les devis et factures.</p>
      </div>
      <div class="profil-field">
        <label class="profil-label">🎨 Modèle de PDF (devis &amp; facture)</label>
        <select class="profil-select" id="p-pdf_template" style="width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;outline:none;background:#fff">
          <option value="standard" ${(p.pdf_template||'standard')==='standard'?'selected':''}>Standard — en-tête vert avec logo et bandeau couleur</option>
          <option value="epure"    ${(p.pdf_template||'standard')==='epure'   ?'selected':''}>Épuré — fond blanc, typographie minimaliste</option>
        </select>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Choix appliqué à tous les PDF générés depuis l'application.</p>
      </div>
      <div class="profil-field">
        <label class="profil-label">Mentions légales</label>
        <textarea class="profil-textarea" id="p-mentions_legales" placeholder="Mentions légales...">${p.mentions_legales||''}</textarea>
      </div>
    </div>

    <!-- Coordonnées bancaires -->
    <div class="profil-section">
      <div class="profil-section-title">🏦 Coordonnées bancaires (optionnel)</div>
      <div class="profil-field">
        <label class="profil-label">Banque</label>
        <input class="profil-input" id="p-rib_banque" type="text" value="${p.rib_banque||''}" placeholder="Crédit Agricole, BNP..."/>
      </div>
      <div class="profil-field">
        <label class="profil-label">IBAN</label>
        <input class="profil-input" id="p-rib_iban" type="text" value="${p.rib_iban||''}" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"/>
      </div>
      <div class="profil-field">
        <label class="profil-label">BIC</label>
        <input class="profil-input" id="p-rib_bic" type="text" value="${p.rib_bic||''}" placeholder="AGRIFRPP"/>
      </div>
    </div>

    <!-- Documents réglementaires -->
    <div class="profil-section">
      <div class="profil-section-title">📄 Documents réglementaires</div>
      <p style="font-size:12px;color:#6B7280;margin-bottom:14px">Uploadez tes PDF une fois — ils seront stockés dans l'application et disponibles depuis chaque devis.</p>
      ${['consentement','cgv','cgi'].map(function(id) {
        var labels = { consentement:'Feuille de consentement', cgv:'Conditions Générales de Vente (CGV)', cgi:"Conditions Générales d'Intervention (CGI)" };
        var storedDocs = (function() { try { return JSON.parse(localStorage.getItem('dd_docs_reglementaires') || '{}'); } catch(e) { return {}; } })();
        var stored = storedDocs[id];
        return '<div style="padding:12px;border:1.5px solid '+(stored?'#BBF7D0':'#E2E5F0')+';border-radius:10px;margin-bottom:10px;background:'+(stored?'#F0FDF4':'#FAFAFA')+'">'
          + '<div style="font-size:13px;font-weight:700;color:#1B4332;margin-bottom:8px">'
          + (stored ? '✅ ' : '📎 ') + labels[id] + '</div>'
          + (stored ? '<div style="font-size:11px;color:#065F46;margin-bottom:8px">📄 '+stored.name+'</div>' : '')
          + '<div style="display:flex;gap:8px;align-items:center">'
          + '<label style="flex:1;padding:8px 12px;border-radius:8px;border:1.5px dashed #BBF7D0;background:#fff;font-size:12px;color:#2D6A4F;font-weight:600;cursor:pointer;text-align:center">'
          + (stored ? '🔄 Remplacer le PDF' : '⬆️ Choisir le PDF')
          + '<input type="file" accept=".pdf,application/pdf" style="display:none" onchange="uploadDocReglementaire(this,\''+id+'\')" />'
          + '</label>'
          + (stored ? '<button onclick="supprimerDocReglementaire(\''+id+'\')" style="padding:8px 12px;border-radius:8px;border:1.5px solid #FCA5A5;background:#FFF;color:#EF4444;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🗑️</button>' : '')
          + '</div>'
          + '</div>';
      }).join('')}
      <p style="font-size:11px;color:#9ca3af;margin-top:4px">⚠️ Les PDF sont stockés localement dans le navigateur. Taille max recommandée : 2 Mo par fichier.</p>
    </div>

    <!-- ── Changement d'email de connexion ── -->
    <div class="profil-section" style="border:2px solid #6366F1;background:#EEF2FF">
      <div class="profil-section-title" style="color:#3730A3">🔐 Email de connexion</div>
      <p style="font-size:12px;color:#4338CA;margin-bottom:12px">Email actuel : <strong>${localStorage.getItem('fb_email') || '—'}</strong></p>
      <input id="profil-new-email" type="email" placeholder="Nouvel email de connexion"
        style="width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #A5B4FC;font-size:14px;font-family:inherit;box-sizing:border-box;margin-bottom:8px;outline:none"/>
      <button onclick="changerEmailConnexion()" style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#818CF8);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
        Changer mon email de connexion
      </button>
      <div id="profil-email-msg" style="display:none;margin-top:8px;font-size:12px;text-align:center;font-weight:600;padding:8px;border-radius:8px"></div>
    </div>

    <!-- ── Sauvegarde / Restauration ── -->
    <div class="profil-section" style="border:2px solid #FCD34D;background:#FFFBEB">
      <div class="profil-section-title" style="color:#92400E">💾 Sauvegarde des données</div>
      <p style="font-size:12px;color:#78350F;margin-bottom:14px">Exporte toutes tes données (profil, devis, missions, factures, tarifs) dans un fichier JSON. Conserve ce fichier précieusement — il permet de tout restaurer en cas de perte.</p>
      <button onclick="exporterDonnees()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#059669,#10B981);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">
        ⬇️ Exporter mes données (JSON)
      </button>
      <label style="display:block;width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:2px solid #059669;background:#fff;color:#059669;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;margin-bottom:4px">
        ⬆️ Importer / Restaurer mes données
        <input type="file" accept=".json,application/json" style="display:none" onchange="importerDonnees(event)"/>
      </label>
      <p style="font-size:10px;color:#9ca3af;text-align:center">L'import restaure toutes les données après confirmation. Les données actuelles seront remplacées.</p>
    </div>

    <button class="profil-save-btn" onclick="saveProfilForm()">💾 Enregistrer le profil</button>
    <div id="profil-success" style="display:none;text-align:center;padding:12px;background:#D1FAE5;border-radius:10px;color:#065F46;font-weight:700;margin-bottom:16px">✅ Profil sauvegardé !</div>`;
}

function saveProfilForm() {
  var fields = ['nom_societe','nom_responsable','forme_juridique','adresse','code_postal','ville',
                'telephone','email','site_web','siret','tva_intrac','num_assurance','organisme_certif',
                'num_certif','statut_fiscal','taux_tva','conditions_paiement','lien_paiement',
                'pdf_template','mentions_legales','rib_banque','rib_iban','rib_bic'];
  var existing = getCompanyProfile();
  fields.forEach(function(f) {
    var el = document.getElementById('p-' + f);
    if (el) existing[f] = el.value;
  });
  saveCompanyProfile(existing);
  var ok = document.getElementById('profil-success');
  if (ok) { ok.style.display = 'block'; setTimeout(function() { ok.style.display = 'none'; }, 2500); }
}

function uploadDocReglementaire(input, docId) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 3 * 1024 * 1024) {
    alert('Ce fichier depasse 3 Mo. Reduis la taille du PDF avant de l importer.');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var docs = JSON.parse(localStorage.getItem('dd_docs_reglementaires') || '{}');
      docs[docId] = { name: file.name, data: e.target.result };
      localStorage.setItem('dd_docs_reglementaires', JSON.stringify(docs));
    } catch(err) {
      alert('Impossible de stocker le fichier. Essaie avec un PDF plus leger (moins de 2 Mo).');
      return;
    }
    if (typeof renderProfilScreen === 'function') renderProfilScreen();
    else if (typeof openProfil === 'function') openProfil();
  };
  reader.readAsDataURL(file);
}

function supprimerDocReglementaire(docId) {
  if (!confirm('Supprimer ce document de l application ?')) return;
  var docs = JSON.parse(localStorage.getItem('dd_docs_reglementaires') || '{}');
  delete docs[docId];
  localStorage.setItem('dd_docs_reglementaires', JSON.stringify(docs));
  if (typeof renderProfilScreen === 'function') renderProfilScreen();
  else if (typeof openProfil === 'function') openProfil();
}

function loadProfilLogo(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var p = getCompanyProfile();
    p.logo = e.target.result;
    saveCompanyProfile(p);
    var img = document.getElementById('profil-logo-preview');
    if (img) { img.src = e.target.result; img.style.display = 'block'; }
  };
  reader.readAsDataURL(input.files[0]);
}

function removeLogo() {
  var p = getCompanyProfile();
  p.logo = '';
  saveCompanyProfile(p);
  renderProfilScreen();
}

// ─────────────────────────────────────────────
// EXPORT / IMPORT JSON — Sauvegarde complète
// ─────────────────────────────────────────────

function exporterDonnees() {
  var cles = [
    'dd_company_profile',
    'dd_tarifs',
    'dd_devis_list',
    'dd_missions',
    'dd_factures_list',
    'dd_docs_reglementaires',
    'dd_avatar',
    'dd_avatar_color',
    'dd_prenom',
    'dd_avis_lien',
    'dd_avis_msg',
    'certif_planning',
    'dd_dark'
  ];
  var backup = {
    version: '1.0',
    date: new Date().toISOString(),
    application: 'Coup 2 Pouce — DELY DIAG',
    donnees: {}
  };
  cles.forEach(function(cle) {
    var val = localStorage.getItem(cle);
    if (val !== null) {
      try { backup.donnees[cle] = JSON.parse(val); }
      catch(e) { backup.donnees[cle] = val; }
    }
  });
  var json   = JSON.stringify(backup, null, 2);
  var blob   = new Blob([json], { type: 'application/json' });
  var url    = URL.createObjectURL(blob);
  var today  = new Date().toISOString().split('T')[0];
  var a      = document.createElement('a');
  a.href     = url;
  a.download = 'coup2pouce-backup-' + today + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importerDonnees(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var backup = JSON.parse(e.target.result);
      // Validation minimale
      if (!backup || !backup.donnees || typeof backup.donnees !== 'object') {
        alert('Fichier invalide. Ce fichier ne semble pas etre un fichier de sauvegarde Coup 2 Pouce.');
        return;
      }
      var msg = 'Restaurer les données depuis ce fichier ? Les données actuelles seront remplacées.';
      var confirm1 = confirm(msg);
      if (!confirm1) return;
      var keys = Object.keys(backup.donnees);
      keys.forEach(function(k) {
        if (backup.donnees[k] !== null && backup.donnees[k] !== undefined) {
          localStorage.setItem(k, backup.donnees[k]);
        }
      });
      alert('Données restaurées avec succès ! L\'application va se recharger.');
      window.location.reload();
    } catch(err) {
      alert('Erreur lors de la lecture du fichier.');
    }
  };
  reader.readAsText(file);
}

// ─── Changement email de connexion ───
function changerEmailConnexion() {
  var newEmail = (document.getElementById('profil-new-email')?.value || '').trim();
  var msgEl    = document.getElementById('profil-email-msg');
  var token    = localStorage.getItem('fb_token');

  if (!newEmail) {
    msgEl.textContent = 'Saisis un nouvel email.';
    msgEl.style.background = '#FEE2E2';
    msgEl.style.color = '#991B1B';
    msgEl.style.display = 'block';
    return;
  }
  if (!token) {
    msgEl.textContent = 'Session expirée — reconnecte-toi.';
    msgEl.style.background = '#FEE2E2';
    msgEl.style.color = '#991B1B';
    msgEl.style.display = 'block';
    return;
  }

  var apiKey = 'AIzaSyATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
  fetch('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + apiKey, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({idToken: token, email: newEmail, returnSecureToken: true})
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.idToken) {
      localStorage.setItem('fb_token', data.idToken);
      localStorage.setItem('fb_email', newEmail);
      msgEl.textContent = 'Email mis à jour : ' + newEmail;
      msgEl.style.background = '#D1FAE5';
      msgEl.style.color = '#065F46';
      msgEl.style.display = 'block';
      document.getElementById('profil-new-email').value = '';
    } else {
      var msg = 'Erreur lors du changement.';
      if (data.error) {
        var code = data.error.message || '';
        if (code === 'EMAIL_EXISTS')       msg = 'Cet email est déjà utilisé.';
        else if (code === 'INVALID_EMAIL') msg = 'Email invalide.';
        else if (code === 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN' || code === 'TOKEN_EXPIRED' || code === 'INVALID_ID_TOKEN') msg = 'Session expirée — déconnecte-toi et reconnecte-toi.';
        else msg = 'Erreur Firebase : ' + code;
      }
      msgEl.textContent = msg;
      msgEl.style.background = '#FEE2E2';
      msgEl.style.color = '#991B1B';
      msgEl.style.display = 'block';
    }
  })
  .catch(function() {
    msgEl.textContent = 'Erreur reseau.';
    msgEl.style.background = '#FEE2E2';
    msgEl.style.color = '#991B1B';
    msgEl.style.display = 'block';
  });
}
