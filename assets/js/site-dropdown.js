(function () {
  'use strict';

  function closeMenus(except) {
    document.querySelectorAll('.imm-menu-drop.is-open').forEach(function (item) {
      if (item !== except) item.classList.remove('is-open');
    });
  }

  function toggleMenu(link) {
    var drop = link.closest('.imm-menu-drop');
    if (!drop) return;

    var panel = drop.querySelector('.imm-menu-panel');
    if (!panel) return;

    var wasOpen = drop.classList.contains('is-open');

    closeMenus(drop);
    drop.classList.toggle('is-open', !wasOpen);
  }

  document.addEventListener('pointerup', function (event) {
    var link = event.target.closest('.imm-menu-drop > a');
    if (!link) return;

    event.preventDefault();
    event.stopPropagation();
    toggleMenu(link);
  }, false);

  document.addEventListener('click', function (event) {
    if (event.target.closest('.imm-menu-drop')) return;
    closeMenus(null);
  }, false);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenus(null);
  }, false);
})();
