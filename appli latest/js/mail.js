// ─────────────────────────────────────────────
// MAIL.JS — Ouverture de l'application mail
// ─────────────────────────────────────────────

/**
 * Ouvre l'app mail du téléphone avec les infos d'une mission
 * @param {Object} options - { to, subject, body }
 */
function ouvrirMail(options) {
  var to      = options.to      || '';
  var subject = options.subject || '';
  var body    = options.body    || '';
  var url = 'mailto:' + encodeURIComponent(to)
    + '?subject=' + encodeURIComponent(subject)
    + '&body='    + encodeURIComponent(body);
  window.location.href = url;
}

/**
 * Mail de confirmation de rendez-vous à partir d'une mission
 */
function envoyerMailMission(mission) {
  if (!mission) return;
  var p       = getCompanyProfile();
  var societe = p.nom_societe || 'DELY DIAG';
  var diags   = (mission.diags || []).join(', ') || 'Diagnostics immobiliers';

  var subject = 'Confirmation de rendez-vous — ' + societe;
  var body    = 'Bonjour ' + (mission.prenom || '') + ',\n\n'
    + 'Votre rendez-vous de diagnostic immobilier est confirmé.\n\n'
    + '📍 Bien : ' + (mission.adresse || '') + '\n'
    + '📅 Date : ' + (mission.date || '') + '\n'
    + '🔬 Diagnostics : ' + diags + '\n\n'
    + 'En cas de question, n\'hésitez pas à nous contacter.\n\n'
    + 'Cordialement,\n'
    + (p.nom_responsable || p.nom_societe || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: mission.email || '', subject, body });
}

/**
 * Mail d'envoi de devis
 */
function envoyerMailDevis(devis) {
  if (!devis) return;
  var p       = getCompanyProfile();
  var societe = p.nom_societe || 'DELY DIAG';

  var subject = 'Devis N°' + (devis.numero || '') + ' — ' + societe;
  var body    = 'Bonjour ' + (devis.client_prenom || '') + ',\n\n'
    + 'Veuillez trouver ci-joint votre devis pour la réalisation des diagnostics immobiliers '
    + 'relatifs au bien situé au ' + (devis.bien_adresse || '') + '.\n\n'
    + '💶 Montant : ' + (devis.total_ttc || devis.total_ht || 0) + ' €\n'
    + '📅 Valable jusqu\'au : ' + getDevisExpiry(devis.date) + '\n\n'
    + 'Pour accepter ce devis, il vous suffit de nous répondre à ce mail ou de nous contacter.\n\n'
    + (p.lien_paiement ? '💳 Payer en ligne : ' + p.lien_paiement + '\n\n' : '')
    + 'Cordialement,\n'
    + (p.nom_responsable || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: devis.client_email || '', subject, body });
}

/**
 * Mail d'envoi de facture
 */
function envoyerMailFacture(facture) {
  if (!facture) return;
  var p       = getCompanyProfile();
  var societe = p.nom_societe || 'DELY DIAG';

  var subject = 'Facture N°' + (facture.numero_facture || '') + ' — ' + societe;
  var body    = 'Bonjour ' + (facture.client_prenom || '') + ',\n\n'
    + 'Veuillez trouver ci-joint votre facture suite à la réalisation des diagnostics immobiliers '
    + 'au ' + (facture.bien_adresse || '') + '.\n\n'
    + '💶 Montant total : ' + (facture.total_ttc || facture.total_ht || 0) + ' €\n'
    + '📋 Conditions : ' + (p.conditions_paiement || 'Paiement à réception') + '\n\n'
    + (p.rib_iban ? '🏦 IBAN : ' + p.rib_iban + '\n' : '')
    + (p.lien_paiement ? '💳 Payer en ligne : ' + p.lien_paiement + '\n' : '')
    + '\nCordialement,\n'
    + (p.nom_responsable || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: facture.client_email || '', subject, body });
}

// Utilitaire : date d'expiration devis (30 jours)
function getDevisExpiry(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('fr-FR');
}
