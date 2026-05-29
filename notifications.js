/* ===== NEXUSSTORE LIVE PURCHASE NOTIFICATIONS ===== */
(function () {
  'use strict';

  /* ---- Sample purchase data for simulation ---- */
  var purchases = [
    { user: 'AmanBista',  product: 'Minecraft Premium',  icon: '⛏',  price: '$29.99', color: '#2ecc71' },
    { user: 'Nischal_B',    product: 'Discord Nitro',      icon: '💬',  price: '$9.99',  color: '#5865F2' },
    { user: 'Aryan_Lamichhane',  product: 'Game Pass Ultimate',  icon: '🎮',  price: '$14.99', color: '#107c10' },
    { user: 'Aryan_Adhikari',product: 'Spotify Premium',     icon: '🎵',  price: '$5.99',  color: '#1DB954' },
    { user: 'Pramanand_Chy',product: 'Netflix Premium',     icon: '🎬',  price: '$11.99', color: '#ff2d95' },
    { user: 'Sujal_Stha',  product: 'Minecraft Premium',   icon: '⛏',  price: '$29.99', color: '#2ecc71' },
    { user: 'Saif_Ali',      product: 'Discord Nitro',       icon: '💬',  price: '$24.99', color: '#5865F2' },
    { user: 'Gopi_Stha',  product: 'Game Pass Ultimate',  icon: '🎮',  price: '$44.97', color: '#107c10' },
    { user: 'Om_Dhakal',   product: 'Spotify Premium',     icon: '🎵',  price: '$5.99',  color: '#1DB954' },
    { user: 'Achyut_Ghimire',  product: 'Netflix Premium',     icon: '🎬',  price: '$11.99', color: '#ff2d95' },
    { user: 'Utkrista_Ghimire',     product: 'Minecraft Premium',   icon: '⛏',  price: '$29.99', color: '#2ecc71' },
    { user: 'Kundan_TML',  product: 'Discord Nitro',       icon: '💬',  price: '$24.99', color: '#5865F2' },
    { user: 'Breeze_Limbu',  product: 'Game Pass Ultimate',  icon: '🎮',  price: '$44.97', color: '#107c10' },
    { user: 'Hari_kumar',    product: 'Spotify Premium',     icon: '🎵',  price: '$5.99',  color: '#1DB954' },
    { user: 'Ram_kumar',    product: 'Netflix Premium',     icon: '🎬',  price: '$11.99', color: '#ff2d95' },
  ];

  var locations = ['United States', 'Germany', 'UK', 'Canada', 'Australia', 'Brazil', 'Japan', 'Singapore', 'France', 'UAE', 'Nepal'];

  /* ---- State ---- */
  var container = document.getElementById('nx-notifications');
  var isPaused = false;
  var scheduleTimer = null;

  /* ---- Create container if missing ---- */
  if (!container) {
    container = document.createElement('div');
    container.id = 'nx-notifications';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Live purchase notifications');
    document.body.appendChild(container);
  }

  /* ---- Dismiss a notification ---- */
  function dismissNotification(notif, instant) {
    if (!notif || !notif.parentNode) return;

    // Clear auto-dismiss timer if set
    if (notif._dismissTimer) {
      clearTimeout(notif._dismissTimer);
      delete notif._dismissTimer;
    }

    if (instant) {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
      return;
    }

    notif.classList.remove('nx-notif-visible');
    notif.classList.add('nx-notif-exit');

    // Kill the progress bar
    var bar = notif.querySelector('.nx-notif-bar');
    if (bar) bar.style.width = '0';

    setTimeout(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 400, notif);
  }

  /* ---- Event delegation: close button clicks ---- */
  container.addEventListener('click', function (e) {
    var target = e.target;
    if (target.classList.contains('nx-notif-close')) {
      e.stopPropagation();
      var notif = target.closest('.nx-notif');
      if (notif) dismissNotification(notif, false);
    }
  });

  /* ---- Create a notification DOM element ---- */
  function createNotification(data) {
    var notif = document.createElement('div');
    notif.className = 'nx-notif';
    notif.style.setProperty('--nx-accent', data.color);

    var location = data.location || locations[Math.floor(Math.random() * locations.length)];
    var timeAgo = data.timeAgo || (Math.random() > 0.5 ? 'Just now' : Math.floor(Math.random() * 3 + 1) + 'm ago');

    notif.innerHTML =
      '<div class="nx-notif-glow"></div>' +
      '<div class="nx-notif-icon" style="background:' + data.color + '20; border-color:' + data.color + '40;">' +
        '<span>' + data.icon + '</span>' +
      '</div>' +
      '<div class="nx-notif-body">' +
        '<div class="nx-notif-head">' +
          '<strong class="nx-notif-user">' + data.user + '</strong>' +
          '<span class="nx-notif-time">' + timeAgo + '</span>' +
        '</div>' +
        '<div class="nx-notif-action">purchased <strong>' + data.product + '</strong></div>' +
        '<div class="nx-notif-meta">' +
          '<span class="nx-notif-price">' + data.price + '</span>' +
          '<span class="nx-notif-dot">·</span>' +
          '<span class="nx-notif-location">' + location + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="nx-notif-close" aria-label="Dismiss">&times;</button>' +
      '<div class="nx-notif-bar"></div>';

    // Hover pause for progress bar
    notif.addEventListener('mouseenter', function () {
      var bar = this.querySelector('.nx-notif-bar');
      if (bar) bar.style.animationPlayState = 'paused';
    });
    notif.addEventListener('mouseleave', function () {
      var bar = this.querySelector('.nx-notif-bar');
      if (bar) bar.style.animationPlayState = 'running';
    });

    return notif;
  }

  /* ---- Show a notification ---- */
  function showNotification(data) {
    if (!container || document.hidden) return;

    var notif = createNotification(data);

    // Limit to 3 visible — remove oldest instantly
    while (container.children.length >= 3) {
      var oldest = container.children[0];
      if (oldest && oldest.classList.contains('nx-notif')) {
        dismissNotification(oldest, true);
      } else break;
    }

    container.appendChild(notif);

    // Trigger slide-in on next frame
    requestAnimationFrame(function () {
      notif.classList.add('nx-notif-visible');
    });

    // Auto-dismiss after 5s; store timer ref so we can cancel
    notif._dismissTimer = setTimeout(function () {
      dismissNotification(notif, false);
    }, 5000);
  }

  /* ---- Pick a random purchase ---- */
  function randomPurchase() {
    var p = purchases[Math.floor(Math.random() * purchases.length)];
    var qty = Math.random() > 0.7 ? ' ×' + (Math.floor(Math.random() * 3) + 2) : '';
    var basePrice = parseFloat(p.price.replace('$', ''));
    return {
      user: p.user,
      product: p.product + qty,
      icon: p.icon,
      price: qty ? '$' + (basePrice * (Math.floor(Math.random() * 3) + 2)).toFixed(2) : p.price,
      color: p.color,
      location: locations[Math.floor(Math.random() * locations.length)],
      timeAgo: 'Just now',
    };
  }

  /* ---- Schedule next notification ---- */
  function scheduleNext() {
    if (scheduleTimer) {
      clearTimeout(scheduleTimer);
      scheduleTimer = null;
    }
    if (isPaused) return;

    var delay = Math.random() * 12000 + 8000; // 8–20 seconds

    scheduleTimer = setTimeout(function () {
      if (!isPaused && !document.hidden) {
        showNotification(randomPurchase());
      }
      scheduleNext();
    }, delay);
  }

  /* ---- Pause schedule on page unload ---- */
  window.addEventListener('beforeunload', function () {
    if (scheduleTimer) clearTimeout(scheduleTimer);
  }, { once: true });

  /* ---- Initial batch — show 2 quickly on load ---- */
  setTimeout(function () {
    if (!document.hidden) showNotification(randomPurchase());
  }, 3000);

  setTimeout(function () {
    if (!document.hidden) showNotification(randomPurchase());
  }, 7000);

  /* ---- Pause when tab hidden ---- */
  document.addEventListener('visibilitychange', function () {
    isPaused = document.hidden;
    if (!isPaused) scheduleNext();
  });

  /* ---- Start the loop ---- */
  scheduleNext();

  console.log('%c🔔 Live Notifications %cActive', 'color:#00c8ff;font-weight:bold;font-size:12px;font-family:Orbitron,sans-serif;', 'color:#1abc9c;font-size:11px;');

})();
