// ─────────────────────────────────────────────
// TERRAIN.JS — Notes vocales de terrain + Boussole
// Coup 2 Pouce — DELY DIAG
// ─────────────────────────────────────────────
'use strict';

// ─── État global ──────────────────────────────
var _terrainOpen        = false;
var _terrainMissionIdx  = null;
var _terrainRecording   = false;
var _terrainSR          = null;
var _terrainAutoRestart = false;
var _terrainFullText    = '';
var _terrainLastFinals  = [];   // Anti-doublons : derniers textes finalisés
var _compassActive      = false;
var _compassHeading     = 0;
var _compassListener    = null;
var _compassAbsListener = null;

// ─── Modules ──────────────────────────────────
var TERRAIN_MODULES = [
  { key:'dpe',         label:'DPE',         emoji:'🏠', triggers:['module dpe','dpe projeté','diagnostic performance'] },
  { key:'carrez',      label:'Carrez',       emoji:'📐', triggers:['module carrez','loi carrez','surface carrez'] },
  { key:'amiante',     label:'Amiante',      emoji:'🔬', triggers:['module amiante'] },
  { key:'plomb',       label:'Plomb',        emoji:'⚗️', triggers:['module plomb'] },
  { key:'electricite', label:'Électricité',  emoji:'⚡', triggers:['module électricité','module electricite'] },
  { key:'gaz',         label:'Gaz',          emoji:'🔥', triggers:['module gaz'] },
  { key:'termites',    label:'Termites',     emoji:'🪲', triggers:['module termites','module termite'] },
  { key:'erp',         label:'ERP',          emoji:'⚠️', triggers:['module erp','risques et pollutions'] },
  { key:'boutin',      label:'Boutin',       emoji:'📏', triggers:['module boutin'] },
  { key:'general',     label:'Général',      emoji:'📋', triggers:['module général','module general','notes générales'] }
];

// ─── Classification ────────────────────────────
function _terrainClassify(rawText) {
  if (!rawText || !rawText.trim()) return {};
  var allTriggers = [];
  TERRAIN_MODULES.forEach(function(m) {
    m.triggers.forEach(function(t) { allTriggers.push({ t: t, key: m.key }); });
  });
  allTriggers.sort(function(a,b){ return b.t.length - a.t.length; });

  var lower      = rawText.toLowerCase();
  var segments   = [];
  var pos        = 0;
  var curKey     = 'general';

  while (pos < rawText.length) {
    var nextMatch = null, nextPos = rawText.length;
    allTriggers.forEach(function(tr) {
      var idx = lower.indexOf(tr.t, pos);
      if (idx !== -1 && idx < nextPos) { nextPos = idx; nextMatch = tr; }
    });
    var chunk = rawText.slice(pos, nextPos).trim();
    if (chunk) segments.push({ key: curKey, text: chunk });
    if (!nextMatch) break;
    curKey = nextMatch.key;
    pos = nextPos + nextMatch.t.length;
  }

  var result = {};
  segments.forEach(function(s) {
    if (!result[s.key]) result[s.key] = [];
    var lines = s.text.replace(/([.,;!?])\s*/g,'$1\n').split('\n');
    lines.forEach(function(l) {
      var t = l.trim().replace(/^[,.\s]+|[,.\s]+$/g,'');
      if (t.length > 2) result[s.key].push(t);
    });
  });
  return result;
}

