/* ===== AUTH PAGE SCRIPT ===== */

(function () {
  'use strict';

  var isMobile = window.innerWidth < 768;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Tab Switching ---- */
  var tabs = document.querySelectorAll('.auth-tab');
  var loginForm = document.getElementById('login-form');
  var registerForm = document.getElementById('register-form');

  if (tabs.length > 0) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var target = tab.getAttribute('data-tab');
        if (target === 'register') {
          if (loginForm) loginForm.style.display = 'none';
          if (registerForm) registerForm.style.display = 'block';
        } else {
          if (registerForm) registerForm.style.display = 'none';
          if (loginForm) loginForm.style.display = 'block';
        }
      }, { passive: true });
    });
  }

  /* ---- Password Toggle (event delegation) ---- */
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.password-toggle');
    if (!toggle) return;
    var input = toggle.parentElement.querySelector('input');
    if (!input) return;
    var type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    toggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
  });

  /* ---- Password Strength (throttled) ---- */
  var passwordInput = document.querySelector('#reg-password');
  var strengthBars = document.querySelectorAll('.strength-bar span');
  var strengthText = document.querySelector('.strength-text');

  if (passwordInput && strengthBars.length > 0) {
    var strengthTimer;
    passwordInput.addEventListener('input', function () {
      clearTimeout(strengthTimer);
      strengthTimer = setTimeout(function () {
        var val = passwordInput.value;
        var score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        var levels = ['', 'Weak', 'Fair', 'Medium', 'Strong', 'Very Strong'];
        var classes = ['', 'weak', 'weak', 'medium', 'strong', 'strong'];

        strengthBars.forEach(function (bar, i) {
          bar.className = '';
          if (i < score) bar.classList.add('active', classes[score] || 'weak');
        });

        if (strengthText) {
          strengthText.textContent = val.length > 0 ? levels[score] || '' : '';
          strengthText.style.color = score >= 4 ? '#2ecc71' : score >= 2 ? '#ffd700' : '#ff4444';
        }
      }, 100);
    }, { passive: true });
  }

  /* ---- Form Validation ---- */
  document.querySelectorAll('.auth-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hasError = false;

      form.querySelectorAll('input[required]').forEach(function (input) {
        var errorEl = input.parentElement.querySelector('.error-text');
        if (!input.value.trim()) {
          input.classList.add('input-error');
          if (errorEl) errorEl.textContent = 'This field is required';
          hasError = true;
        } else {
          input.classList.remove('input-error');
          if (errorEl) errorEl.textContent = '';
        }

        if (input.getAttribute('type') === 'email' && input.value.trim()) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
            input.classList.add('input-error');
            if (errorEl) errorEl.textContent = 'Invalid email address';
            hasError = true;
          }
        }
      });

      if (!hasError) {
        var formContent = form.querySelector('.auth-form-content');
        var success = form.querySelector('.auth-success');
        if (formContent) formContent.style.display = 'none';
        if (success) success.classList.add('show');
      }
    }, { passive: false });
  });

  /* ---- Clear errors on input (event delegation) ---- */
  document.addEventListener('input', function (e) {
    var input = e.target.closest('.auth-form input');
    if (!input) return;
    input.classList.remove('input-error');
    var errorEl = input.parentElement.querySelector('.error-text');
    if (errorEl) errorEl.textContent = '';
  }, { passive: true });

  /* ---- Social Buttons ---- */
  document.querySelectorAll('.social-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var provider = this.getAttribute('data-provider') || 'unknown';
      this.innerHTML = '⏳ <span>Connecting...</span>';
      setTimeout(function () {
        btn.innerHTML = '✓ <span>Connected</span>';
        btn.style.borderColor = '#2ecc71';
        btn.style.color = '#2ecc71';
      }, 1500);
    }, { passive: true });
  });

  /* ---- Background Cubes (reduced on mobile) ---- */
  if (isMobile || prefersReducedMotion) {
    document.querySelectorAll('.auth-cube, .auth-glow-orb, .auth-float-icon').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  console.log('%c🔐 Auth UI %cReady', 'color:#00c8ff;font-weight:bold;font-size:12px;font-family:Orbitron,sans-serif;', 'color:#9b59b6;font-size:11px;');
})();
