// ─────────────────────────────────────────────
// PDF-GENERATOR.JS — Génération PDF via jsPDF
// Devis et Factures professionnels
// ─────────────────────────────────────────────

// ─── UTILITAIRES ───────────────────────────
// ─── TEMPLATES PDF ─────────────────────────
var PDF_TEMPLATES = {
  standard:   { bg:[45,106,79],  fg:[255,255,255], sub:[200,230,210] },
  epure:      { bg:null,         fg:[27,67,50],    sub:[107,114,128] },
  marine:     { bg:[30,58,138],  fg:[255,255,255], sub:[187,210,255] },
  ardoise:    { bg:[30,41,59],   fg:[255,255,255], sub:[190,198,212] },
  terracotta: { bg:[153,58,30],  fg:[255,255,255], sub:[255,200,180] },
  premium:    { bg:[15,15,15],   fg:[212,175,55],  sub:[180,160,100] },
  bordeaux:   { bg:[120,20,30],  fg:[255,255,255], sub:[255,190,190] }
};

// Rend l'en-tête du PDF selon le template choisi
// extraLine : 4e ligne à droite (ex: "Valable 30 jours", "Devis réf. XX", "Signé le : XX")
function _pdfRenderHeader(doc, tplKey, p, docType, docNum, docDate, extraLine) {
  var cfg = PDF_TEMPLATES[tplKey] || PDF_TEMPLATES.standard;
  if (cfg.bg === null) {
    // Style Épuré
    pdfRect(doc, 0, 0, 210, 40, [255,255,255]);
    doc.setDrawColor(220,220,220); doc.line(15,42,195,42);
    var tx = 15;
    if (p.logo && p.logo.startsWith('data:image')) tx = pdfAddLogo(doc, p.logo, 15, 8, p.logo_w, p.logo_h);
    pdfText(doc, p.nom_societe||'DELY DIAG', tx, 18, {bold:true,size:14,color:cfg.fg});
    pdfText(doc, (p.forme_juridique||'')+( p.nom_responsable?' '+p.nom_responsable:'')+( p.siret?' — SIRET : '+p.siret:''), tx, 24, {size:8,color:cfg.sub});
    pdfText(doc, (p.adresse?p.adresse+(p.code_postal?', ':'')+'':'')+(p.code_postal?p.code_postal+' '+(p.ville||''):''), tx, 30, {size:8,color:cfg.sub});
    pdfText(doc, (p.telephone||'')+(p.email?'  |  '+p.email:''), tx, 36, {size:8,color:cfg.sub});
    pdfText(doc, docType, 195, 18, {bold:true,size:20,color:cfg.fg,align:'right'});
    pdfText(doc, 'N° '+docNum, 195, 26, {bold:true,size:10,color:[45,106,79],align:'right'});
    pdfText(doc, 'Date : '+docDate, 195, 32, {size:8,color:cfg.sub,align:'right'});
    if (extraLine) pdfText(doc, extraLine, 195, 38, {size:8,color:[156,163,175],align:'right'});
  } else {
    // Style bandeau coloré
    pdfRect(doc, 0, 0, 210, 40, cfg.bg);
    var tx = 15;
    if (p.logo && p.logo.startsWith('data:image')) tx = pdfAddLogo(doc, p.logo, 15, 8, p.logo_w, p.logo_h);
    pdfText(doc, p.nom_societe||'DELY DIAG', tx, 18, {bold:true,size:16,color:cfg.fg});
    pdfText(doc, (p.forme_juridique||'')+( p.nom_responsable?' '+p.nom_responsable:'')+( p.siret?' — SIRET : '+p.siret:''), tx, 25, {size:9,color:cfg.sub});
    pdfText(doc, (p.adresse?p.adresse+(p.code_postal?', ':'')+'':'')+(p.code_postal?p.code_postal+' '+(p.ville||''):''), tx, 31, {size:9,color:cfg.sub});
    pdfText(doc, (p.telephone||'')+(p.email?'  |  '+p.email:''), tx, 37, {size:9,color:cfg.sub});
    pdfText(doc, docType, 195, 18, {bold:true,size:22,color:cfg.fg,align:'right'});
    pdfText(doc, 'N° '+docNum, 195, 26, {bold:true,size:11,color:cfg.sub,align:'right'});
    pdfText(doc, 'Date : '+docDate, 195, 32, {size:9,color:cfg.sub,align:'right'});
    if (extraLine) pdfText(doc, extraLine, 195, 38, {size:8,color:cfg.sub,align:'right'});
  }
}



