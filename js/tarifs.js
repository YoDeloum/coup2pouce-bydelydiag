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
  body.innerHTML += renderGrilleTarifaireSection();
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

// ─── GRILLE TARIFAIRE ──────────────────────────────────────────────────────

var GRILLE_TARIFAIRE_DEFAULT = {
  active: false,
  grille: [
    [110, 130, 160, 190],
    [160, 190, 210, 250],
    [190, 230, 250, 290],
    [230, 250, 290, 340],
    [250, 280, 320, 390],
    [280, 310, 340, 450]
  ],
  majoration_150_pct: 10,
  tarifs_fixes: {
    erp_seul:            30,
    prelevement_amiante: 60,
    prelevement_plomb:   60,
    cave_box:            70
  }
};

function getGrilleTarifaire() {
  try {
    var saved = JSON.parse(localStorage.getItem('dd_grille_tarifaire') || 'null');
    if (!saved) return JSON.parse(JSON.stringify(GRILLE_TARIFAIRE_DEFAULT));
    var g = JSON.parse(JSON.stringify(GRILLE_TARIFAIRE_DEFAULT));
    if (typeof saved.active !== 'undefined')          g.active              = saved.active;
    if (saved.grille && saved.grille.length === 6)    g.grille              = saved.grille;
    if (saved.majoration_150_pct !== undefined)       g.majoration_150_pct  = saved.majoration_150_pct;
    if (saved.tarifs_fixes)                           g.tarifs_fixes        = Object.assign({}, g.tarifs_fixes, saved.tarifs_fixes);
    return g;
  } catch(e) {
    return JSON.parse(JSON.stringify(GRILLE_TARIFAIRE_DEFAULT));
  }
}

function _collectGrilleFromDOM() {
  var g = getGrilleTarifaire();
  for (var ri = 0; ri < 6; ri++) {
    for (var ci = 0; ci < 4; ci++) {
      var el = document.getElementById('gt-cell-'+ri+'-'+ci);
      if (el) g.grille[ri][ci] = parseFloat(el.value.replace(',','.')) || 0;
    }
  }
  var majEl = document.getElementById('gt-majoration');
  if (majEl) g.majoration_150_pct = parseFloat(majEl.value) || 10;
  var tf = ['erp_seul','prelevement_amiante','prelevement_plomb','cave_box'];
  tf.forEach(function(k) {
    var el = document.getElementById('gt-tf-'+k);
    if (el) g.tarifs_fixes[k] = parseFloat(el.value.replace(',','.')) || 0;
  });
  var activeEl = document.getElementById('gt-active');
  if (activeEl) g.active = activeEl.checked;
  return g;
}

function saveGrilleTarifaire() {
  var g = _collectGrilleFromDOM();
  localStorage.setItem('dd_grille_tarifaire', JSON.stringify(g));
  var btn = document.getElementById('gt-save-btn');
  if (btn) { btn.textContent = '✅ Sauvegardée !'; btn.style.background = '#22C55E'; setTimeout(function(){ btn.textContent='💾 Sauvegarder la grille'; btn.style.background='#2D6A4F'; }, 2500); }
}

