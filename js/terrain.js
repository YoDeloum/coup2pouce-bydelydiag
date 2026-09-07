// ─────────────────────────────────────────────
// TERRAIN.JS — Notes vocales de terrain + Boussole
// Coup 2 Pouce — DELY DIAG
// ─────────────────────────────────────────────
'use strict';

// ─── État global ──────────────────────────────
var _terrainOpen        = false;
var _terrainMissionIdx  = null;
var _terrainRecording   = false;
var _terrainSR          = null;   // instance SpeechRecognition
var _terrainAutoRestart = false;  // flag auto-relance
var _terrainFullText    = '';     // texte brut accumulé
var _terrainInterim     = '';     // texte en cours (pas encore finalisé)
var _compassActive      = false;
var _compassHeading     = 0;
var _compassListener    = null;

// ─── Modules reconnus ─────────────────────────
// triggers : mots-clés qui déclenchent le changement de module (en minuscules)
var TERRAIN_MODULES = [
  { key: 'dpe',         label: 'DPE',          emoji: '🏠', triggers: ['module dpe', 'dpe projeté', 'diagnostic performance'] },
  { key: 'carrez',      label: 'Carrez',        emoji: '📐', triggers: ['module carrez', 'loi carrez', 'surface carrez'] },
  { key: 'amiante',     label: 'Amiante',       emoji: '🔬', triggers: ['module amiante'] },
  { key: 'plomb',       label: 'Plomb',         emoji: '⚗️', triggers: ['module plomb'] },
  { key: 'electricite', label: 'Électricité',   emoji: '⚡', triggers: ['module électricité', 'module electricite'] },
  { key: 'gaz',         label: 'Gaz',           emoji: '🔥', triggers: ['module gaz'] },
  { key: 'termites',    label: 'Termites',      emoji: '🪲', triggers: ['module termites', 'module termite'] },
  { key: 'erp',         label: 'ERP',           emoji: '⚠️', triggers: ['module erp', 'risques et pollutions'] },
  { key: 'boutin',      label: 'Boutin',        emoji: '📏', triggers: ['module boutin'] },
  { key: 'general',     label: 'Général',       emoji: '📋', triggers: ['module général', 'module general', 'notes générales', 'observation générale'] }
];

// ─── Classification du texte brut ─────────────
// Retourne un objet { key: [lignes], ... }
function _terrainClassify(rawText) {
  if (!rawText || !rawText.trim()) return {};

  // Construire la regex de détection (tri par longueur décroissante)
  var allTriggers = [];
  TERRAIN_MODULES.forEach(function(m) {
    m.triggers.forEach(function(t) {
      allTriggers.push({ trigger: t, key: m.key });
    });
  });
  allTriggers.sort(function(a, b) { return b.trigger.length - a.trigger.length; });

  // Découper le texte en segments [{ key, text }]
  var lower   = rawText.toLowerCase();
  var segments = [];
  var pos      = 0;
  var currentKey = 'general';

  while (pos < rawText.length) {
    var nextMatch = null;
    var nextPos   = rawText.length;
    allTriggers.forEach(function(t) {
      var idx = lower.indexOf(t.trigger, pos);
      if (idx !== -1 && idx < nextPos) {
        nextPos = idx;
        nextMatch = t;
      }
    });

    // Texte avant le prochain trigger
    var chunk = rawText.slice(pos, nextPos).trim();
    if (chunk) segments.push({ key: currentKey, text: chunk });

    if (!nextMatch) break;

    // Sauter le trigger lui-même
    currentKey = nextMatch.key;
    pos = nextPos + nextMatch.trigger.length;
  }

  // Regrouper par module
  var result = {};
  segments.forEach(function(s) {
    if (!result[s.key]) result[s.key] = [];
    // Découper en lignes sur les pauses naturelles (virgule, point)
    var lines = s.text.replace(/([.,!?;])\s*/g, '$1\n').split('\n');
    lines.forEach(function(l) {
      var t = l.trim().replace(/^[,.\s]+|[,.\s]+$/g, '');
      if (t) result[s.key].push(t);
    });
  });

  return result;
}

