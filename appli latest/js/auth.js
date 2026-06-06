// ─────────────────────────────────────────────
// AUTH.JS — Authentification Firebase (REST API)
// ─────────────────────────────────────────────

var FIREBASE_API_KEY = "AIzaSyATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4";

function firebaseLogin() {
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var errorEl  = document.getElementById('login-error');
  var btn      = document.querySelector('.login-btn');

  if (!email || !password) {
    errorEl.textContent = '❌ Remplis tous les champs';
    errorEl.style.display = 'block';
    return;
  }

  btn.textContent = '⏳ Connexion...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: email, password: password, returnSecureToken: true})
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.idToken) {
      localStorage.setItem('fb_token', data.idToken);
      localStorage.setItem('fb_email', email);
      document.getElementById('login-screen').classList.add('hidden');
    } else {
      var msg = '❌ Email ou mot de passe incorrect';
      if (data.error && data.error.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        msg = '❌ Trop de tentatives. Réessaie plus tard.';
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      btn.textContent = 'Accéder →';
      btn.disabled = false;
    }
  })
  .catch(function() {
    errorEl.textContent = '❌ Erreur réseau. Vérifie ta connexion.';
    errorEl.style.display = 'block';
    btn.textContent = 'Accéder →';
    btn.disabled = false;
  });
}

function checkLogin() {
  var token = localStorage.getItem('fb_token');
  if (token) {
    document.getElementById('login-screen').classList.add('hidden');
  }
}