function _tE(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Ouverture ────────────────────────────────
function openTerrain(idx) {
  _terrainMissionIdx  = (idx !== undefined && idx !== null) ? idx : currentMissionIdx;
  _terrainOpen        = true;
  _terrainRecording   = false;
  _terrainAutoRestart = false;
  _terrainLastFinals  = [];
  var saved = (_terrainMissionIdx !== null && missions[_terrainMissionIdx])
    ? (missions[_terrainMissionIdx].terrain_text || '') : '';
  _terrainFullText = saved;
  _renderTerrainModal();
}

function closeTerrain() {
  _stopTerrainRecording();
  _stopCompass();
  _terrainOpen = false;
  var el = document.getElementById('terrain-modal');
  if (el) el.remove();
}

// ─── Rendu ────────────────────────────────────
function _renderTerrainModal() {
  var ex = document.getElementById('terrain-modal');
  if (ex) ex.remove();

  var label = '';
  if (_terrainMissionIdx !== null && missions[_terrainMissionIdx]) {
    var m = missions[_terrainMissionIdx];
    label = (m.nom||m.prenom||m.societe||'Mission').trim();
    if (m.adresse) label += ' — ' + m.adresse;
  }

  var modal = document.createElement('div');
  modal.id = 'terrain-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#0F172A;display:flex;flex-direction:column;font-family:inherit;overflow:hidden;-webkit-overflow-scrolling:touch';

  // Raccourcis modules
  var chipsHtml = TERRAIN_MODULES.map(function(m) {
    return '<button onclick="_terrainInsertTag(\''+m.triggers[0]+'\')" '
      +'style="display:inline-block;flex-shrink:0;background:#0F172A;border:1px solid #334155;color:#94A3B8;font-size:11px;padding:5px 9px;border-radius:6px;cursor:pointer;font-family:inherit;touch-action:manipulation">'
      +m.emoji+' '+m.label+'</button>';
  }).join('');

  modal.innerHTML =
    // En-tête
    '<div style="background:#1E293B;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;border-bottom:1px solid #334155">'
      +'<button onclick="closeTerrain()" style="background:none;border:none;color:#94A3B8;font-size:26px;cursor:pointer;padding:0 4px;line-height:1;touch-action:manipulation">←</button>'
      +'<div style="flex:1;min-width:0"><div style="color:#F1F5F9;font-size:16px;font-weight:800">🎙️ Notes Terrain</div>'
      +'<div style="color:#64748B;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_tE(label)+'</div></div>'
      +'<button onclick="_terrainShowClassified()" style="background:#1B4332;border:none;color:#86EFAC;font-size:12px;font-weight:700;padding:8px 12px;border-radius:8px;cursor:pointer;font-family:inherit;touch-action:manipulation;white-space:nowrap">📊 Classé</button>'
    +'</div>'

    // Zone transcription
    +'<div id="terrain-transcript-area" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 16px 8px;display:flex;flex-direction:column">'
      +(_terrainFullText
        ? '<div id="terrain-final-text" style="color:#CBD5E1;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word">'+_tE(_terrainFullText)+'</div>'
        : '<div id="terrain-placeholder" style="color:#475569;font-size:13px;text-align:center;margin-top:48px;line-height:2">'
          +'🎙️ Appuie sur le micro pour commencer<br><br>'
          +'💡 Commence par dire :<br>'
          +'<span style="color:#94A3B8;font-weight:700">"module DPE"</span>, '
          +'<span style="color:#94A3B8;font-weight:700">"module Amiante"</span>,<br>'
          +'<span style="color:#94A3B8;font-weight:700">"module Carrez"</span>…'
          +'</div>'
      )
      +'<div id="terrain-interim-text" style="color:#64748B;font-size:13px;font-style:italic;min-height:24px;margin-top:4px"></div>'
    +'</div>'

    // Boussole (masquée)
    +'<div id="terrain-compass-panel" style="display:none;background:#1E293B;padding:16px;border-top:1px solid #334155;flex-shrink:0">'
      +'<div style="display:flex;align-items:center;gap:20px;justify-content:center">'
        // SVG boussole : CADRAN tournant, repère fixe en haut
        +'<div style="position:relative;width:120px;height:120px;flex-shrink:0">'
          +'<svg width="120" height="120" viewBox="0 0 120 120" style="display:block">'
            // Cadran tournant
            +'<g id="compass-dial" transform="rotate(0,60,60)">'
              +'<circle cx="60" cy="60" r="55" fill="#0F172A" stroke="#334155" stroke-width="2"/>'
              // Graduations tous les 30°
              +'<line x1="60" y1="6" x2="60" y2="16" stroke="#475569" stroke-width="1.5"/>'
              +'<line x1="60" y1="104" x2="60" y2="114" stroke="#475569" stroke-width="1"/>'
              +'<line x1="6" y1="60" x2="16" y2="60" stroke="#475569" stroke-width="1"/>'
              +'<line x1="104" y1="60" x2="114" y2="60" stroke="#475569" stroke-width="1"/>'
              // Points cardinaux
              +'<text x="60" y="22" text-anchor="middle" fill="#F1F5F9" font-size="13" font-weight="bold" font-family="Arial,sans-serif">N</text>'
              +'<text x="60" y="110" text-anchor="middle" fill="#64748B" font-size="11" font-family="Arial,sans-serif">S</text>'
              +'<text x="110" y="64" text-anchor="middle" fill="#64748B" font-size="11" font-family="Arial,sans-serif">E</text>'
              +'<text x="10" y="64" text-anchor="middle" fill="#64748B" font-size="11" font-family="Arial,sans-serif">O</text>'
            +'</g>'
            // Point central
            +'<circle cx="60" cy="60" r="3" fill="#334155"/>'
            // Repère fixe (triangle rouge en haut = direction actuelle du téléphone)
            +'<polygon points="60,4 64,14 60,18 56,14" fill="#EF4444"/>'
          +'</svg>'
        +'</div>'
        +'<div style="display:flex;flex-direction:column;gap:10px;align-items:center">'
          +'<div id="compass-reading" style="color:#F1F5F9;font-size:32px;font-weight:800;line-height:1">—°</div>'
          +'<div id="compass-direction" style="color:#94A3B8;font-size:15px;font-weight:700">—</div>'
          +'<button onclick="_insertCompassNote()" style="background:#1B4332;border:none;color:#86EFAC;font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;cursor:pointer;font-family:inherit;touch-action:manipulation">📝 Insérer</button>'
        +'</div>'
      +'</div>'
      +'<div id="compass-calibration" style="display:none;color:#FBBF24;font-size:11px;text-align:center;margin-top:10px">🔄 Effectue un mouvement en 8 pour calibrer la boussole</div>'
    +'</div>'

    // Raccourcis modules
    +'<div style="background:#1E293B;padding:8px 12px;border-top:1px solid #334155;flex-shrink:0;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap">'
      +chipsHtml
    +'</div>'

    // Barre d'actions
    +'<div style="background:#1E293B;padding:14px 20px 28px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-top:1px solid #334155">'
      +'<button id="btn-compass-toggle" onclick="_toggleCompass()" '
        +'style="width:54px;height:54px;border-radius:50%;background:#0F172A;border:2px solid #334155;color:#94A3B8;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation">🧭</button>'
      +'<button id="btn-record-terrain" onclick="_toggleTerrainRecording()" '
        +'style="width:78px;height:78px;border-radius:50%;background:#EF4444;border:none;color:#fff;font-size:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:box-shadow .2s;touch-action:manipulation">🎙️</button>'
      +'<button onclick="_terrainSave(true)" '
        +'style="width:54px;height:54px;border-radius:50%;background:#1B4332;border:2px solid #2D6A4F;color:#86EFAC;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation">💾</button>'
    +'</div>';

  document.body.appendChild(modal);
  var ta = document.getElementById('terrain-transcript-area');
  if (ta) ta.scrollTop = ta.scrollHeight;
}

// ─── Enregistrement vocal ──────────────────────
function _toggleTerrainRecording() {
  if (_terrainRecording) { _stopTerrainRecording(); } else { _startTerrainRecording(); }
}

function _startTerrainRecording() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Reconnaissance vocale non disponible.\nUtilise Chrome (Android) ou Safari (iPhone).');
    return;
  }
  // Toujours créer une nouvelle instance pour éviter les conflits
  if (_terrainSR) { try { _terrainSR.abort(); } catch(e){} _terrainSR = null; }

  var sr = new SR();
  sr.lang            = 'fr-FR';
  sr.continuous      = false;   // ← false : plus fiable sur mobile, on relance nous-mêmes
  sr.interimResults  = true;
  sr.maxAlternatives = 1;
  _terrainSR = sr;

  sr.onstart = function() {
    _terrainRecording   = true;
    _terrainAutoRestart = true;
    _updateRecordBtn(true);
  };

  sr.onresult = function(e) {
    var interim = '';
    for (var i = 0; i < e.results.length; i++) {
      var res = e.results[i];
      if (res.isFinal) {
        var txt = res[0].transcript.trim();
        // Anti-doublons : ignorer si déjà reçu dans les 3 derniers résultats
        if (txt && _terrainLastFinals.indexOf(txt) === -1) {
          _terrainLastFinals.push(txt);
          if (_terrainLastFinals.length > 5) _terrainLastFinals.shift();
          var ph = document.getElementById('terrain-placeholder');
          if (ph) ph.remove();
          _terrainFullText += (_terrainFullText ? ' ' : '') + txt;
          _updateFinalDisplay();
        }
      } else {
        interim += res[0].transcript;
      }
    }
    var iEl = document.getElementById('terrain-interim-text');
    if (iEl) iEl.textContent = interim ? '✏️ ' + interim : '';
  };

  sr.onerror = function(e) {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      _terrainAutoRestart = false;
      _terrainRecording   = false;
      _updateRecordBtn(false);
      alert('Microphone non autorisé.\nAutorise-le dans les réglages du navigateur.');
    }
    // 'no-speech', 'network' → géré dans onend (auto-restart)
  };

  sr.onend = function() {
    var iEl = document.getElementById('terrain-interim-text');
    if (iEl) iEl.textContent = '';
    if (_terrainRecording && _terrainAutoRestart) {
      // Réinitialiser le buffer anti-doublons à chaque nouvelle session
      _terrainLastFinals = [];
      setTimeout(function() {
        if (_terrainRecording && _terrainAutoRestart) {
          _startTerrainRecording(); // ← nouvelle instance propre
        }
      }, 250);
    } else {
      _terrainRecording = false;
      _updateRecordBtn(false);
    }
  };

  try { sr.start(); }
  catch(e) {
    alert('Impossible de démarrer le micro : ' + (e.message || e));
    _terrainRecording = false;
    _updateRecordBtn(false);
  }
}