// Lit les dimensions réelles d'un logo depuis son dataURL (synchrone — PNG et JPEG)
function getImgDimsFromDataUrl(dataUrl) {
  try {
    var b64 = dataUrl.split(',')[1];
    if (!b64) return null;
    var bin = atob(b64);
    // PNG : magic bytes 0x89 0x50, dimensions aux octets 16-23
    if ((bin.charCodeAt(0) & 0xFF) === 0x89 && (bin.charCodeAt(1) & 0xFF) === 0x50 && bin.length >= 24) {
      var w = ((bin.charCodeAt(16)&0xFF)<<24)|((bin.charCodeAt(17)&0xFF)<<16)|((bin.charCodeAt(18)&0xFF)<<8)|(bin.charCodeAt(19)&0xFF);
      var h = ((bin.charCodeAt(20)&0xFF)<<24)|((bin.charCodeAt(21)&0xFF)<<16)|((bin.charCodeAt(22)&0xFF)<<8)|(bin.charCodeAt(23)&0xFF);
      if (w > 0 && h > 0) return { w: w, h: h };
    }
    // JPEG : chercher marqueur SOF (0xFF 0xC0..C3)
    if ((bin.charCodeAt(0)&0xFF) === 0xFF && (bin.charCodeAt(1)&0xFF) === 0xD8) {
      var i = 2;
      while (i < bin.length - 9) {
        if ((bin.charCodeAt(i)&0xFF) !== 0xFF) break;
        var marker = bin.charCodeAt(i+1)&0xFF;
        var len = ((bin.charCodeAt(i+2)&0xFF)<<8)|(bin.charCodeAt(i+3)&0xFF);
        if (marker >= 0xC0 && marker <= 0xC3) {
          var h = ((bin.charCodeAt(i+5)&0xFF)<<8)|(bin.charCodeAt(i+6)&0xFF);
          var w = ((bin.charCodeAt(i+7)&0xFF)<<8)|(bin.charCodeAt(i+8)&0xFF);
          if (w > 0 && h > 0) return { w: w, h: h };
        }
        i += 2 + len;
      }
    }
  } catch(e) {}
  return null;
}

