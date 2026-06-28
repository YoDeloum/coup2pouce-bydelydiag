// ─────────────────────────────────────────────
// AUTH.JS — Authentification Firebase (REST API)
// ─────────────────────────────────────────────

var FIREBASE_API_KEY = "AIzaSyATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4";
var _authMode = 'login'; // 'login' ou 'register'

// ─── Bascule Login ↔ Inscription ───
function toggleAuthMode() {
  _authMode = _authMode === 'login' ? 'register' : 'login';
  var isReg = _authMode === 'register';
  document.querySelector('.login-btn').textContent = isReg ? 'Créer mon compte →' : 'Accéder →';
  document.querySelector('.login-subtitle').textContent = isReg ? 'Créez votre compte Coup 2 Pouce' : 'Application réservée aux licenciés DELY DIAG';
  document.getElementById('login-confirm-password').style.display = isReg ? 'block' : 'none';
  document.getElementById('login-toggle-text').textContent = isReg ? 'Déjà un compte ?' : 'Pas encore de compte ?';
  document.getElementById('login-toggle-btn').textContent  = isReg ? 'Se connecter' : 'Créer mon compte';
  document.getElementById('login-error').style.display = 'none';
}

function handleAuthSubmit() {
  if (_authMode === 'register') { firebaseRegister(); } else { firebaseLogin(); }
}

// ─── Connexion ───
function firebaseLogin() {
  var email   = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var errorEl  = document.getElementById('login-error');
  var btn      = document.querySelector('.login-btn');

  if (!email || !password) {
    errorEl.textContent = 'Remplis tous les champs';
    errorEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Connexion...';
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
      localStorage.setItem('fb_uid',   data.localId);
      localStorage.setItem('fb_email', email);
      document.getElementById('login-screen').classList.add('hidden');
      if (typeof syncFromFirestore === 'function') {
        syncFromFirestore(function() {});
      }
    } else {
      var msg = 'Email ou mot de passe incorrect';
      if (data.error && data.error.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        msg = 'Trop de tentatives. Réessaie plus tard.';
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      btn.textContent = 'Accéder →';
      btn.disabled = false;
    }
  })
  .catch(function() {
    errorEl.textContent = 'Erreur réseau. Vérifie ta connexion.';
    errorEl.style.display = 'block';
    btn.textContent = 'Accéder →';
    btn.disabled = false;
  });
}

// ─── Inscription ───
function firebaseRegister() {
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var confirm  = document.getElementById('login-confirm-password').value;
  var errorEl  = document.getElementById('login-error');
  var btn      = document.querySelector('.login-btn');

  if (!email || !password || !confirm) {
    errorEl.textContent = 'Remplis tous les champs';
    errorEl.style.display = 'block'; return;
  }
  if (password !== confirm) {
    errorEl.textContent = 'Les mots de passe ne correspondent pas';
    errorEl.style.display = 'block'; return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Mot de passe trop court (6 caractères minimum)';
    errorEl.style.display = 'block'; return;
  }

  btn.textContent = 'Création...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: email, password: password, returnSecureToken: true})
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.idToken) {
      localStorage.setItem('fb_token', data.idToken);
      localStorage.setItem('fb_uid',   data.localId);
      localStorage.setItem('fb_email', email);
      document.getElementById('login-screen').classList.add('hidden');
      if (typeof syncFromFirestore === 'function') {
        syncFromFirestore(function() {});
      }
    } else {
      var msg = 'Erreur lors de la création du compte';
      if (data.error) {
        if (data.error.message === 'EMAIL_EXISTS')  msg = 'Cet email est déjà utilisé. Connecte-toi.';
        if (data.error.message === 'WEAK_PASSWORD') msg = 'Mot de passe trop faible (6 caractères min.)';
        if (data.error.message === 'INVALID_EMAIL') msg = 'Adresse email invalide';
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      btn.textContent = 'Créer mon compte →';
      btn.disabled = false;
    }
  })
  .catch(function() {
    errorEl.textContent = 'Erreur réseau. Vérifie ta connexion.';
    errorEl.style.display = 'block';
    btn.textContent = 'Créer mon compte →';
    btn.disabled = false;
  });
}

// ─── Déconnexion ───
function deconnexion() {
  if (!confirm('Se déconnecter ?')) return;
  localStorage.removeItem('fb_token');
  localStorage.removeItem('fb_uid');
  localStorage.removeItem('fb_email');
  document.getElementById('login-screen').classList.remove('hidden');
}

// ─── Vérification session existante ───
function checkLogin() {
  var token = localStorage.getItem('fb_token');
  if (token) {
    document.getElementById('login-screen').classList.add('hidden');
    if (typeof syncFromFirestore === 'function') {
      syncFromFirestore(function() {});
    }
  }
}
