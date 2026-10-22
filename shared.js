// Phone menu: opens and closes the navigation links on small screens.
(function () {
  var nav = document.querySelector('nav');
  var button = document.querySelector('.nav-toggle');
  if (!nav || !button) return;

  function setOpen(open) {
    nav.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  button.addEventListener('click', function () {
    setOpen(!nav.classList.contains('nav-open'));
  });

  // Close when a link is chosen, when Escape is pressed, or when tapping outside the menu.
  nav.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });
})();
