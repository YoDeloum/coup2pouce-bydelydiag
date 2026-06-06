// ─────────────────────────────────────────────
// COURS.JS — Rendu des cours et fiches
// ─────────────────────────────────────────────

// ─── RENDU CONTENU ───
function renderContenu(contenu, color) {
  return contenu.map(function(block) {
    if (block.type === 'h')     return '<p class="section-title" style="color:' + color + '">' + block.text + '</p>';
    if (block.type === 'photo') return '';
    return '<p>' + block.text + '</p>';
  }).join('');
}

// ─── RENDU COURS ───
function renderCours() {
  var d = DATA[curKey];

  if (curKey === 'Carrez') { renderCarrez(); return; }
  if (curKey === 'Materiel') { renderMateriel(); return; }
  if (curKey === 'Certif' && curCours === 1) { renderCertifPlanning(); return; }

  // Filtre sous-dossier DPE
  var coursToShow = d.cours;
  var sdSelector  = '';
  if (curKey === 'DPE' && d.cours.some(function(c) { return c.sd; })) {
    var activeSd = window.dpeSd || 'sans_mention';
    if (activeSd === 'mention') {
      coursToShow = d.cours.filter(function(c) { return c.sd === 'mention'; });
    } else {
      coursToShow = d.cours.filter(function(c) { return c.sd === 'both' || c.sd === 'sans_mention'; });
    }
    sdSelector = '<div style="display:flex;gap:6px;margin-bottom:14px">'
      + '<button onclick="setDpeSd(\'sans_mention\')" style="flex:1;padding:9px;border-radius:8px;border:2px solid ' + (activeSd==='sans_mention'?'#E8650A':'#E2E5F0') + ';background:' + (activeSd==='sans_mention'?'#E8650A18':'transparent') + ';cursor:pointer;font-weight:' + (activeSd==='sans_mention'?700:400) + ';color:' + (activeSd==='sans_mention'?'#E8650A':'#6B7280') + ';font-size:13px;font-family:inherit">🏠 DPE Sans Mention</button>'
      + '<button onclick="setDpeSd(\'mention\')" style="flex:1;padding:9px;border-radius:8px;border:2px solid ' + (activeSd==='mention'?'#C2410C':'#E2E5F0') + ';background:' + (activeSd==='mention'?'#C2410C18':'transparent') + ';cursor:pointer;font-weight:' + (activeSd==='mention'?700:400) + ';color:' + (activeSd==='mention'?'#C2410C':'#6B7280') + ';font-size:13px;font-family:inherit">🏢 DPE Mention</button>'
      + '</div>';
  }

  var nav = coursToShow.map(function(c, i) {
    return '<div class="cours-item" onclick="setCours(' + i + ')" style="background:' + (curCours===i?d.color+'12':'transparent') + ';border-color:' + (curCours===i?d.color+'44':'transparent') + '">'
      + '<span class="cours-num" style="background:' + (curCours===i?d.color:'#E2E5F0') + ';color:' + (curCours===i?'#fff':'#6B7280') + '">' + (i+1) + '</span>'
      + '<span style="font-size:13px;font-weight:' + (curCours===i?600:400) + ';color:' + (curCours===i?'#1A1D2E':'#6B7280') + '">' + c.titre + '</span>'
      + '</div>';
  }).join('');

  var c = coursToShow[curCours] || coursToShow[0];
  if (!c) return;

  var schema  = c.schema ? getSchema(c.schema) : '';
  var nextBtn = curCours < coursToShow.length - 1
    ? '<button class="btn btn-primary" style="background:' + d.color + '" onclick="setCours(' + (curCours+1) + ')">Suivant →</button>'
    : '<button class="btn btn-primary" style="background:' + d.color + '" onclick="showTab(\'fiches\')">📋 Voir les fiches →</button>';

  document.getElementById('tab-content-cours').innerHTML =
    sdSelector
    + '<div style="margin-bottom:12px">' + nav + '</div>'
    + '<div class="card">'
    + '<div style="margin-bottom:14px"><span class="chap-badge" style="background:' + d.color + '">Chapitre ' + (curCours+1) + '</span><h2 style="font-size:16px;font-weight:700;display:inline;margin-left:8px">' + c.titre + '</h2></div>'
    + '<div class="cours-content">' + renderContenu(c.contenu, d.color) + '</div>'
    + schema
    + '<div class="nav-btns">'
    + '<button class="btn btn-outline" onclick="setCours(' + Math.max(0, curCours-1) + ')" ' + (curCours===0?'disabled':'') + '>← Précédent</button>'
    + nextBtn
    + '</div>'
    + (d.driveUrl ? '<a href="' + d.driveUrl + '" target="_blank" class="drive-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6.28 3L1 12.5 6.28 22h11.44L23 12.5 17.72 3H6.28zM12 17.5L7 9h10l-5 8.5z"/></svg>👁️ Coup d\'œil — Photos terrain</a>' : '')
    + '</div>';
}