function _stopTerrainRecording() {
  _terrainAutoRestart = false;
  _terrainRecording   = false;
  if (_terrainSR) { try { _terrainSR.stop(); } catch(e){} _terrainSR = null; }
  _updateRecordBtn(false);
  var iEl = document.getElementById('terrain-interim-text');
  if (iEl) iEl.textContent = '';
}

function _updateRecordBtn(on) {
  var btn = document.getElementById('btn-record-terrain');
  if (!btn) return;
  btn.textContent   = on ? '⏹️' : '🎙️';
  btn.style.background  = on ? '#DC2626' : '#EF4444';
  btn.style.boxShadow   = on ? '0 0 0 10px rgba(220,38,38,.2)' : 'none';
}

function _updateFinalDisplay() {
  var area = document.getElementById('terrain-transcript-area');
  if (!area) return;
  var el = document.getElementById('terrain-final-text');
  if (!el) {
    el = document.createElement('div');
    el.id = 'terrain-final-text';
    el.style.cssText = 'color:#CBD5E1;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word';
    area.insertBefore(el, document.getElementById('terrain-interim-text'));
  }
  el.textContent = _terrainFullText;
  area.scrollTop = area.scrollHeight;
}

function _terrainInsertTag(tag) {
  var ph = document.getElementById('terrain-placeholder');
  if (ph) ph.remove();
  _terrainFullText += (_terrainFullText ? ' ' : '') + tag + ' ';
  _updateFinalDisplay();
}

