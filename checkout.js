/* ===== CHECKOUT PAGE SCRIPT ===== */

(function () {
  'use strict';

  var isMobile = window.innerWidth < 768;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Debounce helper ---- */
  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  /* ---- Order Summary ---- */
  var coOrderSummary = (function () {
    var items = document.querySelectorAll('.co-summary-item');
    var subtotalEl = document.getElementById('co-subtotal');
    var taxEl = document.getElementById('co-tax');
    var totalEl = document.getElementById('co-total');
    var itemCountEl = document.getElementById('co-item-count');
    var placeOrderBtn = document.getElementById('co-place-order');
    var TAX_RATE = 0.08;

    function updateTotals() {
      var subtotal = 0;
      var totalItems = 0;

      items.forEach(function (item) {
        var priceEl = item.querySelector('.co-item-price');
        var qtyEl = item.querySelector('.co-qty-value');
        if (!priceEl || !qtyEl) return;
        var price = parseFloat(priceEl.getAttribute('data-base')) || 0;
        var qty = parseInt(qtyEl.getAttribute('data-qty')) || 1;
        subtotal += price * qty;
        totalItems += qty;
        priceEl.textContent = '$' + (price * qty).toFixed(2);
      });

      var tax = subtotal * TAX_RATE;
      var total = subtotal + tax;

      if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
      if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
      if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
      if (itemCountEl) itemCountEl.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
      if (placeOrderBtn) {
        placeOrderBtn.innerHTML = '<span class=\"co-btn-lock\">🔒</span><span class=\"btn-label\">Place Order – $' + total.toFixed(2) + '</span><span class=\"btn-arrow\">→</span>';
        placeOrderBtn.disabled = total <= 0;
      }
    }

    /* ---- Qty buttons with touch optimization ---- */
    items.forEach(function (item) {
      var minusBtn = item.querySelector('.co-qty-minus');
      var plusBtn = item.querySelector('.co-qty-plus');
      var qtyEl = item.querySelector('.co-qty-value');

      if (minusBtn && qtyEl) {
        minusBtn.addEventListener('click', function () {
          var qty = parseInt(qtyEl.getAttribute('data-qty')) || 1;
          if (qty > 1) {
            qtyEl.setAttribute('data-qty', qty - 1);
            qtyEl.textContent = qty - 1;
            updateTotals();
          }
        });
        // CSS touch-action: manipulation handles double-tap prevention natively
      }

      if (plusBtn && qtyEl) {
        plusBtn.addEventListener('click', function () {
          var qty = parseInt(qtyEl.getAttribute('data-qty')) || 1;
          if (qty < 99) {
            qtyEl.setAttribute('data-qty', qty + 1);
            qtyEl.textContent = qty + 1;
            updateTotals();
          }
        });
      }
    });

    updateTotals();
    return { updateTotals: updateTotals };
  })();

  /* ---- Payment Method Switching ---- */
  var payOptions = document.querySelectorAll('.co-pay-option');
  var cardForm = document.getElementById('co-card-form');
  var paypalInfo = document.getElementById('co-paypal-info');
  var cryptoInfo = document.getElementById('co-crypto-info');

  payOptions.forEach(function (opt) {
    opt.addEventListener('click', function () {
      payOptions.forEach(function (o) {
        o.classList.remove('active');
        o.setAttribute('aria-checked', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-checked', 'true');

      var method = this.getAttribute('data-method');
      if (cardForm) cardForm.style.display = method === 'card' ? '' : 'none';
      if (paypalInfo) paypalInfo.style.display = method === 'paypal' ? '' : 'none';
      if (cryptoInfo) cryptoInfo.style.display = method === 'crypto' ? '' : 'none';
    }, { passive: true });
  });

  /* ---- Card Formatting ---- */
  var cardNumber = document.getElementById('co-card-number');
  var cardExpiry = document.getElementById('co-card-expiry');
  var cardCvv = document.getElementById('co-card-cvv');

  if (cardNumber) {
    cardNumber.addEventListener('input', function () {
      var val = this.value.replace(/\D/g, '').substring(0, 16);
      this.value = val.replace(/(.{4})/g, '$1 ').trim();
    }, { passive: true });
  }

  if (cardExpiry) {
    cardExpiry.addEventListener('input', function () {
      var val = this.value.replace(/\D/g, '').substring(0, 4);
      this.value = val.length >= 3 ? val.substring(0, 2) + ' / ' + val.substring(2) : val;
    }, { passive: true });
  }

  if (cardCvv) {
    cardCvv.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').substring(0, 4);
    }, { passive: true });
  }

  /* ---- Promo Code ---- */
  var promoInput = document.getElementById('co-promo');
  var promoBtn = document.getElementById('co-promo-btn');
  var promoMsg = document.getElementById('co-promo-msg');

  var validCodes = {
    'NEXUS10': 0.10,
    'GAMER20': 0.20,
    'WELCOME5': 0.05,
    'VIP15': 0.15,
  };

  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', function () {
      var code = promoInput.value.trim().toUpperCase();
      if (!code) {
        if (promoMsg) { promoMsg.textContent = 'Please enter a promo code'; promoMsg.className = 'co-field-hint co-promo-msg error'; }
        return;
      }

      if (validCodes[code] !== undefined) {
        if (promoMsg) { promoMsg.textContent = '✅ ' + code + ' applied! ' + (validCodes[code] * 100) + '% off'; promoMsg.className = 'co-field-hint co-promo-msg success'; }
        promoInput.value = code;
        promoInput.disabled = true;
        promoBtn.disabled = true;
        promoBtn.textContent = '✓ Applied';
        coOrderSummary.updateTotals();
      } else {
        if (promoMsg) { promoMsg.textContent = '❌ Invalid promo code'; promoMsg.className = 'co-field-hint co-promo-msg error'; }
      }
    }, { passive: true });
  }

  /* ---- Place Order ---- */
  var placeOrderBtn = document.getElementById('co-place-order');
  var successOverlay = document.getElementById('co-success');
  var orderIdEl = document.getElementById('co-order-id');
  var orderTotalDisplay = document.getElementById('co-order-total');

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', function () {
      var inputs = document.querySelectorAll('.co-card-body .co-input[required]');
      var valid = true;
      inputs.forEach(function (input) {
        if (!input.value.trim()) { input.style.borderColor = '#ff4444'; valid = false; }
        else { input.style.borderColor = ''; }
      });

      if (!valid) {
        var firstError = document.querySelector('.co-card-body .co-input[required]');
        if (firstError) { firstError.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstError.focus(); }
        return;
      }

      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = '⏳ <span>Processing...</span>';

      setTimeout(function () {
        if (successOverlay) {
          var orderId = 'NEX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          if (orderIdEl) orderIdEl.textContent = orderId;
          if (orderTotalDisplay) {
            var totalText = document.getElementById('co-total');
            if (totalText) orderTotalDisplay.textContent = totalText.textContent;
          }
          successOverlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '✓ <span>Order Placed</span>';
      }, 2500);
    }, { passive: true });
  }

  /* ---- Success overlay dismiss ---- */
  if (successOverlay) {
    successOverlay.addEventListener('click', function (e) {
      if (e.target === successOverlay) {
        successOverlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && successOverlay.style.display === 'flex') {
        successOverlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- Mobile: reduce background effects ---- */
  if (isMobile || prefersReducedMotion) {
    document.querySelectorAll('.co-glow-orb, .co-cube, .co-float-icon').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  console.log('%c🛒 Checkout %cReady', 'color:#00c8ff;font-weight:bold;font-size:12px;font-family:Orbitron,sans-serif;', 'color:#2ecc71;font-size:11px;');

})();
