// ─────────────────────────────────────────────
// RELANCES.JS — Relances devis par mail / WhatsApp
// ─────────────────────────────────────────────

function ouvrirRelance() {
  var devis = (_devisEdit !== null) ? getAllDevis()[_devisEdit] : null;
  if (!devis) { alert('Enregistre d\'abord le devis avant de lancer une relance.'); return; }

  var p = getCompanyProfile();

  // Historique de relances sur ce devis
  var list   = getAllDevis();
  var relances = list[_devisEdit].relances || [];

  // Message par défaut
  var msgMail = [
    'Objet : Relance — Devis N° ' + (devis.numero || ''),
    '',
    'Bonjour ' + (devis.client_prenom || '') + ' ' + (devis.client_nom || '') + ',',
    '',
    'Je me permets de revenir vers vous concernant le devis N° ' + (devis.numero || '') +
    ' établi le ' + (devis.date ? new Date(devis.date).toLocaleDateString('fr-FR') : '') +
    ' pour le bien situé au ' + (devis.bien_adresse || '') + '.',
    '',
    'Ce devis d\'un montant de ' + parseFloat(devis.total_ht || 0).toFixed(2) + ' € HT' +
    ' est toujours disponible et je reste à votre disposition pour toute question.',
    '',
    'Dans l\'attente de votre retour,',
    'Cordialement,',
    '',
    (p.nom_societe || '') + (p.telephone ? ' — ' + p.telephone : '')
  ].join('\n');

  var msgWA = 'Bonjour ' + (devis.client_prenom || '') + ' ' + (devis.client_nom || '') + ' 👋\n\n' +
    'Je me permets de vous relancer concernant le devis N° ' + (devis.numero || '') + ' (' + parseFloat(devis.total_ht || 0).toFixed(2) + ' € HT) pour le bien au ' + (devis.bien_adresse || '') + '.\n\n' +
    'Avez-vous eu le temps d\'en prendre connaissance ? Je reste disponible pour toute question. 😊\n\n' +
    '— ' + (p.nom_societe || p.nom || 'Dely Diag');

  var modal = document.createElement('div');
  modal.id  = 'relance-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:420px;max-height:92vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
    + '<h3 style="font-size:16px;font-weight:800;color:#1B4332">📨 Relance — Devis N° ' + (devis.numero || '') + '</h3>'
    + '<button onclick="document.getElementById(\'relance-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af">✕</button>'
    + '</div>'

    // Infos client
    + '<div style="background:#F0FDF4;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#065F46">'
    + '👤 <strong>' + (devis.client_prenom || '') + ' ' + (devis.client_nom || '') + '</strong>'
    + (devis.client_tel ? ' — 📞 ' + devis.client_tel : '')
    + (devis.client_email ? '<br>✉️ ' + devis.client_email : '')
    + '</div>'

    // Historique
    + (relances.length > 0
      ? '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">Historique des relances</div>'
        + relances.map(function(r) {
            return '<div style="font-size:12px;color:#374151;padding:5px 0;border-bottom:1px solid #F0F2F8">'
              + (r.canal === 'mail' ? '✉️' : '💬') + ' ' + r.canal + ' — ' + new Date(r.date).toLocaleDateString('fr-FR')
              + '</div>';
          }).join('')
        + '</div>'
      : '')

    // Onglets
    + '<div style="display:flex;gap:6px;margin-bottom:14px">'
    + '<button onclick="_relanceTab(\'mail\')" id="tab-mail" style="flex:1;padding:9px;border-radius:8px;border:2px solid #0891B2;background:#0891B2;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">✉️ Mail</button>'
    + '<button onclick="_relanceTab(\'wa\')" id="tab-wa" style="flex:1;padding:9px;border-radius:8px;border:2px solid #25D366;background:#fff;color:#25D366;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💬 WhatsApp</button>'
    + '</div>'

    // Panneau Mail
    + '<div id="panel-mail">'
    + '<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Email du client</label>'
    + '<input id="rel-email" type="email" value="' + (devis.client_email || '') + '" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;outline:none"/>'
    + '<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Message (copie dans le mailto)</label>'
    + '<textarea id="rel-msg-mail" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;box-sizing:border-box;min-height:130px;resize:vertical;margin-bottom:12px;outline:none">' + msgMail + '</textarea>'
    + '<button onclick="_envoyerRelanceMail()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#0891B2,#0E7490);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✉️ Ouvrir mon client mail</button>'
    + '<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:6px">Ouvre ton application mail avec le message prérempli. La pièce jointe PDF doit être ajoutée manuellement.</p>'
    + '</div>'

    // Panneau WhatsApp
    + '<div id="panel-wa" style="display:none">'
    + '<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Téléphone du client</label>'
    + '<input id="rel-tel" type="tel" value="' + (devis.client_tel || '') + '" placeholder="06 00 00 00 00" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;outline:none"/>'
    + '<label style="font-size:11px;font-weight:700;color:#6B7280;display:block;margin-bottom:4px;text-transform:uppercase">Message WhatsApp</label>'
    + '<textarea id="rel-msg-wa" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:12px;font-family:inherit;box-sizing:border-box;min-height:100px;resize:vertical;margin-bottom:12px;outline:none">' + msgWA + '</textarea>'
    + '<button onclick="_envoyerRelanceWA()" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💬 Ouvrir WhatsApp</button>'
    + '<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:6px">Utilise wa.me pour ouvrir WhatsApp avec le message prérempli.</p>'
    + '</div>'
    + '</div>';

  document.body.appendChild(modal);
}

