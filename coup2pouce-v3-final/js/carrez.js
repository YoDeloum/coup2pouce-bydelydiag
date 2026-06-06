// ─────────────────────────────────────────────
// CARREZ.JS — Calculateur Loi Carrez / Loi Boutin
// ─────────────────────────────────────────────

function renderCarrez() {
  var d         = DATA['Carrez'];
  var activeTab = window.carrezTab || 'info';
  document.getElementById('tab-content-cours').innerHTML = `
    <div style="display:flex;gap:4px;margin-bottom:16px;background:#fff;padding:4px;border-radius:11px;border:1px solid #E2E5F0">
      <button class="carrez-tab-btn ${activeTab==='info'?'active':''}" onclick="setCarrezTab('info')">📖 Loi Carrez / Boutin</button>
      <button class="carrez-tab-btn ${activeTab==='calc'?'active':''}" onclick="setCarrezTab('calc')">📐 Calculateur</button>
    </div>
    ${activeTab === 'info' ? renderCarrezInfo() : renderCarrezCalc()}`;
}

function setCarrezTab(tab) {
  window.carrezTab = tab;
  renderCarrez();
}

function renderCarrezInfo() {
  return `<div class="card" style="margin-bottom:14px">
    <h2 style="font-size:16px;font-weight:800;margin-bottom:14px;color:#0891B2">📖 Loi Carrez vs Loi Boutin</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#0891B218;border:2px solid #0891B2;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:22px;margin-bottom:6px">🏠</div>
        <div style="font-weight:800;color:#0891B2;font-size:14px">LOI CARREZ</div>
        <div style="font-size:11px;color:#6B7280;margin-top:4px">Vente — Surface privative</div>
      </div>
      <div style="background:#7C3AED18;border:2px solid #7C3AED;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:22px;margin-bottom:6px">🔑</div>
        <div style="font-weight:800;color:#7C3AED;font-size:14px">LOI BOUTIN</div>
        <div style="font-size:11px;color:#6B7280;margin-top:4px">Location — Surface habitable</div>
      </div>
    </div>
    <div style="background:#FFF9E6;border:1px solid #F59E0B66;border-radius:10px;padding:12px;margin-bottom:16px">
      <p style="font-size:13px;font-weight:700;color:#92400E;margin-bottom:6px">⚠️ Règles communes aux deux lois</p>
      <p style="font-size:13px;color:#374151;line-height:1.8">
        • Hauteur sous plafond <strong>≥ 1,80 m</strong> — en dessous non comptabilisé<br>
        • Les <strong>embrasures</strong> ne sont pas comptées<br>
        • Les surfaces des <strong>murs et cloisons</strong> sont déduites<br>
        • Les <strong>placards</strong> : comptés si même sol fini ET profondeur ≥ 50 cm<br>
        • <strong>Balcons, terrasses, garages, caves</strong> : exclus
      </p>
    </div>
    <div style="overflow-x:auto">
    <table class="comp-table">
      <thead><tr style="background:#F5F6FA">
        <th style="text-align:left;padding:10px 12px;color:#374151">Élément</th>
        <th style="color:#0891B2">Carrez<br><span style="font-weight:400;font-size:10px">Vente</span></th>
        <th style="color:#7C3AED">Boutin<br><span style="font-weight:400;font-size:10px">Location</span></th>
      </tr></thead>
      <tbody>
        <tr><td>Pièces principales</td><td style="text-align:center"><span class="badge-yes">OUI</span></td><td style="text-align:center"><span class="badge-yes">OUI</span></td></tr>
        <tr style="background:#FAFFFE"><td>Combles aménageables (h≥1,80m)</td><td style="text-align:center"><span class="badge-yes">OUI</span></td><td style="text-align:center"><span class="badge-no">NON</span></td></tr>
        <tr><td>Caves / sous-sols</td><td style="text-align:center"><span class="badge-no">NON</span></td><td style="text-align:center"><span class="badge-no">NON</span></td></tr>
        <tr style="background:#FAFFFE"><td>Garages</td><td style="text-align:center"><span class="badge-no">NON</span></td><td style="text-align:center"><span class="badge-no">NON</span></td></tr>
        <tr><td>Balcons / terrasses</td><td style="text-align:center"><span class="badge-no">NON</span></td><td style="text-align:center"><span class="badge-no">NON</span></td></tr>
        <tr style="background:#FAFFFE"><td>Placards (même sol + prof.≥50cm)</td><td style="text-align:center"><span class="badge-cond">COND.</span></td><td style="text-align:center"><span class="badge-cond">COND.</span></td></tr>
        <tr><td>Sous hauteur < 1,80 m</td><td style="text-align:center"><span class="badge-no">NON</span></td><td style="text-align:center"><span class="badge-no">NON</span></td></tr>
      </tbody>
    </table>
    </div>
    <div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:12px;margin-top:12px">
      <p style="font-size:13px;font-weight:700;color:#991B1B;margin-bottom:4px">⚠️ Tolérance Loi Carrez</p>
      <p style="font-size:13px;color:#374151;line-height:1.6">Si la surface réelle est inférieure de plus de <strong>5%</strong>, l'acheteur peut demander une <strong>diminution du prix proportionnelle</strong> dans un délai d'un an.</p>
    </div>
  </div>`;
}

