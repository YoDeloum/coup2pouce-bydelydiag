// ─────────────────────────────────────────────
// CHECKLIST.JS — Checklist terrain dynamique
// ─────────────────────────────────────────────

function openChecklist() {
  document.getElementById('checklist-screen').classList.add('open');
}

function closeChecklist() {
  document.getElementById('checklist-screen').classList.remove('open');
}

function toggleMod(btn) {
  var mod = btn.dataset.mod;
  btn.classList.toggle('selected');
  if (selectedMods.includes(mod)) {
    selectedMods = selectedMods.filter(function(m) { return m !== mod; });
  } else {
    selectedMods.push(mod);
  }
}

function generateChecklist() {
  if (selectedMods.length === 0) { alert('Sélectionne au moins un module !'); return; }
  var container = document.getElementById('cl-results');
  container.innerHTML = '';

  selectedMods.forEach(function(mod) {
    var data = CHECKLIST_DATA[mod];
    if (!data) return;
    if (!checkStates[mod]) checkStates[mod] = {};

    var checked = Object.values(checkStates[mod]).filter(Boolean).length;
    var total   = data.items.length;
    var pct     = Math.round(checked / total * 100);

    var section = document.createElement('div');
    section.className = 'cl-section';
    section.innerHTML = `
      <div class="cl-section-title" style="color:${data.color}">${data.icon} ${data.label}</div>
      <div class="cl-progress"><div class="cl-progress-fill" id="prog-${mod}" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:#6B7280;margin-bottom:10px;text-align:right">${checked}/${total} effectués</div>
      <div id="items-${mod}"></div>
      <button class="cl-reset-btn" onclick="resetMod('${mod}')">🔄 Réinitialiser ${data.label}</button>`;
    container.appendChild(section);

    var itemsContainer = document.getElementById('items-' + mod);
    data.items.forEach(function(item, i) {
      var isChecked = checkStates[mod][i] || false;
      var div = document.createElement('div');
      div.className = 'cl-item';
      div.onclick = function() { toggleCheck(mod, i, data.items.length); };
      div.innerHTML = `
        <div class="cl-checkbox ${isChecked?'checked':''}" id="cb-${mod}-${i}"></div>
        <div class="cl-item-text ${isChecked?'checked':''}" id="ct-${mod}-${i}">${item}</div>`;
      itemsContainer.appendChild(div);
    });
  });
}

function toggleCheck(mod, idx, total) {
  if (!checkStates[mod]) checkStates[mod] = {};
  checkStates[mod][idx] = !checkStates[mod][idx];
  var isChecked = checkStates[mod][idx];

  var cb = document.getElementById('cb-' + mod + '-' + idx);
  var ct = document.getElementById('ct-' + mod + '-' + idx);
  if (cb) cb.className = 'cl-checkbox' + (isChecked ? ' checked' : '');
  if (ct) ct.className = 'cl-item-text' + (isChecked ? ' checked' : '');

  var checked = Object.values(checkStates[mod]).filter(Boolean).length;
  var pct     = Math.round(checked / total * 100);
  var prog    = document.getElementById('prog-' + mod);
  if (prog) prog.style.width = pct + '%';

  // Mettre à jour le compteur
  var section = prog && prog.closest('.cl-section');
  if (section) {
    var counter = section.querySelector('div[style*="text-align:right"]');
    if (counter) counter.textContent = checked + '/' + total + ' effectués';
  }
}

function resetMod(mod) {
  checkStates[mod] = {};
  generateChecklist();
}

// ─── CHECKLIST VOCALE ───
function startChecklistVoice(mod) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert('Reconnaissance vocale non disponible.'); return; }
  var r = new SpeechRecognition();
  r.lang = 'fr-FR'; r.continuous = false; r.interimResults = false;
  r.onresult = function(e) {
    var said = e.results[0][0].transcript.toLowerCase();
    var data = CHECKLIST_DATA[mod];
    if (!data) return;
    data.items.forEach(function(item, i) {
      var words = item.toLowerCase().split(' ').filter(function(w) { return w.length > 3; });
      var match = words.some(function(w) { return said.includes(w); });
      if (match && !checkStates[mod]?.[i]) {
        toggleCheck(mod, i, data.items.length);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    });
  };
  r.start();
}
