// ─────────────────────────────────────────────
// PRESCRIPTEURS.JS — Gestion des prescripteurs
// ─────────────────────────────────────────────

var _FS_PRESC_PROJECT = 'coup2pouce-by-delydiag';
var _FS_PRESC_KEY     = 'AIzaSy' + 'ATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';

function getAllPrescripteurs() {
  try { return JSON.parse(localStorage.getItem('dd_prescripteurs') || '[]'); } catch(e) { return []; }
}
function saveAllPrescripteurs(list) {
  localStorage.setItem('dd_prescripteurs', JSON.stringify(list));
}

function _genCodePrescripteur() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code  = '';
  for (var i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Écriture du code dans Firestore codes/{code} ───
function _fsPushCode(code, data) {
  var uid   = localStorage.getItem('fb_uid');
  var token = localStorage.getItem('fb_token');
  if (!uid || !token) return;
  var fields = {};
  Object.keys(data).forEach(function(k) {
    var v = data[k];
    if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else fields[k] = { stringValue: String(v || '') };
  });
  var url = 'https://firestore.googleapis.com/v1/projects/' + _FS_PRESC_PROJECT + '/databases/(default)/documents/codes/' + code;
  fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ fields: fields })
  }).catch(function() {});
}

// ─── Mise à jour des créneaux publics Firestore public_slots/{uid} ───
// Appelé automatiquement quand les missions changent
function updatePublicSlots() {
  var uid   = localStorage.getItem('fb_uid');
  var token = localStorage.getItem('fb_token');
  if (!uid || !token) return;

  var SLOTS    = ['09:30', '11:30', '13:30', '15:30', '17:30'];
  var slotMins = [9*60+30, 11*60+30, 13*60+30, 15*60+30, 17*60+30];

  function toStandardSlot(heure) {
    if (!heure) return null;
    if (SLOTS.indexOf(heure) !== -1) return heure;
    var parts = heure.split(':');
    var mins  = parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
    var closest = SLOTS[0]; var minDiff = Math.abs(mins - slotMins[0]);
    for (var i = 1; i < slotMins.length; i++) {
      var diff = Math.abs(mins - slotMins[i]);
      if (diff < minDiff) { minDiff = diff; closest = SLOTS[i]; }
    }
    return closest;
  }

  var ms = [];
  try { ms = JSON.parse(localStorage.getItem('dd_missions') || '[]'); } catch(e) {}

  var busy = [];
  ms.forEach(function(m) {
    if (!m.date) return;
    var slot = toStandardSlot(m.heure);
    if (slot) {
      busy.push({ date: m.date, heure: slot });
    } else {
      // Heure inconnue → bloquer tous les créneaux de ce jour
      SLOTS.forEach(function(s) { busy.push({ date: m.date, heure: s }); });
    }
  });

  // Dédupliquer
  var seen = {};
  busy = busy.filter(function(b) {
    var k = b.date + '_' + b.heure;
    if (seen[k]) return false;
    seen[k] = true; return true;
  });

  var url = 'https://firestore.googleapis.com/v1/projects/' + _FS_PRESC_PROJECT + '/databases/(default)/documents/public_slots/' + uid;
  fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      fields: {
        email_diag: { stringValue: localStorage.getItem('fb_email') || '' },
        busy: {
          arrayValue: {
            values: busy.map(function(b) {
              return {
                mapValue: {
                  fields: {
                    date:  { stringValue: b.date },
                    heure: { stringValue: b.heure }
                  }
                }
              };
            })
          }
        }
      }
    })
  }).catch(function() {});
}

