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
    + 'Bien : ' + (mission.adresse || '') + '\n'
    + 'Date : ' + (mission.date || '') + '\n'
    + 'Diagnostics : ' + diags + '\n\n'
    + 'En cas de question, n\'hésitez pas à nous contacter.\n\n'
    + 'Cordialement,\n'
    + (p.nom_responsable || p.nom_societe || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: mission.email || '', subject: subject, body: body });
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
    + 'Montant : ' + (function() {
        var htBase = devis.prix_final && devis.prix_final > 0 ? parseFloat(devis.prix_final) : parseFloat(devis.total_ht || 0);
        var taux = (devis.taux_tva || 20) / 100;
        return devis.statut_fiscal === 'TTC'
          ? (htBase * (1 + taux)).toFixed(2) + ' EUR TTC'
          : htBase.toFixed(2) + ' EUR HT';
      })() + '\n'
    + 'Valable jusqu\'au : ' + getDevisExpiry(devis.date) + '\n\n'
    + 'Pour accepter ce devis, il vous suffit de nous répondre à ce mail ou de nous contacter.\n\n'
    + (p.lien_paiement ? 'Payer en ligne : ' + p.lien_paiement + '\n\n' : '')
    + 'Cordialement,\n'
    + (p.nom_responsable || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: devis.client_email || '', subject: subject, body: body });
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
    + 'Montant total : ' + (function() {
        var htBase = facture.prix_final && facture.prix_final > 0 ? parseFloat(facture.prix_final) : parseFloat(facture.total_ht || 0);
        var taux = (facture.taux_tva || 20) / 100;
        return facture.statut_fiscal === 'TTC'
          ? (htBase * (1 + taux)).toFixed(2) + ' EUR TTC'
          : htBase.toFixed(2) + ' EUR HT';
      })() + '\n'
    + 'Conditions : ' + (p.conditions_paiement || 'Paiement à réception') + '\n\n'
    + (p.rib_iban ? 'IBAN : ' + p.rib_iban + '\n' : '')
    + (p.lien_paiement ? 'Payer en ligne : ' + p.lien_paiement + '\n' : '')
    + '\nCordialement,\n'
    + (p.nom_responsable || societe) + '\n'
    + (p.telephone || '') + '\n'
    + (p.email || '');

  ouvrirMail({ to: facture.client_email || '', subject: subject, body: body });
}

// Utilitaire : date d'expiration devis (30 jours)
function getDevisExpiry(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('fr-FR');
}
