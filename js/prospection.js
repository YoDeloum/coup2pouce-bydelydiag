/* ═══════════════════════════════════════════════════════════════
   PROSPECTION — Module de prospection commerciale
   Import CSV Scrap.io · Pipeline · Relances
   ═══════════════════════════════════════════════════════════════ */

// ── Stockage ──────────────────────────────────────────────────
var _prospects = [];
var _prospectionTab = 'pipeline'; // 'pipeline' | 'import' | 'relances'
var _prospectSearch = '';
var _prospectStatutFilter = '';
var _prospectView = 'list'; // 'list' | 'fiche'
var _prospectFicheIdx = null;

var PROSPECT_STATUTS = [
  { key: 'À contacter',  color: '#6B7280', bg: '#F3F4F6' },
  { key: 'Contacté',     color: '#D97706', bg: '#FEF3C7' },
  { key: 'RDV pris',     color: '#2563EB', bg: '#DBEAFE' },
  { key: 'RDV réalisé',  color: '#059669', bg: '#D1FAE5' },
  { key: 'Inactif',      color: '#EF4444', bg: '#FEE2E2' }
];

function _loadProspects() {
  try { _prospects = JSON.parse(localStorage.getItem('dd_prospects') || '[]'); }
  catch(e) { _prospects = []; }
}
function _saveProspects() {
  localStorage.setItem('dd_prospects', JSON.stringify(_prospects));
}

