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
