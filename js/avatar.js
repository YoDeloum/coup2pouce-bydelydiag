// ─────────────────────────────────────────────
// AVATAR.JS — Sélecteur d'avatar et couleur
// ─────────────────────────────────────────────

var AVATARS = ['😊','😎','🧑‍🔧','👷','🧰','🏠','🔬','⚡','🔥','🪲','📐','🎯','💪','🦾','🧑‍💼','👨‍🔬','🏆','⭐','🚀','🎓'];
var AVATAR_COLORS = ['#2D6A4F','#E8650A','#0891B2','#6366F1','#E85D04','#1B4332','#0E7490','#7C3AED','#374151','#B45309'];

function initAvatar() {
  updateAvatarDisplay();
}

function updateAvatarDisplay() {
  var display = document.getElementById('avatar-display');
  if (display) {
    display.style.background = 'linear-gradient(135deg, ' + selectedAvatarColor + ', ' + selectedAvatarColor + '99)';
    display.textContent = selectedAvatar;
  }
}

function openAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('hidden');
  var grid = document.getElementById('avatar-grid');
  if (grid) {
    grid.innerHTML = AVATARS.map(function(a) {
      return '<div class="avatar-option ' + (a === selectedAvatar ? 'selected' : '') + '" onclick="selectAvatar(\'' + a + '\')">' + a + '</div>';
    }).join('');
  }
  var colors = document.getElementById('avatar-colors');
  if (colors) {
    colors.innerHTML = AVATAR_COLORS.map(function(c) {
      var isSelected = c === selectedAvatarColor;
      return '<div onclick="selectAvatarColor(\'' + c + '\')" style="width:32px;height:32px;border-radius:50%;background:' + c + ';cursor:pointer;border:3px solid ' + (isSelected ? '#1B4332' : 'transparent') + ';transition:transform .15s;' + (isSelected ? 'transform:scale(1.2)' : '') + '"></div>';
    }).join('');
  }
  var preview = document.getElementById('avatar-preview-big');
  if (preview) {
    preview.textContent = selectedAvatar;
    preview.style.background = 'linear-gradient(135deg, ' + selectedAvatarColor + ', ' + selectedAvatarColor + '99)';
  }
}

function selectAvatar(emoji) {
  selectedAvatar = emoji;
  document.querySelectorAll('.avatar-option').forEach(function(el) {
    el.classList.toggle('selected', el.textContent.trim() === emoji);
  });
  var preview = document.getElementById('avatar-preview-big');
  if (preview) preview.textContent = emoji;
}

function selectAvatarColor(color) {
  selectedAvatarColor = color;
  document.querySelectorAll('#avatar-colors div').forEach(function(el, i) {
    var c = AVATAR_COLORS[i];
    el.style.border = '3px solid ' + (c === color ? '#1B4332' : 'transparent');
    el.style.transform = c === color ? 'scale(1.2)' : 'scale(1)';
  });
  var preview = document.getElementById('avatar-preview-big');
  if (preview) preview.style.background = 'linear-gradient(135deg, ' + color + ', ' + color + '99)';
  var display = document.getElementById('avatar-display');
  if (display) display.style.background = 'linear-gradient(135deg, ' + color + ', ' + color + '99)';
}

function saveAvatar() {
  localStorage.setItem('dd_avatar', selectedAvatar);
  localStorage.setItem('dd_avatar_color', selectedAvatarColor);
  updateAvatarDisplay();
  document.getElementById('avatar-modal').classList.add('hidden');
}
