// ─────────────────────────────────────────────
// CLIENTS.JS — Module CRM clients
// Identifiant unique : Nom + Téléphone
// ─────────────────────────────────────────────

function openClients() {
  document.getElementById('clients-screen').style.display = 'block';
  renderClients();
}

function closeClients() {
  document.getElementById('clients-screen').style.display = 'none';
}

// ─── Construire la base clients depuis toutes les données ───
function buildClientsDB() {
  var db = {}; // clé = "NOM|TEL"

  function normalise(s) { return (s||'').trim().toUpperCase(); }
  function key(nom, prenom, tel) {
    var n = normalise(nom) + ' ' + normalise(prenom);
    return n.trim() + '|' + normalise(tel);
  }
  function upsert(nom, prenom, tel, email, adresse, montant, date, type, ref) {
    if (!nom && !tel) return;
    var k = key(nom, prenom, tel);
    if (!db[k]) {
      db[k] = { nom: nom||'', prenom: prenom||'', tel: tel||'', email: email||'',
                missions: [], devis: [], factures: [], ca: 0, depts: {} };
    }
    var c = db[k];
    if (email && !c.email) c.email = email;
    if (adresse) {
      var dept = adresse.match(/\b(\d{2})\d{3}\b/);
      if (dept) c.depts[dept[1]] = (c.depts[dept[1]] || 0) + 1;
    }
    c.ca += parseFloat(montant) || 0;
    if (type === 'mission') c.missions.push({ date: date, ref: ref, adresse: adresse });
    if (type === 'devis')   c.devis.push({ date: date, ref: ref, adresse: adresse });
    if (type === 'facture') c.factures.push({ date: date, ref: ref, adresse: adresse });
  }

  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));

  // Missions
  (missions || []).forEach(function(m) {
    var montant = m.total && parseFloat(m.total) > 0 ? parseFloat(m.total) :
      (m.diags||[]).reduce(function(s,d){return s+(parseFloat(tarifs[d])||0);},0);
    upsert(m.nom||m.client_nom, m.prenom||m.client_prenom, m.tel||m.client_tel,
           m.email||m.client_email, m.adresse||m.bien_adresse, montant, m.date, 'mission', m.id||m.date);
  });

  // Devis
  var allDevis = typeof getAllDevis === 'function' ? getAllDevis() : [];
  allDevis.forEach(function(d) {
    var montant = d.prix_final && d.prix_final > 0 ? d.prix_final : (d.total_ht||0);
    upsert(d.client_nom, d.client_prenom, d.client_tel, d.client_email,
           d.bien_adresse, montant, d.date, 'devis', d.numero);
  });

  // Factures
  var allFact = typeof getAllFactures === 'function' ? getAllFactures() : [];
  allFact.forEach(function(f) {
    var montant = f.prix_final && f.prix_final > 0 ? f.prix_final : (f.total_ht||0);
    upsert(f.client_nom, f.client_prenom, f.client_tel, f.client_email,
           f.bien_adresse, montant, f.date_facture||f.date, 'facture', f.numero_facture);
  });

  return Object.values(db).sort(function(a,b) { return b.ca - a.ca; });
}

// ─── Autocomplétion dans les formulaires ───
function clientsAutocomplete(nomInput, telInput, prenomInput, emailInput) {
  var val = (nomInput.value || '').trim().toUpperCase();
  var existing = document.getElementById('clients-autocomplete-list');
  if (existing) existing.remove();
  if (val.length < 2) return;

  var db = buildClientsDB();
  var matches = db.filter(function(c) {
    return c.nom.toUpperCase().includes(val) || c.prenom.toUpperCase().includes(val);
  }).slice(0, 5);

  if (!matches.length) return;

  var list = document.createElement('div');
  list.id = 'clients-autocomplete-list';
  list.style.cssText = 'position:absolute;z-index:9999;background:#fff;border:1.5px solid #E2E5F0;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);max-width:320px;width:100%';
  matches.forEach(function(c) {
    var item = document.createElement('div');
    item.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #F5F5F5';
    item.innerHTML = '<strong>' + c.nom + ' ' + c.prenom + '</strong>'
      + (c.tel ? '<span style="color:#6B7280"> — ' + c.tel + '</span>' : '')
      + '<div style="font-size:11px;color:#9ca3af">' + c.missions.length + ' mission(s) — CA : ' + c.ca.toFixed(0) + ' €</div>';
    item.onmousedown = function(e) {
      e.preventDefault();
      if (nomInput)    nomInput.value    = c.nom;
      if (prenomInput) prenomInput.value = c.prenom;
      if (telInput)    telInput.value    = c.tel;
      if (emailInput)  emailInput.value  = c.email;
      list.remove();
    };
    list.appendChild(item);
  });

  nomInput.parentNode.style.position = 'relative';
  nomInput.parentNode.appendChild(list);
  nomInput.addEventListener('blur', function() { setTimeout(function(){ var l=document.getElementById('clients-autocomplete-list'); if(l)l.remove(); }, 200); }, { once: true });
}

