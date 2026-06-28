// ─────────────────────────────────────────────
// COMPANY-PROFILE.JS — Structure du profil société
// Valeurs par défaut (écrasées par localStorage)
// ─────────────────────────────────────────────

var COMPANY_PROFILE_DEFAULT = {
  // Identité
  nom_societe:      '',
  nom_responsable:  '',
  forme_juridique:  'Auto-entrepreneur',
  // Coordonnées
  adresse:          '',
  code_postal:      '',
  ville:            '',
  telephone:        '',
  email:            '',
  site_web:         '',
  // Juridique & fiscal
  siret:            '',
  tva_intrac:       '',
  num_assurance:    '',
  organisme_certif: '',
  num_certif:       '',
  // Facturation
  statut_fiscal:    'HT',      // 'HT' ou 'TTC'
  taux_tva:         20,         // %
  conditions_paiement: 'Paiement à réception de facture',
  mentions_legales: 'Dispensé d\'immatriculation au Registre du Commerce et des Sociétés (RCS) et au Répertoire des Métiers (RM).',
  rib_banque:       '',
  rib_iban:         '',
  rib_bic:          '',
  // Paiement en ligne (lien Stripe, SumUp, PayPal, Revolut…)
  lien_paiement:    '',
  // Logo (base64 ou URL)
  logo:             '',
};

function getCompanyProfile() {
  try {
    var saved = JSON.parse(localStorage.getItem('dd_company_profile') || '{}');
    return Object.assign({}, COMPANY_PROFILE_DEFAULT, saved);
  } catch(e) {
    return Object.assign({}, COMPANY_PROFILE_DEFAULT);
  }
}

function saveCompanyProfile(data) {
  localStorage.setItem('dd_company_profile', JSON.stringify(data));
}
