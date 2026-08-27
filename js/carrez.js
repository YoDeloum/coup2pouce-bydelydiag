// ─────────────────────────────────────────────
// CARREZ.JS — Calculateur Loi Carrez / Loi Boutin
// ─────────────────────────────────────────────

function renderCarrez() {
  var d         = DATA['Carrez'];
  var activeTab = window.carrezTab || 'info';
  document.getElementById('tab-content-cours').innerHTML = `
    <div style="display:flex;gap:4px;margin-bottom:12px;background:#fff;padding:4px;border-radius:11px;border:1px solid #E2E5F0;flex-wrap:wrap">
      <button class="carrez-tab-btn ${activeTab==='info'?'active':''}" onclick="setCarrezTab('info')">📖 Loi Carrez / Boutin</button>
      <button class="carrez-tab-btn ${activeTab==='calc'?'active':''}" onclick="setCarrezTab('calc')">📐 Calculateur</button>
      <button class="carrez-tab-btn ${activeTab==='tri'?'active':''}" onclick="setCarrezTab('tri')">📐 Triangulation</button>
    </div>
    ${activeTab === 'info' ? renderCarrezInfo() : activeTab === 'calc' ? renderCarrezCalc() : renderCarrezTriangulation()}`;
  if (activeTab === 'tri') setTimeout(triInitCanvas, 30);
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

// ─── TRIANGULATION ──────────────────────────────────────────────────────────

function renderCarrezTriangulation() {
  if (typeof window.tri_phase === 'undefined') {
    window.tri_phase = 'draw'; window.tri_pts = [];
    window.tri_walls = []; window.tri_diags = []; window.tri_cur = 0;
  }
  var phase = window.tri_phase;
  if (phase === 'walls' || phase === 'diagonals') return triHtmlMeasure();
  if (phase === 'result') return triHtmlResult();
  return triHtmlDraw();
}

function triHtmlDraw() {
  var pts = window.tri_pts || [], N = pts.length, ok = N >= 3;
  return '<div class="card">'
    + '<h2 style="font-size:15px;font-weight:800;margin-bottom:6px;color:#7C3AED">📐 Triangulation — Dessiner la pièce</h2>'
    + '<p style="font-size:12px;color:#6B7280;margin-bottom:10px">Tapez les coins de la pièce dans l\'ordre sur le canevas</p>'
    + '<canvas id="tri-canvas" width="320" height="220" style="width:100%;border-radius:10px;touch-action:none;cursor:crosshair;display:block"></canvas>'
    + '<p id="tri-count" style="font-size:13px;font-weight:700;color:' + (ok ? '#059669' : '#374151') + ';margin:10px 0 8px">'
    + (N === 0 ? 'Tapez sur le canevas pour placer les coins'
       : N < 3 ? N + ' coin(s) placé(s) — continuez'
       : '✓ ' + N + ' coins — prêt à mesurer') + '</p>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<button id="tri-undo-btn" onclick="triUndo()" ' + (N===0?'disabled':'') + ' style="flex:1;padding:11px;border-radius:9px;border:2px solid #6B7280;background:#fff;color:#374151;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px;opacity:' + (N===0?'.3':'1') + '">↩ Annuler</button>'
    + '<button id="tri-close-btn" onclick="triStartMeasure()" ' + (ok?'':'disabled') + ' style="flex:2;padding:11px;border-radius:9px;border:none;background:' + (ok?'linear-gradient(135deg,#7C3AED,#6D28D9)':'#E5E7EB') + ';color:' + (ok?'#fff':'#9CA3AF') + ';font-weight:700;cursor:' + (ok?'pointer':'default') + ';font-family:inherit;font-size:13px">✅ Fermer la pièce (' + N + ' coins)</button>'
    + '</div>'
    + '<button onclick="triReset()" style="width:100%;padding:9px;border-radius:9px;border:2px solid #E5E7EB;background:#fff;color:#9CA3AF;font-weight:600;cursor:pointer;font-family:inherit;font-size:12px">🔄 Tout recommencer</button>'
    + '</div>';
}

function triHtmlMeasure() {
  var phase = window.tri_phase, cur = window.tri_cur || 0;
  var pts = window.tri_pts || [], N = pts.length;
  var totalSteps = N + (N - 3), stepNum, label, hint, color, grad;
  if (phase === 'walls') {
    stepNum = cur + 1;
    var toC = (cur + 1 < N ? cur + 2 : 1);
    label = 'Mur ' + (cur + 1) + ' → ' + toC;
    hint  = 'Mesurez le mur entre le coin ' + (cur + 1) + ' et le coin ' + toC;
    color = '#0891B2'; grad = '#0369A1';
  } else {
    stepNum = N + cur + 1;
    label = 'Diagonale 1 → ' + (cur + 3);
    hint  = 'Mesurez entre le coin 1 (violet) et le coin ' + (cur + 3);
    color = '#DC2626'; grad = '#B91C1C';
  }
  var pct = Math.round(stepNum / totalSteps * 100);
  return '<div class="card">'
    + '<h2 style="font-size:15px;font-weight:800;margin-bottom:6px;color:' + color + '">📐 ' + (phase === 'walls' ? 'Murs périphériques' : 'Diagonales') + '</h2>'
    + '<div style="display:flex;align-items:center;gap:8px;background:#F5F6FA;border-radius:8px;padding:7px 10px;margin-bottom:10px">'
    + '<div style="height:4px;flex:1;background:#E5E7EB;border-radius:4px"><div style="height:4px;background:' + color + ';border-radius:4px;width:' + pct + '%"></div></div>'
    + '<span style="font-size:11px;font-weight:700;color:#6B7280;white-space:nowrap">Étape ' + stepNum + ' / ' + totalSteps + '</span></div>'
    + '<canvas id="tri-canvas" width="320" height="190" style="width:100%;border-radius:10px;display:block;margin-bottom:10px"></canvas>'
    + '<p style="font-size:18px;font-weight:800;color:' + color + ';margin-bottom:3px;text-align:center">' + label + '</p>'
    + '<p style="font-size:11px;color:#6B7280;margin-bottom:12px;text-align:center">' + hint + '</p>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<input id="tri-meas-input" type="text" inputmode="decimal" placeholder="ex: 3,45" onkeydown="if(event.key===\'Enter\')triValidate()" style="flex:1;font-size:26px;font-weight:700;text-align:center;padding:12px;border-radius:10px;border:2px solid ' + color + ';font-family:inherit;outline:none;background:#fff">'
    + '<span style="font-size:16px;color:#6B7280;font-weight:700">m</span></div>'
    + '<button onclick="triValidate()" style="width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(135deg,' + color + ',' + grad + ');color:#fff;font-weight:800;font-size:16px;cursor:pointer;font-family:inherit;margin-top:10px">✅ Valider</button>'
    + '<button onclick="triReset()" style="width:100%;padding:9px;border-radius:9px;border:2px solid #E5E7EB;background:#fff;color:#9CA3AF;font-weight:600;cursor:pointer;font-family:inherit;font-size:12px;margin-top:8px">🔄 Tout recommencer</button>'
    + '</div>';
}

function triHtmlResult() {
  var calc = triCalculate(), hasErr = calc.triangles.some(function(t){return !t.valid;});
  var detail = calc.triangles.map(function(t,i){
    return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6;font-size:12px">'
      + '<span style="color:#6B7280">▲ Triangle ' + (i+1) + '</span>'
      + '<span style="font-weight:700;color:' + (t.valid?'#374151':'#DC2626') + '">' + (t.valid?t.area.toFixed(3)+' m²':'⚠️ invalide') + '</span></div>';
  }).join('');
  return '<div class="card">'
    + '<h2 style="font-size:15px;font-weight:800;margin-bottom:6px;color:#059669">📐 Résultat</h2>'
    + '<canvas id="tri-canvas" width="320" height="180" style="width:100%;border-radius:10px;display:block;margin-bottom:12px"></canvas>'
    + '<div class="calc-result"><div style="color:rgba(255,255,255,.8);font-size:12px;margin-bottom:4px">Surface totale calculée</div>'
    + '<div style="color:#fff;font-size:40px;font-weight:800">' + calc.total.toFixed(2) + ' m²</div></div>'
    + (hasErr ? '<div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:8px;padding:10px;margin-top:10px;font-size:12px;color:#991B1B">⚠️ Un ou plusieurs triangles ont des mesures incompatibles. Vérifiez vos valeurs.</div>' : '')
    + '<div style="margin:12px 0"><p style="font-size:11px;font-weight:700;color:#9CA3AF;margin-bottom:6px;letter-spacing:.5px">DÉTAIL PAR TRIANGLE</p>' + detail + '</div>'
    + '<button onclick="triReset()" style="width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit">🔄 Nouveau calcul</button>'
    + '</div>';
}

function triInitCanvas() {
  var canvas = document.getElementById('tri-canvas');
  if (!canvas) return;
  canvas.removeEventListener('pointerdown', triCanvasClick);
  triDrawCanvas();
  if (window.tri_phase === 'draw') {
    canvas.addEventListener('pointerdown', triCanvasClick);
  }
  if (window.tri_phase === 'walls' || window.tri_phase === 'diagonals') {
    var inp = document.getElementById('tri-meas-input');
    if (inp) setTimeout(function(){ inp.focus(); }, 80);
  }
}

function triDrawCanvas() {
  var canvas = document.getElementById('tri-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var CW = canvas.width, CH = canvas.height;
  var pts = window.tri_pts || [], N = pts.length;
  var phase = window.tri_phase || 'draw', cur = window.tri_cur || 0;
  ctx.clearRect(0,0,CW,CH);
  ctx.fillStyle = '#F8F9FB'; ctx.fillRect(0,0,CW,CH);
  if (N === 0) {
    ctx.fillStyle='#C4C9D4'; ctx.font='13px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Tapez ici pour placer les coins', CW/2, CH/2);
    ctx.textBaseline='alphabetic'; ctx.textAlign='left'; return;
  }
  // Polygon edges (gray)
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (var i=1;i<N;i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (phase !== 'draw') ctx.closePath();
  ctx.strokeStyle='#9CA3AF'; ctx.lineWidth=2; ctx.setLineDash([]); ctx.stroke();
  // Highlight current wall
  if (phase === 'walls') {
    var p1=pts[cur], p2=pts[(cur+1)%N];
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle='#0891B2'; ctx.lineWidth=5; ctx.setLineDash([]); ctx.stroke();
  }
  // Diagonals
  if ((phase==='diagonals'||phase==='result') && N>=4) {
    var nd=N-3;
    for (var d=0;d<nd;d++) {
      var act=(phase==='diagonals'&&d===cur);
      ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[d+2].x,pts[d+2].y);
      ctx.strokeStyle=act?'#DC2626':'#BDBDBD'; ctx.lineWidth=act?4:1.5;
      ctx.setLineDash(act?[]:[5,4]); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  // Corner labels
  ctx.setLineDash([]);
  for (var i=0;i<N;i++) {
    var p=pts[i];
    ctx.beginPath(); ctx.arc(p.x,p.y,7,0,Math.PI*2);
    ctx.fillStyle=(i===0)?'#7C3AED':'#374151'; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 9px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(i+1, p.x, p.y);
  }
  ctx.textBaseline='alphabetic'; ctx.textAlign='left';
}

function triCanvasClick(e) {
  e.preventDefault();
  var canvas=document.getElementById('tri-canvas'); if(!canvas)return;
  var rect=canvas.getBoundingClientRect();
  var sx=canvas.width/rect.width, sy=canvas.height/rect.height;
  var cx=e.touches?e.touches[0].clientX:e.clientX;
  var cy=e.touches?e.touches[0].clientY:e.clientY;
  window.tri_pts=window.tri_pts||[];
  window.tri_pts.push({x:Math.round((cx-rect.left)*sx), y:Math.round((cy-rect.top)*sy)});
  triDrawCanvas();
  var N=window.tri_pts.length, ok=N>=3;
  var countEl=document.getElementById('tri-count');
  var closeBtn=document.getElementById('tri-close-btn');
  var undoBtn=document.getElementById('tri-undo-btn');
  if(countEl){
    countEl.textContent=N===0?'Tapez sur le canevas pour placer les coins':N<3?N+' coin(s) placé(s) — continuez':'✓ '+N+' coins — prêt à mesurer';
    countEl.style.color=ok?'#059669':'#374151';
  }
  if(closeBtn){
    closeBtn.textContent='✅ Fermer la pièce ('+N+' coins)'; closeBtn.disabled=!ok;
    closeBtn.style.background=ok?'linear-gradient(135deg,#7C3AED,#6D28D9)':'#E5E7EB';
    closeBtn.style.color=ok?'#fff':'#9CA3AF'; closeBtn.style.cursor=ok?'pointer':'default';
  }
  if(undoBtn){undoBtn.disabled=N===0; undoBtn.style.opacity=N===0?'.3':'1';}
}

function triUndo() {
  window.tri_pts=window.tri_pts||[];
  if(window.tri_pts.length>0) window.tri_pts.pop();
  setCarrezTab('tri');
}

function triStartMeasure() {
  var N=(window.tri_pts||[]).length; if(N<3)return;
  window.tri_phase='walls'; window.tri_walls=[]; window.tri_diags=[]; window.tri_cur=0;
  setCarrezTab('tri');
}

function triValidate() {
  var inp=document.getElementById('tri-meas-input'); if(!inp)return;
  var val=parseFloat(inp.value.replace(',','.'));
  if(isNaN(val)||val<=0){inp.style.borderColor='#DC2626';inp.focus();return;}
  var phase=window.tri_phase, cur=window.tri_cur||0, N=(window.tri_pts||[]).length;
  if(phase==='walls'){
    (window.tri_walls=window.tri_walls||[])[cur]=val;
    if(cur+1>=N){window.tri_phase=N<=3?'result':'diagonals';window.tri_cur=0;}
    else {window.tri_cur=cur+1;}
  } else if(phase==='diagonals'){
    (window.tri_diags=window.tri_diags||[])[cur]=val;
    if(cur+1>=N-3){window.tri_phase='result';}
    else {window.tri_cur=cur+1;}
  }
  setCarrezTab('tri');
}

function triCalculate() {
  var N=(window.tri_pts||[]).length, W=window.tri_walls||[], D=window.tri_diags||[];
  function heron(a,b,c){
    if(!a||!b||!c||a<=0||b<=0||c<=0)return{area:0,valid:false};
    var s=(a+b+c)/2, v=s*(s-a)*(s-b)*(s-c);
    return v>0?{area:Math.sqrt(v),valid:true}:{area:0,valid:false};
  }
  function dist0k(k){
    if(k===1)return W[0];
    if(k===N-1)return W[N-1];
    return D[k-2];
  }
  var triangles=[],total=0;
  for(var t=0;t<N-2;t++){
    var a=dist0k(t+1), b=W[t+1], c=dist0k(t+2);
    var r=heron(a,b,c);
    triangles.push({a:a,b:b,c:c,area:r.area,valid:r.valid});
    total+=r.area;
  }
  return{total:total,triangles:triangles};
}

function triReset() {
  window.tri_phase='draw'; window.tri_pts=[];
  window.tri_walls=[]; window.tri_diags=[]; window.tri_cur=0;
  setCarrezTab('tri');
}
