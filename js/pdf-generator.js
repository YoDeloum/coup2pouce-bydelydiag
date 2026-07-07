// ─────────────────────────────────────────────
// PDF-GENERATOR.JS — Génération PDF via jsPDF
// Devis et Factures professionnels
// ─────────────────────────────────────────────

// ─── UTILITAIRES ───────────────────────────

// Ajoute le logo en conservant les proportions dans une boîte max 28×24mm
function pdfAddLogo(doc, logoDataUrl, x, y) {
  try {
    var img = new Image();
    img.src = logoDataUrl;
    var iw = img.naturalWidth  || img.width  || 100;
    var ih = img.naturalHeight || img.height || 100;
    var maxW = 28, maxH = 24;
    var ratio = Math.min(maxW / iw, maxH / ih);
    var w = iw * ratio;
    var h = ih * ratio;
    var fmt = logoDataUrl.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
    doc.addImage(logoDataUrl, fmt, x, y + (maxH - h) / 2, w, h);
    return x + w + 4; // retourne la position X après le logo
  } catch(e) {
    return x;
  }
}

function pdfAddLine(doc, y) {
  doc.setDrawColor(226, 229, 240);
  doc.line(15, y, 195, y);
  return y + 4;
}

function pdfText(doc, text, x, y, opts) {
  opts = opts || {};
  if (opts.bold)   doc.setFont('helvetica', 'bold');
  else             doc.setFont('helvetica', 'normal');
  if (opts.size)   doc.setFontSize(opts.size);
  if (opts.color)  doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
  else             doc.setTextColor(30, 30, 30);
  doc.text(String(text || ''), x, y, opts);
}

function pdfRect(doc, x, y, w, h, color) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, 'F');
}

