// ─────────────────────────────────────────────
// CERTIF.JS — Planning de certification DPE
// ─────────────────────────────────────────────

function renderCertifPlanning() {
  var d     = DATA['Certif'];
  var color = d.color;

  document.getElementById('tab-content-cours').innerHTML = `
    <div style="margin-bottom:12px">
      <div class="cours-item" onclick="setCours(0)" style="background:transparent;border-color:transparent">
        <span class="cours-num" style="background:#E2E5F0;color:#6B7280">1</span>
        <span style="font-size:13px;color:#6B7280">Mon cycle de certification</span>
      </div>
      <div class="cours-item" style="background:${color}12;border-color:${color}44">
        <span class="cours-num" style="background:${color};color:#fff">2</span>
        <span style="font-size:13px;font-weight:600;color:#1A1D2E">Mon planning personnel</span>
      </div>
    </div>
    <div class="card">
      <span class="chap-badge" style="background:${color}">Mon Planning</span>
      <h2 style="font-size:16px;font-weight:700;margin-left:8px;display:inline">Mon planning personnel</h2>
      <p style="font-size:13px;color:#6B7280;margin-top:12px;margin-bottom:18px;line-height:1.6">Renseignez vos dates d'échéances avec votre certificateur. Données sauvegardées sur votre appareil.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:5px">Date début certification</label>
          <input id="cf_date_debut" type="date" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit"/>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#6B7280;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:5px">Certificateur</label>
          <input id="cf_certificateur" type="text" placeholder="Ex: Certicer, Bureau Veritas..." style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit"/>
        </div>
      </div>
      <div style="background:#fafaf8;border-radius:10px;padding:14px;margin-bottom:16px">
        <p style="font-size:12px;font-weight:700;color:#6366F1;margin-bottom:12px;letter-spacing:1px;text-transform:uppercase">📋 Contrôles obligatoires</p>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #E2E5F0">
          <span style="font-size:10px;font-weight:700;color:#9ca3af;width:70px;text-align:center;flex-shrink:0">ANNÉE</span>
          <span style="font-size:10px;font-weight:700;color:#9ca3af;flex:1">CONTRÔLE</span>
          <span style="font-size:10px;font-weight:700;color:#9ca3af;width:120px;text-align:center;flex-shrink:0">DATE ÉCHÉANCE</span>
          <span style="font-size:10px;font-weight:700;color:#9ca3af;width:90px;text-align:center;flex-shrink:0">FRAIS PRÉVUS</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            {yr:'Année 1', bg:'#6366F1', id:'cd0',    label:'Contrôle documentaire 0'},
            {yr:'Année 1', bg:'#6366F1', id:'csol1',  label:'CSO En cours de diagnostic'},
            {yr:'Année 1', bg:'#6366F1', id:'tutorat',label:'Tutorat (2 missions)'},
            {yr:'Année 2', bg:'#8B5CF6', id:'cd1',    label:'Contrôle documentaire 1'},
            {yr:'Année 3', bg:'#A855F7', id:'csoa1',  label:'CSO Après diagnostic 1'},
            {yr:'Année 4', bg:'#8B5CF6', id:'cd2',    label:'Contrôle documentaire 2'},
            {yr:'Année 5', bg:'#A855F7', id:'csoa2',  label:'CSO Après diagnostic 2'},
            {yr:'Année 6', bg:'#8B5CF6', id:'cd3',    label:'Contrôle documentaire 3'},
          ].map(row => `
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:11px;background:${row.bg};color:#fff;padding:3px 6px;border-radius:999px;font-weight:600;white-space:nowrap;width:70px;text-align:center;flex-shrink:0">${row.yr}</span>
              <span style="font-size:12px;color:#374151;flex:1">${row.label}</span>
              <input id="cf_${row.id}" type="date" style="width:120px;padding:6px 8px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:11px;font-family:inherit;flex-shrink:0"/>
              <div style="position:relative;width:90px;flex-shrink:0">
                <input id="cf_frais_${row.id}" type="number" placeholder="0" style="width:100%;padding:6px 22px 6px 8px;border-radius:7px;border:1.5px solid #E2E5F0;font-size:11px;font-family:inherit"/>
                <span style="position:absolute;right:7px;top:50%;transform:translateY(-50%);font-size:10px;color:#9ca3af">€</span>
              </div>
            </div>`).join('')}
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px;padding-top:10px;border-top:2px solid #6366F1">
            <span style="font-size:11px;background:#1A1D2E;color:#fff;padding:3px 6px;border-radius:999px;font-weight:700;white-space:nowrap;width:70px;text-align:center;flex-shrink:0">TOTAL</span>
            <span style="font-size:13px;font-weight:700;color:#1A1D2E;flex:1">Budget total du cycle</span>
            <span style="width:120px;flex-shrink:0"></span>
            <div id="cf_total" style="width:90px;padding:6px 8px;border-radius:7px;background:#6366F118;border:1.5px solid #6366F1;font-size:13px;font-weight:700;color:#6366F1;text-align:center;flex-shrink:0">0 €</div>
          </div>
        </div>
      </div>
      <button id="certif_save_btn" onclick="saveCertifData()" style="width:100%;padding:13px;border-radius:9px;border:none;background:#6366F1;color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit">
        💾 Sauvegarder mon planning
      </button>
    </div>`;
  loadCertifData();
}

