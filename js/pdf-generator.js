// ─────────────────────────────────────────────
// PDF-GENERATOR.JS — Génération PDF via jsPDF
// Devis et Factures professionnels
// ─────────────────────────────────────────────

// ─── UTILITAIRES ───────────────────────────

/**
 * Normalise un profil société pour gérer les anciens .c2p
 * dont les champs ont été renommés.
 * Toujours appeler après getCompanyProfile() pour les PDFs agent.
 */
function _pdfNormalizeProfile(p) {
  if (!p) return p;
  // Compatibilité anciens exports .c2p (noms courts → noms complets)
  p.mentions_legales    = p.mentions_legales    || p.mentions    || '';
  p.num_assurance       = p.num_assurance       || p.assurance   || '';
  p.rib_iban            = p.rib_iban            || p.iban        || '';
  p.rib_bic             = p.rib_bic             || p.bic         || '';
  p.rib_banque          = p.rib_banque          || p.banque      || '';
  p.taux_tva            = p.taux_tva            !== undefined ? p.taux_tva : (p.tva !== undefined ? p.tva : 20);
  p.statut_fiscal       = p.statut_fiscal       || 'HT';
  p.conditions_paiement = p.conditions_paiement || 'Paiement à réception de facture';
  return p;
}

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
  var p   = _pdfNormalizeProfile(getCompanyProfile());
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

  // Variables thème — utilisées dans tout le PDF
  var _tplCfg    = PDF_TEMPLATES[p.pdf_template || 'standard'] || PDF_TEMPLATES.standard;
  var _tplBg     = _tplCfg.bg || [240,240,240];
  var _tplFg     = _tplCfg.fg;
  var _tplSub    = _tplCfg.sub;
  var _tplAccent = _tplCfg.bg || _tplCfg.fg;
  var _tplDark   = _tplCfg.bg ? _tplCfg.bg.map(function(c){return Math.max(0,c-18);}) : [210,210,210];
  var _tplTextOnBg = _tplCfg.bg ? _tplCfg.fg : _tplCfg.fg;

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
  pdfText(doc, 'Objet de la mission :', 15, y + 6, {bold:true, size:9, color:_tplAccent});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (devis.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (devis.bien_type || '') + (devis.type_transaction ? ' — ' + devis.type_transaction : ''), 15, y + 27, {size:9, color:[80,80,80]});
  // Date prévue : visible uniquement dans la mission, pas sur le devis client

  y += 48;
  y = pdfAddLine(doc, y);

  // ── Tableau diagnostics ──
  pdfRect(doc, 15, y, 180, 8, _tplBg);
  pdfText(doc, 'PRESTATIONS', 18, y + 5.5, {bold:true, size:9, color:_tplTextOnBg});
  pdfText(doc, 'INCLUS', 195, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  var diags = devis.diagnostics || [];
  var tarifs_manuels = devis.tarifs_manuels || {};
  diags.forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
    var _qtyD = (devis.qte_manuels && parseInt(devis.qte_manuels[d]) > 1) ? parseInt(devis.qte_manuels[d]) : 1;
    var _labelD = '- ' + d + (_qtyD > 1 ? ' \xD7' + _qtyD : '');
    pdfText(doc, _labelD, 18, y + 5, {size:9, color:[30,30,30]});
    pdfText(doc, 'incl.', 193, y + 5, {size:9, color:[45,106,79], align:'right'});
    y += 8;
    // DPE Immeuble : afficher le détail des logements juste en dessous
    if (d === 'DPE Immeuble' && devis.dpe_immeuble_detail) {
      var detail = 'Détail : ' + devis.dpe_immeuble_detail;
      var lines  = doc.splitTextToSize(detail, 165);
      lines.forEach(function(line) {
        pdfText(doc, line, 22, y + 3, {size:7.5, color:[150,100,30]});
        y += 4;
      });
      y += 1;
    }
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

  pdfRect(doc, 120, y, 75, isHT ? 30 : 38, _tplBg);
  if (isHT) {
    pdfText(doc, 'Total HT', 122, y + 9, {size:10, color:_tplSub});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+17, {size:9, color:_tplSub});
  } else {
    pdfText(doc, 'Total HT', 122, y + 9, {size:9, color:_tplSub});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (devis.taux_tva||20) + '%', 122, y+16, {size:9, color:_tplSub});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y+16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL TTC', 122, y + 27, {bold:true, size:11, color:_tplTextOnBg});
    pdfText(doc, ttc.toFixed(2) + ' €', 193, y + 27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }

  if (isHT) {
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL', 122, y+27, {bold:true, size:11, color:_tplTextOnBg});
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
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true, size:9, color:_tplAccent});
  y += 6;
  pdfText(doc, p.conditions_paiement || 'Paiement à réception de facture', 15, y, {size:9, color:[80,80,80]});
  y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : ' + p.rib_iban + (p.rib_bic ? '  |  BIC : ' + p.rib_bic : ''), 15, y, {size:8, color:[100,100,100]});

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    pdfText(doc, 'Certification', 15, y, {bold:true, size:9, color:_tplAccent});
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
  var p   = _pdfNormalizeProfile(getCompanyProfile());
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

  // Variables thème — utilisées dans tout le PDF
  var _tplCfg    = PDF_TEMPLATES[p.pdf_template || 'standard'] || PDF_TEMPLATES.standard;
  var _tplBg     = _tplCfg.bg || [240,240,240];
  var _tplFg     = _tplCfg.fg;
  var _tplSub    = _tplCfg.sub;
  var _tplAccent = _tplCfg.bg || _tplCfg.fg;
  var _tplDark   = _tplCfg.bg ? _tplCfg.bg.map(function(c){return Math.max(0,c-18);}) : [210,210,210];
  var _tplTextOnBg = _tplCfg.bg ? _tplCfg.fg : _tplCfg.fg;

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

  pdfText(doc, 'Objet :', 15, y + 6, {bold:true, size:9, color:_tplAccent});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (facture.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (facture.bien_type || ''), 15, y + 27, {size:9, color:[80,80,80]});
  pdfText(doc, 'Intervention : ' + (facture.date_mission ? new Date(facture.date_mission).toLocaleDateString('fr-FR') : ''), 15, y + 34, {size:9, color:[80,80,80]});

  y += 48;
  y = pdfAddLine(doc, y);

  // ── Prestations ──
  var isSpecialFacture = facture.type === 'special' && (facture.lots || []).length > 0;

  if (isSpecialFacture) {
    // ─── Devis spécial : détail par lot ───
    var fLots = facture.lots || [];
    fLots.forEach(function(lot, i) {
      var estimH = 22 + (lot.diagnostics||[]).length * 7;
      if (y + estimH > 270) { doc.addPage(); y = 15; }

      pdfRect(doc, 15, y, 180, 8, _tplBg);
      pdfText(doc, 'BIEN N°'+(i+1)+(lot.label?' — '+lot.label:''), 18, y+5.5, {bold:true,size:9,color:_tplTextOnBg});
      y += 10;

      var adresse = lot.meme_adresse ? (facture.adresse_commune||'') : (lot.adresse||'');
      if (adresse) { pdfText(doc, '📍 '+adresse, 18, y+4, {size:8.5,color:[60,60,60]}); y += 6; }
      if (lot.type_bien) { pdfText(doc, 'Type : '+lot.type_bien, 18, y+4, {size:8.5,color:[80,80,80]}); y += 6; }

      pdfRect(doc, 15, y, 180, 7, [240,253,244]);
      pdfText(doc, 'Prestation', 18, y+4.5, {bold:true,size:8,color:_tplAccent});
      pdfText(doc, 'Tarif HT', 193, y+4.5, {bold:true,size:8,color:[45,106,79],align:'right'});
      y += 7;
      (lot.diagnostics||[]).forEach(function(d, di) {
        if (di % 2 === 0) pdfRect(doc, 15, y-1, 180, 7, [249,250,251]);
        pdfText(doc, '  '+d, 18, y+4, {size:8,color:[30,30,30]});
        var tv = lot.tarifs_manuels && lot.tarifs_manuels[d] !== undefined ? parseFloat(lot.tarifs_manuels[d]) : 0;
        pdfText(doc, tv > 0 ? tv.toFixed(2)+' €' : 'inclus', 193, y+4, {size:8,color:[45,106,79],align:'right'});
        y += 7;
      });

      pdfRect(doc, 130, y+1, 65, 8, [232,245,237]);
      pdfText(doc, 'Sous-total Bien N°'+(i+1), 132, y+6, {size:8,color:_tplAccent});
      pdfText(doc, parseFloat(lot.sous_total||0).toFixed(2)+' €', 193, y+6, {bold:true,size:9,color:[27,67,50],align:'right'});
      y += 13;
    });

    // Récapitulatif lots
    if (y + 40 > 270) { doc.addPage(); y = 15; }
    y = pdfAddLine(doc, y); y += 2;
    pdfRect(doc, 15, y, 180, 8, _tplBg);
    pdfText(doc, 'RÉCAPITULATIF', 18, y+5.5, {bold:true,size:9,color:_tplTextOnBg});
    y += 10;
    fLots.forEach(function(lot, i) {
      if (i%2===0) pdfRect(doc, 15, y-1, 180, 8, [249,250,251]);
      pdfText(doc, '  '+(lot.label||'Bien N°'+(i+1)), 18, y+5, {size:9,color:[30,30,30]});
      pdfText(doc, parseFloat(lot.sous_total||0).toFixed(2)+' €', 193, y+5, {size:9,color:[45,106,79],align:'right'});
      y += 8;
    });

  } else {
    // ─── Devis standard : liste plate ───
    pdfRect(doc, 15, y, 180, 8, _tplBg);
    pdfText(doc, 'PRESTATIONS RÉALISÉES', 18, y + 5.5, {bold:true, size:9, color:_tplTextOnBg});
    pdfText(doc, 'RÉALISÉ', 193, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
    y += 10;

    (facture.diagnostics || []).forEach(function(d, i) {
      if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
      var _qtyD = (facture.qte_manuels && parseInt(facture.qte_manuels[d]) > 1) ? parseInt(facture.qte_manuels[d]) : 1;
      var _labelD = '- ' + d + (_qtyD > 1 ? ' \xD7' + _qtyD : '');
      pdfText(doc, _labelD, 18, y + 5, {size:9, color:[30,30,30]});
      pdfText(doc, 'OK', 193, y + 5, {size:9, color:[27,67,50], align:'right'});
      y += 8;
    });
  }

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

  pdfRect(doc, 120, y, 75, isHT ? 28 : 36, _tplBg);
  if (!isHT) {
    pdfText(doc, 'Total HT',           122, y + 9,  {size:9, color:[170,210,185]});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9,  {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (p.taux_tva||20) + '%',  122, y + 16, {size:9, color:[170,210,185]});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y + 16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, [10, 40, 25]);
    pdfText(doc, 'TOTAL TTC',            122, y+27, {bold:true, size:11, color:_tplTextOnBg});
    pdfText(doc, ttc.toFixed(2) + ' €',  193, y+27, {bold:true, size:12, color:[255,255,255], align:'right'});
  } else {
    pdfRect(doc, 120, y+18, 75, 10, [10, 40, 25]);
    pdfText(doc, 'TOTAL',              122, y + 9,  {size:10, color:_tplSub});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9,  {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+16, {size:8, color:[170,210,185]});
    pdfText(doc, 'À PAYER',            122, y+25, {bold:true, size:11, color:_tplTextOnBg});
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
  pdfText(doc, 'Modalités de règlement', 15, y, {bold:true, size:9, color:_tplAccent});
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
  var p   = _pdfNormalizeProfile(getCompanyProfile());
  var y   = 15;
  var sig = devis.signature;
  var signedDateStr = sig.date_signature ? new Date(sig.date_signature).toLocaleDateString('fr-FR') : '';

  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'DEVIS SIGNÉ',
    devis.numero || '',
    new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'),
    signedDateStr ? 'Signé le : ' + signedDateStr : 'Signé électroniquement');
  y = 50;

  // Variables thème — utilisées dans tout le PDF
  var _tplCfg    = PDF_TEMPLATES[p.pdf_template || 'standard'] || PDF_TEMPLATES.standard;
  var _tplBg     = _tplCfg.bg || [240,240,240];
  var _tplFg     = _tplCfg.fg;
  var _tplSub    = _tplCfg.sub;
  var _tplAccent = _tplCfg.bg || _tplCfg.fg;
  var _tplDark   = _tplCfg.bg ? _tplCfg.bg.map(function(c){return Math.max(0,c-18);}) : [210,210,210];
  var _tplTextOnBg = _tplCfg.bg ? _tplCfg.fg : _tplCfg.fg;

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
  pdfText(doc, 'Objet de la mission :', 15, y + 6, {bold:true, size:9, color:_tplAccent});
  pdfText(doc, 'Réalisation de diagnostics immobiliers', 15, y + 13, {size:10, color:[30,30,30]});
  pdfText(doc, 'Bien : ' + (devis.bien_adresse || ''), 15, y + 20, {size:9, color:[80,80,80]});
  pdfText(doc, 'Type : ' + (devis.bien_type || '') + (devis.type_transaction ? ' — ' + devis.type_transaction : ''), 15, y + 27, {size:9, color:[80,80,80]});
  // Date prévue : visible uniquement dans la mission, pas sur le devis client

  y += 48;
  y = pdfAddLine(doc, y);

  // ── Tableau diagnostics (identique à genererPDFDevis) ──
  pdfRect(doc, 15, y, 180, 8, _tplBg);
  pdfText(doc, 'PRESTATIONS', 18, y + 5.5, {bold:true, size:9, color:_tplTextOnBg});
  pdfText(doc, 'INCLUS', 195, y + 5.5, {bold:true, size:9, color:[255,255,255], align:'right'});
  y += 10;

  var diags = devis.diagnostics || [];
  diags.forEach(function(d, i) {
    if (i % 2 === 0) pdfRect(doc, 15, y - 1, 180, 8, [249, 250, 251]);
    var _qtyD = (devis.qte_manuels && parseInt(devis.qte_manuels[d]) > 1) ? parseInt(devis.qte_manuels[d]) : 1;
    var _labelD = '- ' + d + (_qtyD > 1 ? ' \xD7' + _qtyD : '');
    pdfText(doc, _labelD, 18, y + 5, {size:9, color:[30,30,30]});
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

  pdfRect(doc, 120, y, 75, isHT ? 30 : 38, _tplBg);
  if (isHT) {
    pdfText(doc, 'Total HT', 122, y + 9, {size:10, color:_tplSub});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {bold:true, size:10, color:[255,255,255], align:'right'});
    pdfText(doc, 'TVA non applicable — art. 293B CGI', 122, y+17, {size:9, color:_tplSub});
  } else {
    pdfText(doc, 'Total HT', 122, y + 9, {size:9, color:_tplSub});
    pdfText(doc, ht.toFixed(2) + ' €', 193, y + 9, {size:9, color:[200,230,210], align:'right'});
    pdfText(doc, 'TVA ' + (devis.taux_tva||20) + '%', 122, y+16, {size:9, color:_tplSub});
    pdfText(doc, tva_mt.toFixed(2) + ' €', 193, y+16, {size:9, color:[200,230,210], align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL TTC', 122, y + 27, {bold:true, size:11, color:_tplTextOnBg});
    pdfText(doc, ttc.toFixed(2) + ' €', 193, y + 27, {bold:true, size:12, color:[255,255,255], align:'right'});
  }
  if (isHT) {
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL', 122, y+27, {bold:true, size:11, color:_tplTextOnBg});
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
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true, size:9, color:_tplAccent});
  y += 6;
  pdfText(doc, p.conditions_paiement || 'Paiement à réception de facture', 15, y, {size:9, color:[80,80,80]});
  y += 5;
  if (p.rib_iban) pdfText(doc, 'IBAN : ' + p.rib_iban + (p.rib_bic ? '  |  BIC : ' + p.rib_bic : ''), 15, y, {size:8, color:[100,100,100]});

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 8;
    pdfText(doc, 'Certification', 15, y, {bold:true, size:9, color:_tplAccent});
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
function genererPDFDevisSpecial(devis, returnBlob, opts) {
  opts = opts || {};
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDF) { alert('jsPDF non chargé.'); return null; }
  var doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var p    = _pdfNormalizeProfile(getCompanyProfile());
  if (opts.compressedLogo) p = Object.assign({}, p, { logo: opts.compressedLogo });
  if (opts.skipLogo)       p = Object.assign({}, p, { logo: null });
  var y    = 15;
  var lots = devis.lots || [];

  // Diagnostics facturés une seule fois pour l'ensemble de la mission
  var FORFAITS_UNIQUES = ['ERP', 'Frais déplacement'];

  // ── En-tête ──
  _pdfRenderHeader(doc, p.pdf_template || 'standard', p, 'DEVIS SPECIAL',
    devis.numero || '',
    new Date(devis.date || Date.now()).toLocaleDateString('fr-FR'),
    'Valable 30 jours');
  y = 50;

  var _tplCfg      = PDF_TEMPLATES[p.pdf_template || 'standard'] || PDF_TEMPLATES.standard;
  var _tplBg       = _tplCfg.bg || [45,106,79];
  var _tplSub      = _tplCfg.sub || [200,230,210];
  var _tplAccent   = _tplCfg.fg || [45,106,79];
  var _tplDark     = _tplBg.map ? _tplBg.map(function(c){return Math.max(0,c-18);}) : [27,74,55];
  var _tplTextOnBg = [255,255,255];

  // ── Bloc client ──
  pdfRect(doc, 120, y, 75, 40, [245,247,250]);
  pdfText(doc, 'CLIENT', 122, y+6, {bold:true,size:9,color:[107,114,128]});
  var cyy = y + 13;
  if (devis.client_societe) { pdfText(doc, devis.client_societe, 122, cyy, {bold:true,size:10,color:[30,30,30]}); cyy += 7; }
  var clientName = ((devis.client_prenom||'')+' '+(devis.client_nom||'')).trim();
  if (clientName) { pdfText(doc, clientName, 122, cyy, {size:9,color:[60,60,60]}); cyy += 6; }
  if (devis.client_tel)   { pdfText(doc, devis.client_tel,   122, cyy, {size:8,color:[80,80,80]}); cyy += 5; }
  if (devis.client_email)   pdfText(doc, devis.client_email, 122, cyy, {size:8,color:[80,80,80]});

  // ── Objet mission ──
  var firstLot      = lots[0] || {};
  var typeBienLabel = (lots.length === 1 && firstLot.typeBien) ? firstLot.typeBien+'s' : 'biens immobiliers';
  var totalBiens    = lots.reduce(function(s,l){ return s + (Math.max(1, parseInt(l.quantite)||1)); }, 0);
  var firstAdresse  = (firstLot.adresse || firstLot.bien_adresse || '').trim();
  var objetLine     = 'Diagnostics immobiliers — ' + typeBienLabel;

  pdfText(doc, 'Objet de la mission :', 15, y+6, {bold:true,size:9,color:_tplAccent});
  pdfText(doc, objetLine, 15, y+13, {size:10,color:[30,30,30]});
  if (firstAdresse) pdfText(doc, firstAdresse, 15, y+21, {size:9,color:[80,80,80]});
  pdfText(doc, totalBiens+' bien'+(totalBiens>1?'s':'')+' au total'+(lots.length>1?' ('+lots.length+' lots)':''), 15, y+29, {bold:true,size:9,color:[30,30,30]});

  y += 46;
  y = pdfAddLine(doc, y);

  // ── Un bloc par lot ──
  lots.forEach(function(lot, i) {
    var diags        = lot.diagnostics || [];
    var tm           = lot.tarifs_manuels || {};
    var qte          = Math.max(1, parseInt(lot.quantite)||1);
    var diagsParBien = diags.filter(function(d){ return FORFAITS_UNIQUES.indexOf(d) === -1; });
    var diagsForfait = diags.filter(function(d){ return FORFAITS_UNIQUES.indexOf(d) !== -1; });

    // Calcul réel du lot (les prélèvements avec qty propre ne sont PAS multipliés par qte_lot)
    var _PREV_QTE = ['Prélèvement Amiante', 'Prélèvement Plomb'];
    var subParBien   = 0; var subPrelev = 0;
    diagsParBien.forEach(function(d) {
      var tv = parseFloat(tm[d]) || 0;
      if (_PREV_QTE.indexOf(d) >= 0) {
        var dq = Math.max(1, parseInt((lot.qte_manuels && lot.qte_manuels[d]) || 1));
        subPrelev += tv * dq;
      } else {
        subParBien += tv;
      }
    });
    var subForfait   = diagsForfait.reduce(function(s,d){ return s+(parseFloat(tm[d])||0); }, 0);
    var calcTotal    = subParBien * qte + subPrelev + subForfait;
    var remise       = parseFloat(lot.remise) || 0;
    var apresRemise  = Math.max(0, calcTotal - remise);
    var manuel       = parseFloat(lot.total_manuel_ht) || 0;
    var totalLot     = manuel > 0 ? manuel : apresRemise;  // TOUJOURS recalculer — lot.total_ht peut être obsolète

    var estimH = 30 + diagsParBien.length * 7 + (diagsForfait.length > 0 ? 12+diagsForfait.length*7 : 0) + 20;
    if (y + estimH > 270) { doc.addPage(); y = 15; }

    // Titre lot
    pdfRect(doc, 15, y, 180, 8, _tplBg);
    var lotTitle = 'LOT N°'+(i+1)+(lot.label ? ' — '+lot.label : '')+(lot.typeBien ? ' ('+lot.typeBien+')' : '');
    pdfText(doc, lotTitle, 18, y+5.5, {bold:true,size:9,color:_tplTextOnBg});
    y += 10;

    // Infos du lot
    var adresse = (lot.adresse || lot.bien_adresse || '').trim();
    if (adresse) { pdfText(doc, 'Adresse : '+adresse, 18, y+4, {size:9,color:[60,60,60]}); y += 7; }
    var infosParts = [];
    if (lot.typeBien) infosParts.push('Type : '+lot.typeBien);
    if (lot.surface)  infosParts.push('Surface : '+lot.surface+' m2');
    if (lot.periode)  infosParts.push('Construction : '+lot.periode);
    if (infosParts.length) { pdfText(doc, infosParts.join('  |  '), 18, y+4, {size:8,color:[80,80,80]}); y += 7; }

    // ── Diagnostics par bien ──
    if (diagsParBien.length > 0) {
      pdfText(doc, 'Diagnostics par bien (x'+qte+')', 18, y+4, {bold:true,size:8,color:_tplAccent}); y += 7;
      // En-tête colonnes
      pdfRect(doc, 15, y, 180, 7, [220,250,230]);
      pdfText(doc, 'Prestation',    18,  y+4.5, {bold:true,size:8,color:_tplAccent});
      pdfText(doc, 'Tarif / bien', 128,  y+4.5, {bold:true,size:8,color:_tplAccent,align:'right'});
      pdfText(doc, 'Qte',          155,  y+4.5, {bold:true,size:8,color:_tplAccent,align:'right'});
      pdfText(doc, 'Total',        193,  y+4.5, {bold:true,size:8,color:[45,106,79],align:'right'});
      y += 7;
      diagsParBien.forEach(function(d, di) {
        if (di % 2 === 0) pdfRect(doc, 15, y-1, 180, 7, [249,250,251]);
        var tv = parseFloat(tm[d]) || 0;
        var isPrelev = _PREV_QTE.indexOf(d) >= 0;
        var dq = isPrelev ? Math.max(1, parseInt((lot.qte_manuels && lot.qte_manuels[d]) || 1)) : qte;
        var lineQteLabel = isPrelev ? '\xD7'+dq : 'x'+qte;
        var lineTotal = (tv * dq).toFixed(2) + ' €';
        var lineLabel = '  ' + d + (isPrelev && dq > 1 ? ' \xD7' + dq : '');
        pdfText(doc, lineLabel,           18,  y+4, {size:8,color:[30,30,30]});
        pdfText(doc, tv.toFixed(2)+' €', 128, y+4, {size:8,color:[80,80,80],align:'right'});
        pdfText(doc, lineQteLabel,        155,  y+4, {size:8,color:[100,100,100],align:'right'});
        pdfText(doc, lineTotal,           193, y+4, {size:8,color:[45,106,79],align:'right'});
        y += 7;
      });
      // Ligne sous-total diags
      pdfText(doc, 'Sous-total ('+qte+' bien'+(qte>1?'s':'')+' x '+diagsParBien.length+' diag'+(diagsParBien.length>1?'s':'')+') :', 130, y+5, {size:8,color:[80,80,80],align:'right'});
      pdfText(doc, (subParBien*qte+subPrelev).toFixed(2)+' €', 193, y+5, {bold:true,size:8,color:[45,106,79],align:'right'});
      y += 8;
    }

    // ── Forfaits uniques ──
    if (diagsForfait.length > 0) {
      if (y + diagsForfait.length*7 + 14 > 270) { doc.addPage(); y = 15; }
      pdfRect(doc, 15, y, 180, 6, [255,247,230]);
      pdfText(doc, 'Prestations forfaitaires - comptees une seule fois :', 18, y+4, {bold:true,size:7.5,color:[146,64,14]});
      y += 6;
      diagsForfait.forEach(function(d, di) {
        if (di % 2 === 0) pdfRect(doc, 15, y-1, 180, 7, [255,251,235]);
        var tv = parseFloat(tm[d]) || 0;
        pdfText(doc, '  '+d, 18, y+4, {size:8,color:[30,30,30]});
        pdfText(doc, 'forfait', 155, y+4, {size:7.5,color:[146,64,14],align:'right'});
        pdfText(doc, tv.toFixed(2)+' €', 193, y+4, {size:8,color:[146,64,14],align:'right'});
        y += 7;
      });
    }

    // Remise sur le lot
    if (remise > 0) {
      pdfText(doc, 'Remise :', 140, y+5, {size:8,color:[220,50,50],align:'right'});
      pdfText(doc, '- '+remise.toFixed(2)+' €', 193, y+5, {size:8,color:[220,50,50],align:'right'});
      y += 7;
    }

    // Total / Prix convenu du lot
    pdfRect(doc, 100, y+1, 95, 8, [232,245,237]);
    var totalLabel = (manuel > 0) ? 'Prix convenu — Lot N°'+(i+1) : 'Total HT — Lot N°'+(i+1);
    pdfText(doc, totalLabel, 103, y+6, {size:8,color:_tplAccent});
    pdfText(doc, totalLot.toFixed(2)+' €', 193, y+6, {bold:true,size:9,color:[27,67,50],align:'right'});
    y += 13;
  });

  // ── Récapitulatif ──
  if (y + 55 > 270) { doc.addPage(); y = 15; }
  y = pdfAddLine(doc, y);
  y += 2;
  pdfRect(doc, 15, y, 180, 8, _tplBg);
  pdfText(doc, 'RECAPITULATIF', 18, y+5.5, {bold:true,size:9,color:_tplTextOnBg});
  y += 10;

  var grandTotal = 0;
  lots.forEach(function(lot, i) {
    var diags        = lot.diagnostics || [];
    var tm           = lot.tarifs_manuels || {};
    var qte          = Math.max(1, parseInt(lot.quantite)||1);
    var diagsParBien = diags.filter(function(d){ return FORFAITS_UNIQUES.indexOf(d) === -1; });
    var diagsForfait = diags.filter(function(d){ return FORFAITS_UNIQUES.indexOf(d) !== -1; });
    var subParBien   = diagsParBien.reduce(function(s,d){ return s+(parseFloat(tm[d])||0); }, 0);
    var subForfait   = diagsForfait.reduce(function(s,d){ return s+(parseFloat(tm[d])||0); }, 0);
    var calcTotal    = subParBien * qte + subForfait;
    var remise       = parseFloat(lot.remise) || 0;
    var apresRemise  = Math.max(0, calcTotal - remise);
    var manuel       = parseFloat(lot.total_manuel_ht) || 0;
    var totalLot     = manuel > 0 ? manuel : apresRemise;  // TOUJOURS recalculer
    grandTotal      += totalLot;

    if (i%2===0) pdfRect(doc, 15, y-1, 180, 8, [249,250,251]);
    var qteLabel = qte > 1 ? ' (x'+qte+')' : '';
    var recapLabel = (lot.label || ('Lot N°'+(i+1))) + (lot.typeBien ? ' — '+lot.typeBien : '') + qteLabel;
    pdfText(doc, '  '+recapLabel, 18, y+5, {size:9,color:[30,30,30]});
    pdfText(doc, totalLot.toFixed(2)+' €', 193, y+5, {size:9,color:[45,106,79],align:'right'});
    y += 8;
  });

  y += 2; y = pdfAddLine(doc, y); y += 3;

  // Total final — priorité : prix_final > total_ht > grandTotal calculé
  var isHT  = (devis.statut_fiscal||'HT') === 'HT';
  var taux  = parseFloat(devis.taux_tva||20)/100;
  var pfVal = parseFloat(devis.prix_final||0);
  var ht    = pfVal > 0 ? pfVal : grandTotal;  // TOUJOURS utiliser grandTotal recalculé
  var tvaMt = Math.round(ht*taux*100)/100;
  var ttc   = Math.round((ht+tvaMt)*100)/100;

  pdfRect(doc, 120, y, 75, isHT?30:38, _tplBg);
  if (isHT) {
    pdfText(doc, 'Total HT',                       122, y+9,  {size:10,color:_tplSub});
    pdfText(doc, ht.toFixed(2)+' €',               193, y+9,  {bold:true,size:10,color:[255,255,255],align:'right'});
    pdfText(doc, 'TVA non applicable — art.293B CGI', 122, y+17, {size:8,color:_tplSub});
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL',                          122, y+27, {bold:true,size:11,color:_tplTextOnBg});
    pdfText(doc, ht.toFixed(2)+' € HT',            193, y+27, {bold:true,size:12,color:[255,255,255],align:'right'});
  } else {
    pdfText(doc, 'Total HT',                       122, y+9,  {size:9,color:_tplSub});
    pdfText(doc, ht.toFixed(2)+' €',               193, y+9,  {size:9,color:[200,230,210],align:'right'});
    pdfText(doc, 'TVA '+(devis.taux_tva||20)+'%',  122, y+16, {size:9,color:_tplSub});
    pdfText(doc, tvaMt.toFixed(2)+' €',            193, y+16, {size:9,color:[200,230,210],align:'right'});
    pdfRect(doc, 120, y+20, 75, 10, _tplDark);
    pdfText(doc, 'TOTAL TTC',                      122, y+27, {bold:true,size:11,color:_tplTextOnBg});
    pdfText(doc, ttc.toFixed(2)+' €',              193, y+27, {bold:true,size:12,color:[255,255,255],align:'right'});
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

  // ── Conditions de paiement ──
  y += 4;
  pdfText(doc, 'Conditions de paiement', 15, y, {bold:true,size:9,color:_tplAccent}); y += 6;
  pdfText(doc, p.conditions_paiement||'Paiement à réception de facture', 15, y, {size:9,color:[80,80,80]}); y += 5;
  if (p.rib_iban) { pdfText(doc, 'IBAN : '+p.rib_iban+(p.rib_bic?' | BIC : '+p.rib_bic:''), 15, y, {size:8,color:[100,100,100]}); y += 5; }

  // ── Certification ──
  if (p.num_certif || p.organisme_certif) {
    y += 3;
    pdfText(doc, 'Certification', 15, y, {bold:true,size:9,color:_tplAccent}); y += 6;
    if (p.organisme_certif) { pdfText(doc, 'Certifié par : '+p.organisme_certif, 15, y, {size:9,color:[80,80,80]}); y += 5; }
    if (p.num_certif)       { pdfText(doc, 'N° certification : '+p.num_certif,   15, y, {size:9,color:[80,80,80]}); y += 5; }
    if (p.num_assurance)      pdfText(doc, 'Assurance RC Pro : '+p.num_assurance, 15, y, {size:9,color:[80,80,80]});
  }

  // ── Pied de page ──
  var footerY = 285;
  pdfRect(doc, 0, footerY-3, 210, 15, [245,247,250]);
  pdfText(doc, (p.nom_societe||'')+(p.adresse?' — '+p.adresse:'')+(p.siret?' — SIRET : '+p.siret:''), 15, footerY+2, {size:7,color:[150,150,150]});
  pdfText(doc, (p.telephone||'')+(p.email?' | '+p.email:''), 195, footerY+7, {size:7,color:[150,150,150],align:'right'});

  var filename = 'DevisSpecial_'+(devis.numero||'XXXX')+'_'+(devis.client_nom||'')+'.pdf';
  if (returnBlob) {
    var blob = doc.output('blob');
    return { blob: blob, filename: filename };
  }
  doc.save(filename);
  return null;
}