// ─── HTML utilitaire ──────────────────────────
function _terrainEscape(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Ouverture ────────────────────────────────
function openTerrain(missionIdx) {
  _terrainMissionIdx = (missionIdx !== undefined && missionIdx !== null) ? missionIdx : currentMissionIdx;
  _terrainOpen       = true;
  _terrainRecording  = false;
  _terrainAutoRestart = false;
  _terrainInterim    = '';

  // Charger données existantes
  var saved = (_terrainMissionIdx !== null && missions[_terrainMissionIdx])
    ? (missions[_terrainMissionIdx].terrain_text || '')
    : '';
  _terrainFullText = saved;

  _renderTerrainModal();
}

// ─── Fermeture ────────────────────────────────
function closeTerrain() {
  _stopTerrainRecording();
  _stopCompass();
  _terrainOpen = false;
  var el = document.getElementById('terrain-modal');
  if (el) el.remove();
}

// ─── Rendu principal ──────────────────────────
function _renderTerrainModal() {
  var existing = document.getElementById('terrain-modal');
  if (existing) existing.remove();

  var missionLabel = '';
  if (_terrainMissionIdx !== null && missions[_terrainMissionIdx]) {
    var m = missions[_terrainMissionIdx];
    missionLabel = (m.nom || m.prenom || m.societe || 'Mission').trim();
    if (m.adresse) missionLabel += ' — ' + m.adresse;
  }

  var modal = document.createElement('div');
  modal.id = 'terrain-modal';
  modal.style.cssText = [
    'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999',
    'background:#0F172A;display:flex;flex-direction:column',
    'font-family:inherit;overflow:hidden'
  ].join(';');

  modal.innerHTML =
    // ── En-tête ──
    '<div style="background:#1E293B;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;border-bottom:1px solid #334155">' +
      '<button onclick="closeTerrain()" style="background:none;border:none;color:#94A3B8;font-size:24px;cursor:pointer;padding:0 4px;line-height:1;touch-action:manipulation">←</button>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="color:#F1F5F9;font-size:16px;font-weight:800">🎙️ Notes Terrain</div>' +
        '<div style="color:#64748B;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _terrainEscape(missionLabel) + '</div>' +
      '</div>' +
      '<button onclick="_terrainShowClassified()" style="background:#1B4332;border:none;color:#86EFAC;font-size:12px;font-weight:700;padding:8px 12px;border-radius:8px;cursor:pointer;font-family:inherit;touch-action:manipulation;white-space:nowrap">📊 Classé</button>' +
    '</div>' +

    // ── Zone transcription ──
    '<div id="terrain-transcript-area" style="flex:1;overflow-y:auto;padding:16px 16px 8px;display:flex;flex-direction:column;gap:0">' +
      (_terrainFullText
        ? '<div id="terrain-final-text" style="color:#CBD5E1;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + _terrainEscape(_terrainFullText) + '</div>'
        : '<div id="terrain-placeholder" style="color:#475569;font-size:13px;text-align:center;margin-top:48px;line-height:1.8">' +
            '🎙️ Appuie sur le micro pour commencer<br><br>' +
            '💡 Commence par dire :<br>' +
            '<span style="color:#94A3B8;font-weight:700">"module DPE"</span>, ' +
            '<span style="color:#94A3B8;font-weight:700">"module Amiante"</span>,<br>' +
            '<span style="color:#94A3B8;font-weight:700">"module Carrez"</span>…<br><br>' +
            'pour classer tes notes automatiquement' +
          '</div>'
      ) +
      '<div id="terrain-interim-text" style="color:#64748B;font-size:13px;font-style:italic;min-height:24px;margin-top:4px"></div>' +
    '</div>' +

    // ── Boussole (masquée par défaut) ──
    '<div id="terrain-compass-panel" style="display:none;background:#1E293B;padding:16px;border-top:1px solid #334155;flex-shrink:0">' +
      '<div style="display:flex;align-items:center;gap:20px;justify-content:center">' +
        '<div style="position:relative;flex-shrink:0">' +
          '<svg id="compass-svg" width="110" height="110" viewBox="0 0 110 110">' +
            '<circle cx="55" cy="55" r="52" fill="#0F172A" stroke="#334155" stroke-width="2"/>' +
            '<circle cx="55" cy="55" r="2" fill="#64748B"/>' +
            // Points cardinaux
            '<text x="55" y="16" text-anchor="middle" fill="#F1F5F9" font-size="11" font-weight="bold" font-family="Arial,sans-serif">N</text>' +
            '<text x="55" y="100" text-anchor="middle" fill="#64748B" font-size="10" font-family="Arial,sans-serif">S</text>' +
            '<text x="100" y="59" text-anchor="middle" fill="#64748B" font-size="10" font-family="Arial,sans-serif">E</text>' +
            '<text x="10" y="59" text-anchor="middle" fill="#64748B" font-size="10" font-family="Arial,sans-serif">O</text>' +
            // Graduations
            '<line x1="55" y1="24" x2="55" y2="30" stroke="#475569" stroke-width="1"/>' +
            '<line x1="55" y1="80" x2="55" y2="86" stroke="#475569" stroke-width="1"/>' +
            '<line x1="80" y1="55" x2="86" y2="55" stroke="#475569" stroke-width="1"/>' +
            '<line x1="24" y1="55" x2="30" y2="55" stroke="#475569" stroke-width="1"/>' +
            // Aiguille
            '<g id="compass-needle" transform="rotate(0,55,55)">' +
              '<polygon points="55,18 58,55 55,60 52,55" fill="#EF4444"/>' +
              '<polygon points="55,60 58,55 55,92 52,55" fill="#475569"/>' +
            '</g>' +
          '</svg>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<div id="compass-reading" style="color:#F1F5F9;font-size:28px;font-weight:800;text-align:center">— °</div>' +
          '<div id="compass-direction" style="color:#94A3B8;font-size:14px;font-weight:700;text-align:center">—</div>' +
          '<button onclick="_insertCompassNote()" style="background:#1B4332;border:none;color:#86EFAC;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;cursor:pointer;font-family:inherit;touch-action:manipulation">📝 Insérer</button>' +
        '</div>' +
      '</div>' +
      '<div id="compass-calibration" style="display:none;color:#FBBF24;font-size:11px;text-align:center;margin-top:8px">🔄 Tourne ton téléphone en 8 pour calibrer la boussole</div>' +
    '</div>' +

    // ── Raccourcis modules ──
    '<div style="background:#1E293B;padding:8px 12px;border-top:1px solid #334155;flex-shrink:0;overflow-x:auto;white-space:nowrap">' +
      TERRAIN_MODULES.map(function(m) {
        return '<button onclick="_terrainInsertTag(\'' + m.triggers[0] + '\')" ' +
          'style="display:inline-block;background:#0F172A;border:1px solid #334155;color:#94A3B8;font-size:11px;padding:5px 9px;border-radius:6px;cursor:pointer;font-family:inherit;margin-right:6px;touch-action:manipulation">' +
          m.emoji + ' ' + m.label + '</button>';
      }).join('') +
    '</div>' +

    // ── Barre d'actions ──
    '<div style="background:#1E293B;padding:14px 20px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-top:1px solid #334155">' +

      // Boussole
      '<button id="btn-compass-toggle" onclick="_toggleCompass()" ' +
        'style="width:52px;height:52px;border-radius:50%;background:#0F172A;border:2px solid #334155;color:#94A3B8;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;touch-action:manipulation">' +
        '🧭</button>' +

      // Micro
      '<button id="btn-record-terrain" onclick="_toggleTerrainRecording()" ' +
        'style="width:76px;height:76px;border-radius:50%;background:#EF4444;border:none;color:#fff;font-size:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 0 rgba(239,68,68,0);transition:all .2s;touch-action:manipulation">' +
        '🎙️</button>' +

      // Sauvegarder
      '<button onclick="_terrainSave(true)" ' +
        'style="width:52px;height:52px;border-radius:50%;background:#1B4332;border:2px solid #2D6A4F;color:#86EFAC;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation">' +
        '💾</button>' +

    '</div>';

  document.body.appendChild(modal);

  // Scroll bas
  var ta = document.getElementById('terrain-transcript-area');
  if (ta) ta.scrollTop = ta.scrollHeight;
}

// ─── Enregistrement vocal ──────────────────────
function _toggleTerrainRecording() {
  if (_terrainRecording) {
    _stopTerrainRecording();
  } else {
    _startTerrainRecording();
  }
}

function _startTerrainRecording() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('La reconnaissance vocale n\'est pas disponible sur ce navigateur.\nUtilise Chrome ou Safari mobile.');
    return;
  }

  // Créer une nouvelle instance à chaque démarrage (plus fiable)
  if (_terrainSR) {
    try { _terrainSR.abort(); } catch(e) {}
    _terrainSR = null;
  }

  _terrainSR = new SR();
  _terrainSR.lang           = 'fr-FR';
  _terrainSR.continuous     = true;
  _terrainSR.interimResults = true;
  _terrainSR.maxAlternatives = 1;

  _terrainSR.onstart = function() {
    _terrainRecording   = true;
    _terrainAutoRestart = true;
    _updateRecordBtn(true);
  };

  _terrainSR.onresult = function(e) {
    var interim = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      var res = e.results[i];
      if (res.isFinal) {
        var finalText = res[0].transcript.trim();
        if (finalText) {
          // Retirer le placeholder
          var ph = document.getElementById('terrain-placeholder');
          if (ph) ph.remove();
          // Ajouter au texte complet
          _terrainFullText += (_terrainFullText ? ' ' : '') + finalText;
          _updateFinalDisplay();
        }
      } else {
        interim += res[0].transcript;
      }
    }
    _terrainInterim = interim;
    var interimEl = document.getElementById('terrain-interim-text');
    if (interimEl) interimEl.textContent = interim;
  };

  _terrainSR.onerror = function(e) {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      _terrainAutoRestart = false;
      _terrainRecording   = false;
      _updateRecordBtn(false);
      alert('Microphone non autorisé.\nAutorise le microphone dans les réglages de ton navigateur.');
    }
    // 'no-speech', 'network', 'aborted' → auto-restart géré dans onend
  };

  _terrainSR.onend = function() {
    _terrainInterim = '';
    var interimEl = document.getElementById('terrain-interim-text');
    if (interimEl) interimEl.textContent = '';

    if (_terrainRecording && _terrainAutoRestart) {
      // Redémarrer après un court délai (évite les erreurs "already started")
      setTimeout(function() {
        if (_terrainRecording && _terrainAutoRestart) {
          try {
            _terrainSR.start();
          } catch(e) {
            // Si l'instance est morte, en créer une nouvelle
            _terrainAutoRestart = false;
            _startTerrainRecording();
          }
        }
      }, 200);
    } else {
      _terrainRecording = false;
      _updateRecordBtn(false);
    }
  };

  try {
    _terrainSR.start();
  } catch(e) {
    alert('Impossible de démarrer le micro : ' + e.message);
  }
}

