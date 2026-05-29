/* ===== DASHBOARD SCRIPT ===== */

(function () {
  'use strict';

  var isMobile = window.innerWidth < 968;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance

  /* ---- Debounce helper ---- */
  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  /* ---- Sidebar Toggle ---- */
  var sidebar = document.querySelector('.dash-sidebar');
  var hamburger = document.querySelector('.dash-hamburger');
  var sidebarClose = document.querySelector('.dash-sidebar-close');
  var overlay = document.querySelector('.dash-overlay');

  function toggleSidebar(open) {
    var isOpen = open !== undefined ? open : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', isOpen);
    if (hamburger) hamburger.classList.toggle('active', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = (isOpen && window.innerWidth < 968) ? 'hidden' : '';
  }

  if (sidebar && hamburger) {
    hamburger.addEventListener('click', function () { toggleSidebar(); }, { passive: true });
    if (sidebarClose) sidebarClose.addEventListener('click', function () { toggleSidebar(false); }, { passive: true });
    if (overlay) overlay.addEventListener('click', function () { toggleSidebar(false); }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleSidebar(false);
    });

    document.querySelectorAll('.dash-nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        if (window.innerWidth < 968) toggleSidebar(false);
      });
    });
  }

  /* ---- Section Navigation ---- */
  var navItems = document.querySelectorAll('.dash-nav-item');
  var sections = document.querySelectorAll('.dash-section');

  function showSection(sectionId) {
    sections.forEach(function (s) { s.classList.remove('active'); });
    navItems.forEach(function (n) { n.classList.remove('active'); });

    var target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    navItems.forEach(function (n) {
      if (n.getAttribute('data-section') === sectionId.replace('section-', '')) {
        n.classList.add('active');
      }
    });

    if (history.pushState) {
      history.pushState(null, '', '#' + sectionId.replace('section-', ''));
    }
    triggerAOS(target);
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var section = this.getAttribute('data-section');
      if (section) showSection('section-' + section);
    }, { passive: true });
  });

  // Init from hash
  (function () {
    var hash = window.location.hash.replace('#', '');
    var targetId = hash ? 'section-' + hash : 'section-overview';
    showSection(document.getElementById(targetId) ? targetId : 'section-overview');
  })();

  /* ---- Animated Counters ---- */
  var counters = document.querySelectorAll('.dash-card-value[data-target]');
  var countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    counters.forEach(function (counter) {
      var target = parseFloat(counter.getAttribute('data-target')) || 0;
      if (prefersReducedMotion || target === 0) {
        counter.textContent = target >= 1000 ? '$' + target.toLocaleString() : (target % 1 === 0 ? target.toLocaleString() : target.toFixed(2) + '%');
        return;
      }

      var duration = 2000;
      var startTime = Date.now();
      var isCurrency = counter.textContent.indexOf('$') !== -1;

      function update() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = eased * target;

        if (isCurrency) {
          counter.textContent = '$' + current.toFixed(0);
        } else {
          counter.textContent = current.toFixed(target % 1 === 0 ? 0 : 2);
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = isCurrency ? '$' + target.toLocaleString() : (target % 1 === 0 ? target.toLocaleString() : target.toFixed(2) + '%');
        }
      }
      requestAnimationFrame(update);
    });
  }

  var overviewSection = document.getElementById('section-overview');
  if (overviewSection && !prefersReducedMotion) {
    var overviewObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersAnimated) {
          animateCounters();
          overviewObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    overviewObserver.observe(overviewSection);
  } else if (overviewSection) {
    animateCounters();
  }

  /* ---- Canvas Charts (DPR-capped for performance) ---- */
  function drawChart(canvasId, drawFn) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width || canvas.width;
    var h = parseInt(canvas.getAttribute('height')) || 250;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    drawFn(ctx, w, h);
  }

  /* ---- Revenue Bar Chart ---- */
  function drawRevenueChart() {
    drawChart('chart-revenue', function (ctx, w, h) {
      var data = [{ label: 'Jan', value: 18 }, { label: 'Feb', value: 24 }, { label: 'Mar', value: 21 }, { label: 'Apr', value: 29 }, { label: 'May', value: 34 }, { label: 'Jun', value: 42 }];
      var maxVal = 42;
      var padding = { top: 15, bottom: 25, left: 30, right: 10 };
      var chartW = w - padding.left - padding.right;
      var chartH = h - padding.top - padding.bottom;
      var barW = Math.min(chartW / data.length * 0.55, 36);
      var gap = chartW / data.length;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (var i = 0; i <= 4; i++) {
        var gy = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, gy); ctx.lineTo(w - padding.right, gy); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal - (maxVal / 4) * i) + 'k', padding.left - 5, gy + 3);
      }

      data.forEach(function (d, i) {
        var barH = (d.value / maxVal) * chartH;
        var x = padding.left + gap * i + (gap - barW) / 2;
        var y = padding.top + chartH - barH;
        var grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, '#00c8ff'); grad.addColorStop(1, '#9b59b6');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barW / 2, h - 5);
      });
    });
  }

  /* ---- Product Doughnut Chart ---- */
  function drawDoughnutChart() {
    drawChart('chart-products', function (ctx, w, h) {
      var data = [
        { label: 'Minecraft', value: 35, color: '#2ecc71' },
        { label: 'Discord', value: 25, color: '#5865F2' },
        { label: 'Spotify', value: 20, color: '#1DB954' },
        { label: 'Netflix', value: 12, color: '#ff2d95' },
        { label: 'Other', value: 8, color: '#00c8ff' },
      ];
      var total = data.reduce(function (s, d) { return s + d.value; }, 0);
      var cx = w / 2, cy = h / 2;
      var radius = Math.min(cx, cy) - 10;
      var innerRadius = radius * 0.55;
      var startAngle = -Math.PI / 2;

      data.forEach(function (d) {
        var sliceAngle = (d.value / total) * Math.PI * 2 - 0.03;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
        startAngle += sliceAngle + 0.03;
      });

      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.min(20, w * 0.05) + 'px Orbitron, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(total, cx, cy - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px Rajdhani, sans-serif';
      ctx.fillText('Total', cx, cy + 14);
    });
  }

  /* ---- 12-Month Line Chart ---- */
  function drawLineChart() {
    drawChart('chart-revenue-full', function (ctx, w, h) {
      var data = [12, 18, 15, 24, 21, 29, 34, 31, 38, 42, 39, 48];
      var months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      var maxVal = 48;
      var padding = { top: 15, bottom: 25, left: 5, right: 5 };
      var chartW = w - padding.left - padding.right;
      var chartH = h - padding.top - padding.bottom;
      var stepX = chartW / (data.length - 1);

      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
      for (var i = 0; i <= 4; i++) {
        var gy = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, gy); ctx.lineTo(w - padding.right, gy); ctx.stroke();
      }

      // Area fill
      ctx.beginPath();
      data.forEach(function (val, i) {
        var x = padding.left + i * stepX;
        var y = padding.top + chartH - (val / maxVal) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + (data.length - 1) * stepX, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, 'rgba(0,200,255,0.15)'); grad.addColorStop(1, 'rgba(0,200,255,0.01)');
      ctx.fillStyle = grad; ctx.fill();

      // Line
      ctx.beginPath();
      ctx.strokeStyle = '#00c8ff'; ctx.lineWidth = 2;
      data.forEach(function (val, i) {
        var x = padding.left + i * stepX;
        var y = padding.top + chartH - (val / maxVal) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots (skip every other on mobile for performance)
      var dotStep = isMobile ? 2 : 1;
      data.forEach(function (val, i) {
        if (i % dotStep !== 0) return;
        var x = padding.left + i * stepX;
        var y = padding.top + chartH - (val / maxVal) * chartH;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#00c8ff'; ctx.fill();
      });

      // X labels
      var labelStep = isMobile ? 2 : 1;
      data.forEach(function (val, i) {
        if (i % labelStep !== 0) return;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(months[i], padding.left + i * stepX, h - 5);
      });
    });
  }

  /* ---- Init Charts ---- */
  function initCharts() {
    drawRevenueChart();
    drawDoughnutChart();
    drawLineChart();
  }

  if (document.readyState === 'complete') {
    initCharts();
  } else {
    window.addEventListener('load', initCharts, { once: true });
  }

  /* ---- Debounced chart resize ---- */
  var chartResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(function () {
      isMobile = window.innerWidth < 968;
      initCharts();
    }, 300);
  }, { passive: true });

  /* ---- AOS Helper ---- */
  function triggerAOS(container) {
    if (!container || prefersReducedMotion) return;
    var els = container.querySelectorAll('[data-aos]');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('aos-animate'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { observer.observe(el); });
  }
  sections.forEach(function (s) { triggerAOS(s); });

  /* ---- Toast Notification ---- */
  var toast = document.getElementById('dash-toast');
  var toastClose = document.querySelector('.dash-toast-close');
  var notifBtn = document.querySelector('.dash-topbar-btn');

  function showToast(message) {
    if (!toast) return;
    var title = toast.querySelector('.dash-toast-title');
    var text = toast.querySelector('.dash-toast-text');
    if (title) title.textContent = 'New Update';
    if (text) text.textContent = message || 'You have a new notification.';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 5000);
  }

  if (toastClose) toastClose.addEventListener('click', function () { toast.classList.remove('show'); }, { passive: true });
  if (notifBtn) notifBtn.addEventListener('click', function () { showToast('📦 3 new orders received!'); }, { passive: true });

  setTimeout(function () { showToast('🎮 Welcome to NexusStore Admin!'); }, 2000);

  /* ---- Search Shortcut ---- */
  var searchWrap = document.querySelector('.dash-search-wrap');
  if (searchWrap) {
    var searchInput = searchWrap.querySelector('.dash-search');
    if (searchInput) {
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); }
        if (e.key === 'Escape' && document.activeElement === searchInput) searchInput.blur();
      });

      searchInput.addEventListener('input', function () {
        var query = this.value.toLowerCase().trim();
        document.querySelectorAll('.dash-table tbody tr').forEach(function (row) {
          row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      }, { passive: true });
    }
  }

  /* ---- Select All Checkbox ---- */
  var selectAll = document.querySelector('.dash-checkbox > input[type="checkbox"]');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      document.querySelectorAll('.dash-table tbody .dash-checkbox input[type="checkbox"]').forEach(function (cb) {
        cb.checked = selectAll.checked;
      });
    }, { passive: true });
  }

  /* ---- Resize cleanup ---- */
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 968 && sidebar) {
      sidebar.classList.remove('open');
      if (hamburger) hamburger.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }, { passive: true });

  console.log('%c📊 Dashboard %cReady', 'color:#00c8ff;font-weight:bold;font-size:12px;font-family:Orbitron,sans-serif;', 'color:#2ecc71;font-size:11px;');

})();
