// ─────────────────────────────────────────────
// CLIENTS.JS — Module CRM clients
// Identifiant unique : Nom + Téléphone
// ─────────────────────────────────────────────

// Callbacks de navigation retour (utilisés par devis.js et facture.js)
var _devisBackCallback   = null;
var _factureBackCallback = null;

function openClients() {
  _clientsView   = 'list';
  _currentClient = null;
  document.getElementById('clients-screen').style.display = 'block';
  renderClients();
}

function closeClients() {
  document.getElementById('clients-screen').style.display = 'none';
}

// ─── Construire la base clients depuis toutes les données ───
function buildClientsDB() {
  var db = {}; // clé = "NOM|TEL"

  function normalise(s) { return (s || '').trim().toUpperCase(); }
  function makeKey(nom, prenom, tel) {
    var n = normalise(nom) + ' ' + normalise(prenom);
    return n.trim() + '|' + normalise(tel);
  }
  function upsert(nom, prenom, tel, email, adresse, montant, date, type, ref, extra) {
    if (!nom && !tel) return;
    var k = makeKey(nom, prenom, tel);
    if (!db[k]) {
      db[k] = { nom: nom || '', prenom: prenom || '', tel: tel || '', email: email || '',
                missions: [], devis: [], factures: [], ca: 0, depts: {} };
    }
    var c = db[k];
    if (email && !c.email) c.email = email;
    if (adresse) {
      var dept = adresse.match(/\b(\d{2})\d{3}\b/);
      if (dept) c.depts[dept[1]] = (c.depts[dept[1]] || 0) + 1;
    }
    c.ca += parseFloat(montant) || 0;
    var ex = extra || {};
    if (type === 'mission') c.missions.push({ date: date, ref: ref, adresse: adresse, savedAt: ex.savedAt, montant: ex.montant });
    if (type === 'devis')   c.devis.push({   date: date, ref: ref, adresse: adresse, statut: ex.statut });
    if (type === 'facture') c.factures.push({ date: date, ref: ref, adresse: adresse, statut: ex.statut, montant: ex.montant, numero: ref });
  }

  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));

  // Missions
  (missions || []).forEach(function(m) {
    var montant = m.total && parseFloat(m.total) > 0 ? parseFloat(m.total)
      : (m.diags || []).reduce(function(s, d) { return s + (parseFloat(tarifs[d]) || 0); }, 0);
    upsert(m.nom || m.client_nom, m.prenom || m.client_prenom,
           m.tel || m.client_tel,  m.email  || m.client_email,
           m.adresse || m.bien_adresse, montant, m.date, 'mission', m.id || m.date,
           { savedAt: m.savedAt, montant: montant });
  });

  // Devis
  var allDevis = typeof getAllDevis === 'function' ? getAllDevis() : [];
  allDevis.forEach(function(d) {
    upsert(d.client_nom, d.client_prenom, d.client_tel, d.client_email,
           d.bien_adresse, 0, d.date, 'devis', d.numero, { statut: d.statut });
  });

  // Factures
  var allFact = typeof getAllFactures === 'function' ? getAllFactures() : [];
  allFact.forEach(function(f) {
    var montantFact = parseFloat(
      f.prix_final && parseFloat(f.prix_final) > 0 ? f.prix_final : (f.total_ht || 0)
    );
    upsert(f.client_nom, f.client_prenom, f.client_tel, f.client_email,
           f.bien_adresse, 0, f.date_facture || f.date, 'facture', f.numero_facture,
           { statut: f.statut, montant: montantFact });
  });

  return Object.values(db).sort(function(a, b) { return b.ca - a.ca; });
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
  nomInput.addEventListener('blur', function() {
    setTimeout(function() { var l = document.getElementById('clients-autocomplete-list'); if (l) l.remove(); }, 200);
  }, { once: true });
}

// ─── État de la vue ───
var _clientsFilter  = '';
var _clientsSort    = 'ca';
var _clientsView    = 'list'; // 'list' | 'fiche'
var _currentClient  = null;
var _clientsDB      = [];     // snapshot après filtre+tri (navigation par index)
var _clientsImpayes = false;  // filtre impayés actif

