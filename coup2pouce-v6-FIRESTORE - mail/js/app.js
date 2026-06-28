// ─────────────────────────────────────────────
// APP.JS — Navigation principale et initialisation
// ─────────────────────────────────────────────

// ─── RENDU PAGE D'ACCUEIL ───
function renderHome() {
  var grid = document.getElementById('cards-grid');
  grid.innerHTML = KEYS.map(function(k) {
    var d    = DATA[k];
    var done = scores[k];
    return '<div class="mod-card" onclick="openModule(\'' + k + '\')" style="border-color:' + (done !== undefined ? d.color+'66' : '#E2E5F0') + '">'
      + '<div style="position:absolute;top:-8px;right:-8px;width:70px;height:70px;background:radial-gradient(circle,' + d.color + '18,transparent 70%);pointer-events:none"></div>'
      + '<div class="mod-icon">' + d.icon + '</div>'
      + '<div class="mod-label" style="color:' + d.color + '">' + d.label + '</div>'
      + '<div class="mod-title">' + d.full + '</div>'
      + '<div class="tags">'
      + '<span class="tag" style="background:' + d.color + '18;color:' + d.color + '">' + d.cours.length + ' cours</span>'
      + '<span class="tag" style="background:#fafaf8;color:#6B7280">' + d.fiches.length + ' fiches</span>'
      + '</div>'
      + '<span class="start-hint">→ Consulter</span>'
      + '</div>';
  }).join('');
  updateGlobalProg();
}

function updateGlobalProg() {
  var done = Object.keys(scores).length;
  document.getElementById('header-right').textContent = done + '/' + KEYS.length + ' modules';
  if (done > 0) {
    var pct = Math.round(Object.values(scores).reduce(function(a,b) { return a+b; }, 0) / KEYS.length);
    document.getElementById('global-prog-wrap').style.display = 'block';
    document.getElementById('global-pct').textContent = pct + '%';
    document.getElementById('global-pbar').style.width = pct + '%';
  }
}

// ─── NAVIGATION ───
function openModule(key) {
  curKey   = key;
  curCours = 0;
  curTab   = 'cours';
  document.getElementById('home').style.display   = 'none';
  document.getElementById('module').style.display = 'block';
  var backBtn = document.getElementById('back-btn');
  backBtn.style.display     = 'flex';
  backBtn.style.alignItems  = 'center';
  backBtn.style.justifyContent = 'center';
  var d = DATA[key];
  document.getElementById('header-right').innerHTML =
    '<span style="font-size:18px">' + d.icon + '</span> <strong style="font-size:13px;margin-left:5px">' + d.label + '</strong>';
  showTab('cours');
}

function showHome() {
  curKey = null;
  document.getElementById('home').style.display   = 'block';
  document.getElementById('module').style.display = 'none';
  document.getElementById('back-btn').style.display = 'none';
  renderHome();
}

function showTab(tab) {
  curTab = tab;
  // Cacher l'onglet fiches pour Matériel
  var tabFiches = document.getElementById('tab-fiches');
  if (tabFiches) tabFiches.style.display = (curKey === 'Materiel') ? 'none' : '';

  ['cours','fiches'].forEach(function(t) {
    var content = document.getElementById('tab-content-' + t);
    var btn     = document.getElementById('tab-' + t);
    content.style.display = t === tab ? 'block' : 'none';
    btn.classList.toggle('active', t === tab);
    btn.style.background = t === tab ? DATA[curKey].color : 'transparent';
    btn.style.color      = t === tab ? '#fff' : '#6B7280';
  });
  if (tab === 'cours')  renderCours();
  if (tab === 'fiches') renderFiches();
}

