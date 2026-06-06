// ─────────────────────────────────────────────
// STATE.JS — Variables globales partagées
// Toutes les variables d'état de l'application
// ─────────────────────────────────────────────

// Navigation
var curKey   = null;   // Clé du module ouvert (ex: "DPE")
var curTab   = "cours"; // Onglet actif : "cours" | "fiches"
var curCours = 0;       // Index du chapitre actif

// Scores quiz
var scores = {};

// Utilisateur
var userPrenom = '';
var selectedAvatar      = localStorage.getItem('dd_avatar')       || '😊';
var selectedAvatarColor = localStorage.getItem('dd_avatar_color') || '#2D6A4F';

// Missions
var missions = JSON.parse(localStorage.getItem('dd_missions') || '[]');
var currentMissionIdx = null;
var missionView = 'list'; // 'list' | 'form'

// Checklist
var selectedMods  = [];
var checkStates   = {};

// Carrez calculateur
var calcZones      = [{l:'', w:'', label:'Pièce 1'}];
var calcSoustraire = [];

// Chatbot
var chatHistory = [];
var chatOpen    = false;

// Minuteurs gaz
var _gz = {};

// Sous-dossier DPE actif
// window.dpeSd — géré dans router.js

// ─── Migration données : 'Electricite' → 'Électricité' ───────────────────────
(function migrateTarifs() {
  try {
    var t = JSON.parse(localStorage.getItem('dd_tarifs') || '{}');
    if (t['Electricite'] !== undefined && t['Électricité'] === undefined) {
      t['Électricité'] = t['Electricite'];
      delete t['Electricite'];
      localStorage.setItem('dd_tarifs', JSON.stringify(t));
    }
  } catch(e) {}
})();

// Migration: Electricite (sans accent) -> Electricite (avec accent)
(function migrateTarifs() {
  try {
    var t = JSON.parse(localStorage.getItem('dd_tarifs') || '{}');
    if (t['Electricite'] !== undefined && t['Électricité'] === undefined) {
      t['Électricité'] = t['Electricite'];
      delete t['Electricite'];
      localStorage.setItem('dd_tarifs', JSON.stringify(t));
    }
  } catch(e) {}
})();
