(function () {
  'use strict';

  function isTouchDevice() {
    return window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('.imm-menu-drop > a');
    if (!link || !isTouchDevice()) return;

    var drop = link.parentElement;
    var panel = drop.querySelector('.imm-menu-panel');
    if (!panel) return;

    event.preventDefault();

    document.querySelectorAll('.imm-menu-drop.is-open').forEach(function (item) {
      if (item !== drop) item.classList.remove('is-open');
    });

    drop.classList.toggle('is-open');
  });

  document.addEventListener('click', function (event) {
    if (event.target.closest('.imm-menu-drop')) return;

    document.querySelectorAll('.imm-menu-drop.is-open').forEach(function (item) {
      item.classList.remove('is-open');
    });
  });
})();