function _relanceTab(tab) {
  document.getElementById('panel-mail').style.display = tab === 'mail' ? '' : 'none';
  document.getElementById('panel-wa').style.display   = tab === 'wa'   ? '' : 'none';
  document.getElementById('tab-mail').style.background = tab === 'mail' ? '#0891B2' : '#fff';
  document.getElementById('tab-mail').style.color      = tab === 'mail' ? '#fff'    : '#0891B2';
  document.getElementById('tab-wa').style.background   = tab === 'wa'   ? '#25D366' : '#fff';
  document.getElementById('tab-wa').style.color        = tab === 'wa'   ? '#fff'    : '#25D366';
}

function _envoyerRelanceMail() {
  var email = document.getElementById('rel-email').value.trim();
  var msg   = document.getElementById('rel-msg-mail').value;
  if (!email) { alert('Saisis l\'email du client.'); return; }
  var lignes  = msg.split('\n');
  var sujet   = lignes[0].replace(/^Objet\s*:\s*/i, '');
  var corps   = lignes.slice(2).join('\n');
  window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);
  _enregistrerRelance('mail');
  document.getElementById('relance-modal').remove();
}

function _envoyerRelanceWA() {
  var tel = document.getElementById('rel-tel').value.replace(/[\s\-().+]/g, '');
  var msg = document.getElementById('rel-msg-wa').value;
  if (!tel) { alert('Saisis le téléphone du client.'); return; }
  // Format international : remplace 0X par 33X pour la France
  if (tel.startsWith('0')) tel = '33' + tel.slice(1);
  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
  _enregistrerRelance('whatsapp');
  document.getElementById('relance-modal').remove();
}

function _enregistrerRelance(canal) {
  if (_devisEdit === null) return;
  var list = getAllDevis();
  if (!list[_devisEdit]) return;
  if (!list[_devisEdit].relances) list[_devisEdit].relances = [];
  list[_devisEdit].relances.push({ date: new Date().toISOString(), canal: canal });
  saveAllDevis(list);
}

// ─────────────────────────────────────────────
// RELANCES AUTOMATIQUES
// ─────────────────────────────────────────────

function _getRelanceSettings() {
  try { return JSON.parse(localStorage.getItem('dd_relance_settings') || '{}'); } catch(e) { return {}; }
}
function _saveRelanceSettings(s) { localStorage.setItem('dd_relance_settings', JSON.stringify(s)); }
function _getRelanceLog() {
  try { return JSON.parse(localStorage.getItem('dd_relance_log') || '{}'); } catch(e) { return {}; }
}
function _saveRelanceLog(log) { localStorage.setItem('dd_relance_log', JSON.stringify(log)); }

// ─── Identifiant stable pour un devis ou une facture ───
// On n'utilise JAMAIS l'index (qui change si on ajoute/supprime des éléments)
function _relanceId(doc, prefix) {
  var num = (doc.numero || doc.numero_facture || '').toString().trim();
  if (num) return prefix + '_' + num;
  // Fallback : date_creation + email (stable même si l'ordre change)
  var dc = (doc.date_creation || doc.date || '').toString().slice(0, 16);
  var em = (doc.client_email  || '').replace(/[^a-zA-Z0-9]/g, '');
  return prefix + '_' + dc + '_' + em;
}

