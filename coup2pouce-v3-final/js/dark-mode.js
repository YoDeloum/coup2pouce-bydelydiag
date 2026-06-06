// ─────────────────────────────────────────────
// DARK-MODE.JS — Mode sombre persistant
// ─────────────────────────────────────────────

function toggleDark() {
  var isDark = document.body.classList.toggle('dark');
  localStorage.setItem('dd_dark', isDark ? '1' : '0');
}

function initDark() {
  if (localStorage.getItem('dd_dark') === '1') {
    document.body.classList.add('dark');
  }
}
