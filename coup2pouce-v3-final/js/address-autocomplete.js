// ─────────────────────────────────────────────
// ADDRESS-AUTOCOMPLETE.JS
// Saisie assistée via API Adresse data.gouv.fr
// Fonctionne sur : #dv-bien_adresse, #m-adresse, #p-adresse
// Isolé — ne modifie aucun autre module
// ─────────────────────────────────────────────

(function() {
  var _timer    = null;
  var _dropdown = null;
  var _active   = null;

  var WATCHED_IDS = ['dv-bien_adresse', 'm-adresse', 'p-adresse'];

  // ── Crée ou réutilise le dropdown ──────────────────────────────
  function getDropdown() {
    if (!_dropdown) {
      _dropdown = document.createElement('div');
      _dropdown.id = 'addr-dropdown';
      _dropdown.style.cssText = [
        'position:absolute', 'z-index:9000', 'background:#fff',
        'border:1.5px solid #E2E5F0', 'border-radius:10px',
        'box-shadow:0 8px 24px rgba(0,0,0,.12)',
        'max-height:220px', 'overflow-y:auto',
        'font-family:inherit', 'font-size:13px'
      ].join(';');
      document.body.appendChild(_dropdown);
    }
    return _dropdown;
  }

  function hideDropdown() {
    if (_dropdown) _dropdown.style.display = 'none';
  }

  // ── Positionne le dropdown sous l'input ───────────────────────
  function positionDropdown(input) {
    var rect = input.getBoundingClientRect();
    var d = getDropdown();
    d.style.top    = (rect.bottom + window.scrollY + 4) + 'px';
    d.style.left   = (rect.left + window.scrollX) + 'px';
    d.style.width  = rect.width + 'px';
    d.style.display = 'block';
  }

  // ── Appel API ─────────────────────────────────────────────────
  function fetchSuggestions(query, input) {
    if (!query || query.length < 4) { hideDropdown(); return; }
    fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(query) + '&limit=6&autocomplete=1')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.features || data.features.length === 0) { hideDropdown(); return; }
        showDropdown(data.features, input);
      })
      .catch(function() { hideDropdown(); }); // échec silencieux
  }

  // ── Affiche les suggestions ───────────────────────────────────
  function showDropdown(features, input) {
    var d = getDropdown();
    d.innerHTML = '';
    features.forEach(function(f) {
      var props = f.properties;
      var label = props.label || '';
      var item  = document.createElement('div');
      item.style.cssText = 'padding:10px 14px;cursor:pointer;border-bottom:1px solid #F0F2F8;color:#1a1a1a;line-height:1.3';
      item.innerHTML = '<span style="font-weight:600">' + (props.name || '') + '</span>'
        + ' <span style="color:#6B7280;font-size:12px">' + (props.postcode || '') + ' ' + (props.city || '') + '</span>';
      item.addEventListener('mousedown', function(e) {
        e.preventDefault(); // empêche le blur de l'input
        input.value = label;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        // Tente de remplir les champs ville/code postal proches si présents
        _fillRelatedFields(props, input.id);
        hideDropdown();
      });
      item.addEventListener('mouseover', function() { item.style.background = '#F0FDF4'; });
      item.addEventListener('mouseout',  function() { item.style.background = '#fff'; });
      d.appendChild(item);
    });
    positionDropdown(input);
  }

  // ── Remplit les champs voisins si disponibles ──────────────────
  function _fillRelatedFields(props, inputId) {
    var mappings = {
      'dv-bien_adresse': { cp: null, ville: null },
      'm-adresse':       { cp: null, ville: null },
      'p-adresse':       { cp: 'p-code_postal', ville: 'p-ville' }
    };
    var map = mappings[inputId];
    if (!map) return;
    if (map.cp && props.postcode) {
      var cpEl = document.getElementById(map.cp);
      if (cpEl) cpEl.value = props.postcode;
    }
    if (map.ville && props.city) {
      var villeEl = document.getElementById(map.ville);
      if (villeEl) villeEl.value = props.city;
    }
  }

  // ── Écoute les inputs via délégation ──────────────────────────
  document.addEventListener('input', function(e) {
    var id = e.target && e.target.id;
    if (!id || WATCHED_IDS.indexOf(id) === -1) return;
    _active = e.target;
    clearTimeout(_timer);
    var q = e.target.value.trim();
    if (q.length < 4) { hideDropdown(); return; }
    _timer = setTimeout(function() { fetchSuggestions(q, e.target); }, 320);
  });

  // ── Ferme si clic ailleurs ────────────────────────────────────
  document.addEventListener('click', function(e) {
    if (_dropdown && !_dropdown.contains(e.target) && e.target !== _active) {
      hideDropdown();
    }
  });

  // ── Repositionne au scroll / resize ──────────────────────────
  window.addEventListener('scroll', function() {
    if (_active && _dropdown && _dropdown.style.display !== 'none') {
      positionDropdown(_active);
    }
  }, true);

})();