// ─── Vérification au démarrage ───
function initAutoRelances() {
  var s = _getRelanceSettings();
  if (!s.actif) return;

  // Garde-fou : une seule exécution par jour par appareil
  var todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  if (localStorage.getItem('dd_relance_run') === todayStr) return;
  localStorage.setItem('dd_relance_run', todayStr);

  var devisJ1 = parseInt(s.devis_j1)   || 2;
  var devisJ2 = parseInt(s.devis_j2)   || 7;
  var factJ1  = parseInt(s.facture_j1) || 5;
  var factJ2  = parseInt(s.facture_j2) || 15;

  var log   = _getRelanceLog();
  var today = new Date(); today.setHours(0,0,0,0);
  var p     = typeof getCompanyProfile === 'function' ? getCompanyProfile() : {};

  // ── Devis en attente ──
  var devisList = [];
  try { devisList = JSON.parse(localStorage.getItem('dd_devis_list') || '[]'); } catch(e) {}
  devisList.forEach(function(d) {
    if (!d || d.statut !== 'Devis' || !d.client_email) return;
    var dt = new Date(d.date || d.date_creation);
    if (isNaN(dt)) return;
    dt.setHours(0,0,0,0);
    var jours = Math.floor((today - dt) / 86400000);
    var id = _relanceId(d, 'dv');
    if (!log[id + '_r1'] && jours >= devisJ1) {
      _autoEnvoyerEmail(d, p, 'devis', 1);
      log[id + '_r1'] = todayStr;
    } else if (log[id + '_r1'] && !log[id + '_r2'] && jours >= devisJ2) {
      _autoEnvoyerEmail(d, p, 'devis', 2);
      log[id + '_r2'] = todayStr;
    }
  });

  // ── Factures impayées ──
  var factList = [];
  try { factList = JSON.parse(localStorage.getItem('dd_factures_list') || '[]'); } catch(e) {}
  factList.forEach(function(f) {
    if (!f || f.statut === 'Payée' || f.statut === 'Payé' || !f.client_email) return;
    var dt = new Date(f.date_facture || f.date);
    if (isNaN(dt)) return;
    dt.setHours(0,0,0,0);
    var jours = Math.floor((today - dt) / 86400000);
    var id = _relanceId(f, 'fa');
    if (!log[id + '_r1'] && jours >= factJ1) {
      _autoEnvoyerEmail(f, p, 'facture', 1);
      log[id + '_r1'] = todayStr;
    } else if (log[id + '_r1'] && !log[id + '_r2'] && jours >= factJ2) {
      _autoEnvoyerEmail(f, p, 'facture', 2);
      log[id + '_r2'] = todayStr;
    }
  });

  _saveRelanceLog(log);
}

function _autoEnvoyerEmail(doc, p, type, niveau) {
  var societe = p.nom_societe || 'DELY DIAG';
  var prenom  = doc.client_prenom || '';
  var to      = doc.client_email;
  var nLabel  = niveau === 1 ? 'Relance' : '2ème relance';
  var subject, html;

  if (type === 'devis') {
    var montant = parseFloat(doc.total_ht || 0).toFixed(2) + ' € HT';
    subject = nLabel + ' — Devis N°' + (doc.numero || '') + ' — ' + societe;
    html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#1B4332;padding:24px 32px;border-radius:8px 8px 0 0"><h1 style="color:#fff;margin:0;font-size:20px">' + societe + '</h1>'
      + (p.telephone ? '<p style="color:#A7F3D0;margin:4px 0;font-size:13px">' + p.telephone + '</p>' : '')
      + '</div><div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<p style="font-size:15px;color:#111827">Bonjour ' + prenom + ',</p>'
      + '<p style="color:#374151">Je me permets de revenir vers vous concernant le devis N°' + (doc.numero || '') + ' d\'un montant de <strong>' + montant + '</strong>, toujours disponible.</p>'
      + '<p style="color:#374151">N\'hésitez pas à me contacter pour toute question.</p>'
      + '<p style="color:#374151;margin-top:20px">Cordialement,<br/><strong>' + (p.nom_responsable || societe) + '</strong><br/>' + (p.telephone || '') + '</p>'
      + '</div></div>';
  } else {
    var montantF = parseFloat(doc.prix_final && doc.prix_final > 0 ? doc.prix_final : (doc.total_ht || 0)).toFixed(2) + ' € HT';
    subject = nLabel + ' — Facture N°' + (doc.numero_facture || '') + ' — ' + societe;
    html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#1B4332;padding:24px 32px;border-radius:8px 8px 0 0"><h1 style="color:#fff;margin:0;font-size:20px">' + societe + '</h1>'
      + (p.telephone ? '<p style="color:#A7F3D0;margin:4px 0;font-size:13px">' + p.telephone + '</p>' : '')
      + '</div><div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<p style="font-size:15px;color:#111827">Bonjour ' + prenom + ',</p>'
      + '<p style="color:#374151">Sauf erreur de notre part, nous n\'avons pas encore reçu le règlement de la facture N°' + (doc.numero_facture || '') + ' d\'un montant de <strong>' + montantF + '</strong>.</p>'
      + (p.iban ? '<p style="color:#374151;font-size:13px">🏦 IBAN : ' + p.iban + '</p>' : '')
      + (p.lien_paiement ? '<p style="color:#374151;font-size:13px">💳 <a href="' + p.lien_paiement + '">' + p.lien_paiement + '</a></p>' : '')
      + '<p style="color:#374151;margin-top:20px">Cordialement,<br/><strong>' + (p.nom_responsable || societe) + '</strong><br/>' + (p.telephone || '') + '</p>'
      + '</div></div>';
  }

  fetch('/.netlify/functions/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: to, subject: subject, html: html,
      fromName: societe, fromEmail: 'noreply@coup2pouce-pro.fr',
      replyTo: p.email || '', cc: p.email || '' })
  }).catch(function() {});
}

