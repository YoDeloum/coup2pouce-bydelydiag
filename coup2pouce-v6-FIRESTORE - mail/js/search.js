// ─────────────────────────────────────────────
// SEARCH.JS — Recherche globale dans les modules
// ─────────────────────────────────────────────

function searchGlobal(q) {
  var query         = q.trim().toLowerCase();
  var resultsScreen = document.getElementById('search-results');
  var resultsList   = document.getElementById('search-results-list');
  var bar2          = document.getElementById('search-bar-results');

  if (!query || query.length < 2) {
    resultsScreen.classList.remove('open');
    return;
  }

  resultsScreen.classList.add('open');
  if (bar2 && bar2.value !== q) bar2.value = q;

  var results = [];

  Object.entries(DATA).forEach(function([key, mod]) {
    if (!mod.cours) return;
    mod.cours.forEach(function(chapitre, ci) {
      // Recherche dans le titre
      if (chapitre.titre && chapitre.titre.toLowerCase().includes(query)) {
        results.push({module:mod.label||key, icon:mod.icon||'📚', color:mod.color||'#2D6A4F',
          title:chapitre.titre, excerpt:'Chapitre '+(ci+1), key, ci});
        return;
      }
      // Recherche dans le contenu
      if (chapitre.contenu) {
        chapitre.contenu.forEach(function(block) {
          if (block.text && block.text.toLowerCase().includes(query)) {
            var excerpt = block.text.length > 80 ? block.text.substring(0,80)+'...' : block.text;
            results.push({module:mod.label||key, icon:mod.icon||'📚', color:mod.color||'#2D6A4F',
              title:chapitre.titre, excerpt, key, ci});
          }
        });
      }
    });
    // Recherche dans les fiches
    if (mod.fiches) {
      mod.fiches.forEach(function(f) {
        if ((f.t+' '+f.c).toLowerCase().includes(query)) {
          results.push({module:mod.label||key, icon:mod.icon||'📚', color:mod.color||'#2D6A4F',
            title:'📋 Fiche : '+f.t, excerpt:f.c, key, ci:-1});
        }
      });
    }
  });

  // Dédoublonnage par titre
  var seen   = new Set();
  var unique = results.filter(function(r) {
    var k = r.key + r.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 30);

  if (unique.length === 0) {
    resultsList.innerHTML = '<div style="text-align:center;padding:40px;color:#6B7280">Aucun résultat pour "' + q + '"</div>';
  } else {
    resultsList.innerHTML = unique.map(function(r) {
      return '<div class="search-result-item" onclick="goToResult(\'' + r.key + '\', ' + r.ci + ')">'
        + '<div class="search-result-module" style="color:' + r.color + '">' + r.icon + ' ' + r.module + '</div>'
        + '<div class="search-result-title">' + r.title + '</div>'
        + '<div class="search-result-excerpt">' + r.excerpt + '</div>'
        + '</div>';
    }).join('');
  }
}

function goToResult(key, chapIdx) {
  closeSearch();
  curKey   = key;
  curCours = chapIdx >= 0 ? chapIdx : 0;
  curTab   = chapIdx >= 0 ? 'cours' : 'fiches';
  openModule(key);
  if (chapIdx < 0) showTab('fiches');
}

function closeSearch() {
  document.getElementById('search-results').classList.remove('open');
  var bar = document.getElementById('search-bar');
  if (bar) bar.value = '';
}
