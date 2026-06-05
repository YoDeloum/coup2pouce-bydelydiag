// ─────────────────────────────────────────────
// TARIFS.JS — Calculateur tarifs & générateur de devis
// ─────────────────────────────────────────────

function openTarif() {
  document.getElementById('tarif-screen').classList.add('open');
  renderTarifScreen();
}

function closeTarif() {
  document.getElementById('tarif-screen').classList.remove('open');
}

function renderTarifScreen() {
  var saved  = JSON.parse(localStorage.getItem('dd_tarifs') || '{}');
  var tarifs = Object.assign({}, TARIFS_DEFAULT, saved);
  var body   = document.getElementById('tarif-body');
  var lastMission = missions.length > 0 ? missions[missions.length - 1] : null;

  body.innerHTML = `
    <div class="tarif-section">
      <h3 style="font-size:14px;font-weight:800;color:#2D6A4F;margin-bottom:12px">💶 Mes tarifs par diagnostic</h3>
      <p style="font-size:12px;color:#6B7280;margin-bottom:12px">Personnalise tes tarifs — sauvegardés sur ton appareil</p>
      ${Object.entries(tarifs).map(([diag, prix]) => `
        <div class="tarif-row">
          <span class="tarif-label">${diag}</span>
          <input class="tarif-input-small" type="number" value="${prix}"
            onchange="updateTarif('${diag}', this.value)" min="0" step="5"/> €
        </div>`).join('')}
      <button onclick="saveTarifs()" style="width:100%;padding:12px;border-radius:9px;border:none;background:#2D6A4F;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px">💾 Sauvegarder mes tarifs</button>
    </div>
    <div class="tarif-section">
      <h3 style="font-size:14px;font-weight:800;color:#E8650A;margin-bottom:12px">📄 Générateur de devis</h3>
      ${lastMission ? `<p style="font-size:12px;color:#6B7280;margin-bottom:10px">Basé sur la dernière mission : <strong>${lastMission.nom} ${lastMission.prenom}</strong></p>` : ''}
      <div id="devis-diags" style="margin-bottom:12px">
        ${Object.keys(tarifs).map(d => `
          <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F5F5F5">
            <input type="checkbox" id="dv-${d}" style="width:16px;height:16px;accent-color:#E8650A" onchange="updateDevis()"/>
            <label for="dv-${d}" style="flex:1;font-size:13px">${d}</label>
            <span style="font-size:13px;font-weight:600;color:#374151">${tarifs[d]} €</span>
          </div>`).join('')}
      </div>
      <div id="devis-result" style="background:#F5F6FA;border-radius:10px;padding:14px;text-align:center;color:#6B7280;font-size:13px">
        Sélectionne les diagnostics pour calculer
      </div>
      <button onclick="exportDevis()" style="width:100%;padding:12px;border-radius:9px;border:none;background:linear-gradient(135deg,#E8650A,#F4A261);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:10px">📤 Exporter le devis</button>
    </div>`;

  window._tarifs = tarifs;
}

function updateTarif(diag, val) {
  if (!window._tarifs) window._tarifs = {};
  window._tarifs[diag] = parseFloat(val) || 0;
  updateDevis();
}

function saveTarifs() {
  localStorage.setItem('dd_tarifs', JSON.stringify(window._tarifs || {}));
  alert('✅ Tarifs sauvegardés !');
}

function updateDevis() {
  var tarifs   = window._tarifs || TARIFS_DEFAULT;
  var selected = Object.keys(tarifs).filter(function(d) {
    var el = document.getElementById('dv-' + d);
    return el && el.checked;
  });
  var total  = selected.reduce(function(s, d) { return s + (tarifs[d] || 0); }, 0);
  var result = document.getElementById('devis-result');
  if (!result) return;

  if (selected.length === 0) {
    result.innerHTML = '<span style="color:#6B7280">Sélectionne les diagnostics pour calculer</span>';
    return;
  }

  result.innerHTML = '<div style="text-align:left">'
    + selected.map(function(d) {
        return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span>' + d + '</span><span>' + tarifs[d] + ' €</span></div>';
      }).join('')
    + '<div style="border-top:2px solid #E2E5F0;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#2D6A4F"><span>TOTAL</span><span>' + total + ' €</span></div>'
    + '</div>';
}

function exportDevis() {
  var tarifs   = window._tarifs || TARIFS_DEFAULT;
  var selected = Object.keys(tarifs).filter(function(d) {
    var el = document.getElementById('dv-' + d);
    return el && el.checked;
  });
  if (selected.length === 0) { alert('Sélectionne au moins un diagnostic !'); return; }

  var total       = selected.reduce(function(s, d) { return s + (tarifs[d] || 0); }, 0);
  var lastMission = missions.length > 0 ? missions[missions.length - 1] : null;
  var today       = new Date().toLocaleDateString('fr-FR');

  var text = '📄 DEVIS DELY DIAG\nDate : ' + today + '\n'
    + (lastMission ? 'Client : ' + lastMission.nom + ' ' + lastMission.prenom + '\nBien : ' + lastMission.adresse + '\n' : '')
    + '─────────────────────\nDIAGNOSTICS\n'
    + selected.map(function(d) { return '• ' + d + ' : ' + tarifs[d] + ' €'; }).join('\n')
    + '\n─────────────────────\nTOTAL : ' + total + ' €\nDELY DIAG — Diagnostics Immobiliers\nDevis valable 1 mois';

  if (navigator.share) {
    navigator.share({title: 'Devis DELY DIAG', text});
  } else {
    navigator.clipboard.writeText(text).then(function() { alert('✅ Devis copié !'); });
  }
}
