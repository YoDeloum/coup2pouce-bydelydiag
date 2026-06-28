// ─────────────────────────────────────────────
// ASTUCES.JS — Bannière rotative page d'accueil
// ─────────────────────────────────────────────

function initAstuce() {
  newAstuce();
}

function newAstuce() {
  var idx = Math.floor(Math.random() * ASTUCES.length);
  var el  = document.getElementById('astuce-content');
  if (el) {
    el.style.opacity = '0';
    setTimeout(function() {
      el.textContent  = ASTUCES[idx];
      el.style.opacity = '1';
      el.style.transition = 'opacity .4s';
    }, 200);
  }
}

// ─── MINUTEURS GAZ ───
function gzStart(id, total) {
  if (_gz[id]) clearInterval(_gz[id]);
  var rem = total;
  _gz[id] = setInterval(function() {
    rem--;
    var m = Math.floor(rem / 60), s = rem % 60;
    var d = document.getElementById('td-' + id);
    var b = document.getElementById('tb-' + id);
    if (d) d.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    if (b) b.style.width  = (rem / total * 100) + '%';
    if (rem <= 0) {
      clearInterval(_gz[id]);
      if (d) d.textContent = '✅ OK';
      if (navigator.vibrate) navigator.vibrate([300,100,300]);
    }
  }, 1000);
  var btn = document.getElementById('tbtn-' + id);
  if (btn) btn.textContent = '⏹ Stop';
}

function gzReset(id, total) {
  if (_gz[id]) clearInterval(_gz[id]);
  var m = Math.floor(total / 60), s = total % 60;
  var d   = document.getElementById('td-' + id);
  var b   = document.getElementById('tb-' + id);
  var btn = document.getElementById('tbtn-' + id);
  if (d)   d.textContent   = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  if (b)   b.style.width   = '100%';
  if (btn) btn.textContent = '▶ Démarrer';
}