// Ajoute le logo en conservant les proportions dans une boîte max 28×24mm
function pdfAddLogo(doc, logoDataUrl, x, y, logoW, logoH) {
  try {
    var iw = (logoW && logoW > 0) ? logoW : 0;
    var ih = (logoH && logoH > 0) ? logoH : 0;
    // Si dimensions non stockées, les lire directement depuis les octets de l'image
    if (!iw || !ih) {
      var dims = getImgDimsFromDataUrl(logoDataUrl);
      if (dims) { iw = dims.w; ih = dims.h; }
    }
    // Fallback ultime : ratio 3:1 typique d'un logo horizontal
    if (!iw) iw = 300;
    if (!ih) ih = 100;
    var maxW = 28, maxH = 24;
    var ratio = Math.min(maxW / iw, maxH / ih);
    var w = iw * ratio;
    var h = ih * ratio;
    var fmt = logoDataUrl.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
    doc.addImage(logoDataUrl, fmt, x, y + (maxH - h) / 2, w, h);
    return x + w + 4;
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

// ─── COMPRESSION LOGO POUR EMAIL ───────────────────────────
// Réduit le logo en JPEG 400px max / qualité 0.65 pour éviter les erreurs 413
function _compressLogoForEmail(logoDataUrl, callback) {
  if (!logoDataUrl || !logoDataUrl.startsWith('data:image')) { callback(null); return; }
  var img = new Image();
  img.onload = function() {
    try {
      var maxDim = 400;
      var scale  = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      var c = document.createElement('canvas');
      c.width  = Math.round(img.naturalWidth  * scale);
      c.height = Math.round(img.naturalHeight * scale);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      callback(c.toDataURL('image/jpeg', 0.65));
    } catch(e) { callback(null); }
  };
  img.onerror = function() { callback(null); };
  img.src = logoDataUrl;
}

// ─── DEVIS PDF ─────────────────────────────
function genererPDFDevis(devis, _returnBlob, opts) {
  opts = opts || {};
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé. Vérifiez votre connexion internet.'); return; }

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  // Pour l'envoi par mail : ignorer le logo (trop lourd pour Netlify)
  if (opts.compressedLogo) { p = Object.assign({}, p); p.logo = opts.compressedLogo; }
  else if (opts.skipLogo) { p = Object.assign({}, p); delete p.logo; }
  var y   = 15;
  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'DEVIS',
    devis.numero || '',
    new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'),
    'Valable 30 jours');
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
  // Date prévue : visible uniquement dans la mission, pas sur le devis client

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
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+17, {size:9, color:[180,220,190]});
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

  // ── Mentions légales (avant conditions de paiement) ──
  if (p.mentions_legales && p.mentions_legales.trim()) {
    y += 8;
    pdfText(doc, 'Mentions légales', 15, y, {bold:true, size:8, color:[107,114,128]});
    y += 5;
    var _mlD = doc.splitTextToSize(p.mentions_legales.trim(), 180);
    _mlD.forEach(function(line) {
      pdfText(doc, line, 15, y, {size:7, color:[120,120,120]});
      y += 3.5;
    });
  }

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
  pdfText(doc, (p.nom_societe||'') + (p.adresse ? ' — ' + p.adresse : '') + (p.siret ? ' — SIRET : ' + p.siret : ''), 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.telephone||'') + (p.email ? ' | ' + p.email : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});

  var _pdfFilename = 'Devis_' + (devis.numero || 'XXXX') + '_' + (devis.client_nom || '') + '.pdf';
  if (_returnBlob) return { blob: doc.output('blob'), filename: _pdfFilename };
  doc.save(_pdfFilename);
}

