// ─────────────────────────────────────────────
// STATS.JS — Statistiques d'activité par mois
// + objectif mensuel avec jauge de progression
// ─────────────────────────────────────────────

var _statsMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

function openStats() {
  document.getElementById('stats-screen').style.display = 'block';
  renderStats();
}

function renderStats() {
  var body       = document.getElementById('stats-body');
  var tarifs     = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}')); 
  var objectif   = parseFloat(localStorage.getItem('dd_stats_objectif') || '0');
  var allMissions    = missions || [];
  var allDevis       = typeof getAllDevis    === 'function' ? getAllDevis()    : [];
  var allFactures    = typeof getAllFactures === 'function' ? getAllFactures() : [];

  // ── Filtrage par mois ──
  function matchMonth(dateStr) {
    if (!dateStr) return false;
    return dateStr.substring(0, 7) === _statsMonth;
  }

  var missionsFilt  = allMissions.filter(function(m)  { return matchMonth(m.date); });
  var devisFilt     = allDevis.filter(function(d)     { return matchMonth(d.date); });
  var facturesFilt  = allFactures.filter(function(f)  { return matchMonth(f.date_facture || f.date); });

  // ── Calculs missions filtrées ──
  var caMissions = 0, caDeplacements = 0;
  var modCount = {};
  missionsFilt.forEach(function(m) {
    // Comptage des diagnostics pour le graphique (inchangé)
    (m.diags || []).forEach(function(d) {
      modCount[d] = (modCount[d] || 0) + 1;
    });
    // CA : utiliser le total personnalisé si défini, sinon calculer depuis les tarifs
    if (m.total && parseFloat(m.total) > 0) {
      caMissions += parseFloat(m.total);
    } else {
      (m.diags || []).forEach(function(d) {
        if (d === 'Frais déplacement') caDeplacements += parseFloat(tarifs[d]) || 0;
        else                           caMissions     += parseFloat(tarifs[d]) || 0;
      });
    }
  });

  // ── Calculs devis filtrés ──
  var caDevisTotal = devisFilt.reduce(function(s, d) {
    return s + parseFloat(d.total_ht && d.total_ht > 0 ? d.total_ht : (d.prix_final || 0));
  }, 0);
  var devisParStatut = {};
  devisFilt.forEach(function(d) { var s = d.statut || 'Devis'; devisParStatut[s] = (devisParStatut[s] || 0) + 1; });

  // ── Calculs factures filtrées ──
  var caFacture = facturesFilt.reduce(function(s, f) {
    return s + parseFloat(f.total_ht && f.total_ht > 0 ? f.total_ht : (f.prix_final || 0));
  }, 0);
  var caPaye = facturesFilt.filter(function(f) { return f.statut === 'Payé'; })
    .reduce(function(s, f) { return s + parseFloat(f.total_ht && f.total_ht > 0 ? f.total_ht : (f.prix_final || 0)); }, 0);
  var factParStatut = {};
  facturesFilt.forEach(function(f) { var s = f.statut || 'Facturé'; factParStatut[s] = (factParStatut[s] || 0) + 1; });

  var caTotal = caMissions + caDeplacements;
  var topMod  = Object.entries(modCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
  var maxVal  = topMod.length ? Math.max.apply(null, Object.values(modCount)) : 1;

  // ── Jauge objectif ──
  var pctObj  = objectif > 0 ? Math.min(100, Math.round(caTotal / objectif * 100)) : 0;
  var jaugeColor = pctObj >= 100 ? '#059669' : pctObj >= 60 ? '#F59E0B' : '#EF4444';

  // ── Libellé mois ──
  var moisLabel = new Date(_statsMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  moisLabel = moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1);

  body.innerHTML = `
    <!-- ── Sélecteur de mois ── -->
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <button onclick="changerMoisStats(-1)" style="padding:6px 14px;border-radius:8px;border:1.5px solid #E2E5F0;background:#fff;font-size:18px;cursor:pointer">←</button>
        <span style="font-size:15px;font-weight:800;color:#1B4332">${moisLabel}</span>
        <button onclick="changerMoisStats(1)" style="padding:6px 14px;border-radius:8px;border:1.5px solid #E2E5F0;background:#fff;font-size:18px;cursor:pointer">→</button>
      </div>
      <input type="month" value="${_statsMonth}" onchange="_statsMonth=this.value;renderStats()"
        style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none"/>
    </div>

    <!-- ── Objectif mensuel + jauge ── -->
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">🎯 Objectif mensuel</h3>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <input type="number" id="stats-objectif-input" value="${objectif > 0 ? objectif : ''}" min="0" step="50"
          placeholder="Saisir un objectif €"
          style="flex:1;padding:8px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;outline:none"/>
        <span style="font-size:13px;color:#6B7280">€ HT</span>
        <button onclick="sauvegarderObjectif()" style="padding:8px 14px;border-radius:8px;border:none;background:#1B4332;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">OK</button>
      </div>
      ${objectif > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#6B7280;margin-bottom:6px">
        <span>CA réalisé : <strong style="color:#1B4332">${caTotal.toFixed(0)} €</strong></span>
        <span>Objectif : <strong>${objectif.toFixed(0)} €</strong></span>
      </div>
      <div style="background:#E2E5F0;border-radius:999px;height:18px;overflow:hidden">
        <div style="height:100%;border-radius:999px;background:${jaugeColor};width:${pctObj}%;transition:width 0.6s;display:flex;align-items:center;justify-content:center">
          ${pctObj >= 15 ? '<span style="font-size:11px;font-weight:700;color:#fff">' + pctObj + '%</span>' : ''}
        </div>
      </div>
      ${pctObj < 15 ? '<div style="font-size:11px;color:' + jaugeColor + ';text-align:right;margin-top:2px;font-weight:700">' + pctObj + '%</div>' : ''}
      ` : '<div style="font-size:12px;color:#9ca3af;text-align:center">Fixe un objectif pour voir ta progression</div>'}
    </div>

    <!-- KPI principaux -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div onclick="toggleStatsMissionsDetail()" style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer;border:2px solid transparent;transition:border .2s" id="stats-missions-kpi">
        <div style="font-size:28px;font-weight:800;color:#6366F1">${missionsFilt.length}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Missions</div>
        <div style="font-size:10px;color:#6366F1;margin-top:2px">👆 voir détail</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#2D6A4F">${caTotal.toFixed(0)} €</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">CA estimé</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#059669">${devisFilt.length}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Devis créés</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#1B4332">${facturesFilt.length}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Factures émises</div>
      </div>
    </div>

    <!-- Détail missions (caché par défaut, juste sous les KPIs) -->
    <div id="stats-missions-detail" style="display:none;background:#EDE9FE;border:2px solid #6366F1;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(99,102,241,.15)">
      <h3 style="font-size:14px;font-weight:800;color:#5B21B6;margin-bottom:12px">📋 Détail des missions — ${moisLabel}</h3>
      ${missionsFilt.length === 0 ? '<div style="text-align:center;color:#9ca3af;font-size:13px;padding:16px">Aucune mission ce mois-ci</div>' :
        missionsFilt.map(function(m) {
          var dept = (m.bien_adresse || m.adresse || '').match(/\b(\d{2})\d{3}\b/);
          dept = dept ? dept[1] : (m.code_postal ? String(m.code_postal).substring(0,2) : '—');
          var diags = (m.diags || []).join(' · ') || '—';
          var tarifs2 = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
          var montant = m.total && parseFloat(m.total) > 0 ? parseFloat(m.total) : (m.diags||[]).reduce(function(s,d){return s+(parseFloat(tarifs2[d])||0);},0);
          var nom = (m.nom||m.client_nom||'') + ' ' + (m.prenom||m.client_prenom||'');
          return '<div style="padding:10px;border-bottom:1px solid #DDD6FE;font-size:12px">'
            + '<div style="font-weight:700;color:#1B4332">' + (nom.trim()||'Client inconnu') + ' — ' + dept + '</div>'
            + '<div style="color:#6B7280;margin-top:2px">' + diags + '</div>'
            + '<div style="color:#5B21B6;font-weight:700;margin-top:2px">' + montant.toFixed(0) + ' €</div>'
            + '</div>';
        }).join('')
      }
    </div>

    <!-- CA détaillé -->
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">💶 Détail financier</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#F9FAFB;border-radius:8px">
          <span style="font-size:13px;color:#374151">Diagnostics</span>
          <span style="font-size:13px;font-weight:700;color:#2D6A4F">${caMissions.toFixed(0)} €</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#F9FAFB;border-radius:8px">
          <span style="font-size:13px;color:#374151">Frais de déplacement</span>
          <span style="font-size:13px;font-weight:700;color:#E8650A">${caDeplacements.toFixed(0)} €</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#D1FAE5;border-radius:8px;border:1px solid #6EE7B7">
          <span style="font-size:14px;font-weight:700;color:#065F46">Total CA estimé</span>
          <span style="font-size:15px;font-weight:800;color:#065F46">${caTotal.toFixed(0)} €</span>
        </div>
        ${facturesFilt.length > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#EDE9FE;border-radius:8px">
          <span style="font-size:13px;color:#5B21B6">Total facturé</span>
          <span style="font-size:13px;font-weight:700;color:#5B21B6">${caFacture.toFixed(0)} €</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#D1FAE5;border-radius:8px">
          <span style="font-size:13px;color:#065F46">Total encaissé (Payé)</span>
          <span style="font-size:13px;font-weight:700;color:#065F46">${caPaye.toFixed(0)} €</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Statuts devis -->
    ${devisFilt.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📄 Statuts devis</h3>
      ${Object.entries(devisParStatut).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px"><span>'+e[0]+'</span><span style="font-weight:700;color:#059669">'+e[1]+'</span></div>';}).join('')}
    </div>` : ''}

    <!-- Statuts factures -->
    ${facturesFilt.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📋 Statuts factures</h3>
      ${Object.entries(factParStatut).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px"><span>'+e[0]+'</span><span style="font-weight:700;color:#1B4332">'+e[1]+'</span></div>';}).join('')}
    </div>` : ''}

    <!-- Top diagnostics -->
    ${topMod.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📊 Diagnostics réalisés</h3>
      ${topMod.map(function(e){var mod=e[0];var count=e[1];return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="flex:1;font-size:13px">'+mod+'</span><div style="flex:2;background:#E2E5F0;border-radius:999px;height:8px"><div style="height:100%;border-radius:999px;background:#2D6A4F;width:'+Math.round(count/maxVal*100)+'%"></div></div><span style="font-size:13px;font-weight:700;color:#2D6A4F;width:28px;text-align:right">'+count+'</span></div>';}).join('')}
    </div>` : ''}

    ${missionsFilt.length === 0 && devisFilt.length === 0 && facturesFilt.length === 0 ? '<div style="background:#fff;border-radius:14px;padding:30px;text-align:center;color:#6B7280;font-size:14px">Aucune activité pour '+moisLabel+'</div>' : ''}

    <button onclick="exportStats()" style="width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;margin-bottom:6px">📤 Exporter mes stats</button>`;
}

function toggleStatsMissionsDetail() {
  var detail = document.getElementById('stats-missions-detail');
  var kpi    = document.getElementById('stats-missions-kpi');
  if (!detail) { alert('Panneau introuvable — ouvre les stats et réessaie.'); return; }
  var visible = detail.style.display !== 'none';
  detail.style.display = visible ? 'none' : 'block';
  if (kpi) kpi.style.borderColor = visible ? 'transparent' : '#6366F1';
  if (!visible) {
    setTimeout(function() { detail.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
  }
}

function changerMoisStats(delta) {
  var d = new Date(_statsMonth + '-01');
  d.setMonth(d.getMonth() + delta);
  _statsMonth = d.toISOString().substring(0, 7);
  renderStats();
}

function sauvegarderObjectif() {
  var val = parseFloat(document.getElementById('stats-objectif-input')?.value) || 0;
  localStorage.setItem('dd_stats_objectif', val);
  renderStats();
}

function exportStats() {
  var tarifs       = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}')); 
  var facturesList = typeof getAllFactures === 'function' ? getAllFactures() : [];
  var caTotal = 0;
  (missions || []).forEach(function(m) {
    if (m.total && parseFloat(m.total) > 0) {
      caTotal += parseFloat(m.total);
    } else {
      (m.diags||[]).forEach(function(d) { caTotal += parseFloat(tarifs[d])||0; });
    }
  });
  var caFacture = facturesList.reduce(function(s,f) { return s+parseFloat(f.total_ht||0); }, 0);
  var caPaye    = facturesList.filter(function(f) { return f.statut === 'Payé'; }).reduce(function(s,f) { return s+parseFloat(f.total_ht||0); }, 0);
  var today = new Date().toLocaleDateString('fr-FR');
  var moisLabel = new Date(_statsMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  var text = '📊 MES STATISTIQUES DELY DIAG\nMois : ' + moisLabel + '\nDate export : ' + today
    + '\n─────────────────\nMissions : ' + (missions||[]).length
    + '\nCA estimé : ' + caTotal.toFixed(0) + ' €'
    + '\nDevis créés : ' + (typeof getAllDevis==='function'?getAllDevis():[]).length
    + '\nFactures émises : ' + facturesList.length
    + '\nTotal facturé : ' + caFacture.toFixed(0) + ' €'
    + '\nTotal encaissé : ' + caPaye.toFixed(0) + ' €'
    + '\n─────────────────\nDELY DIAG — Diagnostics Immobiliers';
  if (navigator.share) navigator.share({title:'Stats DELY DIAG', text});
  else navigator.clipboard.writeText(text).then(function() { alert('✅ Stats copiées !'); });
}
