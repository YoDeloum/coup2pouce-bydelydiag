// ─────────────────────────────────────────────
// FEUILLE-VISITE-MISSION.JS
// Feuille de visite terrain intégrée à la mission
// 3 onglets : Infos bien, Métrage, Croquis
// Sauvegarde dans missions[currentMissionIdx].feuille_visite
// ─────────────────────────────────────────────

// ── Ouvrir la feuille depuis le bouton mission ──
function ouvrirFeuilleVisite() {
  // Sauvegarder la mission courante d'abord pour avoir un idx valide
  var data = getMissionFormData();
  if (currentMissionIdx !== null) {
    missions[currentMissionIdx] = Object.assign({}, missions[currentMissionIdx], data);
  } else {
    missions.push(data);
    currentMissionIdx = missions.length - 1;
  }
  localStorage.setItem('dd_missions', JSON.stringify(missions));
  missionView = 'feuille_visite';
  renderMissionScreen();
}

// ── Renderer principal ──
function renderFeuilleVisite(body) {
  var m  = missions[currentMissionIdx] || {};
  var fv = m.feuille_visite || {};

  // Correspondance diagnostics → prestations
  var diagMap = {
    'DPE':          'dpe',
    'DPE Projeté':  'audit',
    'Audit énergétique': 'audit',
    'Amiante':      'amiante',
    'Plomb':        'plomb',
    'Termites':     'termites',
    'Électricité':  'elec',
    'Gaz':          'gaz',
    'Carrez':       'carrez',
    'Boutin':       'boutin',
    'ERP':          'erp',
    'Assainissement': 'assainissement'
  };
  var prestaFromMission = (m.diags || []).map(function(d) { return diagMap[d]; }).filter(Boolean);

  // Correspondance type bien
  var typeBienMap = {
    'Maison':           'maison',
    'Appartement':      'appartement',
    'Immeuble':         'immeuble',
    'Local commercial': 'local-pro',
    'Dépendance':       'dependance'
  };
  var typeBienVal = typeBienMap[m.typeBien] || '';

  // Repères réglementaires auto depuis période construction
  var reglAutoVals = (fv.cg_reglementaire) ? fv.cg_reglementaire : (function() {
    var vals = [];
    var p = m.periode_construction || '';
    if (p === 'Avant 1949') { vals.push('plomb'); vals.push('amiante'); }
    else if (p === '1949-1997') vals.push('amiante');
    if ((m.diags || []).includes('Électricité')) vals.push('elec15');
    if ((m.diags || []).includes('Gaz')) vals.push('gaz15');
    if ((m.diags || []).includes('Termites')) vals.push('termites');
    return vals;
  })();

  // Profil opérateur
  var profil = (typeof getCompanyProfile === 'function') ? getCompanyProfile() : {};

  body.innerHTML = `
    <button onclick="missionView='form';renderMissionScreen()"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#2D6A4F;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px;font-family:inherit">← Retour à la mission</button>

    <!-- Titre -->
    <div style="background:linear-gradient(135deg,#2D6A4F,#1B4332);border-radius:12px;padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:15px;font-weight:800;color:#fff">📋 Feuille de visite</div>
        <div style="font-size:11px;color:#95D5B2;margin-top:2px">${m.adresse||'Adresse non renseignée'}</div>
      </div>
      <button onclick="sauvegarderFeuilleVisite()" style="padding:10px 16px;border-radius:8px;border:none;background:#52B788;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 Sauvegarder</button>
    </div>

    <!-- Onglets -->
    <div style="display:flex;background:#1B4332;border-radius:10px 10px 0 0;overflow:hidden;margin-bottom:0">
      <div id="fv-tab-0" class="fv-tab fv-tab-active" onclick="fvShowTab(0)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border-bottom:3px solid #52B788">📋 Infos</div>
      <div id="fv-tab-1" class="fv-tab" onclick="fvShowTab(1)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;font-weight:700;color:#95D5B2;cursor:pointer;border-bottom:3px solid transparent">📐 Métrage</div>
      <div id="fv-tab-2" class="fv-tab" onclick="fvShowTab(2)" style="flex:1;padding:12px 6px;text-align:center;font-size:13px;font-weight:700;color:#95D5B2;cursor:pointer;border-bottom:3px solid transparent">✏️ Croquis</div>
    </div>

    <!-- ════════════════════════════════════ -->
    <!-- PAGE 0 — INFORMATIONS              -->
    <!-- ════════════════════════════════════ -->
    <div id="fv-page-0" style="background:#fff;border-radius:0 0 12px 12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">

      <!-- Dossier -->
      <div style="background:linear-gradient(135deg,#40916C,#2D6A4F);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px">
        ${fvField('fv-dossier','N° de dossier',fv.dossier||m.devis_ref||'','text','2026-001','#fff','rgba(255,255,255,.15)','rgba(255,255,255,.3)','#95D5B2')}
        ${fvField('fv-date','Date de visite',fv.date||m.date||'','date','','#fff','rgba(255,255,255,.15)','rgba(255,255,255,.3)','#95D5B2')}
        ${fvField('fv-heure-arr','Heure arrivée',fv.heure_arr||m.heure||'','time','','#fff','rgba(255,255,255,.15)','rgba(255,255,255,.3)','#95D5B2')}
        ${fvField('fv-heure-dep','Heure départ',fv.heure_dep||'','time','','#fff','rgba(255,255,255,.15)','rgba(255,255,255,.3)','#95D5B2')}
        ${fvField('fv-operateur','Opérateur',fv.operateur||profil.nom_responsable||profil.nom_societe||'','text','Diagnostiqueur','#fff','rgba(255,255,255,.15)','rgba(255,255,255,.3)','#95D5B2')}
      </div>

      <!-- CLIENT -->
      <div style="${fvSection()}">
        <div style="${fvSectionTitle()}">👤 Client</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="grid-column:1/-1">${fvField('fv-client-nom','Nom / Raison sociale',(fv.client_nom||((m.societe?m.societe+' — ':'')+m.nom+' '+m.prenom).trim()),'text','SCI Dupont')}</div>
          <div style="grid-column:1/-1">${fvField('fv-client-adresse','Adresse de facturation (si différente)',fv.client_adresse||'','text','12 rue de la Paix, 75001 Paris')}</div>
          ${fvField('fv-client-tel','Téléphone',fv.client_tel||m.tel||'','tel','06 00 00 00 00')}
          ${fvField('fv-client-email','E-mail',fv.client_email||m.email||'','email','contact@email.fr')}
          ${fvField('fv-proprio','Propriétaire (si différent)',fv.proprio||'','text','Nom propriétaire')}
          ${fvField('fv-present','Personne présente sur place',fv.present||'','text','Nom + rôle')}
        </div>
        <div style="margin-top:10px">
          <div style="${fvLabelStyle()}">Qualité du client</div>
          ${fvCheckGroup('fv-cg-qualite',['vendeur:Vendeur','bailleur:Bailleur','agence:Agence','notaire:Notaire','syndic:Syndic','autre:Autre'],fv.cg_qualite||[],false)}
        </div>
      </div>

      <!-- BIEN -->
      <div style="${fvSection()}">
        <div style="${fvSectionTitle()}">🏠 Bien immobilier</div>
        <div style="margin-bottom:10px">
          <div style="${fvLabelStyle()}">Type de bien</div>
          ${fvCheckGroup('fv-cg-type-bien',['maison:Maison','appartement:Appartement','immeuble:Immeuble','local-pro:Local professionnel','dependance:Dépendance','terrain:Terrain'],fv.cg_type_bien||[typeBienVal].filter(Boolean),true)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="grid-column:1/-1">${fvField('fv-adresse','Adresse du bien',fv.adresse||m.adresse||'','text','15 rue Victor Hugo')}</div>
          ${fvField('fv-cp','Code postal',fv.cp||'','text','13001')}
          ${fvField('fv-ville','Commune',fv.ville||'','text','Marseille')}
          ${fvField('fv-bat','Bâtiment',fv.bat||'','text','A')}
          ${fvField('fv-esc','Escalier',fv.esc||'','text','2')}
          ${fvField('fv-etage','Étage',fv.etage||'','text','3ème')}
          ${fvField('fv-porte','Porte / Appt',fv.porte||'','text','12')}
          ${fvField('fv-lot','N° de lot',fv.lot||'','text','LOT 47')}
          ${fvField('fv-tantiemes','Tantièmes',fv.tantiemes||'','text','325/10000')}
          ${fvField('fv-section','Section cadastrale',fv.section||'','text','AB')}
          ${fvField('fv-parcelle','Parcelle',fv.parcelle||'','text','0042')}
          ${fvField('fv-annee','Année de construction',fv.annee||m.annee||'','text','1972')}
          ${fvField('fv-pc','Date du permis de construire',fv.pc||'','text','15/04/1971')}
          ${fvField('fv-niveaux','Nb de niveaux',fv.niveaux||'','number','2')}
          ${fvField('fv-pieces','Nb de pièces',fv.pieces||m.nb_pieces||'','number','4')}
          ${fvField('fv-surface','Surface annoncée (m²)',fv.surface||m.surface||'','number','68')}
          ${fvField('fv-hsp','Hauteur sous plafond (m)',fv.hsp||'','number','2.50')}
          <div style="grid-column:1/-1">${fvField('fv-chauffage','Chauffage / Énergie',fv.chauffage||'','text','Gaz collectif / électrique...')}</div>
        </div>
        <div style="margin-top:12px">
          <div style="${fvLabelStyle()}">Annexes</div>
          ${fvCheckGroup('fv-cg-annexes',['cave:Cave','garage:Garage','combles:Combles','vide-san:Vide sanitaire','terrasse:Terrasse','jardin:Jardin'],fv.cg_annexes||[],false)}
        </div>
      </div>

      <!-- REPÈRES RÉGLEMENTAIRES -->
      <div style="${fvSection()}">
        <div style="${fvSectionTitle()}">⚖️ Repères réglementaires</div>
        ${fvCheckGroup('fv-cg-regl',['amiante:PC avant 01/07/1997 (amiante)','plomb:Construit avant 01/01/1949 (plomb)','elec15:Électricité > 15 ans','gaz15:Gaz > 15 ans','termites:Commune en arrêté termites'],reglAutoVals,false)}
      </div>

      <!-- OCCUPATION & ACCÈS -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="${fvSection()}">
          <div style="${fvSectionTitle()}">🏡 Occupation</div>
          ${fvCheckGroup('fv-cg-occup',['occupe:Occupé','vacant:Vacant','meuble:Meublé','mineur:Enfant mineur'],fv.cg_occup||[],false)}
        </div>
        <div style="${fvSection()}">
          <div style="${fvSectionTitle()}">🔑 Accès</div>
          ${fvCheckGroup('fv-cg-acces',['cles:Clés remises','boite:Boîte à clés','code:Code / interphone','gardien:Gardien'],fv.cg_acces||[],false)}
        </div>
      </div>

      <!-- PRESTATIONS -->
      <div style="${fvSection()}">
        <div style="${fvSectionTitle()}">✅ Prestations commandées</div>
        ${fvCheckGroup('fv-cg-prest',['dpe:DPE','audit:Audit énergétique','amiante:Amiante','plomb:Plomb','termites:Termites','elec:Électricité','gaz:Gaz','carrez:Carrez','boutin:Boutin','erp:ERP','assainissement:Assainissement','bruit:Bruit aéroport'],fv.cg_prest||prestaFromMission,false)}
      </div>

      <!-- OBSERVATIONS -->
      <div style="${fvSection()}">
        <div style="${fvSectionTitle()}">📄 Documents remis &amp; Observations</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="${fvLabelStyle()}">Documents remis sur place</div>
            <textarea id="fv-docs-remis" style="${fvTextareaStyle()}">${fv.docs_remis||''}</textarea>
          </div>
          <div>
            <div style="${fvLabelStyle()}">Observations et points d'attention</div>
            <textarea id="fv-observations" style="${fvTextareaStyle()}">${fv.observations||m.notes||''}</textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════ -->
    <!-- PAGE 1 — MÉTRAGE                   -->
    <!-- ════════════════════════════════════ -->
    <div id="fv-page-1" style="display:none;background:#fff;border-radius:0 0 12px 12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        ${fvField('fv-m-adresse','Adresse du bien',fv.m_adresse||m.adresse||'','text','15 rue Victor Hugo, 13001 Marseille')}
        ${fvField('fv-m-hsp','HSP courante (m)',fv.m_hsp||'','number','2.50')}
      </div>

      <div style="overflow-x:auto;border-radius:8px;border:1px solid #E2E5F0">
        <table id="fv-metrage-table" style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#2D6A4F">
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:50px">Niv.</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:120px;text-align:left">Pièce</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:65px">Long.(m)</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:65px">Larg.(m)</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:65px">HSP(m)</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:75px">Surf.(m²)</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:70px">&lt;1,80m</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:55px">Carrez</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:55px">Boutin</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:100px;text-align:left">Obs.</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;min-width:32px"></th>
            </tr>
          </thead>
          <tbody id="fv-metrage-body"></tbody>
        </table>
      </div>

      <button onclick="fvAddRow()" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:10px 0;padding:10px;border-radius:8px;border:2px dashed #52B788;background:#F0FDF4;color:#2D6A4F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">➕ Ajouter une pièce</button>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:8px">
        <div style="background:#fff;border-radius:10px;padding:10px;text-align:center;border:1px solid #E2E5F0">
          <div style="font-size:10px;color:#6B7280;font-weight:600">Surface plancher</div>
          <div id="fv-t-plancher" style="font-size:18px;font-weight:800;color:#1B4332">0,00 m²</div>
        </div>
        <div style="background:#D8F3DC;border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#2D6A4F;font-weight:600">Carrez</div>
          <div id="fv-t-carrez" style="font-size:18px;font-weight:800;color:#1B4332">0,00 m²</div>
        </div>
        <div style="background:#D8F3DC;border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#2D6A4F;font-weight:600">Boutin</div>
          <div id="fv-t-boutin" style="font-size:18px;font-weight:800;color:#1B4332">0,00 m²</div>
        </div>
        <div style="background:#fff;border-radius:10px;padding:10px;text-align:center;border:1px solid #E2E5F0">
          <div style="font-size:10px;color:#6B7280;font-weight:600">Écart / annoncé</div>
          <div id="fv-t-ecart" style="font-size:18px;font-weight:800;color:#6B7280">—</div>
        </div>
      </div>

      <div style="margin-top:12px">
        <div style="${fvLabelStyle()}">Surfaces exclues et motifs</div>
        <textarea id="fv-m-exclusions" style="${fvTextareaStyle()};min-height:50px">${fv.m_exclusions||''}</textarea>
      </div>

      <div style="margin-top:8px;padding:10px;background:#FFF7ED;border-radius:8px;font-size:11px;color:#92400E;line-height:1.7">
        <strong>Carrez :</strong> exclure caves, garages, combles non aménagés, balcons, terrasses et toute surface sous 1,80 m.<br>
        <strong>Boutin :</strong> surface habitable — exclure en plus vérandas, sous-sols, emprise des cloisons et embrasures.
      </div>
    </div>

    <!-- ════════════════════════════════════ -->
    <!-- PAGE 2 — CROQUIS                   -->
    <!-- ════════════════════════════════════ -->
    <div id="fv-page-2" style="display:none;background:#fff;border-radius:0 0 12px 12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        ${fvField('fv-c-niveau','Niveau représenté',fv.c_niveau||'','text','RDC / 1er…')}
        ${fvField('fv-c-echelle','Échelle approx.',fv.c_echelle||'','text','1 cm = 1 m')}
        ${fvField('fv-c-nord','Nord',fv.c_nord||'','text','↑ (haut de page)')}
      </div>

      <!-- Toolbar croquis -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;align-items:center">
        <button id="fv-tool-pen" onclick="fvSetTool('pen')" style="${fvToolBtn(true)}">✏️ Stylo</button>
        <button id="fv-tool-eraser" onclick="fvSetTool('eraser')" style="${fvToolBtn(false)}">🧽 Gomme</button>
        <div style="display:flex;gap:6px;align-items:center">
          <div id="fv-col-0" onclick="fvSetColor('#1B1B1B',0)" style="width:26px;height:26px;border-radius:50%;background:#1B1B1B;cursor:pointer;border:3px solid #1B4332;flex-shrink:0" title="Noir"></div>
          <div id="fv-col-1" onclick="fvSetColor('#1a56e8',1)" style="width:26px;height:26px;border-radius:50%;background:#1a56e8;cursor:pointer;border:3px solid transparent;flex-shrink:0" title="Bleu"></div>
          <div id="fv-col-2" onclick="fvSetColor('#e83a1a',2)" style="width:26px;height:26px;border-radius:50%;background:#e83a1a;cursor:pointer;border:3px solid transparent;flex-shrink:0" title="Rouge (cotes)"></div>
          <div id="fv-col-3" onclick="fvSetColor('#059669',3)" style="width:26px;height:26px;border-radius:50%;background:#059669;cursor:pointer;border:3px solid transparent;flex-shrink:0" title="Vert"></div>
        </div>
        <label style="font-size:12px;font-weight:600;color:#6B7280;display:flex;align-items:center;gap:4px">
          ✏️ <input type="range" id="fv-stroke" min="1" max="12" value="${fv.stroke_size||2}" oninput="fvStrokeVal=parseInt(this.value)" style="width:70px"/>
        </label>
        <button onclick="fvUndo()" style="${fvToolBtn(false)}">↩️ Annuler</button>
        <button onclick="fvClearCanvas()" style="${fvToolBtn(false)}">🗑️ Effacer</button>
      </div>

      <div id="fv-canvas-wrap" style="position:relative;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);touch-action:none">
        <canvas id="fv-grid-canvas" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>
        <canvas id="fv-draw-canvas" style="position:relative;display:block;cursor:crosshair;touch-action:none"></canvas>
      </div>
      <div style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:6px">Dessin au doigt ou au stylet — papier millimétré 5 mm</div>
    </div>

    <!-- Bouton sauvegarder en bas -->
    <button onclick="sauvegarderFeuilleVisite()" style="width:100%;margin-top:14px;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#2D6A4F,#1B4332);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">💾 Sauvegarder la feuille de visite</button>
  `;

  // Initialiser les données du métrage sauvegardées (ou pièces par défaut)
  var savedRows = fv.metrage_rows || [];
  var fvRowCount = 0;
  if (savedRows.length > 0) {
    savedRows.forEach(function(r) { fvAddRow(r); });
  } else {
    ['Entrée','Séjour','Cuisine','Chambre 1','Chambre 2','Salle de bain','WC','Couloir'].forEach(function(p) {
      fvAddRow({piece: p, carrez: true, boutin: true});
    });
  }
  fvRecalcTotals();

  // Initialiser le canvas (après rendu DOM)
  setTimeout(function() {
    fvInitCanvas(fv.canvas_img || null, fv.stroke_size || 2);
  }, 80);
}

