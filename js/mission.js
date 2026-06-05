// ─────────────────────────────────────────────
// MISSION.JS — CRUD missions terrain
// ─────────────────────────────────────────────

function openMission() {
  document.getElementById('mission-screen').classList.add('open');
  renderMissionScreen();
}

function closeMission() {
  document.getElementById('mission-screen').classList.remove('open');
}

function renderMissionScreen() {
  var body = document.getElementById('mission-body');
  if (missionView === 'form') renderMissionForm(body);
  else renderMissionList(body);
}

function renderMissionList(body) {
  var sorted = missions.slice().reverse();
  body.innerHTML = `
    <button onclick="newMission()" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#E8650A,#F4A261);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:10px">
      ➕ Nouvelle mission
    </button>
    ${sorted.length === 0 ? '<div style="text-align:center;padding:40px;color:#6B7280;font-size:14px">Aucune mission enregistrée</div>' : ''}
    ${sorted.map((m, i) => `
      <div class="mission-card" onclick="editMission(${missions.length-1-i})">
        <div class="mission-card-title">${m.nom||'Sans nom'} ${m.prenom||''}</div>
        <div class="mission-card-sub">📍 ${m.adresse||'Adresse non renseignée'}</div>
        <div class="mission-card-sub">🏠 ${m.typeBien||'-'} • ${m.date||'-'}</div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          ${(m.diags||[]).map(d=>'<span style="font-size:10px;padding:2px 8px;border-radius:999px;background:#2D6A4F18;color:#2D6A4F;font-weight:600">'+d+'</span>').join('')}
        </div>
      </div>`).join('')}`;
}

function newMission() {
  currentMissionIdx = null;
  missionView = 'form';
  renderMissionScreen();
}

function editMission(idx) {
  currentMissionIdx = idx;
  missionView = 'form';
  renderMissionScreen();
}

function renderMissionForm(body) {
  var m     = currentMissionIdx !== null ? missions[currentMissionIdx] : {};
  var diags = ['DPE','Amiante','Plomb','Électricité','Gaz','Termites','ERP','Carrez','Boutin'];

  body.innerHTML = `
    <button onclick="missionView='list';renderMissionScreen()" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#2D6A4F;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:16px;font-family:inherit">← Retour</button>
    <div class="mission-section">
      <h3>👤 Client</h3>
      <div class="mission-field"><label class="mission-label">Nom</label><input class="mission-input" id="m-nom" type="text" value="${m.nom||''}" placeholder="Dupont"/></div>
      <div class="mission-field"><label class="mission-label">Prénom</label><input class="mission-input" id="m-prenom" type="text" value="${m.prenom||''}" placeholder="Jean"/></div>
      <div class="mission-field"><label class="mission-label">Téléphone</label><input class="mission-input" id="m-tel" type="tel" value="${m.tel||''}" placeholder="06 00 00 00 00"/></div>
      <div class="mission-field"><label class="mission-label">Email</label><input class="mission-input" id="m-email" type="email" value="${m.email||''}" placeholder="email@exemple.fr"/></div>
    </div>
    <div class="mission-section">
      <h3>🏠 Le Bien</h3>
      <div class="mission-field">
        <label class="mission-label">Adresse complète</label>
        <input class="mission-input" id="m-adresse" type="text" value="${m.adresse||''}" placeholder="12 rue des Lilas, 75001 Paris" oninput="updateMapsBtn(this.value)"/>
        <a id="maps-btn" href="#" target="_blank" onclick="openMaps()" style="display:${(m.adresse||'').length>5?'flex':'none'};align-items:center;gap:8px;margin-top:8px;padding:9px 14px;background:#4285F4;border-radius:8px;color:#fff;font-size:12px;font-weight:700;text-decoration:none">📍 Voir sur Google Maps</a>
      </div>
      <div class="mission-field">
        <label class="mission-label">Type de bien</label>
        <select class="mission-select" id="m-typeBien">
          <option ${m.typeBien==='Maison'?'selected':''}>Maison</option>
          <option ${m.typeBien==='Appartement'?'selected':''}>Appartement</option>
          <option ${m.typeBien==='Local commercial'?'selected':''}>Local commercial</option>
          <option ${m.typeBien==='Immeuble'?'selected':''}>Immeuble</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="mission-field"><label class="mission-label">Année construction</label><input class="mission-input" id="m-annee" type="number" value="${m.annee||''}" placeholder="1985"/></div>
        <div class="mission-field"><label class="mission-label">Surface approx.</label><input class="mission-input" id="m-surface" type="number" value="${m.surface||''}" placeholder="85 m²"/></div>
      </div>
      <div class="mission-field">
        <label class="mission-label">Description</label>
        <textarea class="mission-textarea" id="m-description" placeholder="Ex: Maison sur 2 niveaux...">${m.description||''}</textarea>
        <button id="vocal-desc-btn" class="vocal-btn idle" onclick="startVoiceDescription('m-description','vocal-desc-btn')" style="margin-top:8px">🎤 Dicter</button>
      </div>
      <div class="mission-field"><label class="mission-label">Date de mission</label><input class="mission-input" id="m-date" type="date" value="${m.date||new Date().toISOString().split('T')[0]}"/></div>
    </div>
    <div class="mission-section">
      <h3>📋 Diagnostics à réaliser</h3>
      <div class="diag-grid">
        ${diags.map(d=>`<div class="diag-item ${(m.diags||[]).includes(d)?'selected':''}" onclick="toggleDiag(this,'${d}')"><input type="checkbox" ${(m.diags||[]).includes(d)?'checked':''} readonly/><span style="font-size:13px">${d}</span></div>`).join('')}
      </div>
    </div>
    <div class="mission-section">
      <h3>📝 Notes terrain</h3>
      <textarea class="mission-textarea" id="m-notes" placeholder="Notes libres, observations, anomalies...">${m.notes||''}</textarea>
      <button id="vocal-notes-btn" class="vocal-btn idle" onclick="startVoiceDescription('m-notes','vocal-notes-btn')" style="margin-top:8px">🎤 Dicter les notes</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <button onclick="addToCalendar()" style="padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#0891B2,#0E7490);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">📅 Agenda</button>
      <button onclick="setMissionRappel()" style="padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">🔔 Rappel</button>
    </div>
    <button class="mission-save-btn" onclick="saveMissionForm()">💾 Sauvegarder la mission</button>
    <button class="mission-export-btn" onclick="exportMission()">📤 Exporter / Partager</button>
    <button onclick="openAvisGoogle()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">⭐ Demander un avis Google</button>
    ${currentMissionIdx !== null ? '<button onclick="deleteMission()" style="width:100%;padding:12px;border-radius:10px;border:2px solid #EF4444;background:#fff;color:#EF4444;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">🗑️ Supprimer cette mission</button>' : ''}`;
}