// ─── DEVIS PDF ─────────────────────────────
function genererPDFDevis(devis, _returnBlob, opts) {
  opts = opts || {};
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé. Vérifiez votre connexion internet.'); return; }

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  // Pour l'envoi par mail : ignorer le logo (trop lourd pour Netlify)
  if (opts.skipLogo) { p = Object.assign({}, p); delete p.logo; }
  var y   = 15;
  var tplEpure = (p.pdf_template || 'standard') === 'epure';

  // ── En-tête ──
  if (tplEpure) {
    // Template Épuré — fond blanc, bordure inférieure fine
    pdfRect(doc, 0, 0, 210, 40, [255, 255, 255]);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 42, 195, 42);
    var textX = 15;
    if (p.logo && p.logo.startsWith('data:image')) {
      textX = pdfAddLogo(doc, p.logo, 15, 8);
    }
    pdfText(doc, p.nom_societe || 'DELY DIAG', textX, 18, {bold:true, size:14, color:[27,67,50]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textX, 24, {size:8, color:[107,114,128]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textX, 30, {size:8, color:[107,114,128]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textX, 36, {size:8, color:[107,114,128]});
    pdfText(doc, 'DEVIS', 195, 18, {bold:true, size:20, color:[27,67,50], align:'right'});
    pdfText(doc, 'N° ' + (devis.numero || ''), 195, 26, {bold:true, size:10, color:[45,106,79], align:'right'});
    pdfText(doc, 'Date : ' + new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:8, color:[107,114,128], align:'right'});
    pdfText(doc, 'Valable 30 jours', 195, 38, {size:8, color:[156,163,175], align:'right'});
  } else {
    // Template Standard — bandeau vert
    pdfRect(doc, 0, 0, 210, 40, [45, 106, 79]);
    var textX = 15;
    if (p.logo && p.logo.startsWith('data:image')) {
      textX = pdfAddLogo(doc, p.logo, 15, 8);
    }
    pdfText(doc, p.nom_societe || 'DELY DIAG', textX, 18, {bold:true, size:16, color:[255,255,255]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textX, 25, {size:9, color:[200,230,210]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textX, 31, {size:9, color:[200,230,210]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textX, 37, {size:9, color:[200,230,210]});
    pdfText(doc, 'DEVIS', 195, 18, {bold:true, size:22, color:[255,255,255], align:'right'});
    pdfText(doc, 'N° ' + (devis.numero || ''), 195, 26, {bold:true, size:11, color:[180,230,200], align:'right'});
    pdfText(doc, 'Date : ' + new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'Valable 30 jours', 195, 38, {size:8, color:[180,210,190], align:'right'});
  }

  y = 50;

  // ── Informations CLIENT ──
  pdfRect(doc, 120, y, 75, 40, [245, 247, 250]);
  pdfText(doc, 'CLIENT', 122, y + 6, {bold:true, size:9, color:[107, 114, 128]});
  if (devis.client_societe) {
    pdfText(doc, devis.client_societe, 122, y + 13, {bold:true, size:10, color:[30,30,30]});
    pdfText(doc, (devis.client_prenom||'') + ' ' + (devis.client_nom||''), 122, y + 20, {size:8, color:[80,80,80]});
    pdfText(doc, devis.bien_adresse || '', 122, y + 27, {size:8, color:[80,80,80]});
    if (devis.client_tel) pdfText(doc, 'Tel : ' + devis.client_tel, 122, y + 34, {size:8, color:[80,80,80]});
  } else {
    pdfText(doc, (devis.client_prenom||'') + ' ' + (devis.client_nom||''), 122, y + 13, {bold:true, size:11, color:[30,30,30]});
    pdfText(doc, devis.bien_adresse || '', 122, y + 20, {size:9, color:[80,80,80]});
    if (devis.client_tel)   pdfText(doc, 'Tel : ' + devis.client_tel,   122, y + 27, {size:9, color:[80,80,80]});
    if (devis.client_email) pdfText(doc, 'Email : ' + devis.client_email, 122, y + 34, {size:9, color:[80,80,80]});
  }

  // ── Objet ──
  pdfText(doc, 'Objet de la mission :', 15, y + 6, {bold:true, size:9, color:[45,106,79]});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (devis.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (devis.bien_type || '') + (devis.type_transaction ? ' — ' + devis.type_transaction : ''), 15, y + 27, {size:9, color:[80,80,80]});
  pdfText(doc, 'Date prévue : ' + (devis.date_mission ? new Date(devis.date_mission).toLocaleDateString('fr-FR') : 'À définir'), 15, y + 34, {size:9, color:[80,80,80]});

  y += 48;
  y = pdfAddLine(doc, y);

  // ── Tableau diagnostics ──
  pdfRect(doc, 15, y, 180, 8, [45, 106, 79]);
  pdfText(doc, 'PRESTATIONS', 18, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'INCLUS', 195, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  var diags = devis.diagnostics || [];
  var tarifs_manuels = devis.tarifs_manuels || {};
  diags.forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
    pdfText(doc, '- ' + d, 18, y + 5, {size:9, color:[30,30,30]});
    pdfText(doc, 'incl.', 193, y + 5, {size:9, color:[45,106,79], align:'right'});
    y += 8;
  });

  // Ligne remise si applicable
  if (devis.remise_eur && parseFloat(devis.remise_eur) > 0) {
    y += 2;
    pdfText(doc, 'Remise' + (devis.remise_pct > 0 ? ' (' + parseFloat(devis.remise_pct).toFixed(1) + '%)' : ''), 18, y + 5, {size:9, color:[220,50,50]});
    pdfText(doc, '- ' + parseFloat(devis.remise_eur).toFixed(2) + ' €', 193, y + 5, {size:9, color:[220,50,50], align:'right'});
    y += 8;
  }

  y += 4;
  y = pdfAddLine(doc, y);
  y += 3;

  // ── Total ──
  var isHT    = (devis.statut_fiscal || 'HT') === 'HT';
  var taux    = parseFloat(devis.taux_tva || 20) / 100;
  var ht      = parseFloat(devis.prix_final && devis.prix_final > 0 ? devis.prix_final : (devis.total_ht || 0));
  var tva_mt  = Math.round(ht * taux * 100) / 100;
  var ttc     = Math.round((ht + tva_mt) * 100) / 100;

  pdfRect(doc, 120, y, 75, isHT ? 30 : 38, [45, 106, 79]);
  if (isHT) {
    pdfText(doc, 'Total HT', 122, y + 9, {size:10, color:[200,230,210]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, p.mentions_legales && p.mentions_legales.includes('Dispensé') ? 'TVA non applicable — art. 293B CGI' : 'TVA ' + (devis.taux_tva||20) + '%', 122, y+17, {size:9, color:[180,220,190]});
    pdfText(doc, p.mentions_legales && p.mentions_legales.includes('Dispensé') ? '' : tva_mt.toFixed(2) + ' €', 193, y+17, {size:9, color:[200,230,210], align:'right'});
  } else {
    pdfText(doc, 'Total HT', 122, y + 9, {size:9, color:[180,220,190]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (devis.taux_tva||20) + '%', 122, y+16, {size:9, color:[180,220,190]});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y+16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, [27, 67, 50]);
    pdfText(doc, 'TOTAL TTC', 122, y + 27, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ttc.toFixed(2) + ' €', 193, y + 27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }

  if (isHT) {
    pdfRect(doc, 120, y+20, 75, 10, [27,67,50]);
    pdfText(doc, 'TOTAL', 122, y+27, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ht.toFixed(2) + ' € HT', 193, y+27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }

  y += isHT ? 38 : 46;

  // ── Conditions de paiement ──
  y += 4;
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true, size:9, color:[45,106,79]});
  y += 6;
  pdfText(doc, p.conditions_paiement || 'Paiement à réception de facture', 15, y, {size:9, color:[80,80,80]});
  y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : ' + p.rib_iban + (p.rib_bic ? '  |  BIC : ' + p.rib_bic : ''), 15, y, {size:8, color:[100,100,100]});

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    pdfText(doc, 'Certification', 15, y, {bold:true, size:9, color:[45,106,79]});
    y += 6;
    if (p.organisme_certif) pdfText(doc, 'Certifié par : ' + p.organisme_certif, 15, y, {size:9, color:[80,80,80]});
    y += 5;
    if (p.num_certif) pdfText(doc, 'N° certification : ' + p.num_certif, 15, y, {size:9, color:[80,80,80]});
    y += 5;
    if (p.num_assurance) pdfText(doc, 'Assurance RC Pro : ' + p.num_assurance, 15, y, {size:9, color:[80,80,80]});
  }

  // ── Pied de page ──
  var footerY = 285;
  pdfRect(doc, 0, footerY - 3, 210, 15, [245,247,250]);
  pdfText(doc, p.mentions_legales || '', 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.nom_societe||'') + (p.siret ? ' — SIRET : ' + p.siret : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});

  var _pdfFilename = 'Devis_' + (devis.numero || 'XXXX') + '_' + (devis.client_nom || '') + '.pdf';
  if (_returnBlob) return { blob: doc.output('blob'), filename: _pdfFilename };
  doc.save(_pdfFilename);
}

// ─── FACTURE PDF ───────────────────────────
function genererPDFFacture(facture) {
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé.'); return; }

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  var y   = 15;
  var tplEpureF = (p.pdf_template || 'standard') === 'epure';

  // ── En-tête ──
  if (tplEpureF) {
    pdfRect(doc, 0, 0, 210, 40, [255, 255, 255]);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 42, 195, 42);
    var textXf = 15;
    if (p.logo && p.logo.startsWith('data:image')) {
      textXf = pdfAddLogo(doc, p.logo, 15, 8);
    }
    pdfText(doc, p.nom_societe || 'DELY DIAG', textXf, 18, {bold:true, size:14, color:[27,67,50]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textXf, 24, {size:8, color:[107,114,128]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textXf, 30, {size:8, color:[107,114,128]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textXf, 36, {size:8, color:[107,114,128]});
    pdfText(doc, 'FACTURE', 195, 18, {bold:true, size:20, color:[27,67,50], align:'right'});
    pdfText(doc, 'N° ' + (facture.numero_facture || ''), 195, 26, {bold:true, size:10, color:[45,106,79], align:'right'});
    pdfText(doc, 'Date : ' + new Date(facture.date_facture || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:8, color:[107,114,128], align:'right'});
    if (facture.numero) pdfText(doc, 'Devis réf. : ' + facture.numero, 195, 38, {size:8, color:[156,163,175], align:'right'});
  } else {
    pdfRect(doc, 0, 0, 210, 40, [27, 67, 50]);
    var textXf = 15;
    if (p.logo && p.logo.startsWith('data:image')) {
      textXf = pdfAddLogo(doc, p.logo, 15, 8);
    }
    pdfText(doc, p.nom_societe || 'DELY DIAG', textXf, 18, {bold:true, size:16, color:[255,255,255]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textXf, 25, {size:9, color:[170,210,185]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textXf, 31, {size:9, color:[170,210,185]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textXf, 37, {size:9, color:[170,210,185]});
    pdfText(doc, 'FACTURE', 195, 18, {bold:true, size:22, color:[255,255,255], align:'right'});
    pdfText(doc, 'N° ' + (facture.numero_facture || ''), 195, 26, {bold:true, size:11, color:[170,230,190], align:'right'});
    pdfText(doc, 'Date : ' + new Date(facture.date_facture || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:9, color:[170,210,185], align:'right'});
    if (facture.numero) pdfText(doc, 'Devis réf. : ' + facture.numero, 195, 38, {size:8, color:[150,200,165], align:'right'});
  }

  y = 50;

  // Client — coordonnées de facturation (société ou nom/prénom et adresse spécifiques si renseignés)
  var _factSociete = facture.fact_societe || facture.client_societe || '';
  var _factNomContact = ((facture.fact_prenom || facture.client_prenom || '') + ' ' + (facture.fact_nom || facture.client_nom || '')).trim();
  var _factAdresse = facture.fact_adresse || facture.bien_adresse || '';
  pdfRect(doc, 120, y, 75, 40, [245, 247, 250]);
  pdfText(doc, 'FACTURÉ À', 122, y + 6, {bold:true, size:9, color:[107,114,128]});
  if (_factSociete) {
    pdfText(doc, _factSociete, 122, y + 13, {bold:true, size:10, color:[30,30,30]});
    pdfText(doc, _factNomContact, 122, y + 20, {size:8, color:[80,80,80]});
    pdfText(doc, _factAdresse, 122, y + 27, {size:8, color:[80,80,80]});
    if (facture.client_tel) pdfText(doc, 'Tel : ' + facture.client_tel, 122, y + 34, {size:8, color:[80,80,80]});
  } else {
    pdfText(doc, _factNomContact, 122, y + 13, {bold:true, size:11, color:[30,30,30]});
    pdfText(doc, _factAdresse, 122, y + 20, {size:9, color:[80,80,80]});
    if (facture.client_tel)   pdfText(doc, 'Tel : ' + facture.client_tel,   122, y + 27, {size:9, color:[80,80,80]});
    if (facture.client_email) pdfText(doc, 'Email : ' + facture.client_email, 122, y + 34, {size:9, color:[80,80,80]});
  }

  pdfText(doc, 'Objet :', 15, y + 6, {bold:true, size:9, color:[27,67,50]});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (facture.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (facture.bien_type || ''), 15, y + 27, {size:9, color:[80,80,80]});
  pdfText(doc, 'Intervention : ' + (facture.date_mission ? new Date(facture.date_mission).toLocaleDateString('fr-FR') : ''), 15, y + 34, {size:9, color:[80,80,80]});

  y += 48;
  y = pdfAddLine(doc, y);

  // Tableau diagnostics
  pdfRect(doc, 15, y, 180, 8, [27, 67, 50]);
  pdfText(doc, 'PRESTATIONS RÉALISÉES', 18, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'RÉALISÉ', 193, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  (facture.diagnostics || []).forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
    pdfText(doc, '- ' + d, 18, y + 5, {size:9, color:[30,30,30]});
    pdfText(doc, 'OK', 193, y + 5, {size:9, color:[27,67,50], align:'right'});
    y += 8;
  });

  y += 4;
  y = pdfAddLine(doc, y);
  y += 3;

  // Total
  var isHT   = (p.statut_fiscal || 'HT') === 'HT';
  var taux   = parseFloat(p.taux_tva || 20) / 100;
  var ht     = parseFloat(facture.total_ht || 0);
  var tva_mt = Math.round(ht * taux * 100) / 100;
  var ttc    = Math.round((ht + tva_mt) * 100) / 100;

  pdfRect(doc, 120, y, 75, isHT ? 28 : 36, [27, 67, 50]);
  if (!isHT) {
    pdfText(doc, 'Total HT',           122, y + 9,  {size:9, color:[170,210,185]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9,  {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (p.taux_tva||20) + '%',  122, y + 16, {size:9, color:[170,210,185]});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y + 16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, [10, 40, 25]);
    pdfText(doc, 'TOTAL TTC',            122, y+27, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ttc.toFixed(2) + ' €',  193, y+27, {bold:true, size:12, color:[255,255,255], align:'right'});
  } else {
    pdfRect(doc, 120, y+18, 75, 10, [10, 40, 25]);
    pdfText(doc, 'TOTAL',              122, y + 9,  {size:10, color:[200,230,210]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9,  {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, p.mentions_legales && p.mentions_legales.includes('Dispensé') ? 'TVA non applicable — art. 293B CGI' : 'TVA ' + (p.taux_tva||20) + '%', 122, y+16, {size:8, color:[170,210,185]});
    pdfText(doc, 'À PAYER',            122, y+25, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y+25, {bold:true, size:12, color:[255,255,255], align:'right'});
  }

  y += isHT ? 36 : 44;

  // Paiement
  y += 4;
  pdfText(doc, 'Modalites de reglement', 15, y, {bold:true, size:9, color:[27,67,50]});
  y += 6;
  pdfText(doc, p.conditions_paiement || 'Paiement à réception de facture', 15, y, {size:9, color:[80,80,80]});
  y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : ' + p.rib_iban + (p.rib_bic ? '  BIC : ' + p.rib_bic : ''), 15, y, {size:8, color:[100,100,100]});

  // Certification
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    if (p.organisme_certif) { pdfText(doc, 'Certifié par : ' + p.organisme_certif, 15, y, {size:8, color:[100,100,100]}); y += 5; }
    if (p.num_certif)        { pdfText(doc, 'N° : ' + p.num_certif, 15, y, {size:8, color:[100,100,100]}); y += 5; }
    if (p.num_assurance)     { pdfText(doc, 'RC Pro : ' + p.num_assurance, 15, y, {size:8, color:[100,100,100]}); }
  }

  // ── Tampon PAYÉ ──
  if (facture.statut === 'Payé') {
    doc.setFontSize(58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('PAYÉ', 100, 248, { angle: 35, align: 'center' });
    doc.setDrawColor(22, 101, 52);
    doc.setLineWidth(2.5);
    doc.rect(40, 215, 110, 55, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    if (facture.date_paiement) {
      doc.text('le ' + new Date(facture.date_paiement).toLocaleDateString('fr-FR'), 95, 259, { align: 'center' });
    }
  }

  // Pied de page
  var footerY = 285;
  pdfRect(doc, 0, footerY - 3, 210, 15, [245,247,250]);
  pdfText(doc, p.mentions_legales || '', 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.nom_societe||'') + (p.siret ? ' — SIRET : ' + p.siret : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});
  doc.save('Facture_' + (facture.numero_facture || 'XXXX') + '_' + (facture.client_nom || '') + '.pdf');
}

// ─── DEVIS SIGNÉ PDF ───────────────────────
// Génère un PDF identique au devis original + bloc de signature à la fin
function genererPDFSigne(devis) {
  if (!devis || !devis.signature || !devis.signature.signature_img) {
    alert('Aucune signature disponible pour ce devis.');
    return;
  }
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé. Vérifiez votre connexion internet.'); return; }

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  var y   = 15;
  var tplEpure = (p.pdf_template || 'standard') === 'epure';
  var sig = devis.signature;
  var signedDateStr = sig.date_signature ? new Date(sig.date_signature).toLocaleDateString('fr-FR') : '';

  // ── En-tête (identique à genererPDFDevis) ──
  if (tplEpure) {
    pdfRect(doc, 0, 0, 210, 40, [255, 255, 255]);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 42, 195, 42);
    var textX = 15;
    if (p.logo && p.logo.startsWith('data:image')) textX = pdfAddLogo(doc, p.logo, 15, 8);
    pdfText(doc, p.nom_societe || 'DELY DIAG', textX, 18, {bold:true, size:14, color:[27,67,50]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textX, 24, {size:8, color:[107,114,128]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textX, 30, {size:8, color:[107,114,128]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textX, 36, {size:8, color:[107,114,128]});
    pdfText(doc, 'DEVIS SIGNÉ', 195, 18, {bold:true, size:20, color:[27,67,50], align:'right'});
    pdfText(doc, 'N° ' + (devis.numero || ''), 195, 26, {bold:true, size:10, color:[45,106,79], align:'right'});
    pdfText(doc, 'Date : ' + new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:8, color:[107,114,128], align:'right'});
    pdfText(doc, signedDateStr ? 'Signé le : ' + signedDateStr : 'Signé électroniquement', 195, 38, {size:8, color:[5,150,105], align:'right'});
  } else {
    pdfRect(doc, 0, 0, 210, 40, [45, 106, 79]);
    var textX = 15;
    if (p.logo && p.logo.startsWith('data:image')) textX = pdfAddLogo(doc, p.logo, 15, 8);
    pdfText(doc, p.nom_societe || 'DELY DIAG', textX, 18, {bold:true, size:16, color:[255,255,255]});
    pdfText(doc, (p.forme_juridique || '') + (p.siret ? ' — SIRET : ' + p.siret : ''), textX, 25, {size:9, color:[200,230,210]});
    pdfText(doc, (p.adresse || '') + (p.code_postal ? ', ' + p.code_postal + ' ' + (p.ville||'') : ''), textX, 31, {size:9, color:[200,230,210]});
    pdfText(doc, (p.telephone || '') + (p.email ? '  |  ' + p.email : ''), textX, 37, {size:9, color:[200,230,210]});
    pdfText(doc, 'DEVIS SIGNÉ', 195, 18, {bold:true, size:22, color:[255,255,255], align:'right'});
    pdfText(doc, 'N° ' + (devis.numero || ''), 195, 26, {bold:true, size:11, color:[180,230,200], align:'right'});
    pdfText(doc, 'Date : ' + new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'), 195, 32, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, signedDateStr ? 'Signé le : ' + signedDateStr : 'Signé électroniquement', 195, 38, {size:8, color:[180,255,200], align:'right'});
  }

  y = 50;

  // ── Informations CLIENT (identique à genererPDFDevis) ──
  pdfRect(doc, 120, y, 75, 40, [245, 247, 250]);
  pdfText(doc, 'CLIENT', 122, y + 6, {bold:true, size:9, color:[107, 114, 128]});
  if (devis.client_societe) {
    pdfText(doc, devis.client_societe, 122, y + 13, {bold:true, size:10, color:[30,30,30]});
    pdfText(doc, (devis.client_prenom||'') + ' ' + (devis.client_nom||''), 122, y + 20, {size:8, color:[80,80,80]});
    pdfText(doc, devis.bien_adresse || '', 122, y + 27, {size:8, color:[80,80,80]});
    if (devis.client_tel) pdfText(doc, 'Tel : ' + devis.client_tel, 122, y + 34, {size:8, color:[80,80,80]});
  } else {
    pdfText(doc, (devis.client_prenom||'') + ' ' + (devis.client_nom||''), 122, y + 13, {bold:true, size:11, color:[30,30,30]});
    pdfText(doc, devis.bien_adresse || '', 122, y + 20, {size:9, color:[80,80,80]});
    if (devis.client_tel)   pdfText(doc, 'Tel : ' + devis.client_tel,   122, y + 27, {size:9, color:[80,80,80]});
    if (devis.client_email) pdfText(doc, 'Email : ' + devis.client_email, 122, y + 34, {size:9, color:[80,80,80]});
  }

  // ── Objet (identique à genererPDFDevis) ──
  pdfText(doc, 'Objet de la mission :', 15, y + 6, {bold:true, size:9, color:[45,106,79]});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (devis.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (devis.bien_type || '') + (devis.type_transaction ? ' — ' + devis.type_transaction : ''), 15, y + 27, {size:9, color:[80,80,80]});
  pdfText(doc, 'Date prévue : ' + (devis.date_mission ? new Date(devis.date_mission).toLocaleDateString('fr-FR') : 'À définir'), 15, y + 34, {size:9, color:[80,80,80]});

  y += 48;
  y = pdfAddLine(doc, y);

  // ── Tableau diagnostics (identique à genererPDFDevis) ──
  pdfRect(doc, 15, y, 180, 8, [45, 106, 79]);
  pdfText(doc, 'PRESTATIONS', 18, y + 5.5, {bold:true, size:9, color:[255,255,255]});
  pdfText(doc, 'INCLUS', 195, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  var diags = devis.diagnostics || [];
  diags.forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
    pdfText(doc, '- ' + d, 18, y + 5, {size:9, color:[30,30,30]});
    pdfText(doc, 'incl.', 193, y + 5, {size:9, color:[45,106,79], align:'right'});
    y += 8;
  });

  if (devis.remise_eur && parseFloat(devis.remise_eur) > 0) {
    y += 2;
    pdfText(doc, 'Remise' + (devis.remise_pct > 0 ? ' (' + parseFloat(devis.remise_pct).toFixed(1) + '%)' : ''), 18, y + 5, {size:9, color:[220,50,50]});
    pdfText(doc, '- ' + parseFloat(devis.remise_eur).toFixed(2) + ' €', 193, y + 5, {size:9, color:[220,50,50], align:'right'});
    y += 8;
  }

  y += 4;
  y = pdfAddLine(doc, y);
  y += 3;

  // ── Total (identique à genererPDFDevis) ──
  var isHT   = (devis.statut_fiscal || 'HT') === 'HT';
  var taux   = parseFloat(devis.taux_tva || 20) / 100;
  var ht     = parseFloat(devis.prix_final && devis.prix_final > 0 ? devis.prix_final : (devis.total_ht || 0));
  var tva_mt = Math.round(ht * taux * 100) / 100;
  var ttc    = Math.round((ht + tva_mt) * 100) / 100;

  pdfRect(doc, 120, y, 75, isHT ? 30 : 38, [45, 106, 79]);
  if (isHT) {
    pdfText(doc, 'Total HT', 122, y + 9, {size:10, color:[200,230,210]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, p.mentions_legales && p.mentions_legales.includes('Dispensé') ? 'TVA non applicable — art. 293B CGI' : 'TVA ' + (devis.taux_tva||20) + '%', 122, y+17, {size:9, color:[180,220,190]});
    pdfText(doc, p.mentions_legales && p.mentions_legales.includes('Dispensé') ? '' : tva_mt.toFixed(2) + ' €', 193, y+17, {size:9, color:[200,230,210], align:'right'});
  } else {
    pdfText(doc, 'Total HT', 122, y + 9, {size:9, color:[180,220,190]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (devis.taux_tva||20) + '%', 122, y+16, {size:9, color:[180,220,190]});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y+16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, [27, 67, 50]);
    pdfText(doc, 'TOTAL TTC', 122, y + 27, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ttc.toFixed(2) + ' €', 193, y + 27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }
  if (isHT) {
    pdfRect(doc, 120, y+20, 75, 10, [27,67,50]);
    pdfText(doc, 'TOTAL', 122, y+27, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ht.toFixed(2) + ' € HT', 193, y+27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }
  y += isHT ? 38 : 46;

  // ── Conditions de paiement ──
  y += 4;
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true, size:9, color:[45,106,79]});
  y += 6;
  pdfText(doc, p.conditions_paiement || 'Paiement à réception de facture', 15, y, {size:9, color:[80,80,80]});
  y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : ' + p.rib_iban + (p.rib_bic ? '  |  BIC : ' + p.rib_bic : ''), 15, y, {size:8, color:[100,100,100]});

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    pdfText(doc, 'Certification', 15, y, {bold:true, size:9, color:[45,106,79]});
    y += 6;
    if (p.organisme_certif) pdfText(doc, 'Certifié par : ' + p.organisme_certif, 15, y, {size:9, color:[80,80,80]});
    y += 5;
    if (p.num_certif) pdfText(doc, 'N° certification : ' + p.num_certif, 15, y, {size:9, color:[80,80,80]});
    y += 5;
    if (p.num_assurance) pdfText(doc, 'Assurance RC Pro : ' + p.num_assurance, 15, y, {size:9, color:[80,80,80]});
  }

  // ── Bloc signature ──
  y += 10;
  // Nouvelle page si plus assez de place (le bloc signature nécessite ~60mm)
  if (y > 215) {
    doc.addPage();
    y = 20;
  }
  y = pdfAddLine(doc, y);
  pdfRect(doc, 15, y, 180, 10, [240, 253, 244]);
  pdfText(doc, '✅  DEVIS ACCEPTÉ ET SIGNÉ ÉLECTRONIQUEMENT', 105, y + 7, {bold:true, size:10, color:[5,150,105], align:'center'});
  y += 15;

  var signedFullDate = sig.date_signature ? new Date(sig.date_signature).toLocaleString('fr-FR') : '';
  pdfText(doc, 'Signataire : ' + (sig.signataire || 'Le client'), 15, y, {bold:true, size:9});
  y += 5;
  if (signedFullDate) { pdfText(doc, 'Date et heure : ' + signedFullDate, 15, y, {size:9, color:[100,100,100]}); y += 5; }
  pdfText(doc, 'Procédé : Signature électronique via lien sécurisé (conforme eIDAS)', 15, y, {size:8, color:[100,100,100]});
  y += 10;

  try {
    var sigImg = sig.signature_img;
    if (sigImg && sigImg.startsWith('data:image')) {
      doc.addImage(sigImg, 'PNG', 15, y, 80, 35);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(15, y, 80, 35);
      pdfText(doc, 'Signature du client', 55, y + 39, {size:8, color:[150,150,150], align:'center'});
    }
  } catch(e) {}

  // ── Pied de page ──
  var footerY = 285;
  pdfRect(doc, 0, footerY - 3, 210, 15, [245,247,250]);
  pdfText(doc, p.mentions_legales || '', 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.nom_societe||'') + (p.siret ? ' — SIRET : ' + p.siret : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});

  doc.save('DevisSigne_' + (devis.numero || 'XXXX') + '_' + (devis.client_nom || '') + '.pdf');
}
