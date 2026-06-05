// ─────────────────────────────────────────────
// VOICE.JS — Reconnaissance vocale (Web Speech API)
// ─────────────────────────────────────────────

var recognition = null;
var isRecording  = false;

function startVoiceDescription(targetId, btnId) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('La reconnaissance vocale n\'est pas disponible sur votre navigateur. Utilisez Chrome sur Android.');
    return;
  }

  var btn    = document.getElementById(btnId);
  var target = document.getElementById(targetId);

  if (isRecording) {
    recognition.stop();
    isRecording = false;
    btn.className = 'vocal-btn idle';
    btn.innerHTML = '🎤 Dicter';
    return;
  }

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = function(e) {
    var transcript = '';
    for (var i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    target.value = transcript;
  };

  recognition.onerror = function() {
    isRecording = false;
    btn.className = 'vocal-btn idle';
    btn.innerHTML = '🎤 Dicter';
  };

  recognition.onend = function() {
    isRecording = false;
    btn.className = 'vocal-btn idle';
    btn.innerHTML = '🎤 Dicter';
  };

  recognition.start();
  isRecording = true;
  btn.className = 'vocal-btn recording';
  btn.innerHTML = '⏹️ Stop';
}