// ─── Sauvegarde ───────────────────────────────
function _terrainSave(feedback) {
  _stopTerrainRecording();
  if (_terrainMissionIdx === null || !missions[_terrainMissionIdx]) {
    if (feedback) alert('Aucune mission sélectionnée.');
    return;
  }
  missions[_terrainMissionIdx].terrain_text = _terrainFullText;
  missions[_terrainMissionIdx].terrain_date = new Date().toISOString();
  localStorage.setItem('dd_missions', JSON.stringify(missions));
  if (feedback) {
    var btn = document.querySelector('[onclick="_terrainSave(true)"]');
    if (btn) {
      var o = btn.textContent; btn.textContent = '✅'; btn.style.background = '#065F46';
      setTimeout(function(){ btn.textContent = o; btn.style.background = '#1B4332'; }, 1500);
    }
  }
}

// ─── Vue classée ──────────────────────────────
function _terrainShowClassified() {
  _stopTerrainRecording();
  var classified = _terrainClassify(_terrainFullText);
  var keys = Object.keys(classified);

  var panel = document.createElement('div');
  panel.id = 'terrain-classified-panel';
  panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000;background:#0F172A;display:flex;flex-direction:column;font-family:inherit;overflow:hidden';

  var sectionsHtml = '';
  if (!keys.length) {
    sectionsHtml = '<div style="color:#475569;text-align:center;margin-top:60px;font-size:13px;padding:20px">Aucune note à classer.<br>Dicte tes observations puis réessaie.</div>';
  } else {
    TERRAIN_MODULES.forEach(function(m) {
      var lines = classified[m.key];
      if (!lines || !lines.length) return;
      sectionsHtml +=
        '<div style="background:#1E293B;border-radius:12px;overflow:hidden;border:1px solid #334155;margin-bottom:12px">'
          +'<div style="background:#0F172A;padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #334155">'
            +'<span style="font-size:18px">'+m.emoji+'</span>'
            +'<span style="color:#F1F5F9;font-size:14px;font-weight:800">'+m.label+'</span>'
            +'<span style="margin-left:auto;background:#334155;color:#94A3B8;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px">'+lines.length+'</span>'
          +'</div>'
          +'<div style="padding:10px 14px">'
            +lines.map(function(l){
              return '<div style="color:#CBD5E1;font-size:13px;line-height:1.6;padding:5px 0;border-bottom:1px solid #0F172A">— '+_tE(l)+'</div>';
            }).join('')
          +'</div>'
        +'</div>';
    });
  }

  panel.innerHTML =
    '<div style="background:#1E293B;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;border-bottom:1px solid #334155">'
      +'<button onclick="document.getElementById(\'terrain-classified-panel\').remove()" '
        +'style="background:none;border:none;color:#94A3B8;font-size:26px;cursor:pointer;padding:0 4px;line-height:1;touch-action:manipulation">←</button>'
      +'<div style="color:#F1F5F9;font-size:15px;font-weight:800">📊 Notes classées par module</div>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px">'+sectionsHtml+'</div>'
    +'<div style="background:#1E293B;padding:12px 16px;border-top:1px solid #334155;display:flex;gap:10px;flex-shrink:0">'
      +'<button onclick="_terrainCopyAll()" '
        +'style="flex:1;padding:13px;border-radius:10px;border:1.5px solid #334155;background:#0F172A;color:#94A3B8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation">📋 Copier</button>'
      +'<button onclick="_terrainSave(false);document.getElementById(\'terrain-classified-panel\').remove()" '
        +'style="flex:2;padding:13px;border-radius:10px;border:none;background:#1B4332;color:#86EFAC;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation">💾 Enregistrer</button>'
    +'</div>';

  document.body.appendChild(panel);
}

