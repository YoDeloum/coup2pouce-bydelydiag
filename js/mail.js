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
 * Mail d'envoi de facture — via Netlify Function + Resend (PDF en pièce jointe)
 */
function envoyerMailFacture(facture) {
  if (!facture) { alert('Facture introuvable.'); return; }
  if (!facture.client_email) {
    alert('Renseigne d\'abord l\'email du client dans la facture avant d\'envoyer.');
    return;
  }

  var btn = document.querySelector('[onclick*="envoyerMailFacture"]');
  if (btn) { btn.textContent = '⏳ Préparation...'; btn.disabled = true; }

  var p       = typeof getCompanyProfile === 'function' ? getCompanyProfile() : {};
  var societe = p.nom_societe || 'DELY DIAG';
  var htBase  = facture.prix_final && facture.prix_final > 0 ? parseFloat(facture.prix_final) : parseFloat(facture.total_ht || 0);
  var taux    = (facture.taux_tva || 20) / 100;
  var montant = facture.statut_fiscal === 'TTC'
    ? (htBase * (1 + taux)).toFixed(2) + ' € TTC'
    : htBase.toFixed(2) + ' € HT';

  var subject = 'Facture N°' + (facture.numero_facture || '') + ' — ' + societe;

  // 1. Générer PDF facture en blob
  var pdfResult = (typeof genererPDFFacture === 'function') ? genererPDFFacture(facture, true, { skipLogo: true }) : null;
  if (!pdfResult || !pdfResult.blob) {
    if (btn) { btn.textContent = '✉️ Envoyer par mail'; btn.disabled = false; }
    alert('Erreur lors de la génération du PDF facture.');
    return;
  }

  // 2. Convertir blob en base64
  var reader = new FileReader();
  reader.onload = function(e) {
    var b64 = e.target.result.split(',')[1];
    var attachments = [{ filename: pdfResult.filename, content: b64 }];

    // 3. Construire HTML email
    var isPaye = (facture.statut === 'Payé');
    var html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#1B4332;padding:24px 32px;border-radius:8px 8px 0 0">'
      + '<h1 style="color:#fff;margin:0;font-size:20px">' + societe + '</h1>'
      + (p.telephone ? '<p style="color:#A7F3D0;margin:4px 0;font-size:13px">' + p.telephone + '</p>' : '')
      + (p.email ? '<p style="color:#A7F3D0;margin:4px 0;font-size:13px">' + p.email + '</p>' : '')
      + '</div>'
      + '<div style="background:#F9FAFB;padding:28px 32px;border:1px solid #E5E7EB;border-top:none">'
      + '<p style="font-size:15px;color:#111827">Bonjour ' + (facture.client_prenom || '') + ',</p>'
      + '<p style="color:#374151">Veuillez trouver ci-joint votre facture suite à la réalisation '
      + 'des diagnostics immobiliers au <strong>' + (facture.bien_adresse || '') + '</strong>.</p>'
      + '<div style="background:#fff;border:2px solid ' + (isPaye ? '#6EE7B7' : '#E5E7EB') + ';border-radius:8px;padding:16px 20px;margin:20px 0">'
      + '<p style="margin:0 0 6px;font-size:13px;color:#6B7280">N° Facture</p>'
      + '<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1B4332">' + (facture.numero_facture || '') + '</p>'
      + '<p style="margin:0 0 4px;font-size:13px;color:#6B7280">Montant</p>'
      + '<p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#1B4332">' + montant + '</p>'
      + (isPaye
        ? '<p style="margin:0;padding:8px 12px;background:#D1FAE5;border-radius:6px;color:#065F46;font-weight:700;font-size:14px">✅ PAYÉE'
          + (facture.date_paiement ? ' le ' + new Date(facture.date_paiement).toLocaleDateString('fr-FR') : '')
          + (facture.mode_paiement ? ' — ' + facture.mode_paiement : '')
          + '</p>'
        : '<p style="margin:0;font-size:13px;color:#374151">Conditions : <strong>' + (p.conditions_paiement || 'Paiement à réception') + '</strong></p>')
      + '</div>'
      + ((!isPaye && p.rib_iban) ? '<p style="font-size:13px;color:#374151"><strong>IBAN :</strong> ' + p.rib_iban + '</p>' : '')
      + ((!isPaye && p.lien_paiement)
        ? '<a href="' + p.lien_paiement + '" style="display:inline-block;padding:12px 24px;background:#1B4332;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">💳 Payer en ligne</a>'
        : '')
      + '<p style="color:#374151;margin-top:24px">Cordialement,<br><strong>' + (p.nom_responsable || societe) + '</strong></p>'
      + '</div>'
      + '<div style="padding:12px 32px;font-size:11px;color:#9ca3af;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;background:#fff">'
      + societe + (p.adresse ? ' — ' + p.adresse : '') + (p.siret ? ' — SIRET : ' + p.siret : '')
      + '</div>'
      + '</div>';

    if (btn) btn.textContent = '⏳ Envoi en cours...';

    // 4. Appel Netlify Function send-email
    fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:          facture.client_email,
        subject:     subject,
        html:        html,
        attachments: attachments,
        fromName:    p.nom_societe  || 'Coup 2 Pouce',
        fromEmail:   'noreply@coup2pouce-pro.fr',
        replyTo:     p.email || ''
      })
    })
    .then(function(res) {
      var status = res.status;
      return res.text().then(function(text) {
        if (!text || !text.trim()) throw new Error('Réponse vide (HTTP ' + status + ')');
        try { return JSON.parse(text); } catch(ex) { throw new Error('HTTP ' + status + ' — ' + text.substring(0, 200)); }
      });
    })
    .then(function(data) {
      if (btn) { btn.textContent = '✉️ Envoyer par mail'; btn.disabled = false; }
      if (data && data.success) {
        alert('✅ Facture envoyée à ' + facture.client_email + ' avec le PDF en pièce jointe !');
      } else {
        var msg = (data && data.error) ? data.error : JSON.stringify(data);
        alert('⚠️ Erreur envoi : ' + msg);
      }
    })
    .catch(function(err) {
      if (btn) { btn.textContent = '✉️ Envoyer par mail'; btn.disabled = false; }
      alert('❌ Erreur réseau : ' + err.message);
    });
  };
  reader.readAsDataURL(pdfResult.blob);
}

// Utilitaire : date d'expiration devis (30 jours)
function getDevisExpiry(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('fr-FR');
}