function renderCarrezCalc() {
  var zonesHtml = calcZones.map(function(z, i) {
    return '<div class="calc-zone-item">'
      + '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:#0891B2;margin-bottom:6px">' + z.label + '</div>'
      + '<div style="display:flex;gap:8px">'
      + '<input class="calc-input" style="margin:0" type="text" inputmode="decimal" placeholder="Long. (m)" value="' + z.l + '" oninput="updateZone(' + i + ',\'l\',this.value)" pattern="[0-9]*[.,]?[0-9]*"/>'
      + '<input class="calc-input" style="margin:0" type="text" inputmode="decimal" placeholder="Larg. (m)" value="' + z.w + '" oninput="updateZone(' + i + ',\'w\',this.value)" pattern="[0-9]*[.,]?[0-9]*"/>'
      + '</div></div>'
      + (i > 0 ? '<button class="calc-zone-remove" onclick="removeZone(' + i + ')">−</button>' : '<div style="width:28px"></div>')
      + '</div>';
  }).join('');

  var soustrHtml = calcSoustraire.map(function(z, i) {
    return '<div class="calc-zone-item" style="background:#FFF1F2;border-color:#FECACA">'
      + '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:#991B1B;margin-bottom:6px">− ' + z.label + '</div>'
      + '<div style="display:flex;gap:8px">'
      + '<input class="calc-input" style="margin:0;border-color:#FECACA" type="text" inputmode="decimal" placeholder="Long. (m)" value="' + z.l + '" oninput="updateSoustr(' + i + ',\'l\',this.value)"/>'
      + '<input class="calc-input" style="margin:0;border-color:#FECACA" type="text" inputmode="decimal" placeholder="Larg. (m)" value="' + z.w + '" oninput="updateSoustr(' + i + ',\'w\',this.value)"/>'
      + '</div></div>'
      + '<button class="calc-zone-remove" onclick="removeSoustr(' + i + ')">−</button>'
      + '</div>';
  }).join('');

  var totalAdd = calcZones.reduce(function(s,z) { return s + (parseFloat(z.l)||0)*(parseFloat(z.w)||0); }, 0);
  var totalSub = calcSoustraire.reduce(function(s,z) { return s + (parseFloat(z.l)||0)*(parseFloat(z.w)||0); }, 0);
  var total    = Math.max(0, totalAdd - totalSub);

  return '<div class="card">'
    + '<h2 style="font-size:16px;font-weight:800;margin-bottom:4px;color:#0891B2">📐 Calculateur de surface</h2>'
    + '<p style="font-size:12px;color:#6B7280;margin-bottom:16px">Additionne les pièces, soustrait les zones exclues</p>'
    + '<p style="font-size:12px;font-weight:700;color:#0891B2;margin-bottom:8px">➕ Zones à additionner</p>'
    + zonesHtml
    + '<button onclick="addZone()" style="width:100%;padding:10px;border-radius:8px;border:2px dashed #0891B2;background:transparent;color:#0891B2;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px">+ Ajouter une zone</button>'
    + '<p style="font-size:12px;font-weight:700;color:#991B1B;margin-bottom:8px">➖ Zones à soustraire</p>'
    + soustrHtml
    + '<button onclick="addSoustr()" style="width:100%;padding:10px;border-radius:8px;border:2px dashed #FECACA;background:transparent;color:#991B1B;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px">− Ajouter une zone à soustraire</button>'
    + (total > 0
        ? '<div class="calc-result"><div style="color:rgba(255,255,255,.8);font-size:12px;margin-bottom:4px">Surface totale calculée</div><div style="color:#fff;font-size:36px;font-weight:800">' + total.toFixed(2) + ' m²</div>' + (totalSub > 0 ? '<div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:4px">' + totalAdd.toFixed(2) + ' m² − ' + totalSub.toFixed(2) + ' m² exclus</div>' : '') + '</div>'
        : '<div style="background:#F5F6FA;border-radius:12px;padding:20px;text-align:center;color:#6B7280;font-size:13px">Saisis les dimensions pour calculer la surface</div>')
    + '<button onclick="resetCalc()" style="width:100%;padding:11px;border-radius:9px;border:2px solid #6B7280;background:#fff;color:#6B7280;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px">🔄 Réinitialiser</button>'
    + '</div>';
}

function updateZone(i, field, val)   { calcZones[i][field]      = val.replace(',','.'); setCarrezTab('calc'); }
function updateSoustr(i, field, val) { calcSoustraire[i][field] = val.replace(',','.'); setCarrezTab('calc'); }
function addZone()     { calcZones.push({l:'',w:'',label:'Pièce '+(calcZones.length+1)});          setCarrezTab('calc'); }
function removeZone(i) { calcZones.splice(i,1);                                                      setCarrezTab('calc'); }
function addSoustr()   { calcSoustraire.push({l:'',w:'',label:'Zone '+(calcSoustraire.length+1)});  setCarrezTab('calc'); }
function removeSoustr(i){ calcSoustraire.splice(i,1);                                                setCarrezTab('calc'); }
function resetCalc()   { calcZones=[{l:'',w:'',label:'Pièce 1'}]; calcSoustraire=[];                setCarrezTab('calc'); }