function _terrainCopyAll() {
  var classified = _terrainClassify(_terrainFullText);
  var txt = '';
  TERRAIN_MODULES.forEach(function(m) {
    var lines = classified[m.key];
    if (!lines || !lines.length) return;
    txt += m.emoji + ' ' + m.label.toUpperCase() + '\n';
    lines.forEach(function(l){ txt += '— ' + l + '\n'; });
    txt += '\n';
  });
  if (!txt.trim()) txt = _terrainFullText;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt.trim())
      .then(function(){ alert('✅ Notes copiées !'); })
      .catch(function(){ prompt('Copie ce texte :', txt.trim()); });
  } else {
    prompt('Copie ce texte :', txt.trim());
  }
}

// ─── Boussole ─────────────────────────────────
function _toggleCompass() {
  if (_compassActive) { _stopCompass(); } else { _startCompass(); }
}

function _startCompass() {
  if (!window.DeviceOrientationEvent) {
    alert('La boussole n\'est pas disponible sur cet appareil.');
    return;
  }

  function _activate() {
    _compassActive = true;
    var panel = document.getElementById('terrain-compass-panel');
    var btnC  = document.getElementById('btn-compass-toggle');
    if (panel) panel.style.display = 'block';
    if (btnC)  { btnC.style.border = '2px solid #2D6A4F'; btnC.style.color = '#86EFAC'; }

    function _handleOrientation(e) {
      var heading = null;
      if (typeof e.webkitCompassHeading !== 'undefined' && e.webkitCompassHeading !== null) {
        // iOS — direct, 0 = Nord, croissant vers l'Est, toujours absolu
        heading = e.webkitCompassHeading;
      } else if (e.absolute === true && e.alpha !== null && e.alpha !== undefined) {
        // Android Chrome absolu : alpha augmente dans le sens anti-horaire
        // → heading = (360 - alpha) % 360
        heading = (360 - e.alpha + 360) % 360;
      }
      if (heading === null) return;
      _compassHeading = Math.round(heading);
      _updateCompassUI(_compassHeading);
    }

    _compassListener = _handleOrientation;

    // Essayer d'abord l'événement absolu (Android Chrome)
    window.addEventListener('deviceorientationabsolute', _handleOrientation, true);
    // Et l'événement standard (iOS)
    window.addEventListener('deviceorientation', _handleOrientation, true);

    window.addEventListener('compassneedscalibration', function() {
      var cal = document.getElementById('compass-calibration');
      if (cal) cal.style.display = 'block';
    });
  }

  // iOS 13+ : demande explicite de permission
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(function(state) {
        if (state === 'granted') { _activate(); }
        else { alert('Permission boussole refusée.\nRéglages → Safari → Mouvement et orientation.'); }
      })
      .catch(function(err) { alert('Erreur permission boussole : ' + err); });
  } else {
    _activate();
  }
}