// ─── MATÉRIEL ───
function renderMateriel() {
  document.getElementById('tab-content-cours').innerHTML = `
    <div style="padding-bottom:20px">
      <p style="font-size:13px;color:#6B7280;margin-bottom:20px;line-height:1.6">Matériel sélectionné par DELY DIAG au meilleur rapport qualité/prix.</p>
      <div class="mat-section">
        <div class="mat-section-title" style="background:#E8650A18;color:#E8650A">🌡️ DPE</div>
        <div class="mat-grid">
          <div class="mat-card" style="border-color:#E8650A33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#E8650A18">📏</div><div><div class="mat-name">Laser-mètre CIGMAN CD-120G</div></div></div>
            <div class="mat-desc">Mesure laser de précision rechargeable — indispensable pour les relevés de surface lors du DPE.</div>
            <a href="https://www.amazon.fr/CIGMAN-Appareil-CD-120G-pr%C3%A9cision-Rechargeable/dp/B0D4YXVH77" target="_blank" class="mat-link mat-link-amazon">🛒 Voir sur Amazon</a>
          </div>
          <div class="mat-card" style="border-color:#E8650A33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#E8650A18">🌡️</div><div><div class="mat-name">Vitromètre laser</div></div></div>
            <div class="mat-desc">Mesure l'épaisseur des vitrages sans démontage — identifie simple, double ou triple vitrage.</div>
            <a href="https://www.testoon.com/shop/mergauge-gauge-32802" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
          <div class="mat-card" style="border-color:#E8650A33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#E8650A18">🔍</div><div><div class="mat-name">Caméra endoscopique</div></div></div>
            <div class="mat-desc">Inspection des zones inaccessibles — semi-rigide avec éclairage LED.</div>
            <a href="https://www.amazon.fr/Endoscopique-Ferdiiz-Inspection-Canalisation-Semi-Rigide/dp/B0DMK6P7V5" target="_blank" class="mat-link mat-link-amazon">🛒 Voir sur Amazon</a>
          </div>
        </div>
      </div>
      <div class="mat-section">
        <div class="mat-section-title" style="background:#3B82F618;color:#3B82F6">🔬 Amiante</div>
        <div class="mat-grid">
          <div class="mat-card" style="border-color:#3B82F633">
            <div class="mat-card-top"><div class="mat-icon" style="background:#3B82F618">🧴</div><div><div class="mat-name">Surfactant</div></div></div>
            <div class="mat-desc">Liquide ajouté au pulvérisateur avant prélèvement — limite l'émission de fibres.</div>
            <a href="https://www.testoon.com/shop/divsurfactant-surfactant-25152" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
          <div class="mat-card" style="border-color:#3B82F633">
            <div class="mat-card-top"><div class="mat-icon" style="background:#3B82F618">🤐</div><div><div class="mat-name">Sachets minigrip (double ensachage)</div></div></div>
            <div class="mat-desc">Double ensachage obligatoire des prélèvements amiante.</div>
            <a href="https://www.testoon.com/shop/divsacamprekit-sacamprekit-25112" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
        </div>
      </div>
      <div class="mat-section">
        <div class="mat-section-title" style="background:#8B5CF618;color:#8B5CF6">⚡ Électricité</div>
        <div class="mat-grid">
          <div class="mat-card" style="border-color:#8B5CF633">
            <div class="mat-card-top"><div class="mat-icon" style="background:#8B5CF618">⚡</div><div><div class="mat-name">Multifonction MW-9660 XL V2</div></div></div>
            <div class="mat-desc">Appareil multifonction — test différentiel, impédance de boucle, continuité, isolement.</div>
            <a href="https://www.testoon.com/shop/mw-9660-xl-v2-30583" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
        </div>
      </div>
      <div class="mat-section">
        <div class="mat-section-title" style="background:#F59E0B18;color:#F59E0B">🔥 Gaz</div>
        <div class="mat-grid">
          <div class="mat-card" style="border-color:#F59E0B33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#F59E0B18">💨</div><div><div class="mat-name">Testeur CO — KIMCO 110</div></div></div>
            <div class="mat-desc">Détecteur de monoxyde de carbone — mesure en PPM.</div>
            <a href="https://www.testoon.com/shop/kimco110-co110-42639" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
          <div class="mat-card" style="border-color:#F59E0B33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#F59E0B18">🏷️</div><div><div class="mat-name">Étiquettes DGI gaz</div></div></div>
            <div class="mat-desc">Étiquettes de condamnation obligatoires en cas de Danger Grave et Immédiat.</div>
            <a href="https://www.testoon.com/shop/divetiqgaz-etiqgaz-24855" target="_blank" class="mat-link mat-link-testoon">🔗 Voir sur Testoon</a>
          </div>
        </div>
      </div>
      <div class="mat-section">
        <div class="mat-section-title" style="background:#22C55E18;color:#22C55E">🪲 Termites</div>
        <div class="mat-grid">
          <div class="mat-card" style="border-color:#22C55E33">
            <div class="mat-card-top"><div class="mat-icon" style="background:#22C55E18">🔩</div><div><div class="mat-name">Poinçon Stanley FatMax</div></div></div>
            <div class="mat-desc">Poinçonnage des bois tous les 20 cm pour détecter insectes xylophages et champignons.</div>
            <a href="https://www.amazon.fr/Stanley-0-65-491-Poin%C3%A7on-FatMax-diam%C3%A8tre-5-x-75-mm/dp/B008DI253G" target="_blank" class="mat-link mat-link-amazon">🛒 Voir sur Amazon</a>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── APPAREIL PHOTO ───
function handleCameraPhoto(input) {
  if (input.files && input.files[0]) {
    alert('📷 Photo prise : ' + input.files[0].name + '\nElle a été sauvegardée dans votre galerie.');
    input.value = '';
  }
}

// ─── INIT GLOBAL ───
function initApp() {
  checkLogin();
  initPrenom();
  initDark();
  initAstuce();
  checkCertifRappels();
  renderHome();

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }

  // Raccourci Enter sur le champ mot de passe
  var pwdInput = document.getElementById('login-password');
  if (pwdInput) {
    pwdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') firebaseLogin();
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
