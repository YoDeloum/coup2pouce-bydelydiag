// ─────────────────────────────────────────────
// PRENOM.JS — Personnalisation par prénom
// ─────────────────────────────────────────────

function initPrenom() {
  var saved = localStorage.getItem('dd_prenom');
  if (saved) {
    userPrenom = saved;
    window.jeffreyPrenom = saved;
    updateBonjourMessage();
  } else {
    setTimeout(function() {
      document.getElementById('prenom-modal').classList.remove('hidden');
      var inp = document.getElementById('prenom-input');
      if (inp) inp.focus();
    }, 800);
  }
}

function savePrenom() {
  var input = document.getElementById('prenom-input');
  var val   = input.value.trim();
  if (!val) return;
  userPrenom = val;
  window.jeffreyPrenom = val;
  localStorage.setItem('dd_prenom', val);
  document.getElementById('prenom-modal').classList.add('hidden');
  updateBonjourMessage();
}

function updateBonjourMessage() {
  var el = document.getElementById('bonjour-msg');
  if (el && userPrenom) {
    el.textContent = 'Bonjour ' + userPrenom + ' 👋';
    el.style.display = 'block';
  }
}