function _stopCompass() {
  _compassActive = false;
  if (_compassListener) {
    window.removeEventListener('deviceorientationabsolute', _compassListener, true);
    window.removeEventListener('deviceorientation', _compassListener, true);
    _compassListener = null;
  }
  var panel = document.getElementById('terrain-compass-panel');
  if (panel) panel.style.display = 'none';
  var btnC = document.getElementById('btn-compass-toggle');
  if (btnC) { btnC.style.border = '2px solid #334155'; btnC.style.color = '#94A3B8'; }
}

function _updateCompassUI(deg) {
  // Le CADRAN tourne dans le sens opposé à la rotation du téléphone
  // Quand le téléphone pointe vers l'Est (deg=90), le cadran tourne de -90°
  // → "N" monte vers le haut-gauche, et "E" se retrouve sous le repère fixe
  var dial = document.getElementById('compass-dial');
  if (dial) dial.setAttribute('transform', 'rotate(' + (-deg) + ',60,60)');

  var reading = document.getElementById('compass-reading');
  if (reading) reading.textContent = deg + '°';

  var dirs = ['Nord','Nord-Est','Est','Sud-Est','Sud','Sud-Ouest','Ouest','Nord-Ouest'];
  var dir  = dirs[Math.round(deg / 45) % 8];
  var dirEl = document.getElementById('compass-direction');
  if (dirEl) dirEl.textContent = dir;
}

function _insertCompassNote() {
  var dirs = ['Nord','Nord-Est','Est','Sud-Est','Sud','Sud-Ouest','Ouest','Nord-Ouest'];
  var dir  = dirs[Math.round(_compassHeading / 45) % 8];
  var note = 'Orientation ' + dir + ' (' + _compassHeading + '°)';
  var ph = document.getElementById('terrain-placeholder');
  if (ph) ph.remove();
  _terrainFullText += (_terrainFullText ? ' ' : '') + note + '. ';
  _updateFinalDisplay();
}

function getTerrainNotes(idx) {
  if (idx === null || !missions[idx]) return null;
  return missions[idx].terrain_text || null;
}