function toggleDiag(el, diag) {
  el.classList.toggle('selected');
  el.querySelector('input').checked = el.classList.contains('selected');
}

function getMissionFormData() {
  var diags = Array.from(document.querySelectorAll('.diag-item.selected')).map(function(el) {
    return el.querySelector('span').textContent;
  });
  return {
    nom:        document.getElementById('m-nom')?.value         || '',
    prenom:     document.getElementById('m-prenom')?.value      || '',
    tel:        document.getElementById('m-tel')?.value         || '',
    email:      document.getElementById('m-email')?.value       || '',
    adresse:    document.getElementById('m-adresse')?.value     || '',
    typeBien:   document.getElementById('m-typeBien')?.value    || '',
    annee:      document.getElementById('m-annee')?.value       || '',
    surface:    document.getElementById('m-surface')?.value     || '',
    description:document.getElementById('m-description')?.value || '',
    date:       document.getElementById('m-date')?.value        || '',
    notes:      document.getElementById('m-notes')?.value       || '',
    diags,
    savedAt: new Date().toISOString()
  };
}

function saveMissionForm() {
  var data = getMissionFormData();
  if (currentMissionIdx !== null) missions[currentMissionIdx] = data;
  else missions.push(data);
  localStorage.setItem('dd_missions', JSON.stringify(missions));
  missionView = 'list';
  renderMissionScreen();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function deleteMission() {
  if (!confirm('Supprimer cette mission ?')) return;
  missions.splice(currentMissionIdx, 1);
  localStorage.setItem('dd_missions', JSON.stringify(missions));
  currentMissionIdx = null;
  missionView = 'list';
  renderMissionScreen();
}

function exportMission() {
  var m    = getMissionFormData();
  var text = '📋 MISSION DELY DIAG\n─────────────────────\n'
    + '👤 CLIENT\nNom : ' + m.nom + ' ' + m.prenom
    + '\nTél : ' + m.tel + '\nEmail : ' + m.email
    + '\n🏠 LE BIEN\nAdresse : ' + m.adresse
    + '\nType : ' + m.typeBien + '\nAnnée : ' + m.annee
    + '\nSurface : ' + m.surface + ' m²\nDate mission : ' + m.date
    + '\n📝 DESCRIPTION\n' + m.description
    + '\n🔬 DIAGNOSTICS\n' + m.diags.join(', ')
    + '\n📌 NOTES TERRAIN\n' + m.notes
    + '\n─────────────────────\nDELY DIAG — Diagnostics Immobiliers';
  if (navigator.share) navigator.share({title: 'Mission DELY DIAG', text});
  else navigator.clipboard.writeText(text).then(function() { alert('✅ Copié !'); });
}

// ─── GOOGLE MAPS ───
function updateMapsBtn(addr) {
  var btn = document.getElementById('maps-btn');
  if (btn) btn.style.display = addr.length > 5 ? 'flex' : 'none';
}

function openMaps() {
  var addr = document.getElementById('m-adresse')?.value;
  if (addr) window.open('https://www.google.com/maps/search/' + encodeURIComponent(addr), '_blank');
  return false;
}

// ─── AGENDA (.ics) ───
function addToCalendar() {
  var date    = document.getElementById('m-date')?.value;
  var nom     = document.getElementById('m-nom')?.value    || '';
  var prenom  = document.getElementById('m-prenom')?.value || '';
  var adresse = document.getElementById('m-adresse')?.value|| '';
  var typeBien= document.getElementById('m-typeBien')?.value|| '';
  if (!date) { alert('Saisis d\'abord une date de mission !'); return; }
  var dateStr = date.replace(/-/g,'');
  var icsContent = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    'DTSTART:'+dateStr+'T090000','DTEND:'+dateStr+'T110000',
    'SUMMARY:Mission DELY DIAG — '+nom+' '+prenom,
    'DESCRIPTION:Diagnostic '+typeBien+' — '+adresse,
    'LOCATION:'+adresse,'END:VEVENT','END:VCALENDAR'].join('\n');
  var blob = new Blob([icsContent], {type:'text/calendar'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url; a.download = 'mission_delydiag.ics'; a.click();
  URL.revokeObjectURL(url);
}

// ─── RAPPEL NOTIF ───
function setMissionRappel() {
  var date = document.getElementById('m-date')?.value;
  if (!date) { alert('Saisis d\'abord une date de mission !'); return; }
  if (!('Notification' in window)) { alert('Notifications non disponibles sur ce navigateur.'); return; }
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      var missionDate = new Date(date+'T08:00:00');
      var delay = missionDate - new Date() - (24*60*60*1000);
      if (delay > 0) {
        setTimeout(function() {
          new Notification('📋 Mission DELY DIAG demain !', {body:'N\'oubliez pas votre mission de diagnostic demain.',icon:'/icon-192.png'});
        }, delay);
        alert('✅ Rappel programmé la veille à 8h !');
      } else {
        alert('⚠️ La date est déjà passée ou trop proche.');
      }
    } else {
      alert('Notifications refusées. Active-les dans les paramètres du navigateur.');
    }
  });
}

