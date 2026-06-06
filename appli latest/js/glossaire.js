// ─────────────────────────────────────────────
// GLOSSAIRE.JS — Écran glossaire avec recherche
// ─────────────────────────────────────────────

function openGlossaire() {
  document.getElementById('glossaire-screen').classList.add('open');
  renderGlossaire(GLOSSAIRE);
}

function closeGlossaire() {
  document.getElementById('glossaire-screen').classList.remove('open');
}

function renderGlossaire(items) {
  var list = document.getElementById('glossaire-list');
  list.innerHTML = items.map(function(g) {
    return '<div class="glossaire-item">'
      + '<div class="glossaire-term">' + g.t + '</div>'
      + '<div class="glossaire-def">' + g.d + '</div>'
      + '</div>';
  }).join('');
}

function filterGlossaire(q) {
  var filtered = q.trim() === '' ? GLOSSAIRE
    : GLOSSAIRE.filter(function(g) {
        return g.t.toLowerCase().includes(q.toLowerCase())
            || g.d.toLowerCase().includes(q.toLowerCase());
      });
  renderGlossaire(filtered);
}
