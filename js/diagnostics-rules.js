// ─────────────────────────────────────────────
// DIAGNOSTICS-RULES.JS — Moteur de règles DDT
// Calcul automatique des diagnostics obligatoires
// selon la réglementation (Dossier de Diagnostics Techniques)
// ─────────────────────────────────────────────

/**
 * Calcule les diagnostics obligatoires selon les caractéristiques du bien.
 *
 * @param {Object} params
 *   - periode     : 'Avant 1949' | '1949-1997' | '1997-2011' | 'Après 2011' | ''
 *   - transaction : 'Vente' | 'Location' | ''
 *   - typeBien    : 'Maison' | 'Appartement' | 'Local commercial' | ...
 *   - gaz         : true | false
 *
 * @returns {string[]} liste des diagnostics à cocher
 */
function calculerDiagnosticsObligatoires(params) {
  var periode      = params.periode      || '';
  var transaction  = params.transaction  || '';
  var typeBien     = params.typeBien     || '';
  var gaz          = params.gaz          || false;

  if (!transaction || !periode) return [];

  var result = [];

  // Raccourcis période
  var avant1949   = (periode === 'Avant 1949');
  var avant1997   = (periode === 'Avant 1949' || periode === '1949-1997');
  var avant2011   = (periode === 'Avant 1949' || periode === '1949-1997' || periode === '1997-2011');
  var maison      = (typeBien === 'Maison');
  var appart      = (typeBien === 'Appartement');
  var vente       = (transaction === 'Vente');
  var location    = (transaction === 'Location');

  // ── DPE ─────────────────────────────────────
  // Obligatoire dans tous les cas (vente et location)
  result.push('DPE');

  // ── ÉLECTRICITÉ ──────────────────────────────
  // Installation > 15 ans → avant 2011 approximativement
  if (avant2011) result.push('Électricité');

  // ── GAZ ──────────────────────────────────────
  // Si présence gaz ET installation > 15 ans
  if (gaz && avant2011) result.push('Gaz');

  // ── PLOMB / CREP ─────────────────────────────
  // Avant 1949 — vente ET location
  if (avant1949) result.push('Plomb');

  // ── AMIANTE ──────────────────────────────────
  // Avant juillet 1997 (couvre Avant 1949 + 1949-1997)
  // Exception : location d'une maison individuelle → non obligatoire
  if (avant1997) {
    var exemptLocation = (location && maison);
    if (!exemptLocation) result.push('Amiante');
  }

  // ── ERP ──────────────────────────────────────
  // État des Risques et Pollutions — obligatoire vente ET location
  result.push('ERP');

  // ── CARREZ ───────────────────────────────────
  // Vente + appartement (copropriété) uniquement
  if (vente && appart) result.push('Carrez');

  // ── BOUTIN ───────────────────────────────────
  // Location uniquement (surface habitable)
  if (location) result.push('Boutin');

  // ── TERMITES / ASSAINISSEMENT / MÉRULE ───────
  // Dépendent de la zone géographique → laissés à la main du diagnostiqueur

  return result;
}