// ── Ouvrir / Fermer ───────────────────────────────────────────
function openProspection() {
  _loadProspects();
  _prospectionTab = 'pipeline';
  _prospectSearch = '';
  _prospectStatutFilter = '';
  _prospectView = 'list';
  _prospectFicheIdx = null;
  var el = document.getElementById('prospection-screen');
  if (el) { el.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  renderProspection();
}
function closeProspection() {
  var el = document.getElementById('prospection-screen');
  if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
}

// ── Rendu principal ───────────────────────────────────────────
function renderProspection() {
  var el = document.getElementById('prospection-body');
  if (!el) return;

  if (_prospectView === 'fiche' && _prospectFicheIdx !== null) {
    el.innerHTML = _renderProspectFiche(_prospectFicheIdx);
    return;
  }

  var tabs = [
    { key: 'pipeline', label: '📋 Pipeline' },
    { key: 'import',   label: '📥 Import / Recherche' },
    { key: 'relances', label: '🔔 Relances' }
  ];
  var tabsHtml = '<div style="display:flex;gap:6px;padding:12px 16px 0;background:#fff;border-bottom:1px solid #E5E7EB">';
  tabs.forEach(function(t) {
    var active = _prospectionTab === t.key;
    tabsHtml += '<button onclick="_prospectionTab=\''+t.key+'\';renderProspection()" style="flex:1;padding:9px 4px;font-size:12px;font-weight:'+(active?'700':'500')+';color:'+(active?'#2563EB':'#6B7280')+';background:none;border:none;border-bottom:'+(active?'2.5px solid #2563EB':'2.5px solid transparent')+';cursor:pointer;font-family:inherit;white-space:nowrap">'+t.label+'</button>';
  });
  tabsHtml += '</div>';

  var content = '';
  if (_prospectionTab === 'pipeline') content = _renderPipeline();
  else if (_prospectionTab === 'import') content = _renderImport();
  else if (_prospectionTab === 'relances') content = _renderRelances();

  el.innerHTML = tabsHtml + '<div style="padding:16px;overflow-y:auto;flex:1">' + content + '</div>';
}

// ── PIPELINE ─────────────────────────────────────────────────
function _renderPipeline() {
  var total = _prospects.length;
  if (total === 0) {
    return '<div style="text-align:center;padding:60px 20px;color:#9CA3AF">'
      + '<div style="font-size:40px;margin-bottom:12px">📋</div>'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#374151">Aucun prospect</div>'
      + '<div style="font-size:13px;margin-bottom:20px">Importez un fichier CSV depuis l\'onglet Import</div>'
      + '<button onclick="_prospectionTab=\'import\';renderProspection()" style="background:#2563EB;color:#fff;border:none;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📥 Aller à l\'import</button>'
      + '</div>';
  }

  // KPIs
  var kpis = {};
  PROSPECT_STATUTS.forEach(function(s){ kpis[s.key] = 0; });
  var relancesAuj = 0, today = new Date().toISOString().slice(0,10);
  _prospects.forEach(function(p){
    if (kpis[p.statut] !== undefined) kpis[p.statut]++;
    if (p.relance_date && p.relance_date <= today) relancesAuj++;
  });

  var kpiHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">';
  kpiHtml += '<div style="background:#DBEAFE;border-radius:12px;padding:12px 8px;text-align:center"><div style="font-size:22px;font-weight:800;color:#1D4ED8">'+total+'</div><div style="font-size:10px;font-weight:600;color:#1D4ED8">Total</div></div>';
  kpiHtml += '<div style="background:'+(relancesAuj>0?'#FEE2E2':'#F3F4F6')+';border-radius:12px;padding:12px 8px;text-align:center;cursor:'+(relancesAuj>0?'pointer':'default')+'" '+(relancesAuj>0?'onclick="_prospectionTab=\'relances\';renderProspection()"':'')+' title="Voir les relances"><div style="font-size:22px;font-weight:800;color:'+(relancesAuj>0?'#EF4444':'#6B7280')+'">'+relancesAuj+'</div><div style="font-size:10px;font-weight:600;color:'+(relancesAuj>0?'#EF4444':'#6B7280')+'">Relances</div></div>';
  kpiHtml += '<div style="background:#D1FAE5;border-radius:12px;padding:12px 8px;text-align:center"><div style="font-size:22px;font-weight:800;color:#059669">'+(kpis['RDV réalisé']||0)+'</div><div style="font-size:10px;font-weight:600;color:#059669">RDV réalisés</div></div>';
  kpiHtml += '</div>';

  // Filtres statut
  var filtreHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  filtreHtml += '<button onclick="_prospectStatutFilter=\'\';renderProspection()" style="padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;border:1.5px solid '+(_prospectStatutFilter===''?'#2563EB':'#E5E7EB')+';background:'+(_prospectStatutFilter===''?'#2563EB':'#fff')+';color:'+(_prospectStatutFilter===''?'#fff':'#374151')+';cursor:pointer;font-family:inherit">Tous ('+total+')</button>';
  PROSPECT_STATUTS.forEach(function(s){
    var n = kpis[s.key]||0;
    if (n === 0) return;
    var active = _prospectStatutFilter === s.key;
    filtreHtml += '<button onclick="_prospectStatutFilter=\''+s.key+'\';renderProspection()" style="padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;border:1.5px solid '+(active?s.color:s.color+'44')+';background:'+(active?s.bg:'transparent')+';color:'+s.color+';cursor:pointer;font-family:inherit">'+s.key+' ('+n+')</button>';
  });
  filtreHtml += '</div>';

  // Recherche
  var searchHtml = '<div style="position:relative;margin-bottom:12px"><input id="prospect-search" type="search" placeholder="🔍 Rechercher par nom, ville, tel..." value="'+_escHtml(_prospectSearch)+'" oninput="_prospectSearch=this.value;renderProspection()" style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:13px;font-family:inherit"/></div>';

  // Liste filtrée
  var filtered = _prospects.filter(function(p,i){
    if (_prospectStatutFilter && p.statut !== _prospectStatutFilter) return false;
    if (_prospectSearch) {
      var q = _prospectSearch.toLowerCase();
      return (p.nom||'').toLowerCase().indexOf(q)>=0
          || (p.ville||'').toLowerCase().indexOf(q)>=0
          || (p.tel||'').indexOf(q)>=0
          || (p.email||'').toLowerCase().indexOf(q)>=0;
    }
    return true;
  });

  if (filtered.length === 0) {
    return kpiHtml + filtreHtml + searchHtml + '<div style="text-align:center;padding:40px 20px;color:#9CA3AF;font-size:14px">Aucun résultat</div>';
  }

  var cardsHtml = '';
  filtered.forEach(function(p, fi) {
    var realIdx = _prospects.indexOf(p);
    var statut = PROSPECT_STATUTS.find(function(s){ return s.key === p.statut; }) || PROSPECT_STATUTS[0];
    var telHtml = p.tel ? '<a href="tel:'+p.tel.replace(/\s/g,'')+'" onclick="event.stopPropagation()" style="color:#2563EB;text-decoration:none;font-size:13px;font-weight:600">📞 '+_escHtml(p.tel)+'</a>' : '';
    var mailHtml = p.email ? '<a href="mailto:'+_escHtml(p.email)+'" onclick="event.stopPropagation()" style="color:#059669;text-decoration:none;font-size:12px">✉️ '+_escHtml(p.email)+'</a>' : '';
    var noteHtml = p.note_google ? '<span style="font-size:11px;color:#D97706;font-weight:600">★ '+p.note_google+'</span>' : '';

    cardsHtml += '<div onclick="_openProspectFiche('+realIdx+')" style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:10px;cursor:pointer;position:relative">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
      + '<div style="font-size:14px;font-weight:700;color:#111827;flex:1;margin-right:8px">'+_escHtml(p.nom||'Sans nom')+'</div>'
      + '<span style="background:'+statut.bg+';color:'+statut.color+';font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap">'+statut.key+'</span>'
      + '</div>'
      + (p.ville ? '<div style="font-size:12px;color:#6B7280;margin-bottom:6px">📍 '+_escHtml(p.ville+(p.cp?' ('+p.cp+')':''))+'</div>' : '')
      + '<div style="display:flex;flex-direction:column;gap:4px">'
      + (telHtml ? '<div>'+telHtml+'</div>' : '')
      + (mailHtml ? '<div>'+mailHtml+'</div>' : '')
      + '</div>'
      + (noteHtml || p.relance_date ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">'
          + noteHtml
          + (p.relance_date ? '<span style="font-size:11px;color:'+(p.relance_date<=today?'#EF4444':'#6B7280')+'">🔔 '+p.relance_date+'</span>' : '')
          + '</div>' : '')
      + '</div>';
  });

  return kpiHtml + filtreHtml + searchHtml + '<div style="padding-bottom:20px">'+cardsHtml+'</div>';
}

// ── IMPORT ───────────────────────────────────────────────────
function _renderImport() {
  var html = '';

  // Guide d'utilisation
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #DBEAFE;padding:16px;margin-bottom:14px">'
    + '<div style="font-size:14px;font-weight:800;color:#1E40AF;margin-bottom:10px">📖 Comment utiliser la Prospection ?</div>'
    + '<div style="font-size:12px;color:#374151;line-height:1.9">'
    + '<b>1.</b> Connectez-vous sur <b>Scrap.io</b> avec les identifiants fournis par votre responsable<br>'
    + '<b>2.</b> Recherchez vos cibles par <b>ville ou département</b> (agences immo, mandataires, syndics…)<br>'
    + '<b>3.</b> Exportez les résultats en <b>fichier CSV</b><br>'
    + '<b>4.</b> Importez ce fichier ici → vos prospects apparaissent dans le <b>Pipeline</b><br>'
    + '<b>5.</b> Cliquez sur un prospect pour <b>gérer votre suivi</b> : statut, historique, relance, notes'
    + '</div>'
    + '</div>';

  // Bloc Scrap.io
  html += '<div style="background:linear-gradient(135deg,#1E40AF,#2563EB);border-radius:16px;padding:18px;margin-bottom:16px;color:#fff">'
    + '<div style="font-size:16px;font-weight:800;margin-bottom:4px">🔍 Accéder à Scrap.io</div>'
    + '<div style="font-size:12px;opacity:.85;margin-bottom:6px;line-height:1.5">Identifiants fournis par votre responsable. En cas de doute, contactez-le directement.</div>'
    + '<div style="background:rgba(255,255,255,.15);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;line-height:1.8">'
    + '🔑 <b>Identifiants :</b> à demander à votre responsable<br>'
    + '<span style="opacity:.8;font-size:11px">Ne partagez pas ces accès en dehors de l\'équipe</span>'
    + '</div>'
    + '<a href="https://app.scrap.io/login" target="_blank" style="display:inline-block;background:#fff;color:#1E40AF;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;text-decoration:none">🌐 Se connecter à Scrap.io</a>'
    + '</div>';

  // Zone import CSV
  html += '<div style="border:2px dashed #93C5FD;border-radius:14px;padding:24px;text-align:center;background:#EFF6FF;margin-bottom:16px">'
    + '<div style="font-size:32px;margin-bottom:8px">📁</div>'
    + '<div style="font-size:14px;font-weight:700;color:#1E40AF;margin-bottom:4px">Importer un fichier CSV Scrap.io</div>'
    + '<div style="font-size:12px;color:#6B7280;margin-bottom:14px">Toutes les colonnes sont lues et conservées intégralement</div>'
    + '<label style="display:inline-block;background:#2563EB;color:#fff;padding:10px 20px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700">'
    + '📥 Choisir le fichier CSV'
    + '<input type="file" accept=".csv" onchange="_importCSV(event)" style="display:none">'
    + '</label>'
    + '</div>';

  // Ajout manuel
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:16px;margin-bottom:16px">'
    + '<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:12px">✏️ Ajouter manuellement</div>'
    + '<input id="p-nom" type="text" placeholder="Nom de l\'agence / contact *" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<input id="p-ville" type="text" placeholder="Ville" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<input id="p-cp" type="text" placeholder="Code postal" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<input id="p-tel" type="tel" placeholder="Téléphone" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<input id="p-email" type="email" placeholder="Email" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<input id="p-website" type="url" placeholder="Site web" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<select id="p-categorie" style="'+_inputStyle()+';margin-bottom:12px">'
    + '<option value="">-- Catégorie --</option>'
    + '<option>Agence immobilière</option>'
    + '<option>Mandataire immobilier</option>'
    + '<option>Syndic de copropriété</option>'
    + '<option>Administrateur de biens</option>'
    + '<option>Promoteur immobilier</option>'
    + '<option>Notaire</option>'
    + '<option>Autre</option>'
    + '</select>'
    + '<button onclick="_addManualProspect()" style="width:100%;background:#2563EB;color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Ajouter ce prospect</button>'
    + '</div>';

  // Stats import
  if (_prospects.length > 0) {
    var fromCSV = _prospects.filter(function(p){ return p.source==='CSV'; }).length;
    var fromManuel = _prospects.filter(function(p){ return p.source==='Manuel'; }).length;
    html += '<div style="background:#F9FAFB;border-radius:12px;padding:14px;font-size:13px;color:#374151;line-height:1.8">'
      + '<strong>Base de prospects</strong><br>'
      + '📊 Total : '+_prospects.length+'<br>'
      + '📁 Importés CSV : '+fromCSV+'<br>'
      + '✏️ Ajoutés manuellement : '+fromManuel
      + '<button onclick="_clearProspects()" style="display:block;margin-top:10px;background:none;border:1px solid #EF4444;color:#EF4444;border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;font-family:inherit">🗑️ Vider toute la base</button>'
      + '</div>';
  }

  return html;
}

// ── RELANCES ─────────────────────────────────────────────────
function _renderRelances() {
  var today = new Date().toISOString().slice(0,10);
  var avecRelance = _prospects.filter(function(p){ return p.relance_date; });
  avecRelance.sort(function(a,b){ return a.relance_date.localeCompare(b.relance_date); });

  if (avecRelance.length === 0) {
    return '<div style="text-align:center;padding:60px 20px;color:#9CA3AF">'
      + '<div style="font-size:40px;margin-bottom:12px">🔔</div>'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#374151">Aucune relance planifiée</div>'
      + '<div style="font-size:13px">Ouvrez la fiche d\'un prospect pour planifier une relance.</div>'
      + '</div>';
  }

  var retard = avecRelance.filter(function(p){ return p.relance_date < today; });
  var auj = avecRelance.filter(function(p){ return p.relance_date === today; });
  var afaire = avecRelance.filter(function(p){ return p.relance_date > today; });

  function renderGroup(title, color, list) {
    if (list.length === 0) return '';
    var html = '<div style="font-size:12px;font-weight:700;color:'+color+';letter-spacing:.5px;text-transform:uppercase;margin:14px 0 8px">'+title+' ('+list.length+')</div>';
    list.forEach(function(p) {
      var idx = _prospects.indexOf(p);
      var statut = PROSPECT_STATUTS.find(function(s){ return s.key === p.statut; }) || PROSPECT_STATUTS[0];
      html += '<div onclick="_openProspectFiche('+idx+')" style="background:#fff;border-radius:12px;border:1.5px solid #E5E7EB;padding:12px 14px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">'
        + '<div>'
        + '<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px">'+_escHtml(p.nom||'Sans nom')+'</div>'
        + (p.tel ? '<a href="tel:'+p.tel.replace(/\s/g,'')+'" onclick="event.stopPropagation()" style="font-size:12px;color:#2563EB;text-decoration:none">📞 '+_escHtml(p.tel)+'</a>' : '')
        + '</div>'
        + '<div style="text-align:right">'
        + '<div style="font-size:11px;font-weight:700;color:'+color+';margin-bottom:4px">🔔 '+p.relance_date+'</div>'
        + '<span style="background:'+statut.bg+';color:'+statut.color+';font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">'+statut.key+'</span>'
        + '</div>'
        + '</div>';
    });
    return html;
  }

  return renderGroup('⚠️ En retard', '#EF4444', retard)
       + renderGroup('📌 Aujourd\'hui', '#2563EB', auj)
       + renderGroup('📅 À venir', '#059669', afaire);
}

// ── FICHE PROSPECT ───────────────────────────────────────────
function _openProspectFiche(idx) {
  _prospectFicheIdx = idx;
  _prospectView = 'fiche';
  renderProspection();
}

function _renderProspectFiche(idx) {
  var p = _prospects[idx];
  if (!p) return '<div style="padding:20px">Prospect introuvable</div>';

  var statut = PROSPECT_STATUTS.find(function(s){ return s.key === p.statut; }) || PROSPECT_STATUTS[0];

  // En-tête
  var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
    + '<button onclick="_prospectView=\'list\';_prospectFicheIdx=null;renderProspection()" style="background:#F3F4F6;border:none;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700;cursor:pointer;color:#374151;font-family:inherit">← Retour</button>'
    + '<div style="flex:1"><div style="font-size:16px;font-weight:800;color:#111827">'+_escHtml(p.nom||'Sans nom')+'</div>'
    + (p.categorie ? '<div style="font-size:12px;color:#6B7280">'+_escHtml(p.categorie)+'</div>' : '')
    + '</div></div>';

  // Statut selector
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:12px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Statut</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  PROSPECT_STATUTS.forEach(function(s) {
    var active = p.statut === s.key;
    html += '<button onclick="_setStatut('+idx+',\''+s.key+'\')" style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid '+s.color+';background:'+(active?s.bg:'transparent')+';color:'+s.color+';cursor:pointer;font-family:inherit;opacity:'+(active?'1':'.6')+'">'+s.key+'</button>';
  });
  html += '</div></div>';

  // Coordonnées
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:12px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Coordonnées</div>';

  if (p.adresse || p.ville) {
    html += '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px"><div style="font-size:18px;margin-top:1px">📍</div><div style="font-size:13px;color:#374151;line-height:1.5">'+_escHtml([p.adresse,p.cp,p.ville].filter(Boolean).join(', '))+'</div></div>';
  }
  if (p.tel) {
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-size:18px">📞</div><a href="tel:'+p.tel.replace(/\s/g,'')+'" style="font-size:15px;font-weight:700;color:#2563EB;text-decoration:none">'+_escHtml(p.tel)+'</a>'+(p.tel_type?'<span style="font-size:10px;color:#9CA3AF;background:#F3F4F6;padding:2px 6px;border-radius:6px">'+p.tel_type+'</span>':'')+'</div>';
  }
  if (p.email) {
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:'+(p.email2?'6px':'10px')+'"><div style="font-size:18px">✉️</div><a href="mailto:'+_escHtml(p.email)+'" style="font-size:13px;color:#059669;text-decoration:none;word-break:break-all">'+_escHtml(p.email)+'</a></div>';
  }
  if (p.email2) {
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-left:28px"><a href="mailto:'+_escHtml(p.email2)+'" style="font-size:12px;color:#6B7280;text-decoration:none">'+_escHtml(p.email2)+'</a></div>';
  }
  if (p.website) {
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="font-size:18px">🌐</div><a href="'+_escHtml(p.website)+'" target="_blank" style="font-size:13px;color:#2563EB;text-decoration:none;word-break:break-all">'+_escHtml(p.website)+'</a></div>';
  }
  if (p.note_google) {
    html += '<div style="display:flex;align-items:center;gap:10px"><div style="font-size:18px">⭐</div><span style="font-size:13px;color:#D97706;font-weight:700">'+p.note_google+'/5</span>'+(p.nb_avis?'<span style="font-size:12px;color:#9CA3AF">('+p.nb_avis+' avis)</span>':'')+'</div>';
  }
  html += '</div>';

  // Notes + Relance
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:12px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Notes</div>'
    + '<textarea id="p-notes-'+idx+'" placeholder="Ajouter des notes..." rows="3" style="width:100%;box-sizing:border-box;border:1.5px solid #E5E7EB;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;outline:none">'+_escHtml(p.notes||'')+'</textarea>'
    + '<button onclick="_saveNotes('+idx+')" style="margin-top:8px;background:#F3F4F6;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:#374151;font-family:inherit">💾 Enregistrer les notes</button>'
    + '</div>';

  // Relance
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:12px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Relance planifiée</div>'
    + '<input type="date" id="p-relance-'+idx+'" value="'+(p.relance_date||'')+'" style="'+_inputStyle()+';margin-bottom:8px">'
    + '<button onclick="_saveRelance('+idx+')" style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🔔 Planifier la relance</button>'
    + (p.relance_date ? ' <button onclick="_clearRelance('+idx+')" style="background:#FEE2E2;color:#EF4444;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-left:6px">✕ Supprimer</button>' : '')
    + '</div>';

  // Historique
  var hist = p.historique || [];
  html += '<div style="background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:14px;margin-bottom:12px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Historique des échanges</div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;margin-bottom:10px">'
    + '<input id="p-hist-note-'+idx+'" type="text" placeholder="Décrire l\'échange..." style="flex:1;padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:12px;font-family:inherit;outline:none">'
    + '<button onclick="_addHistorique('+idx+')" style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:9px 12px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:700;white-space:nowrap">+ Ajouter</button>'
    + '</div>';

  if (hist.length > 0) {
    var reversed = hist.slice().reverse();
    reversed.forEach(function(h) {
      html += '<div style="border-left:3px solid #2563EB;padding:8px 10px;margin-bottom:6px;background:#F9FAFB;border-radius:0 8px 8px 0">'
        + '<div style="font-size:11px;color:#9CA3AF;margin-bottom:2px">'+h.date+'</div>'
        + '<div style="font-size:13px;color:#374151">'+_escHtml(h.note)+'</div>'
        + '</div>';
    });
  } else {
    html += '<div style="font-size:12px;color:#9CA3AF;text-align:center;padding:10px">Aucun échange enregistré</div>';
  }
  html += '</div>';

  // Supprimer
  html += '<button onclick="_deleteProspect('+idx+')" style="width:100%;background:#FEE2E2;color:#EF4444;border:1px solid #FECACA;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:24px">🗑️ Supprimer ce prospect</button>';

  return html;
}

// ── ACTIONS ──────────────────────────────────────────────────
function _setStatut(idx, statut) {
  _prospects[idx].statut = statut;
  _saveProspects();
  renderProspection();
}

function _saveNotes(idx) {
  var el = document.getElementById('p-notes-'+idx);
  if (el) { _prospects[idx].notes = el.value; _saveProspects(); _showMsg('Notes enregistrées ✓'); }
}

function _saveRelance(idx) {
  var el = document.getElementById('p-relance-'+idx);
  if (el && el.value) { _prospects[idx].relance_date = el.value; _saveProspects(); _showMsg('Relance planifiée le '+el.value+' ✓'); renderProspection(); }
}

function _clearRelance(idx) {
  _prospects[idx].relance_date = null;
  _saveProspects();
  renderProspection();
}

function _addHistorique(idx) {
  var el = document.getElementById('p-hist-note-'+idx);
  if (!el || !el.value.trim()) return;
  if (!_prospects[idx].historique) _prospects[idx].historique = [];
  var today = new Date().toLocaleDateString('fr-FR');
  _prospects[idx].historique.push({ date: today, note: el.value.trim() });
  _saveProspects();
  el.value = '';
  renderProspection();
}

function _deleteProspect(idx) {
  if (!confirm('Supprimer ce prospect ?')) return;
  _prospects.splice(idx, 1);
  _saveProspects();
  _prospectView = 'list';
  _prospectFicheIdx = null;
  renderProspection();
}

function _addManualProspect() {
  var nom = (document.getElementById('p-nom')||{}).value||'';
  if (!nom.trim()) { alert('Le nom est obligatoire'); return; }
  var p = {
    id: Date.now(),
    nom: nom.trim(),
    adresse: '', ville: _v('p-ville'), cp: _v('p-cp'),
    tel: _v('p-tel'), tel_type: '',
    email: _v('p-email'), email2: '',
    website: _v('p-website'),
    categorie: _v('p-categorie'),
    statut: 'À contacter',
    note_google: null, nb_avis: null,
    source: 'Manuel',
    import_date: Date.now(),
    notes: '', relance_date: null, historique: [], raw: {}
  };
  _prospects.unshift(p);
  _saveProspects();
  _showMsg('Prospect ajouté ✓');
  _prospectionTab = 'pipeline';
  renderProspection();
}

function _clearProspects() {
  if (!confirm('Vider toute la base de prospects ? Cette action est irréversible.')) return;
  _prospects = [];
  _saveProspects();
  renderProspection();
}

// ── IMPORT CSV ───────────────────────────────────────────────
function _importCSV(event) {
  var file = event.target.files[0];
  if (!file) return;
  if (typeof Papa === 'undefined') { alert('Papa Parse non chargé, veuillez rafraîchir la page.'); return; }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
    complete: function(results) {
      var rows = results.data;
      var count = 0;
      rows.forEach(function(row) {
        var p = _mapCSVRow(row);
        if (p.nom) { _prospects.push(p); count++; }
      });
      _saveProspects();
      _showMsg(count+' prospect(s) importé(s) ✓');
      _prospectionTab = 'pipeline';
      renderProspection();
    },
    error: function(err) {
      alert('Erreur lors de la lecture du CSV : ' + err.message);
    }
  });
}