function _stopTerrainRecording() {
  _terrainAutoRestart = false;
  _terrainRecording   = false;
  if (_terrainSR) {
    try { _terrainSR.stop(); } catch(e) {}
  }
  _updateRecordBtn(false);
  var interimEl = document.getElementById('terrain-interim-text');
  if (interimEl) interimEl.textContent = '';
}

function _updateRecordBtn(isRecording) {
  var btn = document.getElementById('btn-record-terrain');
  if (!btn) return;
  if (isRecording) {
    btn.style.background = '#DC2626';
    btn.style.boxShadow  = '0 0 0 8px rgba(220,38,38,0.25)';
    btn.textContent = '⏹️';
    btn.title = 'Arrêter l\'enregistrement';
  } else {
    btn.style.background = '#EF4444';
    btn.style.boxShadow  = '0 0 0 0 rgba(239,68,68,0)';
    btn.textContent = '🎙️';
    btn.title = 'Démarrer l\'enregistrement';
  }
}

function _updateFinalDisplay() {
  var area = document.getElementById('terrain-transcript-area');
  if (!area) return;
  var finalEl = document.getElementById('terrain-final-text');
  if (!finalEl) {
    finalEl = document.createElement('div');
    finalEl.id = 'terrain-final-text';
    finalEl.style.cssText = 'color:#CBD5E1;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word';
    area.insertBefore(finalEl, document.getElementById('terrain-interim-text'));
  }
  finalEl.textContent = _terrainFullText;
  // Scroll bas
  area.scrollTop = area.scrollHeight;
}