// ─── Rendu de l'écran clients ───
var _clientsFilter = '';
var _clientsSort   = 'ca';

function renderClients() {
  var body = document.getElementById('clients-body');
  var db   = buildClientsDB();

  if (_clientsFilter) {
    var f = _clientsFilter.toUpperCase();
    db = db.filter(function(c) {
      return (c.nom+' '+c.prenom).toUpperCase().includes(f)
          || c.tel.includes(f)
          || Object.keys(c.depts).some(function(d){return d.includes(f);});
    });
  }

  if (_clientsSort === 'ca')       db.sort(function(a,b){return b.ca-a.ca;});
  else if (_clientsSort === 'nb')  db.sort(function(a,b){return b.missions.length-a.missions.length;});
  else if (_clientsSort === 'nom') db.sort(function(a,b){return a.nom.localeCompare(b.nom);});

  var topDept = (function() {
    var depts = {};
    db.forEach(function(c) { Object.keys(c.depts).forEach(function(d){ depts[d]=(depts[d]||0)+c.depts[d]; }); });
    return Object.entries(depts).sort(function(a,b){return b[1]-a[1];}).slice(0,3).map(function(e){return e[0];}).join(', ');
  })();

  body.innerHTML = `
    <!-- Résumé -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:22px;font-weight:800;color:#2D6A4F">${db.length}</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600">Clients</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:16px;font-weight:800;color:#1B4332">${db.reduce(function(s,c){return s+c.ca;},0).toFixed(0)} €</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600">CA total</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:14px;font-weight:800;color:#6366F1">${topDept||'—'}</div>
        <div style="font-size:10px;color:#6B7280;font-weight:600">Top depts</div>
      </div>
    </div>

    <!-- Recherche + tri -->
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input type="text" placeholder="🔍 Rechercher..." value="${_clientsFilter}"
        oninput="_clientsFilter=this.value;renderClients()"
        style="flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none"/>
      <select onchange="_clientsSort=this.value;renderClients()"
        style="padding:8px 10px;border-radius:10px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none;background:#fff">
        <option value="ca"  ${_clientsSort==='ca' ?'selected':''}>CA ↓</option>
        <option value="nb"  ${_clientsSort==='nb' ?'selected':''}>Missions ↓</option>
        <option value="nom" ${_clientsSort==='nom'?'selected':''}>Nom A→Z</option>
      </select>
    </div>

    <!-- Liste clients -->
    ${db.length === 0 ? '<div style="text-align:center;padding:40px;color:#9ca3af;font-size:14px">Aucun client trouvé</div>' : ''}
    ${db.map(function(c) {
      var depts = Object.keys(c.depts).sort(function(a,b){return c.depts[b]-c.depts[a];}).join(', ') || '—';
      var lastDate = (c.missions.concat(c.devis).concat(c.factures))
        .map(function(x){return x.date;}).filter(Boolean).sort().reverse()[0];
      return '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
        + '<div><div style="font-size:14px;font-weight:800;color:#1B4332">' + c.nom + ' ' + c.prenom + '</div>'
        + (c.tel ? '<div style="font-size:12px;color:#6B7280">📞 ' + c.tel + '</div>' : '')
        + (c.email ? '<div style="font-size:11px;color:#9ca3af">✉️ ' + c.email + '</div>' : '')
        + '</div>'
        + '<div style="text-align:right"><div style="font-size:18px;font-weight:800;color:#2D6A4F">' + c.ca.toFixed(0) + ' €</div>'
        + '<div style="font-size:10px;color:#9ca3af">CA total</div></div>'
        + '</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
        + '<span style="padding:3px 8px;border-radius:20px;background:#EDE9FE;color:#5B21B6;font-size:11px;font-weight:600">' + c.missions.length + ' mission(s)</span>'
        + '<span style="padding:3px 8px;border-radius:20px;background:#D1FAE5;color:#065F46;font-size:11px;font-weight:600">' + c.devis.length + ' devis</span>'
        + '<span style="padding:3px 8px;border-radius:20px;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:600">Dept ' + depts + '</span>'
        + (lastDate ? '<span style="padding:3px 8px;border-radius:20px;background:#F3F4F6;color:#6B7280;font-size:11px">Dernière : ' + new Date(lastDate).toLocaleDateString('fr-FR') + '</span>' : '')
        + '</div>'
        + '</div>';
    }).join('')}`;
}