function setCours(i) {
  curCours = i;
  renderCours();
}

function setDpeSd(sd) {
  window.dpeSd = sd;
  curCours = 0;
  renderCours();
}

// ─── RENDU FICHES ───
function renderFiches() {
  var d = DATA[curKey];

  var cards = d.fiches.map(function(f) {
    return '<div class="fiche">'
      + '<div class="fiche-bar" style="background:' + d.color + '"></div>'
      + '<div class="fiche-label" style="color:' + d.color + '">' + f.t + '</div>'
      + '<div class="fiche-val">' + f.c + '</div>'
      + '</div>';
  }).join('');

  var top3 = d.fiches.slice(0,3).map(function(f) {
    return '<div style="display:flex;gap:7px;margin-bottom:6px;font-size:13px;color:#6B7280">'
      + '<span style="color:' + d.color + ';font-weight:700;flex-shrink:0">▸</span>'
      + '<span><strong style="color:#1A1D2E">' + f.t + ' : </strong>' + f.c + '</span>'
      + '</div>';
  }).join('');

  // Minuteurs spéciaux Gaz
  var timerHtml = curKey === 'Gaz' ? `
    <div class="card" style="margin-bottom:16px">
      <h3 style="font-weight:800;margin-bottom:14px;font-size:14px;color:#E8650A">⏱️ Minuteurs terrain GAZ</h3>
      <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px">Test étanchéité — 10 minutes</p>
      <div style="background:#1A1D2E;border-radius:12px;padding:14px 16px;text-align:center;margin-bottom:14px">
        <span style="font-size:10px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:6px">2 relevés à 10 min — résultat × 6 = L/h</span>
        <span id="td-etanch" style="font-size:38px;font-weight:800;font-family:monospace;color:#4ADE80;letter-spacing:4px;display:block;margin-bottom:8px">10:00</span>
        <div style="height:5px;background:#374151;border-radius:999px;overflow:hidden;margin-bottom:10px"><div id="tb-etanch" style="height:100%;width:100%;background:linear-gradient(90deg,#4ADE80,#22C55E);border-radius:999px;transition:width 1s linear"></div></div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button id="tbtn-etanch" onclick="gzStart('etanch',600)" style="padding:9px 18px;border-radius:8px;border:none;background:#4ADE80;color:#1A1D2E;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">▶ Démarrer</button>
          <button onclick="gzReset('etanch',600)" style="padding:9px 18px;border-radius:8px;border:none;background:#374151;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">↺ Reset</button>
        </div>
      </div>
      <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px">Test CO — 30 secondes</p>
      <div style="background:#1A1D2E;border-radius:12px;padding:14px 16px;text-align:center">
        <span style="font-size:10px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:6px">Ouvrants fermés — 50 cm chaudière — balayage</span>
        <span id="td-co" style="font-size:38px;font-weight:800;font-family:monospace;color:#4ADE80;letter-spacing:4px;display:block;margin-bottom:8px">00:30</span>
        <div style="height:5px;background:#374151;border-radius:999px;overflow:hidden;margin-bottom:10px"><div id="tb-co" style="height:100%;width:100%;background:linear-gradient(90deg,#4ADE80,#22C55E);border-radius:999px;transition:width 1s linear"></div></div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button id="tbtn-co" onclick="gzStart('co',30)" style="padding:9px 18px;border-radius:8px;border:none;background:#4ADE80;color:#1A1D2E;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">▶ Démarrer</button>
          <button onclick="gzReset('co',30)" style="padding:9px 18px;border-radius:8px;border:none;background:#374151;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">↺ Reset</button>
        </div>
      </div>
    </div>` : '';

  document.getElementById('tab-content-fiches').innerHTML = timerHtml
    + '<div style="margin-bottom:16px"><h2 style="font-size:19px;font-weight:800;margin-bottom:3px">Fiches Mémo</h2><p style="color:#6B7280;font-size:13px">Les points essentiels à retenir</p></div>'
    + '<div class="fiches-grid">' + cards + '</div>'
    + '<div class="card" style="margin-bottom:16px"><h3 style="font-weight:800;margin-bottom:10px;font-size:14px">📝 À retenir absolument</h3>' + top3 + '</div>';
}