function _mapCSVRow(row) {
  function pick(keys) {
    for (var i=0; i<keys.length; i++) {
      var val = row[keys[i]];
      if (val && val.trim && val.trim() !== '' && val.trim().toLowerCase() !== 'null' && val.trim() !== 'undefined') return val.trim();
      // clé insensible à la casse
      for (var k in row) {
        if (k.toLowerCase() === keys[i].toLowerCase()) {
          var v2 = row[k];
          if (v2 && v2.trim && v2.trim() !== '' && v2.trim().toLowerCase() !== 'null') return v2.trim();
        }
      }
    }
    return '';
  }

  var nom    = pick(['name','business_name','nom','title','raison_sociale','company','company_name']);
  var adresse= pick(['address','full_address','location_full_address','adresse','street_address']);
  var ville  = pick(['city','location_city','ville','town','municipality']);
  var cp     = pick(['postal_code','zip','zip_code','location_postal_code','code_postal','cp']);
  var tel    = pick(['phone','telephone','phone_international','tel','phone_number','numero','mobile']);
  var telTyp = pick(['phone_type','type_phone','type_telephone']);
  var email  = pick(['email','email_1','email1','mail','courriel']);
  var email2 = pick(['email_2','email2','email_secondary']);
  var website= pick(['website','web','site','url','site_web','site_internet']);
  var cat    = pick(['type','category','types','categorie','business_type']);
  var note   = pick(['rating','note','google_rating','score']);
  var nbAvis = pick(['reviews','reviews_count','nb_avis','avis','review_count']);

  // Si l'adresse contient déjà ville+CP, on ne duplique pas
  if (adresse && ville && adresse.toLowerCase().indexOf(ville.toLowerCase()) >= 0) {
    // ok
  }

  return {
    id: Date.now() + Math.random(),
    nom: nom,
    adresse: adresse,
    ville: ville,
    cp: cp,
    tel: tel,
    tel_type: telTyp,
    email: email,
    email2: email2,
    website: website,
    categorie: cat,
    statut: 'À contacter',
    note_google: note ? parseFloat(note) : null,
    nb_avis: nbAvis ? parseInt(nbAvis) : null,
    source: 'CSV',
    import_date: Date.now(),
    notes: '',
    relance_date: null,
    historique: [],
    raw: row  // toutes les colonnes originales
  };
}

// ── UTILITAIRES ───────────────────────────────────────────────
function _escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _inputStyle() {
  return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:13px;font-family:inherit;outline:none';
}
function _v(id) {
  var el = document.getElementById(id);
  return el ? (el.value||'').trim() : '';
}
function _showMsg(msg) {
  var d = document.createElement('div');
  d.textContent = msg;
  d.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1E40AF;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:9999;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.2)';
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, 2500);
}