// ── Styles helpers ──
function fvSection() {
  return 'background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid #E8F5E9';
}
function fvSectionTitle() {
  return 'font-size:11px;font-weight:800;color:#2D6A4F;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #D8F3DC';
}
function fvLabelStyle() {
  return 'font-size:11px;font-weight:600;color:#6B7280;margin-bottom:6px';
}
function fvTextareaStyle() {
  return 'width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;outline:none;background:#FAFAFA;resize:vertical;min-height:65px;box-sizing:border-box';
}
function fvToolBtn(active) {
  return 'padding:8px 12px;border-radius:8px;border:2px solid '+(active?'#2D6A4F':'#E2E5F0')+';background:'+(active?'#D8F3DC':'#fff')+';font-size:12px;font-weight:600;cursor:pointer;font-family:inherit';
}
function fvField(id, label, value, type, placeholder, txtColor, bg, borderColor, labelColor) {
  txtColor   = txtColor   || '#1B1B1B';
  bg         = bg         || '#FAFAFA';
  borderColor= borderColor|| '#E2E5F0';
  labelColor = labelColor || '#6B7280';
  return '<div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:130px">'
    + '<label style="font-size:11px;font-weight:600;color:'+labelColor+'">'+label+'</label>'
    + '<input id="'+id+'" type="'+type+'" value="'+String(value).replace(/"/g,'&quot;')+'" placeholder="'+placeholder+'"'
    + ' style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid '+borderColor+';font-size:13px;font-family:inherit;outline:none;background:'+bg+';color:'+txtColor+';box-sizing:border-box"/>'
    + '</div>';
}
function fvCheckGroup(id, items, checked, exclusive) {
  return '<div id="'+id+'" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">'
    + items.map(function(item) {
        var parts = item.split(':');
        var val = parts[0], lbl = parts[1];
        var on  = checked.indexOf(val) >= 0;
        return '<div class="fv-check-btn" data-group="'+id+'" data-val="'+val+'" data-exclusive="'+(exclusive?'1':'0')+'"'
          + ' onclick="fvToggleCheck(this)"'
          + ' style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;border:1.5px solid '+(on?'#52B788':'#E2E5F0')+';background:'+(on?'#D8F3DC':'#FAFAFA')+';font-size:13px;font-weight:600;cursor:pointer;min-height:40px">'
          + '<span style="width:18px;height:18px;border-radius:4px;border:2px solid '+(on?'#2D6A4F':'#ccc')+';background:'+(on?'#2D6A4F':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:#fff">'+(on?'✓':'')+'</span>'
          + lbl + '</div>';
      }).join('')
    + '</div>';
}

// ── Checkboxes ──
function fvToggleCheck(btn) {
  var groupId   = btn.dataset.group;
  var exclusive = btn.dataset.exclusive === '1';
  if (exclusive) {
    document.querySelectorAll('.fv-check-btn[data-group="'+groupId+'"]').forEach(function(b) {
      b.style.background = '#FAFAFA';
      b.style.borderColor = '#E2E5F0';
      var sp = b.querySelector('span');
      sp.style.background='transparent'; sp.style.borderColor='#ccc'; sp.textContent='';
    });
  }
  var isOn = btn.style.background === 'rgb(216, 243, 220)'; // #D8F3DC
  if (!exclusive) isOn = !isOn;
  else isOn = false; // after reset, always turn on
  // Si on réclique sur le même en mode exclusif → le décocher
  if (exclusive && btn.style.background === 'rgb(216, 243, 220)') isOn = true; // toggle off
  btn.style.background = isOn ? '#FAFAFA' : '#D8F3DC';
  btn.style.borderColor = isOn ? '#E2E5F0' : '#52B788';
  var sp = btn.querySelector('span');
  sp.style.background = isOn ? 'transparent' : '#2D6A4F';
  sp.style.borderColor = isOn ? '#ccc' : '#2D6A4F';
  sp.textContent = isOn ? '' : '✓';
}

function fvGetChecked(groupId) {
  var vals = [];
  document.querySelectorAll('.fv-check-btn[data-group="'+groupId+'"]').forEach(function(b) {
    if (b.style.background === 'rgb(216, 243, 220)') vals.push(b.dataset.val);
  });
  return vals;
}

// ── Navigation onglets ──
function fvShowTab(n) {
  [0,1,2].forEach(function(i) {
    var page = document.getElementById('fv-page-'+i);
    var tab  = document.getElementById('fv-tab-'+i);
    if (page) page.style.display = i===n ? 'block' : 'none';
    if (tab) {
      tab.style.color = i===n ? '#fff' : '#95D5B2';
      tab.style.borderBottomColor = i===n ? '#52B788' : 'transparent';
    }
  });
  if (n===2) setTimeout(function() { fvInitCanvas(null, null); }, 60);
}

// ── Métrage ──
var fvRowCount = 0;
function fvAddRow(data) {
  data = data || {};
  fvRowCount++;
  var id = fvRowCount;
  var tbody = document.getElementById('fv-metrage-body');
  if (!tbody) return;
  var tr = document.createElement('tr');
  tr.id = 'fv-row-'+id;
  var even = id % 2 === 0;
  tr.style.background = even ? '#F9FAFB' : '#fff';

  var tdStyle = 'border:1px solid #E2E5F0;padding:2px 3px';
  var inStyle = 'width:100%;padding:5px 4px;border:none;background:transparent;font-size:13px;font-family:inherit;outline:none;text-align:center';

  tr.innerHTML =
    '<td style="'+tdStyle+'"><input type="text" value="'+(data.niv||'')+'" placeholder="RDC" style="'+inStyle+'"/></td>'
   +'<td style="'+tdStyle+'"><input type="text" value="'+(data.piece||'')+'" placeholder="Séjour…" style="'+inStyle+';text-align:left"/></td>'
   +'<td style="'+tdStyle+'"><input type="number" class="fv-long" value="'+(data.long||'')+'" placeholder="4.20" step="0.01" oninput="fvRecalcRow('+id+')" style="'+inStyle+'"/></td>'
   +'<td style="'+tdStyle+'"><input type="number" class="fv-larg" value="'+(data.larg||'')+'" placeholder="3.10" step="0.01" oninput="fvRecalcRow('+id+')" style="'+inStyle+'"/></td>'
   +'<td style="'+tdStyle+'"><input type="number" class="fv-hsp" value="'+(data.hsp||'')+'" placeholder="2.50" step="0.01" oninput="fvRecalcRow('+id+')" style="'+inStyle+'"/></td>'
   +'<td style="'+tdStyle+';background:#EEF9F3"><input type="number" class="fv-surf" value="'+(data.surf||'')+'" step="0.01" readonly tabindex="-1" style="'+inStyle+';font-weight:700;color:#1B4332;background:transparent"/></td>'
   +'<td style="'+tdStyle+'"><input type="number" class="fv-sous180" value="'+(data.sous180||'')+'" placeholder="0" step="0.01" oninput="fvRecalcTotals()" style="'+inStyle+'"/></td>'
   +'<td style="'+tdStyle+';text-align:center"><input type="checkbox" class="fv-carrez" '+(data.carrez!==false?'checked':'')+' onchange="fvRecalcTotals()" style="width:20px;height:20px;cursor:pointer"/></td>'
   +'<td style="'+tdStyle+';text-align:center"><input type="checkbox" class="fv-boutin" '+(data.boutin!==false?'checked':'')+' onchange="fvRecalcTotals()" style="width:20px;height:20px;cursor:pointer"/></td>'
   +'<td style="'+tdStyle+'"><input type="text" class="fv-obs" value="'+(data.obs||'')+'" placeholder="…" style="'+inStyle+';text-align:left"/></td>'
   +'<td style="'+tdStyle+'"><button onclick="fvRemoveRow('+id+')" style="padding:3px 7px;border-radius:6px;border:1px solid #FCA5A5;background:#FFF;color:#EF4444;font-size:12px;cursor:pointer">✕</button></td>';
  tbody.appendChild(tr);
  fvRecalcRow(id);
}
function fvRemoveRow(id) {
  var r = document.getElementById('fv-row-'+id);
  if (r) r.remove();
  fvRecalcTotals();
}
function fvRecalcRow(id) {
  var r = document.getElementById('fv-row-'+id);
  if (!r) return;
  var l = parseFloat(r.querySelector('.fv-long').value)||0;
  var w = parseFloat(r.querySelector('.fv-larg').value)||0;
  var s = l*w;
  r.querySelector('.fv-surf').value = s>0 ? s.toFixed(2) : '';
  fvRecalcTotals();
}
function fvRecalcTotals() {
  var totalP=0, totalC=0, totalB=0;
  document.querySelectorAll('#fv-metrage-body tr').forEach(function(r) {
    var s   = parseFloat(r.querySelector('.fv-surf').value)||0;
    var sub = parseFloat(r.querySelector('.fv-sous180').value)||0;
    totalP += s;
    if (r.querySelector('.fv-carrez').checked) totalC += (s-sub);
    if (r.querySelector('.fv-boutin').checked) totalB += (s-sub);
  });
  var set = function(id, txt) { var el=document.getElementById(id); if(el) el.textContent=txt; };
  set('fv-t-plancher', totalP.toFixed(2)+' m²');
  set('fv-t-carrez',   totalC.toFixed(2)+' m²');
  set('fv-t-boutin',   totalB.toFixed(2)+' m²');
  var announced = parseFloat((document.getElementById('fv-surface')||{}).value)||0;
  if (announced > 0) {
    var ecart = totalC - announced;
    var el = document.getElementById('fv-t-ecart');
    if (el) { el.textContent=(ecart>=0?'+':'')+ecart.toFixed(2)+' m²'; el.style.color=Math.abs(ecart)>1?'#E83A1A':'#059669'; }
  } else {
    var el=document.getElementById('fv-t-ecart'); if(el){el.textContent='—';el.style.color=''}
  }
}

// ── Canvas croquis ──
var _fvDrawCanvas=null, _fvDrawCtx=null, _fvGridCanvas=null, _fvDrawing=false;
var _fvTool='pen', _fvColor='#1B1B1B', _fvStrokeVal=2, _fvUndoStack=[], _fvCanvasReady=false;
var _fvSavedImg=null;

function fvInitCanvas(savedImg, strokeSize) {
  var wrap = document.getElementById('fv-canvas-wrap');
  if (!wrap) return;
  _fvDrawCanvas  = document.getElementById('fv-draw-canvas');
  _fvGridCanvas  = document.getElementById('fv-grid-canvas');
  if (!_fvDrawCanvas || !_fvGridCanvas) return;

  if (strokeSize) _fvStrokeVal = strokeSize;

  var W = Math.min(wrap.offsetWidth || 600, 760);
  var H = Math.round(W * 1.18);
  [_fvDrawCanvas, _fvGridCanvas].forEach(function(c) {
    c.width=W; c.height=H; c.style.width=W+'px'; c.style.height=H+'px';
  });
  _fvDrawCtx  = _fvDrawCanvas.getContext('2d');
  var gridCtx = _fvGridCanvas.getContext('2d');

  // Dessiner la grille
  gridCtx.clearRect(0,0,W,H);
  gridCtx.fillStyle='#fff'; gridCtx.fillRect(0,0,W,H);
  var cell = Math.round(W/80);
  gridCtx.strokeStyle='#D1E8DA'; gridCtx.lineWidth=0.5;
  for(var x=0;x<=W;x+=cell){gridCtx.beginPath();gridCtx.moveTo(x,0);gridCtx.lineTo(x,H);gridCtx.stroke()}
  for(var y=0;y<=H;y+=cell){gridCtx.beginPath();gridCtx.moveTo(0,y);gridCtx.lineTo(W,y);gridCtx.stroke()}
  gridCtx.strokeStyle='#A8D5B5'; gridCtx.lineWidth=1;
  for(var x=0;x<=W;x+=cell*2){gridCtx.beginPath();gridCtx.moveTo(x,0);gridCtx.lineTo(x,H);gridCtx.stroke()}
  for(var y=0;y<=H;y+=cell*2){gridCtx.beginPath();gridCtx.moveTo(0,y);gridCtx.lineTo(W,y);gridCtx.stroke()}

  // Restaurer image sauvegardée
  var imgData = savedImg || _fvSavedImg;
  if (imgData) {
    _fvSavedImg = imgData;
    var img = new Image();
    img.onload = function() { _fvDrawCtx.drawImage(img,0,0,W,H); };
    img.src = imgData;
  }

  if (!_fvCanvasReady) {
    _fvDrawCanvas.addEventListener('mousedown',  fvStartDraw);
    _fvDrawCanvas.addEventListener('mousemove',  fvMoveDraw);
    _fvDrawCanvas.addEventListener('mouseup',    fvEndDraw);
    _fvDrawCanvas.addEventListener('mouseleave', fvEndDraw);
    _fvDrawCanvas.addEventListener('touchstart', fvStartDraw, {passive:false});
    _fvDrawCanvas.addEventListener('touchmove',  fvMoveDraw,  {passive:false});
    _fvDrawCanvas.addEventListener('touchend',   fvEndDraw,   {passive:false});
    _fvCanvasReady = true;
  }
}

function fvGetPos(e) {
  var r  = _fvDrawCanvas.getBoundingClientRect();
  var sx = _fvDrawCanvas.width/r.width;
  var sy = _fvDrawCanvas.height/r.height;
  var src = e.touches ? e.touches[0] : e;
  return {x:(src.clientX-r.left)*sx, y:(src.clientY-r.top)*sy};
}
function fvStartDraw(e){e.preventDefault();_fvDrawing=true;fvSaveUndo();var p=fvGetPos(e);_fvDrawCtx.beginPath();_fvDrawCtx.moveTo(p.x,p.y)}
function fvMoveDraw(e){if(!_fvDrawing)return;e.preventDefault();var p=fvGetPos(e);_fvDrawCtx.lineTo(p.x,p.y);_fvDrawCtx.strokeStyle=_fvTool==='eraser'?'#fff':_fvColor;_fvDrawCtx.lineWidth=_fvTool==='eraser'?_fvStrokeVal*6:_fvStrokeVal;_fvDrawCtx.lineCap='round';_fvDrawCtx.lineJoin='round';_fvDrawCtx.stroke()}
function fvEndDraw(){_fvDrawing=false}
function fvSaveUndo(){if(_fvDrawCtx)_fvUndoStack.push(_fvDrawCtx.getImageData(0,0,_fvDrawCanvas.width,_fvDrawCanvas.height));if(_fvUndoStack.length>30)_fvUndoStack.shift()}
function fvUndo(){if(_fvUndoStack.length&&_fvDrawCtx)_fvDrawCtx.putImageData(_fvUndoStack.pop(),0,0)}
function fvClearCanvas(){if(!confirm('Effacer tout le croquis ?'))return;fvSaveUndo();if(_fvDrawCtx)_fvDrawCtx.clearRect(0,0,_fvDrawCanvas.width,_fvDrawCanvas.height)}

function fvSetTool(t) {
  _fvTool = t;
  ['pen','eraser'].forEach(function(n) {
    var btn = document.getElementById('fv-tool-'+n);
    if (!btn) return;
    var on = n===t;
    btn.style.borderColor = on?'#2D6A4F':'#E2E5F0';
    btn.style.background  = on?'#D8F3DC':'#fff';
  });
}
function fvSetColor(c, idx) {
  _fvColor = c; _fvTool = 'pen'; fvSetTool('pen');
  [0,1,2,3].forEach(function(i) {
    var el=document.getElementById('fv-col-'+i);
    if(el) el.style.borderColor = i===idx ? '#1B4332' : 'transparent';
  });
}

// ── Collecte & Sauvegarde ──
function _fvCollectData() {
  var g = function(id) { var el=document.getElementById(id); return el?el.value:''; };
  var rows = [];
  document.querySelectorAll('#fv-metrage-body tr').forEach(function(r) {
    rows.push({
      niv:    r.querySelector('td:nth-child(1) input').value,
      piece:  r.querySelector('td:nth-child(2) input').value,
      long:   r.querySelector('.fv-long').value,
      larg:   r.querySelector('.fv-larg').value,
      hsp:    r.querySelector('.fv-hsp').value,
      surf:   r.querySelector('.fv-surf').value,
      sous180:r.querySelector('.fv-sous180').value,
      carrez: r.querySelector('.fv-carrez').checked,
      boutin: r.querySelector('.fv-boutin').checked,
      obs:    r.querySelector('.fv-obs').value
    });
  });
  var canvasImg = (_fvDrawCanvas && _fvDrawCtx) ? _fvDrawCanvas.toDataURL() : (_fvSavedImg||'');
  return {
    dossier:       g('fv-dossier'),
    date:          g('fv-date'),
    heure_arr:     g('fv-heure-arr'),
    heure_dep:     g('fv-heure-dep'),
    operateur:     g('fv-operateur'),
    client_nom:    g('fv-client-nom'),
    client_adresse:g('fv-client-adresse'),
    client_tel:    g('fv-client-tel'),
    client_email:  g('fv-client-email'),
    proprio:       g('fv-proprio'),
    present:       g('fv-present'),
    cg_qualite:    fvGetChecked('fv-cg-qualite'),
    cg_type_bien:  fvGetChecked('fv-cg-type-bien'),
    adresse:       g('fv-adresse'),
    cp:            g('fv-cp'),
    ville:         g('fv-ville'),
    bat:           g('fv-bat'),
    esc:           g('fv-esc'),
    etage:         g('fv-etage'),
    porte:         g('fv-porte'),
    lot:           g('fv-lot'),
    tantiemes:     g('fv-tantiemes'),
    section:       g('fv-section'),
    parcelle:      g('fv-parcelle'),
    annee:         g('fv-annee'),
    pc:            g('fv-pc'),
    niveaux:       g('fv-niveaux'),
    pieces:        g('fv-pieces'),
    surface:       g('fv-surface'),
    hsp:           g('fv-hsp'),
    chauffage:     g('fv-chauffage'),
    cg_annexes:    fvGetChecked('fv-cg-annexes'),
    cg_reglementaire: fvGetChecked('fv-cg-regl'),
    cg_occup:      fvGetChecked('fv-cg-occup'),
    cg_acces:      fvGetChecked('fv-cg-acces'),
    cg_prest:      fvGetChecked('fv-cg-prest'),
    docs_remis:    g('fv-docs-remis'),
    observations:  g('fv-observations'),
    m_adresse:     g('fv-m-adresse'),
    m_hsp:         g('fv-m-hsp'),
    m_exclusions:  g('fv-m-exclusions'),
    metrage_rows:  rows,
    c_niveau:      g('fv-c-niveau'),
    c_echelle:     g('fv-c-echelle'),
    c_nord:        g('fv-c-nord'),
    stroke_size:   _fvStrokeVal,
    canvas_img:    canvasImg,
    saved_at:      new Date().toISOString()
  };
}

function sauvegarderFeuilleVisite() {
  if (currentMissionIdx === null) { alert('Mission non sauvegardée.'); return; }
  missions[currentMissionIdx].feuille_visite = _fvCollectData();
  // Remonter aussi la surface Carrez vers le champ surface de la mission si rempli
  var tc = document.getElementById('fv-t-carrez');
  if (tc) {
    var val = parseFloat(tc.textContent);
    if (val > 0) missions[currentMissionIdx].surface_carrez = val.toFixed(2);
  }
  localStorage.setItem('dd_missions', JSON.stringify(missions));
  // Toast
  var toast = document.createElement('div');
  toast.textContent = '✅ Feuille de visite sauvegardée !';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1B4332;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:9999';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2500);
}
