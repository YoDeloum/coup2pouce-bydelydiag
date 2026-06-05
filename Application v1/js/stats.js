// ─────────────────────────────────────────────
// STATS.JS — Statistiques d'activité
// ─────────────────────────────────────────────

function openStats() {
  document.getElementById('stats-screen').style.display = 'block';
  renderStats();
}

function renderStats() {
  var body   = document.getElementById('stats-body');
  var total  = missions.length;
  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));

  var modCount = {};
  var caTotal  = 0;
  missions.forEach(function(m) {
    (m.diags || []).forEach(function(d) {
      modCount[d] = (modCount[d] || 0) + 1;
      caTotal += tarifs[d] || 0;
    });
  });

  var byMonth = {};
  missions.forEach(function(m) {
    if (m.date) {
      var month = m.date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });

  var topMod = Object.entries(modCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
  var maxVal = topMod.length ? Math.max.apply(null, Object.values(modCount)) : 1;

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:32px;font-weight:800;color:#6366F1">${total}</div>
        <div style="font-size:12px;color:#6B7280">Missions total</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="font-size:32px;font-weight:800;color:#2D6A4F">${caTotal}</div>
        <div style="font-size:12px;color:#6B7280">CA estimé (€)</div>
      </div>
    </div>
    ${topMod.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📊 Diagnostics les plus réalisés</h3>
      ${topMod.map(([mod, count]) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="flex:1;font-size:13px">${mod}</span>
          <div style="flex:2;background:#E2E5F0;border-radius:999px;height:8px">
            <div style="height:100%;border-radius:999px;background:#2D6A4F;width:${Math.round(count/maxVal*100)}%"></div>
          </div>
          <span style="font-size:13px;font-weight:700;color:#2D6A4F;width:24px;text-align:right">${count}</span>
        </div>`).join('')}
    </div>` : ''}
    ${Object.keys(byMonth).length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <h3 style="font-size:14px;font-weight:800;color:#374151;margin-bottom:12px">📅 Missions par mois</h3>
      ${Object.entries(byMonth).sort().reverse().slice(0,6).map(([month, count]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F5F5F5;font-size:13px">
          <span>${month}</span>
          <span style="font-weight:700;color:#6366F1">${count} mission${count>1?'s':''}</span>
        </div>`).join('')}
    </div>` : `
    <div style="background:#fff;border-radius:14px;padding:30px;text-align:center;color:#6B7280;font-size:14px">
      Aucune mission enregistrée pour le moment
    </div>`}
    <button onclick="exportStats()" style="width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:16px">📤 Exporter mes stats</button>`;
}

function exportStats() {
  var total  = missions.length;
  var tarifs = Object.assign({}, TARIFS_DEFAULT, JSON.parse(localStorage.getItem('dd_tarifs') || '{}'));
  var caTotal = 0;
  missions.forEach(function(m) { (m.diags||[]).forEach(function(d) { caTotal += tarifs[d] || 0; }); });
  var today = new Date().toLocaleDateString('fr-FR');
  var text  = '📊 MES STATISTIQUES DELY DIAG\nDate : ' + today
    + '\n─────────────────\nMissions totales : ' + total
    + '\nCA estimé : ' + caTotal + ' €\n─────────────────\nDELY DIAG — Diagnostics Immobiliers';
  if (navigator.share) navigator.share({title:'Stats DELY DIAG', text});
  else navigator.clipboard.writeText(text).then(function() { alert('✅ Stats copiées !'); });
}