// ─── Insérer un tag module manuellement ───────
function _terrainInsertTag(tagText) {
  var ph = document.getElementById('terrain-placeholder');
  if (ph) ph.remove();
  _terrainFullText += (_terrainFullText ? ' ' : '') + tagText + ' ';
  _updateFinalDisplay();
}

// ─── Sauvegarde ───────────────────────────────
function _terrainSave(showFeedback) {
  _stopTerrainRecording();

  if (_terrainMissionIdx === null || !missions[_terrainMissionIdx]) {
    if (showFeedback) alert('Aucune mission sélectionnée.');
    return;
  }

  missions[_terrainMissionIdx].terrain_text = _terrainFullText;
  missions[_terrainMissionIdx].terrain_date = new Date().toISOString();
  localStorage.setItem('dd_missions', JSON.stringify(missions));

  if (showFeedback) {
    var btn = document.querySelector('[onclick="_terrainSave(true)"]');
    if (btn) {
      var orig = btn.textContent;
      btn.textContent = '✅';
      btn.style.background = '#065F46';
      setTimeout(function() {
        btn.textContent = orig;
        btn.style.background = '#1B4332';
      }, 1500);
    }
  }
}

// ─── Vue classée ──────────────────────────────
function _terrainShowClassified() {
  _stopTerrainRecording();

  var classified = _terrainClassify(_terrainFullText);
  var empty = Object.keys(classified).length === 0;

  var panel = document.createElement('div');
  panel.id = 'terrain-classified-panel';
  panel.style.cssText = [
    'position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000',
    'background:#0F172A;display:flex;flex-direction:column;font-family:inherit;overflow:hidden'
  ].join(';');

  var html =
    '<div style="background:#1E293B;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;border-bottom:1px solid #334155">' +
      '<button onclick="document.getElementById(\'terrain-classified-panel\').remove()" style="background:none;border:none;color:#94A3B8;font-size:24px;cursor:pointer;padding:0 4px;line-height:1">←</button>' +
      '<div style="color:#F1F5F9;font-size:16px;font-weight:800">📊 Notes classées par module</div>' +
    '</div>' +
    '<div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">';

  if (empty) {
    html += '<div style="color:#475569;text-align:center;margin-top:48px;font-size:13px">Aucune note à classer.<br>Dicte des notes puis réessaie.</div>';
  } else {
    TERRAIN_MODULES.forEach(function(m) {
      var lines = classified[m.key];
      if (!lines || !lines.length) return;
      html +=
        '<div style="background:#1E293B;border-radius:12px;overflow:hidden;border:1px solid #334155">' +
          '<div style="background:#0F172A;padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #334155">' +
            '<span style="font-size:18px">' + m.emoji + '</span>' +
            '<span style="color:#F1F5F9;font-size:14px;font-weight:800">' + m.label + '</span>' +
            '<span style="margin-left:auto;background:#334155;color:#94A3B8;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px">' + lines.length + '</span>' +
          '</div>' +
          '<div style="padding:12px 14px;display:flex;flex-direction:column;gap:6px">' +
            lines.map(function(l) {
              return '<div style="color:#CBD5E1;font-size:13px;line-height:1.5;padding:4px 0;border-bottom:1px solid #1E293B">— ' + _terrainEscape(l) + '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    });
  }

  html += '</div>' +
    '<div style="background:#1E293B;padding:12px 16px;border-top:1px solid #334155;display:flex;gap:10px;flex-shrink:0">' +
      '<button onclick="_terrainCopyAll()" style="flex:1;padding:12px;border-radius:10px;border:1.5px solid #334155;background:#0F172A;color:#94A3B8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📋 Copier</button>' +
      '<button onclick="_terrainSave(false);document.getElementById(\'terrain-classified-panel\').remove()" style="flex:2;padding:12px;border-radius:10px;border:none;background:#1B4332;color:#86EFAC;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 Enregistrer dans la mission</button>' +
    '</div>';

  panel.innerHTML = html;
  document.body.appendChild(panel);
}

function _terrainCopyAll() {
  var classified = _terrainClassify(_terrainFullText);
  var text = '';
  TERRAIN_MODULES.forEach(function(m) {
    var lines = classified[m.key];
    if (!lines || !lines.length) return;
    text += m.emoji + ' ' + m.label.toUpperCase() + '\n';
    lines.forEach(function(l) { text += '— ' + l + '\n'; });
    text += '\n';
  });
  if (!text.trim()) { text = _terrainFullText; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text.trim()).then(function() {
      alert('✅ Notes copiées dans le presse-papiers !');
    }).catch(function() {
      prompt('Copie ce texte :', text.trim());
    });
  } else {
    prompt('Copie ce texte :', text.trim());
  }
}

// ─── Boussole ─────────────────────────────────
function _toggleCompass() {
  if (_compassActive) {
    _stopCompass();
  } else {
    _startCompass();
  }
}

function _startCompass() {
  var panel  = document.getElementById('terrain-compass-panel');
  var btnC   = document.getElementById('btn-compass-toggle');

  if (!window.DeviceOrientationEvent) {
    alert('La boussole n\'est pas disponible sur cet appareil.');
    return;
  }

  function _activateCompass() {
    _compassActive = true;
    if (panel) panel.style.display = 'block';
    if (btnC)  { btnC.style.border = '2px solid #2D6A4F'; btnC.style.color = '#86EFAC'; }

    _compassListener = function(e) {
      var heading = null;

      // iOS : webkitCompassHeading est direct (0 = Nord, croissant vers l'Est)
      if (typeof e.webkitCompassHeading !== 'undefined' && e.webkitCompassHeading !== null) {
        heading = e.webkitCompassHeading;
      }
      // Android : alpha = rotation autour de l'axe Z (0 = Nord sur certains, mais peut varier)
      // Sur Android, si absolute=true, alpha représente l'angle par rapport au nord magnétique
      else if (e.alpha !== null && e.alpha !== undefined) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading === null) return;
      _compassHeading = Math.round(heading);
      _updateCompassUI(_compassHeading);
    };

    window.addEventListener('deviceorientation', _compassListener, true);

    // Détection besoin calibration (iOS)
    window.addEventListener('compassneedscalibration', function() {
      var cal = document.getElementById('compass-calibration');
      if (cal) cal.style.display = 'block';
    }, false);
  }

  // iOS 13+ : demander la permission explicitement
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(function(state) {
        if (state === 'granted') {
          _activateCompass();
        } else {
          alert('Permission boussole refusée. Autorise dans Réglages → Safari → Mouvement et orientation.');
        }
      })
      .catch(function(err) {
        alert('Erreur boussole : ' + err);
      });
  } else {
    _activateCompass();
  }
}

function _stopCompass() {
  _compassActive = false;
  if (_compassListener) {
    window.removeEventListener('deviceorientation', _compassListener, true);
    _compassListener = null;
  }
  var panel = document.getElementById('terrain-compass-panel');
  if (panel) panel.style.display = 'none';
  var btnC = document.getElementById('btn-compass-toggle');
  if (btnC) { btnC.style.border = '2px solid #334155'; btnC.style.color = '#94A3B8'; }
}

function _updateCompassUI(deg) {
  // Aiguille SVG
  var needle = document.getElementById('compass-needle');
  if (needle) needle.setAttribute('transform', 'rotate(' + deg + ',55,55)');

  // Lecture numérique
  var reading = document.getElementById('compass-reading');
  if (reading) reading.textContent = deg + '°';

  // Direction en texte
  var dirs = ['Nord','Nord-Est','Est','Sud-Est','Sud','Sud-Ouest','Ouest','Nord-Ouest'];
  var dir = dirs[Math.round(deg / 45) % 8];
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

// ─── Lecture notes terrain depuis une mission ──
function getTerrainNotes(missionIdx) {
  if (missionIdx === null || !missions[missionIdx]) return null;
  return missions[missionIdx].terrain_text || null;
}