// ─── FACTURE PDF ───────────────────────────
function genererPDFFacture(facture, _returnBlob, opts) {
  opts = opts || {};
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé.'); return; }

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  // Pour l'envoi par mail : ignorer le logo (trop lourd pour Netlify)
  if (opts.compressedLogo) { p = Object.assign({}, p); p.logo = opts.compressedLogo; }
  else if (opts.skipLogo) { p = Object.assign({}, p); delete p.logo; }
  var y   = 15;
  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'FACTURE',
    facture.numero_facture || '',
    new Date(facture.date_facture || Date.now()).toLocaleDateString('fr-FR'),
    facture.numero ? 'Devis réf. : ' + facture.numero : '');
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
  // Priorité au prix forfaitaire saisi manuellement (prix_final), sinon calcul auto (total_ht)
  var ht     = parseFloat(facture.prix_final && facture.prix_final > 0 ? facture.prix_final : (facture.total_ht || 0));
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
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+16, {size:8, color:[170,210,185]});
    pdfText(doc, 'À PAYER',            122, y+25, {bold:true, size:11, color:[255,255,255]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y+25, {bold:true, size:12, color:[255,255,255], align:'right'});
  }

  y += isHT ? 36 : 44;

  // ── Mentions légales obligatoires FACTURE ──
  y += 8;
  pdfText(doc, 'Mentions légales', 15, y, {bold:true, size:8, color:[107,114,128]});
  y += 5;
  var _legalF = [
    "Pénalités de retard : applicables le lendemain de la date d'échéance, au taux légal en vigueur (art. L441-6 C. com.).",
    "Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 € (art. D441-5 C. com.).",
    "Pas d'escompte accordé en cas de paiement anticipé."
  ];
  if (p.mentions_legales && p.mentions_legales.trim()) {
    _legalF.push(p.mentions_legales.trim());
  }
  _legalF.forEach(function(line) {
    doc.splitTextToSize(line, 180).forEach(function(l) {
      pdfText(doc, l, 15, y, {size:7, color:[120,120,120]}); y += 3.5;
    });
  });

  // Paiement
  y += 4;
  pdfText(doc, 'Modalités de règlement', 15, y, {bold:true, size:9, color:[27,67,50]});
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
    if (facture.mode_paiement) {
      doc.text(facture.mode_paiement, 95, 264, { align: 'center' });
    }
  }

  // Pied de page
  var footerY = 285;
  pdfRect(doc, 0, footerY - 3, 210, 15, [245,247,250]);
  pdfText(doc, (p.nom_societe||'') + (p.adresse ? ' — ' + p.adresse : '') + (p.siret ? ' — SIRET : ' + p.siret : ''), 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.telephone||'') + (p.email ? ' | ' + p.email : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});
  var _pdfFilename = 'Facture_' + (facture.numero_facture || 'XXXX') + '_' + (facture.client_nom || '') + '.pdf';
  if (_returnBlob) return { blob: doc.output('blob'), filename: _pdfFilename };
  doc.save(_pdfFilename);
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
  var sig = devis.signature;
  var signedDateStr = sig.date_signature ? new Date(sig.date_signature).toLocaleDateString('fr-FR') : '';

  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'DEVIS SIGNÉ',
    devis.numero || '',
    new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'),
    signedDateStr ? 'Signé le : ' + signedDateStr : 'Signé électroniquement');
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
  // Date prévue : visible uniquement dans la mission, pas sur le devis client

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
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+17, {size:9, color:[180,220,190]});
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

  // ── Mentions légales (avant conditions de paiement) ──
  if (p.mentions_legales && p.mentions_legales.trim()) {
    y += 8;
    pdfText(doc, 'Mentions légales', 15, y, {bold:true, size:8, color:[107,114,128]});
    y += 5;
    var _mlS = doc.splitTextToSize(p.mentions_legales.trim(), 180);
    _mlS.forEach(function(line) {
      pdfText(doc, line, 15, y, {size:7, color:[120,120,120]});
      y += 3.5;
    });
  }

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
  pdfText(doc, (p.nom_societe||'') + (p.adresse ? ' — ' + p.adresse : '') + (p.siret ? ' — SIRET : ' + p.siret : ''), 15, footerY + 2, {size:7, color:[150,150,150]});
  pdfText(doc, (p.telephone||'') + (p.email ? ' | ' + p.email : ''), 195, footerY + 7, {size:7, color:[150,150,150], align:'right'});

  doc.save('DevisSigne_' + (devis.numero || 'XXXX') + '_' + (devis.client_nom || '') + '.pdf');
}