function renderGrilleTarifaireSection() {
  var g = getGrilleTarifaire();
  var tranches = ['30 / 60 m²', '60 / 90 m²', '90 / 120 m²', '120 / 150 m²'];
  var tfLabels  = ['ERP seul', 'Prélèvement Amiante', 'Prélèvement Plomb', 'Cave / Box'];
  var tfKeys    = ['erp_seul', 'prelevement_amiante', 'prelevement_plomb', 'cave_box'];

  var headerHtml = '<tr style="background:#1B4332">'
    + '<th style="padding:8px 6px;color:#fff;font-size:11px;white-space:nowrap">Nb diag.</th>'
    + tranches.map(function(t){ return '<th style="padding:8px 6px;color:#fff;font-size:11px;white-space:nowrap">'+t+'</th>'; }).join('')
    + '<th style="padding:8px 6px;color:#FCD34D;font-size:11px;white-space:nowrap">&gt; 150 m²</th>'
    + '</tr>';

  var rowsHtml = g.grille.map(function(row, ri) {
    var base150 = row[3] || 0;
    var maj     = g.majoration_150_pct || 10;
    var cells   = row.slice(0, 4).map(function(val, ci) {
      return '<td style="padding:3px;border:1px solid #E2E5F0">'
        + '<input id="gt-cell-'+ri+'-'+ci+'" type="number" min="0" step="5" value="'+val
        + '" style="width:100%;padding:5px 2px;border:none;background:transparent;font-size:13px;font-weight:700;text-align:center;font-family:inherit;outline:none;color:#1B4332"/>'
        + '</td>';
    }).join('');
    return '<tr style="background:'+(ri%2===0?'#F9FAFB':'#fff')+'">'
      + '<td style="padding:8px 4px;text-align:center;border:1px solid #E2E5F0;font-weight:800;color:#2D6A4F;font-size:14px">'+(ri+1)+(ri===5?'+':'')+'</td>'
      + cells
      + '<td style="padding:6px;border:1px solid #E2E5F0;background:#FFF7ED;font-size:11px;color:#92400E;text-align:center;white-space:nowrap">'+base150+' €<br>+'+maj+'% / 50m²</td>'
      + '</tr>';
  }).join('');

  var tfHtml = tfLabels.map(function(lbl, i) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F3F4F6">'
      + '<span style="font-size:13px;color:#374151">'+lbl+'</span>'
      + '<div style="display:flex;align-items:center;gap:6px">'
      + '<input id="gt-tf-'+tfKeys[i]+'" type="number" min="0" step="5" value="'+(g.tarifs_fixes[tfKeys[i]]||0)
      + '" style="width:70px;padding:5px 8px;border-radius:6px;border:1.5px solid #E2E5F0;font-size:13px;font-weight:700;text-align:center;font-family:inherit;outline:none"/>'
      + ' €</div></div>';
  }).join('');

  return '<div class="tarif-section" style="border-top:3px solid #2D6A4F;margin-top:16px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    + '<h3 style="font-size:14px;font-weight:800;color:#2D6A4F;margin:0">📊 Grille tarifaire</h3>'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">'
    + '<input type="checkbox" id="gt-active" '+(g.active?'checked':'')+' style="width:18px;height:18px;accent-color:#2D6A4F;cursor:pointer"/>'
    + ' Activée</label></div>'
    + '<p style="font-size:12px;color:#6B7280;margin-bottom:12px">Prix global selon le nombre de diagnostics et la surface. Quand activée, un bouton "📊 Appliquer la grille" apparaît dans chaque devis.</p>'
    + '<div style="overflow-x:auto;border-radius:8px;border:1px solid #E2E5F0;margin-bottom:12px">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead>'+headerHtml+'</thead><tbody>'+rowsHtml+'</tbody></table></div>'
    + '<div style="background:#FFF7ED;border-radius:8px;padding:10px;margin-bottom:14px">'
    + '<div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px">Majoration pour &gt; 150 m²</div>'
    + '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">'
    + 'Prix 120/150 m² + <input id="gt-majoration" type="number" min="0" max="100" step="1" value="'+(g.majoration_150_pct||10)
    + '" style="width:44px;padding:4px 6px;border-radius:6px;border:1.5px solid #FCD34D;text-align:center;font-size:13px;font-weight:700;color:#92400E;font-family:inherit;outline:none"/> % par tranche de 50 m²</div></div>'
    + '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px">Tarifs fixes (s\'ajoutent au prix grille)</div>'
    + tfHtml
    + '<button id="gt-save-btn" onclick="saveGrilleTarifaire()" style="width:100%;padding:12px;border-radius:9px;border:none;background:#2D6A4F;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;margin-top:14px">💾 Sauvegarder la grille</button>'
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