// ─── Rendu principal ───
function renderClients() {
  if (_clientsView === 'fiche' && _currentClient) {
    return _renderClientFiche();
  }
  _renderClientsList();
}

// ─── Vue liste clients ───
function _renderClientsList() {
  var body = document.getElementById('clients-body');
  var db   = buildClientsDB();

  // Filtre texte
  if (_clientsFilter) {
    var f = _clientsFilter.toUpperCase();
    db = db.filter(function(c) {
      return (c.nom + ' ' + c.prenom).toUpperCase().includes(f)
          || c.tel.includes(f)
          || Object.keys(c.depts).some(function(d) { return d.includes(f); });
    });
  }

  // Filtre impayés
  if (_clientsImpayes) {
    db = db.filter(function(c) {
      return c.factures.some(function(f) { return f.statut === 'Facturé'; });
    });
  }

  // Tri
  if (_clientsSort === 'ca')       db.sort(function(a, b) { return b.ca - a.ca; });
  else if (_clientsSort === 'nb')  db.sort(function(a, b) { return b.missions.length - a.missions.length; });
  else if (_clientsSort === 'nom') db.sort(function(a, b) { return a.nom.localeCompare(b.nom); });

  _clientsDB = db; // mémoriser pour _openClientFiche(idx)

  // Calcul nbImpayes sur la base complète (pas filtrée)
  var allDb = buildClientsDB();
  var nbImpayes = allDb.filter(function(c) {
    return c.factures.some(function(f) { return f.statut === 'Facturé'; });
  }).length;

  var COLORS = ['#E8650A','#1B4332','#6366F1','#0891B2','#D97706','#059669','#7C3AED'];

  body.innerHTML = ''

    // ── KPIs
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">'
    +   '<div style="background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">'
    +     '<div style="font-size:22px;font-weight:800;color:#2D6A4F">' + allDb.length + '</div>'
    +     '<div style="font-size:10px;color:#6B7280;font-weight:600">Clients</div>'
    +   '</div>'
    +   '<div style="background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">'
    +     '<div style="font-size:15px;font-weight:800;color:#1B4332">' + allDb.reduce(function(s, c) { return s + c.ca; }, 0).toFixed(0) + ' €</div>'
    +     '<div style="font-size:10px;color:#6B7280;font-weight:600">CA total</div>'
    +   '</div>'
    +   '<div onclick="' + (nbImpayes > 0 ? '_clientsImpayes=!_clientsImpayes;renderClients()' : '') + '" '
    +     'style="background:' + (_clientsImpayes ? '#FEE2E2' : '#fff') + ';border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);'
    +     (nbImpayes > 0 ? 'cursor:pointer;border:1.5px solid ' + (_clientsImpayes ? '#EF4444' : '#FCA5A5') + ';' : '') + '">'
    +     '<div style="font-size:22px;font-weight:800;color:' + (nbImpayes > 0 ? '#EF4444' : '#2D6A4F') + '">' + nbImpayes + '</div>'
    +     '<div style="font-size:10px;color:#6B7280;font-weight:600">' + (_clientsImpayes ? '✕ Impayés' : 'Impayé(s)') + '</div>'
    +   '</div>'
    + '</div>'

    // ── Barre filtre + tri
    + '<div style="display:flex;gap:8px;margin-bottom:12px">'
    +   '<input type="text" placeholder="🔍 Rechercher..." value="' + _clientsFilter + '"'
    +   ' oninput="_clientsFilter=this.value;renderClients()"'
    +   ' style="flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none"/>'
    +   '<select onchange="_clientsSort=this.value;renderClients()"'
    +   ' style="padding:8px 10px;border-radius:10px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;outline:none;background:#fff">'
    +   '<option value="ca"'  + (_clientsSort === 'ca'  ? ' selected' : '') + '>CA ↓</option>'
    +   '<option value="nb"'  + (_clientsSort === 'nb'  ? ' selected' : '') + '>Missions ↓</option>'
    +   '<option value="nom"' + (_clientsSort === 'nom' ? ' selected' : '') + '>Nom A→Z</option>'
    +   '</select>'
    + '</div>'

    + (_clientsImpayes ? '<div style="background:#FEE2E2;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:#991B1B;font-weight:600">⚠️ Filtre actif : clients avec factures impayées</div>' : '')

    + (db.length === 0 ? '<div style="text-align:center;padding:40px;color:#9ca3af;font-size:14px">Aucun client trouvé</div>' : '')

    + db.map(function(c, idx) {
        var hasImpaye = c.factures.some(function(f) { return f.statut === 'Facturé'; });
        var initiales = ((c.nom[0] || '') + (c.prenom[0] || '')).toUpperCase() || '?';
        var color = COLORS[(c.nom.charCodeAt(0) || 0) % COLORS.length];
        var lastDate = c.missions.concat(c.devis).concat(c.factures)
          .map(function(x) { return x.date; }).filter(Boolean).sort().reverse()[0];
        return '<div onclick="_openClientFiche(' + idx + ')" style="background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;'
          + 'box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;display:flex;align-items:center;gap:12px;'
          + 'border:1.5px solid ' + (hasImpaye ? '#FCA5A5' : 'transparent') + '">'
          +   '<div style="width:44px;height:44px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;'
          +     'font-size:15px;font-weight:700;color:#fff;flex-shrink:0">' + initiales + '</div>'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:14px;font-weight:800;color:#1B4332">' + c.nom + ' ' + c.prenom
          +       (hasImpaye ? ' <span style="font-size:11px;color:#EF4444">⚠️ impayé</span>' : '') + '</div>'
          +     (c.tel ? '<div style="font-size:12px;color:#6B7280">📞 ' + c.tel + '</div>' : '')
          +     '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">'
          +       '<span style="padding:2px 7px;border-radius:20px;background:#EDE9FE;color:#5B21B6;font-size:10px;font-weight:600">' + c.missions.length + ' mission(s)</span>'
          +       '<span style="padding:2px 7px;border-radius:20px;background:#D1FAE5;color:#065F46;font-size:10px;font-weight:600">' + c.devis.length + ' devis</span>'
          +       (lastDate ? '<span style="padding:2px 7px;border-radius:20px;background:#F3F4F6;color:#6B7280;font-size:10px">' + new Date(lastDate).toLocaleDateString('fr-FR') + '</span>' : '')
          +     '</div>'
          +   '</div>'
          +   '<div style="text-align:right;flex-shrink:0">'
          +     '<div style="font-size:18px;font-weight:800;color:#2D6A4F">' + c.ca.toFixed(0) + ' €</div>'
          +     '<div style="font-size:10px;color:#9ca3af">CA</div>'
          +     '<div style="font-size:14px;color:#6B7280;margin-top:4px">›</div>'
          +   '</div>'
          + '</div>';
      }).join('');
}