// ─── PDF DEVIS SPÉCIAL (multi-biens) ──────────
function genererPDFDevisSpecial(devis) {
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé.'); return; }
  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p   = getCompanyProfile();
  var y   = 15;
  var lots = devis.lots || [];

  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'DEVIS SPÉCIAL',
    devis.numero || '',
    new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'),
    'Valable 30 jours');
  y = 50;

  // ── Bloc client ──
  pdfRect(doc, 120, y, 75, 36, [245,247,250]);
  pdfText(doc, 'CLIENT', 122, y+6, {bold:true,size:9,color:[107,114,128]});
  if (devis.client_societe) pdfText(doc, devis.client_societe, 122, y+13, {bold:true,size:10,color:[30,30,30]});
  var clientName = ((devis.client_prenom||'')+' '+(devis.client_nom||'')).trim();
  pdfText(doc, clientName, 122, devis.client_societe?y+20:y+13, {size:9,color:[60,60,60]});
  if (devis.client_tel) pdfText(doc, 'Tél : '+devis.client_tel, 122, y+27, {size:8,color:[80,80,80]});
  if (devis.client_email) pdfText(doc, devis.client_email, 122, y+33, {size:8,color:[80,80,80]});

  // ── Objet ──
  pdfText(doc, 'Objet de la mission :', 15, y+6, {bold:true,size:9,color:[45,106,79]});
  pdfText(doc, 'Diagnostics immobiliers — plusieurs biens', 15, y+13, {size:10,color:[30,30,30]});
  if (devis.adresse_commune) pdfText(doc, 'Résidence / adresse réf. : '+devis.adresse_commune, 15, y+20, {size:9,color:[80,80,80]});
  pdfText(doc, lots.length+' bien'+(lots.length>1?'s':'')+' à diagnostiquer', 15, y+27, {size:9,color:[80,80,80]});

  y += 44;
  y = pdfAddLine(doc, y);

  // ── Un bloc par lot ──
  lots.forEach(function(lot, i) {
    // Vérifier si on a besoin d'une nouvelle page
    var estimHeight = 28 + (lot.diagnostics||[]).length * 7;
    if (y + estimHeight > 270) { doc.addPage(); y = 15; }

    // Titre du lot
    pdfRect(doc, 15, y, 180, 8, [27,67,50]);
    pdfText(doc, 'BIEN N°'+(i+1)+(lot.label?' — '+lot.label:''), 18, y+5.5, {bold:true,size:9,color:[255,255,255]});
    y += 10;

    // Infos du lot
    var adresse = lot.meme_adresse ? (devis.adresse_commune||'') : (lot.adresse||'');
    if (adresse) { pdfText(doc, '📍 '+adresse, 18, y+4, {size:9,color:[60,60,60]}); y += 7; }
    if (lot.type_bien) { pdfText(doc, 'Type : '+lot.type_bien, 18, y+4, {size:9,color:[80,80,80]}); y += 7; }

    // Tableau diagnostics du lot
    var diags = lot.diagnostics || [];
    var tm    = lot.tarifs_manuels || {};
    if (diags.length > 0) {
      pdfRect(doc, 15, y, 180, 7, [240,253,244]);
      pdfText(doc, 'Prestation', 18, y+4.5, {bold:true,size:8,color:[45,106,79]});
      pdfText(doc, 'Tarif HT', 193, y+4.5, {bold:true,size:8,color:[45,106,79],align:'right'});
      y += 7;
      diags.forEach(function(d, di) {
        if (di % 2 === 0) pdfRect(doc, 15, y-1, 180, 7, [249,250,251]);
        pdfText(doc, '  '+d, 18, y+4, {size:8,color:[30,30,30]});
        var tv = tm[d] !== undefined ? parseFloat(tm[d]) : 0;
        pdfText(doc, tv > 0 ? tv.toFixed(2)+' €' : 'inclus', 193, y+4, {size:8,color:[45,106,79],align:'right'});
        y += 7;
      });
    }

    // Sous-total lot
    pdfRect(doc, 130, y+1, 65, 8, [232,245,237]);
    pdfText(doc, 'Sous-total Bien N°'+(i+1), 132, y+6, {size:8,color:[45,106,79]});
    pdfText(doc, parseFloat(lot.sous_total||0).toFixed(2)+' €', 193, y+6, {bold:true,size:9,color:[27,67,50],align:'right'});
    y += 13;
  });

  // ── Récapitulatif total ──
  if (y + 50 > 270) { doc.addPage(); y = 15; }
  y = pdfAddLine(doc, y);
  y += 2;

  pdfRect(doc, 15, y, 180, 8, [45,106,79]);
  pdfText(doc, 'RÉCAPITULATIF', 18, y+5.5, {bold:true,size:9,color:[255,255,255]});
  y += 10;

  lots.forEach(function(lot, i) {
    if (i%2===0) pdfRect(doc, 15, y-1, 180, 8, [249,250,251]);
    var label = lot.label || ('Bien N°'+(i+1));
    pdfText(doc, '  '+label, 18, y+5, {size:9,color:[30,30,30]});
    pdfText(doc, parseFloat(lot.sous_total||0).toFixed(2)+' €', 193, y+5, {size:9,color:[45,106,79],align:'right'});
    y += 8;
  });

  y += 2;
  // Remise
  if (devis.remise_eur && parseFloat(devis.remise_eur) > 0) {
    pdfText(doc, 'Remise'+(devis.remise_pct>0?' ('+parseFloat(devis.remise_pct).toFixed(1)+'%)':''), 18, y+5, {size:9,color:[220,50,50]});
    pdfText(doc, '- '+parseFloat(devis.remise_eur).toFixed(2)+' €', 193, y+5, {size:9,color:[220,50,50],align:'right'});
    y += 8;
  }

  y += 2; y = pdfAddLine(doc, y); y += 3;

  // Total
  var isHT  = (devis.statut_fiscal||'HT') === 'HT';
  var taux  = parseFloat(devis.taux_tva||20)/100;
  var ht    = parseFloat(devis.total_ht||0);
  var tvaMt = Math.round(ht*taux*100)/100;
  var ttc   = Math.round((ht+tvaMt)*100)/100;

  pdfRect(doc, 120, y, 75, isHT?30:38, [45,106,79]);
  if (isHT) {
    pdfText(doc, 'Total HT', 122, y+9, {size:10,color:[200,230,210]});
    pdfText(doc, ht.toFixed(2)+' €', 193, y+9, {bold:true,size:10,color:[255,255,255],align:'right'});
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+17, {size:9,color:[180,220,190]});
    pdfRect(doc, 120, y+20, 75, 10, [27,67,50]);
    pdfText(doc, 'TOTAL', 122, y+27, {bold:true,size:11,color:[255,255,255]});
    pdfText(doc, ht.toFixed(2)+' € HT', 193, y+27, {bold:true,size:12,color:[255,255,255],align:'right'});
  } else {
    pdfText(doc, 'Total HT', 122, y+9, {size:9,color:[180,220,190]});
    pdfText(doc, ht.toFixed(2)+' €', 193, y+9, {size:9,color:[200,230,210],align:'right'});
    pdfText(doc, 'TVA '+( devis.taux_tva||20)+'%', 122, y+16, {size:9,color:[180,220,190]});
    pdfText(doc, tvaMt.toFixed(2)+' €', 193, y+16, {size:9,color:[200,230,210],align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, [27,67,50]);
    pdfText(doc, 'TOTAL TTC', 122, y+27, {bold:true,size:11,color:[255,255,255]});
    pdfText(doc, ttc.toFixed(2)+' €', 193, y+27, {bold:true,size:12,color:[255,255,255],align:'right'});
  }
  y += isHT ? 38 : 46;

  // ── Mentions légales ──
  if (p.mentions_legales && p.mentions_legales.trim()) {
    y += 8;
    pdfText(doc, 'Mentions légales', 15, y, {bold:true,size:8,color:[107,114,128]}); y += 5;
    doc.splitTextToSize(p.mentions_legales.trim(), 180).forEach(function(line) {
      pdfText(doc, line, 15, y, {size:7,color:[120,120,120]}); y += 3.5;
    });
  }

  // ── Conditions paiement ──
  y += 4;
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true,size:9,color:[45,106,79]}); y += 6;
  pdfText(doc, p.conditions_paiement||'Paiement à réception de facture', 15, y, {size:9,color:[80,80,80]}); y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : '+p.rib_iban+(p.rib_bic?' | BIC : '+p.rib_bic:''), 15, y, {size:8,color:[100,100,100]});

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    pdfText(doc, 'Certification', 15, y, {bold:true,size:9,color:[45,106,79]}); y += 6;
    if (p.organisme_certif) { pdfText(doc, 'Certifié par : '+p.organisme_certif, 15, y, {size:9,color:[80,80,80]}); y += 5; }
    if (p.num_certif) { pdfText(doc, 'N° certification : '+p.num_certif, 15, y, {size:9,color:[80,80,80]}); y += 5; }
    if (p.num_assurance) pdfText(doc, 'Assurance RC Pro : '+p.num_assurance, 15, y, {size:9,color:[80,80,80]});
  }

  // ── Pied de page ──
  var footerY = 285;
  pdfRect(doc, 0, footerY-3, 210, 15, [245,247,250]);
  pdfText(doc, (p.nom_societe||'')+(p.adresse?' — '+p.adresse:'')+(p.siret?' — SIRET : '+p.siret:''), 15, footerY+2, {size:7,color:[150,150,150]});
  pdfText(doc, (p.telephone||'')+(p.email?' | '+p.email:''), 195, footerY+7, {size:7,color:[150,150,150],align:'right'});

  doc.save('DevisSpecial_'+(devis.numero||'XXXX')+'_'+(devis.client_nom||'')+'.pdf');
}
