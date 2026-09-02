// ─────────────────────────────────────────────
// VOICE.JS — Commandes vocales
// Dictée Jeffrey + Navigation par la voix
// ─────────────────────────────────────────────

var _voiceRecognition = null;
var _voiceActive      = false;

function _getSR() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ─── Feedback visuel sur les boutons mic ───
function _setNavMicActive(active) {
  var btns = document.querySelectorAll('.voice-nav-mic');
  btns.forEach(function(btn) {
    btn.style.color     = active ? '#EF4444' : '';
    btn.style.animation = active ? 'mic-pulse 0.8s ease-in-out infinite' : '';
  });
}
function _setJeffreyMicActive(active) {
  var btn = document.getElementById('voice-jeffrey-btn');
  if (!btn) return;
  btn.style.color     = active ? '#EF4444' : '';
  btn.style.animation = active ? 'mic-pulse 0.8s ease-in-out infinite' : '';
}

// ─── Arrêt propre de la reconnaissance ───
function _stopVoice() {
  if (_voiceRecognition) { try { _voiceRecognition.abort(); } catch(e) {} _voiceRecognition = null; }
  _voiceActive = false;
  _setNavMicActive(false);
  _setJeffreyMicActive(false);
}

// ─── Toast de feedback ───
function _voiceToast(msg) {
  var old = document.getElementById('voice-toast');
  if (old) old.remove();
  var toast = document.createElement('div');
  toast.id = 'voice-toast';
  toast.textContent = msg;
  toast.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(0,0,0,0.78)', 'color:#fff', 'padding:10px 18px',
    'border-radius:20px', 'font-size:13px', 'font-weight:600',
    'z-index:10000', 'white-space:nowrap', 'max-width:90vw',
    'text-align:center', 'pointer-events:none', 'font-family:inherit'
  ].join(';');
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 2500);
}

// ─────────────────────────────────────────────
// DICTÉE JEFFREY
// ─────────────────────────────────────────────
function startJeffreyDictation() {
  if (!_getSR()) { alert('Commande vocale non supportée. Utilisez Chrome.'); return; }
  if (_voiceActive) { _stopVoice(); return; }

  var SR = _getSR();
  var recognition = new SR();
  recognition.lang            = 'fr-FR';
  recognition.continuous      = false;
  recognition.interimResults  = false;

  _voiceActive = true;
  _setJeffreyMicActive(true);

  recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    var input = document.getElementById('chat-input');
    if (input) {
      input.value = transcript;
      input.focus();
      // Déclencher automatiquement l'envoi si fin de phrase détectée
      // (l'utilisateur peut encore modifier le texte avant d'appuyer sur Entrée)
    }
    _stopVoice();
  };

  recognition.onerror = function(e) {
    _stopVoice();
    if (e.error === 'not-allowed') alert('Autorisation microphone refusée. Vérifiez les permissions du navigateur.');
  };

  recognition.onend = function() { _stopVoice(); };

  _voiceRecognition = recognition;
  recognition.start();
}

// ─────────────────────────────────────────────
// NAVIGATION VOCALE
// ─────────────────────────────────────────────

// Correspondances modules
var _VOICE_MODULES = [
  { mots: ['dpe', 'énergie', 'energetique', 'energétique', 'thermique', 'performance'], key: 'DPE',      label: 'DPE' },
  { mots: ['amiante'], key: 'Amiante',  label: 'Amiante' },
  { mots: ['plomb', 'crep'], key: 'Plomb',    label: 'Plomb' },
  { mots: ['termite', 'xylophage', 'bois'], key: 'Termites', label: 'Termites' },
  { mots: ['électricité', 'electricite', 'électrique', 'electrique', 'elec'], key: 'Elec', label: 'Électricité' },
  { mots: ['gaz'], key: 'Gaz',      label: 'Gaz' },
  { mots: ['erp', 'risques', 'pollution', 'risque'], key: 'ERP',      label: 'ERP' },
  { mots: ['certif', 'certification', 'certificat'], key: 'Certif',   label: 'Certification' },
  { mots: ['matériel', 'materiel', 'équipement', 'equipement', 'outil'], key: 'Materiel', label: 'Matériel' },
  { mots: ['carrez', 'boutin', 'triangulation', 'surface', 'loi carrez'], key: 'Carrez',   label: 'Carrez' },
];

// Correspondances actions
var _VOICE_ACTIONS = [
  { mots: ['mission', 'missions', 'agenda', 'rdv', 'rendez-vous', 'rendez vous'],
    label: 'Missions', action: function() { if (typeof openMission==='function') openMission(); else alert('Section missions non disponible ici.'); } },
  { mots: ['devis'],
    label: 'Devis', action: function() { if (typeof openDevis==='function') openDevis(); } },
  { mots: ['facture', 'factures'],
    label: 'Factures', action: function() { if (typeof openFacture==='function') openFacture(); } },
  { mots: ['profil', 'société', 'societe', 'entreprise'],
    label: 'Profil', action: function() { if (typeof openProfil==='function') openProfil(); } },
  { mots: ['accueil', 'retour', 'home', 'retourne'],
    label: 'Accueil', action: function() { if (typeof showHome==='function') showHome(); } },
  { mots: ['jeffrey', 'jeffery', 'jeffry', 'chat', 'assistant'],
    label: 'Jeffrey', action: function() { if (typeof toggleChat==='function') toggleChat(); } },
  { mots: ['tarif', 'tarifs', 'prix'],
    label: 'Tarifs', action: function() { if (typeof openTarifs==='function') openTarifs(); } },
  { mots: ['client', 'clients'],
    label: 'Clients', action: function() { if (typeof openClients==='function') openClients(); } },
  { mots: ['checklist', 'liste'],
    label: 'Checklist', action: function() { if (typeof openChecklist==='function') openChecklist(); } },
];

function _handleVoiceNav(text) {
  var t = text.toLowerCase().trim();

  // 1. Chercher une correspondance de module
  for (var i = 0; i < _VOICE_MODULES.length; i++) {
    var m = _VOICE_MODULES[i];
    for (var j = 0; j < m.mots.length; j++) {
      if (t.indexOf(m.mots[j]) !== -1) {
        if (typeof openModule === 'function') openModule(m.key);
        _voiceToast('📂 Module ' + m.label + ' ouvert');
        return;
      }
    }
  }

  // 2. Chercher une correspondance d'action
  for (var i = 0; i < _VOICE_ACTIONS.length; i++) {
    var a = _VOICE_ACTIONS[i];
    for (var j = 0; j < a.mots.length; j++) {
      if (t.indexOf(a.mots[j]) !== -1) {
        a.action();
        _voiceToast('✅ ' + a.label + ' ouvert');
        return;
      }
    }
  }

  // 3. Non reconnu
  _voiceToast('🎤 "' + text + '" — non reconnu');
}

function startVoiceNav() {
  if (!_getSR()) { alert('Commande vocale non supportée. Utilisez Chrome.'); return; }
  if (_voiceActive) { _stopVoice(); return; }

  var SR = _getSR();
  var recognition = new SR();
  recognition.lang            = 'fr-FR';
  recognition.continuous      = false;
  recognition.interimResults  = false;

  _voiceActive = true;
  _setNavMicActive(true);

  recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    _stopVoice();
    _handleVoiceNav(transcript);
  };

  recognition.onerror = function(e) {
    _stopVoice();
    if (e.error === 'not-allowed') alert('Autorisation microphone refusée. Vérifiez les permissions du navigateur.');
  };

  recognition.onend = function() { _stopVoice(); };

  _voiceRecognition = recognition;
  recognition.start();
}