// ─── Ouvrir la fiche d'un client par son index dans _clientsDB ───
function _openClientFiche(idx) {
  if (!_clientsDB[idx]) return;
  _currentClient = _clientsDB[idx];
  _clientsView   = 'fiche';
  renderClients();
}

// ─── Vue fiche client ───
function _renderClientFiche() {
  var c    = _currentClient;
  var body = document.getElementById('clients-body');

  var COLORS    = ['#E8650A','#1B4332','#6366F1','#0891B2','#D97706','#059669','#7C3AED'];
  var color     = COLORS[(c.nom.charCodeAt(0) || 0) % COLORS.length];
  var initiales = ((c.nom[0] || '') + (c.prenom[0] || '')).toUpperCase() || '?';
  var nbImpayes = c.factures.filter(function(f) { return f.statut === 'Facturé'; }).length;

  function sortDesc(arr) {
    return arr.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // ── Section devis
  var devisHtml = '';
  if (c.devis.length > 0) {
    devisHtml = '<div style="background:#fff;border-radius:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FFFBEB;border-bottom:1.5px solid #FDE68A">'
      +   '<span>📋</span>'
      +   '<span style="font-size:13px;font-weight:700;color:#92400E">Devis</span>'
      +   '<span style="margin-left:auto;background:#E8650A;color:#fff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700">' + c.devis.length + '</span>'
      + '</div>'
      + sortDesc(c.devis).map(function(d) {
          var st = d.statut || '';
          var isPending = st !== 'Accepté' && st !== 'Signé' && st !== 'Refusé' && st !== 'Facturé' && st !== 'Payé' && st !== 'Annulé';
          var badgeStyle = (st === 'Accepté' || st === 'Signé')
            ? 'background:#D1FAE5;color:#065F46'
            : st === 'Refusé'
              ? 'background:#FEE2E2;color:#991B1B'
              : 'background:#FEF3C7;color:#92400E';
          var badgeLabel = (st === 'Accepté' || st === 'Signé') ? '✅ Signé'
            : st === 'Refusé' ? '❌ Refusé' : '⏳ En attente';
          // Devis cliquable si on a un ref valide
          var onclick = d.ref ? ' onclick="_openDevisFromClientFiche(\'' + String(d.ref).replace(/'/g, "\\'") + '\')"' : '';
          var isClickable = !!d.ref;
          return '<div' + onclick + ' style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F5F5F5;' + (isClickable ? 'cursor:pointer;' : '') + '">'
            + '<div style="font-size:11px;color:#9ca3af;width:55px;flex-shrink:0">' + fmtDate(d.date) + '</div>'
            + '<div style="flex:1;min-width:0">'
            +   '<div style="font-size:12px;font-weight:600;color:#1B4332">' + (d.ref || '—') + '</div>'
            +   '<div style="font-size:10px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (d.adresse || '') + '</div>'
            + '</div>'
            + '<span style="padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;' + badgeStyle + '">' + badgeLabel + '</span>'
            + (isClickable ? '<span style="color:#6B7280;font-size:16px;margin-left:4px">›</span>' : '')
            + '</div>';
        }).join('')
      + '</div>';
  }

  // ── Section missions
  var missionsHtml = '';
  if (c.missions.length > 0) {
    missionsHtml = '<div style="background:#fff;border-radius:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#F0FDF4;border-bottom:1.5px solid #6EE7B7">'
      +   '<span>🏠</span>'
      +   '<span style="font-size:13px;font-weight:700;color:#065F46">Missions</span>'
      +   '<span style="margin-left:auto;background:#059669;color:#fff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700">' + c.missions.length + '</span>'
      + '</div>'
      + sortDesc(c.missions).map(function(m) {
          var hasSavedAt = !!m.savedAt;
          var onclick = hasSavedAt ? ' onclick="_openMissionFromClient(\'' + String(m.savedAt).replace(/'/g, "\\'") + '\')"' : '';
          return '<div' + onclick + ' style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F5F5F5;' + (hasSavedAt ? 'cursor:pointer;' : '') + '">'
            + '<div style="font-size:11px;color:#9ca3af;width:55px;flex-shrink:0">' + fmtDate(m.date) + '</div>'
            + '<div style="flex:1;min-width:0">'
            +   '<div style="font-size:12px;font-weight:600;color:#1B4332">' + (m.adresse || m.ref || 'Mission') + '</div>'
            +   (m.montant ? '<div style="font-size:10px;color:#059669;font-weight:600">' + parseFloat(m.montant).toFixed(0) + ' €</div>' : '')
            + '</div>'
            + (hasSavedAt ? '<span style="color:#6B7280;font-size:16px">›</span>' : '')
            + '</div>';
        }).join('')
      + '</div>';
  }

  // ── Section factures
  var facturesHtml = '';
  if (c.factures.length > 0) {
    var headerBg    = nbImpayes > 0 ? '#FEF2F2' : '#EDE9FE';
    var headerBdr   = nbImpayes > 0 ? '#FCA5A5' : '#C4B5FD';
    var headerColor = nbImpayes > 0 ? '#991B1B' : '#5B21B6';
    var badgeBg     = nbImpayes > 0 ? '#EF4444' : '#7C3AED';
    facturesHtml = '<div style="background:#fff;border-radius:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:' + headerBg + ';border-bottom:1.5px solid ' + headerBdr + '">'
      +   '<span>💶</span>'
      +   '<span style="font-size:13px;font-weight:700;color:' + headerColor + '">Factures' + (nbImpayes > 0 ? ' — ' + nbImpayes + ' impayée(s)' : '') + '</span>'
      +   '<span style="margin-left:auto;background:' + badgeBg + ';color:#fff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700">' + c.factures.length + '</span>'
      + '</div>'
      + sortDesc(c.factures).map(function(f) {
          var isPaye   = f.statut === 'Payé';
          var isAnnule = f.statut === 'Annulé';
          var badgeStyle = isPaye   ? 'background:#D1FAE5;color:#065F46'
                         : isAnnule ? 'background:#F3F4F6;color:#6B7280'
                                    : 'background:#FEE2E2;color:#991B1B';
          var badgeLabel = isPaye ? '✅ Payée' : isAnnule ? '🚫 Annulée' : '⚠️ Impayée';
          var onclick = f.numero ? ' onclick="_openFactureFromClientFiche(\'' + String(f.numero).replace(/'/g, "\\'") + '\')"' : '';
          var isClickable = !!f.numero;
          return '<div' + onclick + ' style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F5F5F5;' + (isClickable ? 'cursor:pointer;' : '') + '">'
            + '<div style="font-size:11px;color:#9ca3af;width:55px;flex-shrink:0">' + fmtDate(f.date) + '</div>'
            + '<div style="flex:1;min-width:0">'
            +   '<div style="font-size:12px;font-weight:600;color:#1B4332">' + (f.numero || f.ref || '—') + '</div>'
            +   (f.montant ? '<div style="font-size:11px;color:#6B7280">' + parseFloat(f.montant).toFixed(0) + ' €</div>' : '')
            + '</div>'
            + '<span style="padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;' + badgeStyle + '">' + badgeLabel + '</span>'
            + (isClickable ? '<span style="color:#6B7280;font-size:16px;margin-left:4px">›</span>' : '')
            + '</div>';
        }).join('')
      + '</div>';
  }

  body.innerHTML = '<div style="max-width:560px;margin:0 auto">'

    // ── Bouton retour liste
    + '<button onclick="_clientsView=\'list\';_currentClient=null;renderClients()" '
    +   'style="display:flex;align-items:center;gap:6px;background:transparent;border:none;color:#6B7280;'
    +   'font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 0;margin-bottom:12px">'
    +   '← Retour aux clients'
    + '</button>'

    // ── En-tête client
    + '<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
    +   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
    +     '<div style="width:52px;height:52px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;'
    +       'font-size:18px;font-weight:700;color:#fff;flex-shrink:0">' + initiales + '</div>'
    +     '<div style="flex:1;min-width:0">'
    +       '<div style="font-size:16px;font-weight:800;color:#1B4332">' + c.nom + ' ' + c.prenom + '</div>'
    +       (c.tel ? '<div style="font-size:13px;color:#6B7280"><a href="tel:' + c.tel + '" style="color:#059669;font-weight:600;text-decoration:none">📞 ' + c.tel + '</a></div>' : '')
    +       (c.email ? '<div style="font-size:11px;color:#9ca3af">✉️ ' + c.email + '</div>' : '')
    +     '</div>'
    +     '<div style="text-align:right;flex-shrink:0">'
    +       '<div style="font-size:22px;font-weight:800;color:#059669">' + c.ca.toFixed(0) + ' €</div>'
    +       '<div style="font-size:10px;color:#9ca3af">CA total</div>'
    +     '</div>'
    +   '</div>'
    // KPIs
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">'
    +     '<div style="background:#F0FDF4;border-radius:10px;padding:10px;text-align:center">'
    +       '<div style="font-size:20px;font-weight:800;color:#1B4332">' + c.missions.length + '</div>'
    +       '<div style="font-size:10px;color:#6B7280;font-weight:600">Missions</div>'
    +     '</div>'
    +     '<div style="background:#FEF3C7;border-radius:10px;padding:10px;text-align:center">'
    +       '<div style="font-size:20px;font-weight:800;color:#92400E">' + c.devis.length + '</div>'
    +       '<div style="font-size:10px;color:#6B7280;font-weight:600">Devis</div>'
    +     '</div>'
    +     '<div style="background:' + (nbImpayes > 0 ? '#FEE2E2' : '#EDE9FE') + ';border-radius:10px;padding:10px;text-align:center">'
    +       '<div style="font-size:20px;font-weight:800;color:' + (nbImpayes > 0 ? '#991B1B' : '#5B21B6') + '">' + c.factures.length + '</div>'
    +       '<div style="font-size:10px;color:#6B7280;font-weight:600">' + (nbImpayes > 0 ? nbImpayes + ' impayée(s)' : 'Factures') + '</div>'
    +     '</div>'
    +   '</div>'
    // Actions
    +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +     '<button onclick="_openDevisFromClient(_currentClient)" '
    +       'style="padding:12px;border-radius:10px;border:none;background:#1B4332;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📋 Nouveau devis</button>'
    +     '<button onclick="_openFactureDirecteClient(_currentClient)" '
    +       'style="padding:12px;border-radius:10px;border:1.5px solid #E8650A;background:#fff;color:#E8650A;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💶 Facture directe</button>'
    +   '</div>'
    + '</div>'

    + devisHtml
    + missionsHtml
    + facturesHtml

    + '</div>';
}

// ─── Ouvrir une mission depuis la fiche client ───
function _openMissionFromClient(savedAt) {
  var idx = (missions || []).findIndex(function(m) {
    return String(m.savedAt) === String(savedAt);
  });
  if (idx === -1) { alert('Mission introuvable.'); return; }
  closeClients();
  editMission(idx);
  openMission();
}

// ─── Ouvrir un devis existant depuis la fiche client ───
function _openDevisFromClientFiche(ref) {
  var list = typeof getAllDevis === 'function' ? getAllDevis() : [];
  var idx  = list.findIndex(function(d) { return d.numero === ref; });
  if (idx === -1) { alert('Devis introuvable.'); return; }
  closeClients();
  // Callback retour → fiche client
  _devisBackCallback = function() {
    _devisBackCallback = null;
    closeDevis();
    openClients();
    _clientsView = 'fiche';
    renderClients();
  };
  _devisEdit      = idx;
  _isSpecialMode  = !!(list[idx].type === 'special');
  openDevis();
  renderDevisScreen('form');
}

// ─── Ouvrir une facture existante depuis la fiche client ───
function _openFactureFromClientFiche(numero) {
  var list = typeof getAllFactures === 'function' ? getAllFactures() : [];
  var idx  = list.findIndex(function(f) { return f.numero_facture === numero; });
  if (idx === -1) { alert('Facture introuvable.'); return; }
  closeClients();
  // Callback retour → fiche client
  _factureBackCallback = function() {
    _factureBackCallback = null;
    closeFacture();
    openClients();
    _clientsView = 'fiche';
    renderClients();
  };
  _factureEdit      = idx;
  _factureFromDevis = null;
  openFacture();
  renderFactureScreen('form');
}

// ─── Nouveau devis pré-rempli depuis fiche client ───
function _openDevisFromClient(client) {
  closeClients();
  // Callback retour → fiche client
  _devisBackCallback = function() {
    _devisBackCallback = null;
    closeDevis();
    openClients();
    _clientsView = 'fiche';
    renderClients();
  };
  // Ouvrir l'écran devis directement sur le formulaire vierge
  _devisEdit     = null;
  _isSpecialMode = false;
  openDevis();
  renderDevisScreen('form');
  // Injecter les coordonnées client après le rendu du formulaire
  setTimeout(function() {
    var fields = {
      'dv-client_nom':    client.nom,
      'dv-client_prenom': client.prenom,
      'dv-client_tel':    client.tel,
      'dv-client_email':  client.email
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el && fields[id]) el.value = fields[id];
    });
  }, 100);
}

// ─── Facture directe (sans devis préalable) depuis fiche client ───
function _openFactureDirecteClient(client) {
  closeClients();
  // Callback retour → fiche client
  _factureBackCallback = function() {
    _factureBackCallback = null;
    closeFacture();
    openClients();
    _clientsView = 'fiche';
    renderClients();
  };
  // Utiliser _factureFromDevis avec les infos client uniquement
  // → openFacture() ira directement au formulaire car _factureFromDevis est truthy
  _factureFromDevis = {
    client_nom:     client.nom,
    client_prenom:  client.prenom,
    client_tel:     client.tel,
    client_email:   client.email,
    client_societe: '',
    diagnostics:    [],
    _directe:       true
  };
  _factureEdit = null;
  openFacture();
}
