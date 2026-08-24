/* ==========================================================================
   TUTORTA PUERTO IGUAZÚ - APPLICATION LOGIC
   Features: Catalog Filtering, Interactive Customization, Cart Management,
             Leaflet Interactive Map (Puerto Iguazú), WhatsApp Order Generator.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. PRODUCTS DATA
  const CAKES_DATA = [
    {
      id: 'selva-misionera',
      name: 'Torta Selva Misionera',
      category: 'chocolate',
      categoryLabel: 'Chocolates & Frutos',
      basePrice: 22000,
      description: 'Bizcochuelo húmedo de cacao intenso, relleno de crema batida artesanal, dulce de leche y frutos del bosque de la selva.',
      image: 'assets/torta_selva_misionera.png',
      badge: 'Popular'
    },
    {
      id: 'cataratas-maracuya',
      name: 'Torta Cataratas Maracuyá',
      category: 'frutal',
      categoryLabel: 'Frutal Tropical',
      basePrice: 24000,
      description: 'Mousse de maracuyá fresco, ganache drip de chocolate blanco y frutas de la pasión. Refrescante y lujosa.',
      image: 'assets/torta_cataratas.png',
      badge: 'Firma Iguazú'
    },
    {
      id: 'chocotorta-iguazu',
      name: 'Chocotorta Premium',
      category: 'chocolate',
      categoryLabel: 'Chocolates',
      basePrice: 20000,
      description: 'Capa tras capa de galletitas de chocolate embebidas en café, suave mousse de dulce de leche y trufas artesanales.',
      image: 'assets/torta_chocotorta.png',
      badge: 'Clásico Argentino'
    },
    {
      id: 'red-velvet',
      name: 'Red Velvet Selvática',
      category: 'especial',
      categoryLabel: 'Especiales',
      basePrice: 25000,
      description: 'Bizcocho aterciopelado rojo con suave frosting de queso crema y decoración floral comestible inspirada en Misiones.',
      image: 'assets/torta_red_velvet.png',
      badge: 'Exclusiva'
    }
  ];

  // 2. STATE MANAGEMENT
  let state = {
    cart: [],
    selectedCategory: 'all',
    activeModalCake: null,
    selectedSize: { name: 'Chica', multiplier: 1 },
    orderMode: 'pickup', // 'pickup' | 'delivery'
    deliveryCoords: { lat: -25.5967, lng: -54.5760 }, // Puerto Iguazú Center
    mapInitialized: false,
    mapInstance: null,
    mapMarker: null
  };

  // 3. DOM ELEMENTS
  const cakesGrid = document.getElementById('cakes-grid');
  const categoryFilters = document.getElementById('category-filters');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartTotalPrice = document.getElementById('cart-total-price');

  // Hamburger Menu Elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = hamburgerBtn.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = hamburgerBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }

  // Customize Modal Elements
  const customizeModal = document.getElementById('customize-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCakeImg = document.getElementById('modal-cake-img');
  const modalCakeTitle = document.getElementById('modal-cake-title');
  const modalCakeDesc = document.getElementById('modal-cake-desc');
  const sizeOptionBtns = document.querySelectorAll('.size-option-btn');
  const customTextInput = document.getElementById('custom-text-input');
  const candlesInput = document.getElementById('candles-input');
  const confirmAddToCartBtn = document.getElementById('confirm-add-to-cart');
  const modalCalculatedPrice = document.getElementById('modal-calculated-price');

  // Order Type Toggles
  const togglePickup = document.getElementById('toggle-pickup');
  const toggleDelivery = document.getElementById('toggle-delivery');
  const pickupSection = document.getElementById('pickup-section');
  const deliverySection = document.getElementById('delivery-section');
  const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');
  const btnHeroOrderFast = document.getElementById('btn-hero-order-fast');

  // Form Fields
  const pickupName = document.getElementById('pickup-name');
  const pickupPhone = document.getElementById('pickup-phone');
  const deliveryName = document.getElementById('delivery-name');
  const deliveryPhone = document.getElementById('delivery-phone');
  const deliveryAddress = document.getElementById('delivery-address');
  const deliveryNotes = document.getElementById('delivery-notes');
  const mapCoordsText = document.getElementById('map-coords-text');

  // 4. RENDER CAKES GRID
  function renderCakes() {
    cakesGrid.innerHTML = '';
    
    const filteredCakes = state.selectedCategory === 'all' 
      ? CAKES_DATA 
      : CAKES_DATA.filter(c => c.category === state.selectedCategory);

    filteredCakes.forEach(cake => {
      const cakeCard = document.createElement('div');
      cakeCard.className = 'cake-card glass-panel';
      cakeCard.innerHTML = `
        <div class="cake-img-wrapper">
          <img src="${cake.image}" alt="${cake.name}" loading="lazy">
          <span class="cake-badge">${cake.badge}</span>
        </div>
        <div class="cake-content">
          <h3 class="cake-title">${cake.name}</h3>
          <p class="cake-desc">${cake.description}</p>
          <div class="cake-meta">
            <span class="cake-price">$${cake.basePrice.toLocaleString('es-AR')}</span>
            <button class="btn-add-cart" data-id="${cake.id}">
              <i class="fa-solid fa-plus"></i> Seleccionar
            </button>
          </div>
        </div>
      `;
      cakesGrid.appendChild(cakeCard);
    });

    // Attach click events to "Seleccionar" buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cakeId = e.currentTarget.getAttribute('data-id');
        openCustomizeModal(cakeId);
      });
    });
  }

  // 5. CATEGORY FILTER HANDLER
  categoryFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      state.selectedCategory = e.target.getAttribute('data-category');
      renderCakes();
    }
  });

  // 6. CUSTOMIZE MODAL LOGIC
  function openCustomizeModal(cakeId) {
    const cake = CAKES_DATA.find(c => c.id === cakeId);
    if (!cake) return;

    state.activeModalCake = cake;
    state.selectedSize = { name: 'Chica', multiplier: 1 };
    
    modalCakeImg.src = cake.image;
    modalCakeTitle.textContent = cake.name;
    modalCakeDesc.textContent = cake.description;
    customTextInput.value = '';
    candlesInput.value = '';

    // Reset size buttons state
    sizeOptionBtns.forEach(btn => {
      if (btn.getAttribute('data-size') === 'Chica') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateModalPrice();
    customizeModal.classList.add('active');
  }

  function closeCustomizeModal() {
    customizeModal.classList.remove('active');
    state.activeModalCake = null;
  }

  modalCloseBtn.addEventListener('click', closeCustomizeModal);
  customizeModal.addEventListener('click', (e) => {
    if (e.target === customizeModal) closeCustomizeModal();
  });

  // Size Selector inside Modal
  sizeOptionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeOptionBtns.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');

      const sizeName = target.getAttribute('data-size');
      const multiplier = parseFloat(target.getAttribute('data-price-mod'));
      state.selectedSize = { name: sizeName, multiplier: multiplier };

      updateModalPrice();
    });
  });

  function updateModalPrice() {
    if (!state.activeModalCake) return;
    const finalPrice = Math.round(state.activeModalCake.basePrice * state.selectedSize.multiplier);
    modalCalculatedPrice.textContent = `$${finalPrice.toLocaleString('es-AR')}`;
  }

  // Add to Cart from Modal
  confirmAddToCartBtn.addEventListener('click', () => {
    if (!state.activeModalCake) return;

    const finalPrice = Math.round(state.activeModalCake.basePrice * state.selectedSize.multiplier);
    const cartItem = {
      cartItemId: Date.now().toString(),
      cake: state.activeModalCake,
      size: state.selectedSize.name,
      customText: customTextInput.value.trim(),
      candles: candlesInput.value ? parseInt(candlesInput.value) : 0,
      unitPrice: finalPrice
    };

    state.cart.push(cartItem);
    updateCartUI();
    closeCustomizeModal();
    openCartDrawer();
  });

  // 7. CART DRAWER & UI UPDATES
  function updateCartUI() {
    cartCountBadge.textContent = state.cart.length;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; margin-bottom: 1rem; color: rgba(212,175,55,0.3);"></i>
          <p>Tu pedido está vacío.</p>
          <p style="font-size: 0.85rem;">Elige una deliciosa torta de nuestra vidriera.</p>
        </div>
      `;
      cartTotalPrice.textContent = '$0';
      return;
    }

    let total = 0;
    cartItemsList.innerHTML = '';

    state.cart.forEach((item) => {
      total += item.unitPrice;
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.cake.image}" alt="${item.cake.name}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.cake.name}</div>
          <div class="cart-item-meta">
            Tamaño: <strong>${item.size}</strong>
            ${item.customText ? `<br>Dedicatoria: "<em>${item.customText}</em>"` : ''}
            ${item.candles > 0 ? `<br>Velas: ${item.candles}` : ''}
          </div>
          <div class="cart-item-price">$${item.unitPrice.toLocaleString('es-AR')}</div>
        </div>
        <button class="cart-item-remove" data-id="${item.cartItemId}" aria-label="Eliminar ítem">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      cartItemsList.appendChild(itemEl);
    });

    cartTotalPrice.textContent = `$${total.toLocaleString('es-AR')}`;

    // Remove buttons handler
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.currentTarget.getAttribute('data-id');
        state.cart = state.cart.filter(item => item.cartItemId !== itemId);
        updateCartUI();
      });
    });
  }

  function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');

    // Init map if in delivery mode and not yet initialized
    if (state.orderMode === 'delivery' && !state.mapInitialized) {
      initDeliveryMap();
    }
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  openCartBtn.addEventListener('click', openCartDrawer);
  closeCartBtn.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);
  if (btnHeroOrderFast) {
    btnHeroOrderFast.addEventListener('click', () => {
      const firstCake = CAKES_DATA[0];
      if (firstCake) openCustomizeModal(firstCake.id);
    });
  }

  // 8. ORDER TYPE TOGGLE (PICKUP vs DELIVERY)
  togglePickup.addEventListener('click', () => {
    state.orderMode = 'pickup';
    togglePickup.classList.add('active');
    toggleDelivery.classList.remove('active');
    pickupSection.classList.add('active');
    deliverySection.classList.remove('active');
  });

  toggleDelivery.addEventListener('click', () => {
    state.orderMode = 'delivery';
    toggleDelivery.classList.add('active');
    togglePickup.classList.remove('active');
    deliverySection.classList.add('active');
    pickupSection.classList.remove('active');

    // Lazy load Leaflet Map
    if (!state.mapInitialized) {
      setTimeout(() => initDeliveryMap(), 100);
    } else if (state.mapInstance) {
      setTimeout(() => state.mapInstance.invalidateSize(), 100);
    }
  });

  // 9. LEAFLET MAP INITIALIZATION (PUERTO IGUAZÚ)
  function initDeliveryMap() {
    const mapContainer = document.getElementById('delivery-map');
    if (!mapContainer || typeof L === 'undefined') return;

    state.mapInitialized = true;

    // Center on Puerto Iguazú center (-25.5967, -54.5760)
    state.mapInstance = L.map('delivery-map').setView([state.deliveryCoords.lat, state.deliveryCoords.lng], 14);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(state.mapInstance);

    // Custom Draggable Marker
    state.mapMarker = L.marker([state.deliveryCoords.lat, state.deliveryCoords.lng], {
      draggable: true
    }).addTo(state.mapInstance);

    state.mapMarker.bindPopup('<b>Punto de Entrega</b><br>Arrastra este pin a tu casa.').openPopup();

    // Event: Marker dragged
    state.mapMarker.on('dragend', function (e) {
      const position = e.target.getLatLng();
      state.deliveryCoords.lat = position.lat;
      state.deliveryCoords.lng = position.lng;
      updateMapText(position.lat, position.lng);
    });

    // Event: Click anywhere on map
    state.mapInstance.on('click', function (e) {
      state.mapMarker.setLatLng(e.latlng);
      state.deliveryCoords.lat = e.latlng.lat;
      state.deliveryCoords.lng = e.latlng.lng;
      updateMapText(e.latlng.lat, e.latlng.lng);
    });
  }

  function updateMapText(lat, lng) {
    if (mapCoordsText) {
      mapCoordsText.innerHTML = `<span style="color: var(--gold-accent); font-weight: 600;"><i class="fa-solid fa-location-dot"></i> Coordenadas fijadas:</span> ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // 10. WHATSAPP ORDER GENERATOR
  btnSendWhatsapp.addEventListener('click', () => {
    if (state.cart.length === 0) {
      alert('Tu pedido está vacío. Por favor agrega al menos una torta de la vidriera.');
      return;
    }

    let clientName = '';
    let clientPhone = '';
    let deliveryInfo = '';

    if (state.orderMode === 'pickup') {
      clientName = pickupName.value.trim();
      clientPhone = pickupPhone.value.trim();

      if (!clientName) {
        alert('Por favor ingresa tu Nombre para el retiro en local.');
        pickupName.focus();
        return;
      }
    } else {
      clientName = deliveryName.value.trim();
      clientPhone = deliveryPhone.value.trim();
      const address = deliveryAddress.value.trim();
      const notes = deliveryNotes.value.trim();

      if (!clientName || !address) {
        alert('Por favor completa tu Nombre y Dirección para el delivery.');
        if (!clientName) deliveryName.focus();
        else deliveryAddress.focus();
        return;
      }

      const mapUrl = `https://maps.google.com/?q=${state.deliveryCoords.lat.toFixed(5)},${state.deliveryCoords.lng.toFixed(5)}`;
      deliveryInfo = `\n📍 *Dirección:* ${address}` +
                     `\n📌 *Punto en Mapa GPS:* ${mapUrl}` +
                     (notes ? `\n💬 *Notas Envío:* ${notes}` : '');
    }

    // Build Formatted WhatsApp Message
    let message = `🍰 *NUEVO PEDIDO - TUTORTA PUERTO IGUAZÚ*\n`;
    message += `------------------------------------------\n`;
    message += `👤 *Cliente:* ${clientName}\n`;
    if (clientPhone) message += `📞 *Teléfono:* ${clientPhone}\n`;
    message += `🚚 *Modalidad:* ${state.orderMode === 'pickup' ? '🏬 Retiro en Local (Av. Victoria Aguirre 450)' : '🛵 Delivery a Domicilio'}\n`;
    if (state.orderMode === 'delivery') message += deliveryInfo + '\n';
    
    message += `\n📋 *DETALLE DEL PEDIDO:*\n`;
    
    let grandTotal = 0;
    state.cart.forEach((item, index) => {
      grandTotal += item.unitPrice;
      message += `\n${index + 1}. *${item.cake.name}*\n`;
      message += `   • Tamaño: ${item.size}\n`;
      if (item.customText) message += `   • Dedicatoria: "${item.customText}"\n`;
      if (item.candles > 0) message += `   • Velas: ${item.candles}\n`;
      message += `   • Subtotal: $${item.unitPrice.toLocaleString('es-AR')}\n`;
    });

    message += `------------------------------------------\n`;
    message += `💰 *TOTAL ESTIMADO:* $${grandTotal.toLocaleString('es-AR')}\n`;
    message += `\n¡Quedo a la espera de la confirmación! Gracias.`;

    // Encode URL and redirect to WhatsApp number +5493757571985
    const whatsappUrl = `https://wa.me/5493757571985?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  });

  // INITIALIZE
  renderCakes();
  updateCartUI();

});