// ─── Modal paramètres relances ───
function ouvrirParamRelances() {
  var s = _getRelanceSettings();
  var modal = document.createElement('div');
  modal.id = 'param-relances-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:100%;max-width:400px;max-height:90vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<h3 style="font-size:16px;font-weight:800;color:#1B4332;margin:0">⚙️ Relances automatiques</h3>'
    + '<button onclick="document.getElementById(\'param-relances-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af">✕</button>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:#F0FDF4;border-radius:10px;margin-bottom:20px">'
    + '<input type="checkbox" id="rel-actif" ' + (s.actif ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#2D6A4F;cursor:pointer;flex-shrink:0"/>'
    + '<div><label for="rel-actif" style="font-weight:700;font-size:14px;color:#1B4332;cursor:pointer;display:block">Relances activées</label>'
    + '<span style="font-size:12px;color:#6B7280">Envoi automatique à l\'ouverture de l\'app</span></div>'
    + '</div>'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">📄 Devis non répondu</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'
    + '<div><label style="font-size:12px;color:#374151;font-weight:600;display:block;margin-bottom:4px">1ère relance (J+)</label>'
    + '<input id="rel-dv-j1" type="number" min="1" max="30" value="' + (s.devis_j1 || 2) + '" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:16px;text-align:center;font-family:inherit;box-sizing:border-box;outline:none"/></div>'
    + '<div><label style="font-size:12px;color:#374151;font-weight:600;display:block;margin-bottom:4px">2ème relance (J+)</label>'
    + '<input id="rel-dv-j2" type="number" min="1" max="60" value="' + (s.devis_j2 || 7) + '" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:16px;text-align:center;font-family:inherit;box-sizing:border-box;outline:none"/></div>'
    + '</div>'
    + '<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">🧾 Factures impayées</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px">'
    + '<div><label style="font-size:12px;color:#374151;font-weight:600;display:block;margin-bottom:4px">1ère relance (J+)</label>'
    + '<input id="rel-fa-j1" type="number" min="1" max="30" value="' + (s.facture_j1 || 5) + '" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:16px;text-align:center;font-family:inherit;box-sizing:border-box;outline:none"/></div>'
    + '<div><label style="font-size:12px;color:#374151;font-weight:600;display:block;margin-bottom:4px">2ème relance (J+)</label>'
    + '<input id="rel-fa-j2" type="number" min="1" max="90" value="' + (s.facture_j2 || 15) + '" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:16px;text-align:center;font-family:inherit;box-sizing:border-box;outline:none"/></div>'
    + '</div>'
    + '<button onclick="_sauvegarderParamRelances()" style="width:100%;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#2D6A4F,#1B4332);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 Enregistrer</button>'
    + '<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:10px">Les relances partent par email (sans PDF) à chaque ouverture de l\'app.</p>'
    + '</div>';
  document.body.appendChild(modal);
}

function _sauvegarderParamRelances() {
  _saveRelanceSettings({
    actif:      document.getElementById('rel-actif').checked,
    devis_j1:   parseInt(document.getElementById('rel-dv-j1').value)  || 2,
    devis_j2:   parseInt(document.getElementById('rel-dv-j2').value)  || 7,
    facture_j1: parseInt(document.getElementById('rel-fa-j1').value)  || 5,
    facture_j2: parseInt(document.getElementById('rel-fa-j2').value)  || 15
  });
  document.getElementById('param-relances-modal').remove();
  alert('✅ Paramètres enregistrés !');
}