// ─── AVIS GOOGLE ───
function openAvisGoogle() {
  var tel   = document.getElementById('m-tel')  ? document.getElementById('m-tel').value  : '';
  var lien  = localStorage.getItem('dd_avis_lien') || 'https://g.page/r/CT9LozHbnGhxEAE/review';
  var msg   = localStorage.getItem('dd_avis_msg')  || 'Bonjour,\nSi vous avez une minute, un petit avis sur Google m\'aiderait beaucoup\n'+lien+'\nMerci beaucoup et à bientôt !';
  var ex = document.getElementById('avis-modal');
  if (ex) ex.remove();
  var modal = document.createElement('div');
  modal.id = 'avis-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:100%;max-width:380px;max-height:90vh;overflow-y:auto">'
    +'<h3 style="font-size:16px;font-weight:800;color:#1B4332;margin-bottom:4px">⭐ Demande d\'avis Google</h3>'
    +'<p style="font-size:12px;color:#6B7280;margin-bottom:16px">Personnalise et envoie le SMS à ton client</p>'
    +'<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Ton lien Google</label>'
    +'<input id="avis-lien" type="url" value="'+lien+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:4px"/>'
    +'<p style="font-size:10px;color:#9ca3af;margin-bottom:12px">💡 Remplace ce lien une seule fois — il sera sauvegardé</p>'
    +'<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Message SMS</label>'
    +'<textarea id="avis-msg" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;box-sizing:border-box;min-height:110px;resize:vertical;margin-bottom:12px">'+msg+'</textarea>'
    +'<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Téléphone client</label>'
    +'<input id="avis-tel" type="tel" value="'+tel+'" placeholder="06 00 00 00 00" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;box-sizing:border-box;margin-bottom:16px"/>'
    +'<button onclick="sendAvisGoogle()" style="width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">📱 Ouvrir SMS</button>'
    +'<button onclick="document.getElementById(\'avis-modal\').remove()" style="width:100%;padding:11px;border-radius:10px;border:2px solid #E2E5F0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>'
    +'</div>';
  document.body.appendChild(modal);
}

function sendAvisGoogle() {
  var lien = document.getElementById('avis-lien').value.trim();
  var msg  = document.getElementById('avis-msg').value;
  var tel  = document.getElementById('avis-tel').value.replace(/ /g,'');
  localStorage.setItem('dd_avis_lien', lien);
  localStorage.setItem('dd_avis_msg', msg);
  var smsUrl = tel ? 'sms:'+tel+'?body='+encodeURIComponent(msg) : 'sms:?body='+encodeURIComponent(msg);
  document.getElementById('avis-modal').remove();
  window.location.href = smsUrl;
}
