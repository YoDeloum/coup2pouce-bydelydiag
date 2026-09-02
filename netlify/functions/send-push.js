// send-push.js — Envoi notification push Web Push (VAPID)
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Lire l'abonnement push depuis Firestore (stocké par l'app admin)
    const FS_KEY = 'AIzaSy' + 'ATgMy3v5Uj7xdSoql7xoNgrUmtqERm5G4';
    const FS_URL = 'https://firestore.googleapis.com/v1/projects/coup2pouce-by-delydiag/databases/(default)/documents/push_subscriptions/admin?key=' + FS_KEY;

    const fsRes = await fetch(FS_URL);
    const fsData = await fsRes.json();

    if (!fsData.fields || !fsData.fields.value) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Aucun abonnement push enregistré' }) };
    }

    const subscription = JSON.parse(fsData.fields.value.stringValue);

    const payload = JSON.stringify({
      title: body.title || '✍️ Coup 2 Pouce',
      body:  body.body  || 'Nouvelle notification',
      icon:  '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      tag:   'coup2pouce-devis'
    });

    await webpush.sendNotification(subscription, payload);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('send-push error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
