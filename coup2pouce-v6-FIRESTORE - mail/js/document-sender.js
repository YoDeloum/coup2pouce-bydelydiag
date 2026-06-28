// ─────────────────────────────────────────────
// DOCUMENT-SENDER.JS
// Envoi des documents réglementaires après validation devis
// Les PDF sont stockés dans localStorage via Profil → Documents réglementaires
// ─────────────────────────────────────────────

var DOCS_REGLEMENTAIRES = [
  { id:'consentement', label:'Feuille de consentement',              icon:'📝', desc:'Accord du client pour la réalisation des diagnostics' },
  { id:'cgv',          label:'Conditions Générales de Vente (CGV)',  icon:'📋', desc:'Conditions contractuelles de la prestation' },
  { id:'cgi',          label:'Conditions Générales d\'Intervention (CGI)', icon:'🔧', desc:'Modalités techniques d\'intervention' }
];

function _getStoredDocs() {
  try { return JSON.parse(localStorage.getItem('dd_docs_reglementaires') || '{}'); } catch(e) { return {}; }
}

function _telechargerDocReglementaire(docId) {
  var d = _getStoredDocs()[docId];
  if (!d) { alert('Document non disponible. Uploade-le dans Profil → Documents réglementaires.'); return; }
  var a = document.createElement('a');
  a.href = d.data;
  a.download = d.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function ouvrirEnvoiDocuments() {
  var devis = (_devisEdit !== null) ? getAllDevis()[_devisEdit] : null;
  if (!devis) { alert('Enregistre d\'abord le devis.'); return; }

  var p          = getCompanyProfile();
  var storedDocs = _getStoredDocs();
  var tousPresents = DOCS_REGLEMENTAIRES.every(function(doc) { return !!storedDocs[doc.id]; });

  var sujet = 'Documents réglementaires — Devis N° ' + (devis.numero || '');
  var corps = [
    'Bonjour ' + (devis.client_prenom || '') + ' ' + (devis.client_nom || '') + ',',
    '',
    'Suite à l\'établissement du devis N° ' + (devis.numero || '') + ' concernant le bien situé au ' + (devis.bien_adresse || '') + ',',
    'vous trouverez ci-joint les documents réglementaires suivants :',
    '',
    '  • Feuille de consentement',
    '  • Conditions Générales de Vente (CGV)',
    '  • Conditions Générales d\'Intervention (CGI)',
    '',
    'Ces documents sont à lire et conserver.',
    'N\'hésitez pas à nous contacter pour toute question.',
    '',
    'Cordialement,',
    (p.nom_societe || '') + (p.telephone ? ' — ' + p.telephone : '')
  ].join('\n');

  var docsHtml = DOCS_REGLEMENTAIRES.map(function(doc) {
    var stored = storedDocs[doc.id];
    var dlBtn  = stored
      ? '<button onclick="_telechargerDocReglementaire(\'' + doc.id + '\')" style="padding:5px 10px;border-radius:6px;background:#F0FDF4;border:1px solid #BBF7D0;color:#065F46;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">⬇️ PDF</button>'
      : '<span style="font-size:11px;color:#EF4444;font-weight:600;white-space:nowrap">⚠️ Non uploadé</span>';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ' + (stored ? '#BBF7D0' : '#E2E5F0') + ';border-radius:8px;margin-bottom:8px;background:' + (stored ? '#F0FDF4' : '#fff') + '">'
      + '<span style="font-size:20px">' + doc.icon + '</span>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:13px;font-weight:700;color:#1B4332">' + doc.label + '</div>'
      + '<div style="font-size:11px;color:#6B7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (stored ? '📄 ' + stored.name : doc.desc) + '</div>'
      + '</div>'
      + dlBtn
      + '</div>';
  }).join('');

  var modal = document.createElement('div');
  modal.id  = 'docs-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:440px;max-height:92vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'
    + '<h3 style="font-size:16px;font-weight:800;color:#1B4332">📄 Documents réglementaires</h3>'
    + '<button onclick="document.getElementById(\'docs-modal\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af;line-height:1">✕</button>'
    + '</div>'

    + '<div style="background:#F0FDF4;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#065F46">'
    + '👤 <strong>' + (devis.client_prenom||'') + ' ' + (devis.client_nom||'') + '</strong>'
    + (devis.client_email ? '<br>✉️ ' + devis.client_email : ' — ⚠️ Pas d\'email renseigné')
    + '</div>'

    + (!tousPresents ? '<div style="background:#FEF3C7;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#92400E">⚠️ Certains documents ne sont pas encore chargés. Va dans <strong>Profil → Documents réglementaires</strong> pour les uploader.</div>' : '')

    + '<div style="margin-bottom:14px">'
    + '<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">Documents à envoyer</div>'
    + docsHtml
    + '</div>'

    + '<div style="margin-bottom:10px">'
    + '<label style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;display:block;margin-bottom:5px">Email du client</label>'
    + '<input id="docs-email" type="email" value="' + (devis.client_email||'') + '" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #E2E5F0;font-size:13px;font-family:inherit;box-sizing:border-box;outline:none"/>'
    + '</div>'

    + '<button onclick="_envoyerDocsMail(\'' + encodeURIComponent(sujet) + '\',\'' + encodeURIComponent(corps) + '\')" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#2D6A4F,#1B4332);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">✉️ Préparer le mail</button>'
    + '<p style="font-size:11px;color:#9ca3af;text-align:center">Ouvre ton client mail avec le message prérempli.<br>Télécharge et attache les PDF ci-dessus avant d\'envoyer.</p>'
    + '</div>';

  document.body.appendChild(modal);
}

function _envoyerDocsMail(sujetEnc, corpsEnc) {
  var email = document.getElementById('docs-email').value.trim();
  if (!email) { alert('Saisis l\'email du client.'); return; }
  window.location.href = 'mailto:' + email + '?subject=' + sujetEnc + '&body=' + corpsEnc;
  document.getElementById('docs-modal').remove();
}
