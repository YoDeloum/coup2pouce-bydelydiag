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
    <!-- ── Identité ── -->
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

      <!-- Logo -->
      <div class="profil-field">
        <label class="profil-label">Logo de la société</label>
        <img id="profil-logo-preview" class="profil-logo-preview" src="${p.logo||''}" style="${p.logo?'display:block':'display:none'}"/>
        <input type="file" accept="image/*" onchange="loadProfilLogo(this)" style="font-size:13px"/>
        ${p.logo ? '<button onclick="removeLogo()" style="margin-top:6px;padding:6px 12px;border-radius:7px;border:1px solid #EF4444;background:#fff;color:#EF4444;font-size:12px;font-weight:600;cursor:pointer">🗑️ Supprimer le logo</button>' : ''}
      </div>
    </div>

    <!-- ── Coordonnées ── -->
    <div class="profil-section">
      <div class="profil-section-title">📍 Coordonnées</div>
      <div class="profil-field" >
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

    <!-- ── Juridique ── -->
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

    <!-- ── Facturation ── -->
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
        <input class="profil-input" id="p-lien_paiement" type="url" value="${p.lien_paiement||''}" placeholder="https://buy.stripe.com/... ou SumUp, PayPal, Revolut..."/>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Colle ton lien Stripe, SumUp, PayPal ou Revolut — il apparaîtra dans les devis et factures.</p>
      </div>
      <div class="profil-field">
        <label class="profil-label">Mentions légales</label>
        <textarea class="profil-textarea" id="p-mentions_legales" placeholder="Mentions légales...">${p.mentions_legales||''}</textarea>
      </div>
    </div>

    <!-- ── Coordonnées bancaires ── -->
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

    <button class="profil-save-btn" onclick="saveProfilForm()">💾 Enregistrer le profil</button>
    <div id="profil-success" style="display:none;text-align:center;padding:12px;background:#D1FAE5;border-radius:10px;color:#065F46;font-weight:700;margin-bottom:16px">✅ Profil sauvegardé !</div>`;
}

function saveProfilForm() {
  var fields = ['nom_societe','nom_responsable','forme_juridique','adresse','code_postal','ville',
                'telephone','email','site_web','siret','tva_intrac','num_assurance','organisme_certif',
                'num_certif','statut_fiscal','taux_tva','conditions_paiement','lien_paiement',
                'mentions_legales','rib_banque','rib_iban','rib_bic'];
  var existing = getCompanyProfile();
  fields.forEach(function(f) {
    var el = document.getElementById('p-' + f);
    if (el) existing[f] = el.value;
  });
  saveCompanyProfile(existing);
  var ok = document.getElementById('profil-success');
  if (ok) { ok.style.display = 'block'; setTimeout(function() { ok.style.display = 'none'; }, 2500); }
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
