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

// Email signup: subscribe without leaving the page.
// The form still posts to Buttondown normally, but into a hidden frame, then shows a success message here.
// If this script doesn't run, the form falls back to opening Buttondown's own page.
(function () {
  var forms = document.querySelectorAll('.signup-form');
  forms.forEach(function (form, i) {
    var frame = document.createElement('iframe');
    frame.name = 'signup-frame-' + i;
    frame.title = 'Newsletter signup';
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);
    form.target = frame.name;

    form.addEventListener('submit', function () {
      if (!form.checkValidity()) return;
      var button = form.querySelector('button');
      var email = form.querySelector('input[type="email"]').value;
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        var box = document.createElement('div');
        box.className = 'signup-success';
        box.setAttribute('role', 'status');
        box.innerHTML =
          '<p class="signup-success-title">You’re subscribed! ✓</p>' +
          '<p>Check your inbox at <strong></strong> for a confirmation email from VenturePanda. If it’s not there, look in your spam folder.</p>' +
          '<p class="signup-success-small">Nothing arrived after a few minutes? <a href="https://buttondown.com/venturepanda" target="_blank" rel="noopener">Subscribe here instead</a>.</p>';
        box.querySelector('strong').textContent = email;
        form.replaceWith(box);
        if (window.goatcounter && window.goatcounter.count) {
          window.goatcounter.count({ path: 'newsletter-signup', title: 'Newsletter signup', event: true });
        }
      }
      if (button) { button.disabled = true; button.textContent = 'Subscribing…'; }
      frame.addEventListener('load', finish, { once: true });
      setTimeout(finish, 6000);
    });
  });
})();