// ─── Modal gestion prescripteurs ───
function ouvrirGestionPrescripteurs() {
  var list   = getAllPrescripteurs();
  var origin = window.location.origin;

  var modal = document.createElement('div');
  modal.id  = 'presc-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<h3 style="font-size:16px;font-weight:800;color:#1B4332;margin:0">🏢 Prescripteurs</h3>'
    + '<button onclick="document.getElementById(\'presc-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af">✕</button>'
    + '</div>'

    // Liste
    + (list.length === 0 ? '<p style="color:#9CA3AF;font-size:13px;text-align:center;margin-bottom:16px">Aucun prescripteur configuré</p>' : '')
    + list.map(function(p, i) {
        var lien = origin + '/prescripteur.html?code=' + p.code;
        return '<div style="background:' + (p.actif ? '#F0FDF4' : '#F9FAFB') + ';border:1.5px solid ' + (p.actif ? '#6EE7B7' : '#E2E5F0') + ';border-radius:10px;padding:12px 14px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
          + '<div style="flex:1;min-width:0">'
          + '<div style="font-weight:700;font-size:14px;color:#1A1D2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (p.agence || p.nom) + '</div>'
          + '<div style="font-size:11px;color:#6B7280;margin-top:2px">' + (p.actif ? '🟢 Actif' : '🔴 Inactif') + ' · Code : ' + p.code + '</div>'
          + '</div>'
          + '<button onclick="_togglePrescripteur(' + i + ')" style="flex-shrink:0;background:#fff;border:1px solid #E2E5F0;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit">' + (p.actif ? 'Désactiver' : 'Activer') + '</button>'
          + '</div>'
          + '<div style="display:flex;gap:8px;margin-top:10px">'
          + '<button onclick="_copyLienPrescripteur(\'' + lien + '\')" style="flex:1;padding:8px;border-radius:8px;border:1.5px solid #0891B2;background:#fff;color:#0891B2;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📋 Copier le lien</button>'
          + '<button onclick="_supprimerPrescripteur(' + i + ')" style="padding:8px 12px;border-radius:8px;border:1px solid #FCA5A5;background:#fff;color:#EF4444;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🗑</button>'
          + '</div>'
          + '</div>';
      }).join('')

    // Formulaire ajout
    + '<div style="border-top:1px solid #E2E5F0;padding-top:16px;margin-top:4px">'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">Ajouter un prescripteur</div>'
    + '<input id="presc-agence" type="text" placeholder="Nom de l\'agence / étude notariale" style="width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;box-sizing:border-box;margin-bottom:8px;outline:none"/>'
    + '<input id="presc-nom" type="text" placeholder="Nom du contact (optionnel)" style="width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:14px;font-family:inherit;box-sizing:border-box;margin-bottom:12px;outline:none"/>'
    + '<button onclick="_ajouterPrescripteur()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#E8650A,#F4A261);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">➕ Générer un lien prescripteur</button>'
    + '</div></div>';

  document.body.appendChild(modal);
}

function _ajouterPrescripteur() {
  var agence = (document.getElementById('presc-agence').value || '').trim();
  var nom    = (document.getElementById('presc-nom').value    || '').trim();
  if (!agence) { alert('Saisis le nom de l\'agence.'); return; }

  var code  = _genCodePrescripteur();
  var uid   = localStorage.getItem('fb_uid')   || '';
  var email = localStorage.getItem('fb_email') || '';
  var list  = getAllPrescripteurs();

  list.push({ code: code, agence: agence, nom: nom, actif: true, date_creation: new Date().toISOString() });
  saveAllPrescripteurs(list);

  _fsPushCode(code, { uid: uid, agence: agence, nom: nom, actif: true, email_diag: email });

  document.getElementById('presc-modal').remove();
  ouvrirGestionPrescripteurs();
}

function _togglePrescripteur(idx) {
  var list = getAllPrescripteurs();
  if (!list[idx]) return;
  list[idx].actif = !list[idx].actif;
  saveAllPrescripteurs(list);
  _fsPushCode(list[idx].code, {
    uid:       localStorage.getItem('fb_uid')   || '',
    agence:    list[idx].agence,
    nom:       list[idx].nom || '',
    actif:     list[idx].actif,
    email_diag: localStorage.getItem('fb_email') || ''
  });
  document.getElementById('presc-modal').remove();
  ouvrirGestionPrescripteurs();
}

function _supprimerPrescripteur(idx) {
  if (!confirm('Supprimer ce prescripteur ? Son lien ne fonctionnera plus.')) return;
  var list = getAllPrescripteurs();
  if (!list[idx]) return;
  _fsPushCode(list[idx].code, {
    uid:       localStorage.getItem('fb_uid')   || '',
    agence:    list[idx].agence,
    nom:       list[idx].nom || '',
    actif:     false,
    email_diag: localStorage.getItem('fb_email') || ''
  });
  list.splice(idx, 1);
  saveAllPrescripteurs(list);
  document.getElementById('presc-modal').remove();
  ouvrirGestionPrescripteurs();
}

function _copyLienPrescripteur(lien) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(lien).then(function() {
      alert('✅ Lien copié !\n\nEnvoie-le à ton prescripteur :\n' + lien);
    });
  } else {
    prompt('Copie ce lien et envoie-le à ton prescripteur :', lien);
  }
}
