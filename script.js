/* ===== NEXUSSTORE MAIN SCRIPT ===== */

(function () {
  'use strict';

  /* ---- Detect mobile / low-power ---- */
  var isMobile = window.innerWidth < 768;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  var isLowPower = isMobile || prefersReducedMotion || prefersReducedData;

  /* ---- Loading Screen ---- */
  var loadingScreen = document.getElementById('loading-screen');

  function hideLoading() {
    if (!loadingScreen) return;
    loadingScreen.classList.add('hidden');
    setTimeout(function () {
      loadingScreen.style.display = 'none';
    }, 500);
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoading, 400);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hideLoading, 400);
    }, { once: true });
  }

  /* ---- Scroll Progress Bar (throttled with rAF) ---- */
  var progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    var updateProgress = function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    };

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---- Navbar Scroll Effect ---- */
  var navbar = document.getElementById('navbar');
  if (navbar) {
    var navTicking = false;
    window.addEventListener('scroll', function () {
      if (!navTicking) {
        requestAnimationFrame(function () {
          navbar.classList.toggle('scrolled', window.scrollY > 50);
          navTicking = false;
        });
        navTicking = true;
      }
    }, { passive: true });
  }

  /* ---- Mobile Hamburger Menu ---- */
  var hamburger = document.querySelector('.hamburger');
  var navLinks = document.querySelector('.nav-links');
  var menuOverlay = document.querySelector('.menu-overlay');

  if (hamburger && navLinks) {
    function toggleMenu(open) {
      var isOpen = open !== undefined ? open : !hamburger.classList.contains('active');
      hamburger.classList.toggle('active', isOpen);
      navLinks.classList.toggle('open', isOpen);
      if (menuOverlay) menuOverlay.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    }, { passive: true });

    if (menuOverlay) {
      menuOverlay.addEventListener('click', function () { toggleMenu(false); }, { passive: true });
    }

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hamburger.classList.contains('active')) {
        toggleMenu(false);
      }
    });
  }

  /* ---- Button Ripple Effect (optimized) ---- */
  document.querySelectorAll('.btn-glow, .btn-outline').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (isMobile || prefersReducedMotion) return;
      if (e.clientX === 0 && e.clientY === 0) return;

      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    }, { passive: true });
  });

  /* ---- Particles (Canvas) - optimized for performance ---- */
  var particlesCanvas = document.getElementById('particles-canvas');
  var particleCtx, particleAnimationId;

  if (particlesCanvas && !isLowPower) {
    particleCtx = particlesCanvas.getContext('2d');
    var particles = [];
    var particleCount = isMobile ? 25 : 50;
    var particleSpeed = isMobile ? 0.3 : 0.5;
    var connectionDist = isMobile ? 80 : 120;

    function resizeParticlesCanvas() {
      particlesCanvas.width = window.innerWidth;
      particlesCanvas.height = window.innerHeight;
    }

    function initParticles() {
      resizeParticlesCanvas();
      particles = [];
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * particlesCanvas.width,
          y: Math.random() * particlesCanvas.height,
          vx: (Math.random() - 0.5) * particleSpeed,
          vy: (Math.random() - 0.5) * particleSpeed,
          r: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    }

    function drawParticles() {
      if (!particleCtx) return;

      // Use partial clear for performance on modern browsers
      particleCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

      var len = particles.length;

      // Draw particles
      for (var i = 0; i < len; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = particlesCanvas.width;
        if (p.x > particlesCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particlesCanvas.height;
        if (p.y > particlesCanvas.height) p.y = 0;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(0, 200, 255, ' + p.alpha + ')';
        particleCtx.fill();

        // Draw connections (batch to reduce draw calls)
        for (var j = i + 1; j < len; j++) {
          var p2 = particles[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = dx * dx + dy * dy;
          if (dist < connectionDist * connectionDist) {
            particleCtx.beginPath();
            particleCtx.moveTo(p.x, p.y);
            particleCtx.lineTo(p2.x, p2.y);
            particleCtx.strokeStyle = 'rgba(0, 200, 255, ' + (1 - Math.sqrt(dist) / connectionDist) * 0.12 + ')';
            particleCtx.lineWidth = 0.5;
            particleCtx.stroke();
          }
        }
      }

      particleAnimationId = requestAnimationFrame(drawParticles);
    }

    // Throttled resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeParticlesCanvas();
      }, 300);
    }, { passive: true });

    initParticles();
    drawParticles();
  } else if (particlesCanvas) {
    particlesCanvas.style.display = 'none';
  }

  /* ---- Mouse Trail (Desktop only, high-end only) ---- */
  var trailCanvas = document.getElementById('mouse-trail-canvas');
  var trailCtx, trailAnimationId;

  if (trailCanvas && !isMobile && !prefersReducedMotion && !prefersReducedData) {
    trailCtx = trailCanvas.getContext('2d');
    var trailDots = [];
    var trailMaxDots = 15;

    function resizeTrailCanvas() {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    }
    resizeTrailCanvas();

    window.addEventListener('resize', function () { resizeTrailCanvas(); }, { passive: true });

    document.addEventListener('mousemove', function (e) {
      trailDots.push({ x: e.clientX, y: e.clientY, alpha: 1 });
      if (trailDots.length > trailMaxDots) trailDots.shift();
    }, { passive: true });

    function drawTrail() {
      if (!trailCtx) return;
      trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

      for (var i = 0; i < trailDots.length; i++) {
        var dot = trailDots[i];
        dot.alpha -= 0.04;
        if (dot.alpha <= 0) continue;

        trailCtx.beginPath();
        trailCtx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        trailCtx.fillStyle = 'rgba(0, 200, 255, ' + dot.alpha * 0.4 + ')';
        trailCtx.fill();
      }

      trailDots = trailDots.filter(function (d) { return d.alpha > 0; });
      trailAnimationId = requestAnimationFrame(drawTrail);
    }

    drawTrail();
  } else if (trailCanvas) {
    trailCanvas.style.display = 'none';
  }

  /* ---- AOS (Animate on Scroll) - optimized ---- */
  var aosElements = document.querySelectorAll('[data-aos]');
  if (aosElements.length > 0 && !prefersReducedMotion) {
    var aosObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          aosObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // Batch observe
    for (var i = 0; i < aosElements.length; i++) {
      aosObserver.observe(aosElements[i]);
    }
  } else if (prefersReducedMotion) {
    // Immediately show all AOS elements
    for (var k = 0; k < aosElements.length; k++) {
      aosElements[k].classList.add('aos-animate');
    }
  }

  /* ---- Console log (removed in production / only once) ---- */
  function logInit() {
    console.log('%c⚡ NexusStore %cInitialized', 'color:#00c8ff;font-weight:bold;font-size:14px;font-family:Orbitron,sans-serif;', 'color:#9b59b6;font-size:12px;');
  }
  logInit();

})();
