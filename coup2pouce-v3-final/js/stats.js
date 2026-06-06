// ─────────────────────────────────────────────
// STATS.JS — Statistiques d'activité complètes
// (missions, devis, factures, frais déplacement)
// ─────────────────────────────────────────────

function openStats() {
  document.getElementById('stats-screen').style.display = 'block';
  renderStats();
}

function renderStats() {
  var body     = document.getElementById('stats-body');
  var tarifs   = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var devisList    = typeof getAllDevis    === 'function' ? getAllDevis()    : [];
  var facturesList = typeof getAllFactures === 'function' ? getAllFactures() : [];

  // ── Calculs missions ──
  var totalMissions = missions.length;
  var caMissions    = 0;
  var caDeplacements = 0;
  var modCount      = {};

  missions.forEach(function(m) {
    (m.diags || []).forEach(function(d) {
      modCount[d] = (modCount[d] || 0) + 1;
      if (d === 'Frais déplacement') {
        caDeplacements += parseFloat(tarifs[d]) || 0;
      } else {
        caMissions += parseFloat(tarifs[d]) || 0;
      }
    });
  });

  // ── Calculs devis ──
  var totalDevis  = devisList.length;
  var caDevisTotal = devisList.reduce(function(s, d) { return s + parseFloat(d.total_ht || 0); }, 0);
  var devisParStatut = {};
  devisList.forEach(function(d) {
    var s = d.statut || 'Devis';
    devisParStatut[s] = (devisParStatut[s] || 0) + 1;
  });

  // ── Calculs factures ──
  var totalFactures = facturesList.length;
  var caFacture     = facturesList.reduce(function(s, f) { return s + parseFloat(f.total_ht || 0); }, 0);
  var caPaye        = facturesList.filter(function(f) { return f.statut === 'Payé'; })
                        .reduce(function(s, f) { return s + parseFloat(f.total_ht || 0); }, 0);
  var factParStatut = {};
  facturesList.forEach(function(f) {
    var s = f.statut || 'Facturé';
    factParStatut[s] = (factParStatut[s] || 0) + 1;
  });

  var caTotal = caMissions + caDeplacements;

  // ── Top diagnostics ──
  var topMod = Object.entries(modCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
  var maxVal = topMod.length ? Math.max.apply(null, Object.values(modCount)) : 1;

  // ── Missions par mois ──
  var byMonth = {};
  missions.forEach(function(m) {
    if (m.date) {
      var month = m.date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });

  body.innerHTML = `
    <!-- KPI principaux -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#6366F1">${totalMissions}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Missions</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#2D6A4F">${caTotal.toFixed(0)} €</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">CA total estimé</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#059669">${totalDevis}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Devis créés</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:28px;font-weight:800;color:#1B4332">${totalFactures}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600">Factures émises</div>
      </div>
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
        ${totalFactures > 0 ? `
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
    ${totalDevis > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📄 Statuts devis</h3>
      ${Object.entries(devisParStatut).map(([s, n]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px">
          <span>${s}</span><span style="font-weight:700;color:#059669">${n}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Statuts factures -->
    ${totalFactures > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📋 Statuts factures</h3>
      ${Object.entries(factParStatut).map(([s, n]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px">
          <span>${s}</span><span style="font-weight:700;color:#1B4332">${n}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Top diagnostics -->
    ${topMod.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📊 Diagnostics réalisés</h3>
      ${topMod.map(([mod, count]) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="flex:1;font-size:13px">${mod}</span>
          <div style="flex:2;background:#E2E5F0;border-radius:999px;height:8px">
            <div style="height:100%;border-radius:999px;background:#2D6A4F;width:${Math.round(count/maxVal*100)}%"></div>
          </div>
          <span style="font-size:13px;font-weight:700;color:#2D6A4F;width:28px;text-align:right">${count}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Missions par mois -->
    ${Object.keys(byMonth).length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📅 Missions par mois</h3>
      ${Object.entries(byMonth).sort().reverse().slice(0, 6).map(([month, count]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px">
          <span>${month}</span>
          <span style="font-weight:700;color:#6366F1">${count} mission${count>1?'s':''}</span>
        </div>`).join('')}
    </div>` : `
    <div style="background:#fff;border-radius:14px;padding:30px;text-align:center;color:#6B7280;font-size:14px">
      Aucune mission enregistrée pour le moment
    </div>`}

    <button onclick="exportStats()" style="width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;margin-bottom:6px">📤 Exporter mes stats</button>`;
}

function exportStats() {
  var tarifs       = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var devisList    = typeof getAllDevis    === 'function' ? getAllDevis()    : [];
  var facturesList = typeof getAllFactures === 'function' ? getAllFactures() : [];
  var caTotal = 0;
  missions.forEach(function(m) { (m.diags||[]).forEach(function(d) { caTotal += parseFloat(tarifs[d])||0; }); });
  var caFacture = facturesList.reduce(function(s,f) { return s+parseFloat(f.total_ht||0); }, 0);
  var caPaye    = facturesList.filter(function(f) { return f.statut === 'Payé'; }).reduce(function(s,f) { return s+parseFloat(f.total_ht||0); }, 0);
  var today = new Date().toLocaleDateString('fr-FR');
  var text = '📊 MES STATISTIQUES DELY DIAG\nDate : ' + today
    + '\n─────────────────\nMissions : ' + missions.length
    + '\nCA estimé : ' + caTotal.toFixed(0) + ' €'
    + '\nDevis créés : ' + devisList.length
    + '\nFactures émises : ' + facturesList.length
    + '\nTotal facturé : ' + caFacture.toFixed(0) + ' €'
    + '\nTotal encaissé : ' + caPaye.toFixed(0) + ' €'
    + '\n─────────────────\nDELY DIAG — Diagnostics Immobiliers';
  if (navigator.share) navigator.share({title:'Stats DELY DIAG', text});
  else navigator.clipboard.writeText(text).then(function() { alert('✅ Stats copiées !'); });
}