function calcCertifTotal() {
  var ids = ['cd0','csol1','tutorat','cd1','csoa1','cd2','csoa2','cd3'];
  var total = 0;
  ids.forEach(function(id) {
    var el = document.getElementById('cf_frais_' + id);
    if (el && el.value) total += parseFloat(el.value) || 0;
  });
  var tot = document.getElementById('cf_total');
  if (tot) tot.textContent = total.toFixed(0) + ' €';
}

function saveCertifData() {
  var data = {};
  var allIds = ['date_debut','certificateur','cd0','csol1','tutorat','cd1','csoa1','cd2','csoa2','cd3',
                'frais_cd0','frais_csol1','frais_tutorat','frais_cd1','frais_csoa1','frais_cd2','frais_csoa2','frais_cd3'];
  allIds.forEach(function(id) {
    var el = document.getElementById('cf_' + id);
    if (el) data[id] = el.value;
  });
  localStorage.setItem('certif_planning', JSON.stringify(data));
  calcCertifTotal();
  var btn = document.getElementById('certif_save_btn');
  btn.textContent = '✅ Sauvegardé !';
  btn.style.background = '#22C55E';
  setTimeout(function() { btn.textContent = '💾 Sauvegarder'; btn.style.background = '#6366F1'; }, 2000);
}

function loadCertifData() {
  try {
    var data   = JSON.parse(localStorage.getItem('certif_planning') || '{}');
    var allIds = ['date_debut','certificateur','cd0','csol1','tutorat','cd1','csoa1','cd2','csoa2','cd3',
                  'frais_cd0','frais_csol1','frais_tutorat','frais_cd1','frais_csoa1','frais_cd2','frais_csoa2','frais_cd3'];
    allIds.forEach(function(id) {
      var el = document.getElementById('cf_' + id);
      if (el && data[id]) el.value = data[id];
    });
    calcCertifTotal();
    ['cd0','csol1','tutorat','cd1','csoa1','cd2','csoa2','cd3'].forEach(function(id) {
      var el = document.getElementById('cf_frais_' + id);
      if (el) el.addEventListener('input', calcCertifTotal);
    });
  } catch(e) {}
}

function checkCertifRappels() {
  try {
    var data   = JSON.parse(localStorage.getItem('certif_planning') || '{}');
    var today  = new Date();
    var fields = ['cd0','csol1','tutorat','cd1','csoa1','cd2','csoa2','cd3'];
    var labels = {cd0:'Contrôle documentaire 0', csol1:'CSO en cours', tutorat:'Tutorat',
                  cd1:'Contrôle documentaire 1', csoa1:'CSO après diag 1',
                  cd2:'Contrôle documentaire 2', csoa2:'CSO après diag 2', cd3:'Contrôle documentaire 3'};
    fields.forEach(function(f) {
      if (!data[f]) return;
      var date = new Date(data[f]);
      var diff = Math.round((date - today) / (1000*60*60*24));
      if (diff > 0 && diff <= 60) {
        var banner = document.getElementById('certif-banner');
        if (banner) {
          banner.style.display = 'block';
          banner.innerHTML += '<div>⚠️ <strong>' + labels[f] + '</strong> dans ' + diff + ' jours (' + data[f] + ')</div>';
        }
      }
    });
  } catch(e) {}
}
