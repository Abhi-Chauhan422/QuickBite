// ===== QuickBite - Client Side Script =====
// Needs ../data.js to be loaded first (getData, setData, esc, etc.)

// ---------------------------------------------------------
// 1. Header: cart count and Login / Logout link
// ---------------------------------------------------------
function setupHeader() {
  const cart = getData('qb_cart', []);
  let count = 0;
  cart.forEach(function (item) { count += item.qty; });

  const cartLink = document.getElementById('cartLink');
  if (cartLink) cartLink.textContent = count > 0 ? 'Cart (' + count + ')' : 'Cart';

  const user = getData('qb_currentUser', null);
  const authLink = document.getElementById('authLink');
  if (authLink && user) {
    authLink.textContent = 'Logout (' + user.name.split(' ')[0] + ')';
    authLink.href = '#';
    authLink.classList.remove('active');
    authLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('qb_currentUser');
      window.location.href = 'home.html';
    });
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 1800);
}

// ---------------------------------------------------------
// 2. Form validation helpers
// ---------------------------------------------------------
// Shows (or clears) the red message under an input. Returns true when valid.
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId + 'Error');
  error.textContent = message;
  input.classList.toggle('invalid', message !== '');
  return message === '';
}

// Removes the red message as soon as the user starts typing again
function clearErrorsOnInput(form) {
  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', function () { showError(field.id, ''); });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

// ---------------------------------------------------------
// 3. Menu cards (used on Home and Menu pages)
// ---------------------------------------------------------
function foodCard(item) {
  return '<div class="card">' +
    '<div class="card-img">' + item.emoji + '</div>' +
    '<div class="card-body">' +
      '<h4>' + esc(item.name) + '</h4>' +
      '<p class="category">' + esc(item.category) + '</p>' +
      '<div class="card-footer">' +
        '<span class="price">Rs.' + item.price + '</span>' +
        '<button class="btn btn-small" onclick="addToCart(' + item.id + ')">Add +</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderHomePage() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  const menu = getData('qb_menu', []);
  let featured = menu.filter(function (item) { return [1, 3, 7].includes(item.id); });
  if (featured.length === 0) featured = menu.slice(0, 3);

  grid.innerHTML = featured.map(foodCard).join('');
}

function renderMenuPage() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const searchBox = document.getElementById('searchBox');
  const categoryBox = document.getElementById('categoryBox');

  // Home page category cards send us here like menu.html?category=Starters
  const wanted = new URLSearchParams(window.location.search).get('category');
  if (wanted) categoryBox.value = wanted;

  function showItems() {
    const menu = getData('qb_menu', []);
    const text = searchBox.value.trim().toLowerCase();
    const category = categoryBox.value;

    const result = menu.filter(function (item) {
      const nameMatch = item.name.toLowerCase().includes(text);
      const categoryMatch = (category === 'All' || item.category === category);
      return nameMatch && categoryMatch;
    });

    grid.innerHTML = result.length > 0
      ? result.map(foodCard).join('')
      : '<p class="empty" style="grid-column: 1 / -1;">No dishes found. Try a different search.</p>';
  }

  searchBox.addEventListener('input', showItems);
  categoryBox.addEventListener('change', showItems);
  showItems();
}

// ---------------------------------------------------------
// 4. Cart
// ---------------------------------------------------------
function addToCart(id) {
  const menu = getData('qb_menu', []);
  const cart = getData('qb_cart', []);
  const item = menu.find(function (m) { return m.id === id; });
  if (!item) return;

  const inCart = cart.find(function (c) { return c.id === id; });
  if (inCart) {
    inCart.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
  }

  setData('qb_cart', cart);
  setupHeader();
  showToast(item.name + ' added to cart');
}

function changeQty(id, change) {
  let cart = getData('qb_cart', []);
  const item = cart.find(function (c) { return c.id === id; });
  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(function (c) { return c.id !== id; });
  }
  setData('qb_cart', cart);
  setupHeader();
  renderCartPage();
}

function removeFromCart(id) {
  const cart = getData('qb_cart', []).filter(function (c) { return c.id !== id; });
  setData('qb_cart', cart);
  setupHeader();
  renderCartPage();
}

function renderCartPage() {
  const box = document.getElementById('cartBox');
  if (!box) return;

  const checkoutRow = document.getElementById('checkoutRow');
  const cart = getData('qb_cart', []);

  if (cart.length === 0) {
    box.innerHTML = '<p class="empty">Your cart is empty. <a href="menu.html">Browse the menu</a></p>';
    checkoutRow.style.display = 'none';
    return;
  }
  checkoutRow.style.display = 'block';

  let subtotal = 0;
  let rows = '';
  cart.forEach(function (item) {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    rows += '<tr>' +
      '<td>' + esc(item.name) + '</td>' +
      '<td><div class="qty-box">' +
        '<button onclick="changeQty(' + item.id + ', -1)">-</button>' +
        '<span>' + item.qty + '</span>' +
        '<button onclick="changeQty(' + item.id + ', 1)">+</button>' +
      '</div></td>' +
      '<td>Rs.' + lineTotal + '</td>' +
      '<td><button class="link-btn" onclick="removeFromCart(' + item.id + ')">Remove</button></td>' +
    '</tr>';
  });

  const total = subtotal + DELIVERY_FEE;
  box.innerHTML =
    '<div class="table-wrap"><table>' +
      '<tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>' +
      rows +
    '</table></div>';

  document.getElementById('summaryBox').innerHTML =
    '<div class="row"><span>Subtotal</span><span>Rs.' + subtotal + '</span></div>' +
    '<div class="row"><span>Delivery Fee</span><span>Rs.' + DELIVERY_FEE + '</span></div>' +
    '<div class="row total"><span>Total</span><span>Rs.' + total + '</span></div>';

  document.getElementById('placeOrderBtn').textContent = 'Place Order - Rs.' + total;
}

// ---------------------------------------------------------
// 5. Checkout form (validation form #1)
// ---------------------------------------------------------
function setupCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  clearErrorsOnInput(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const user = getData('qb_currentUser', null);
    if (!user) {
      alert('Please login first to place your order.');
      window.location.href = 'login-register.html';
      return;
    }

    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();

    const addressOk = showError('address', address.length >= 10 ? '' : 'Please enter your full address (at least 10 characters)');
    const phoneOk = showError('phone', isValidPhone(phone) ? '' : 'Enter a valid 10-digit phone number');
    if (!addressOk || !phoneOk) return;

    const cart = getData('qb_cart', []);
    if (cart.length === 0) return;

    let total = DELIVERY_FEE;
    cart.forEach(function (item) { total += item.price * item.qty; });

    const order = {
      id: 'ORD' + Date.now().toString().slice(-6),
      customer: user.name,
      email: user.email,
      phone: phone,
      address: address,
      payment: document.getElementById('payment').value,
      items: cart.map(function (c) { return { name: c.name, price: c.price, qty: c.qty }; }),
      total: total,
      status: 'Pending',
      date: dateISO(0)
    };

    const orders = getData('qb_orders', []);
    orders.push(order);
    setData('qb_orders', orders);
    setData('qb_cart', []);

    alert('Order placed successfully!\nYour Order ID is ' + order.id);
    window.location.href = 'track-order.html';
  });
}

// ---------------------------------------------------------
// 6. Track Order page
// ---------------------------------------------------------
function renderTrackPage() {
  const box = document.getElementById('ordersBox');
  if (!box) return;

  const user = getData('qb_currentUser', null);
  if (!user) {
    box.innerHTML = '<p class="empty">Please <a href="login-register.html">login</a> to see your orders.</p>';
    return;
  }

  const myOrders = getData('qb_orders', [])
    .filter(function (o) { return o.email === user.email; })
    .reverse();

  if (myOrders.length === 0) {
    box.innerHTML = '<p class="empty">You have not placed any orders yet. <a href="menu.html">Order something tasty!</a></p>';
    return;
  }

  box.innerHTML = myOrders.map(function (order) {
    const itemText = order.items.map(function (i) { return esc(i.name) + ' x' + i.qty; }).join(', ');
    const stepNumber = STATUS_LIST.indexOf(order.status);

    const steps = STATUS_LIST.map(function (name, index) {
      let css = 'step';
      if (index <= stepNumber) css += ' done';
      if (index < stepNumber) css += ' line-done';
      return '<div class="' + css + '"><span class="dot"></span>' + name + '</div>';
    }).join('');

    return '<div class="order-card">' +
      '<div class="order-top">' +
        '<div><strong>' + order.id + '</strong><br><span class="muted">' + itemText + '</span></div>' +
        '<span class="' + statusClass(order.status) + '">' + order.status + '</span>' +
      '</div>' +
      '<div class="steps">' + steps + '</div>' +
      '<p class="muted" style="margin-top:12px;">Total: Rs.' + order.total + ' &middot; Placed on ' + showDate(order.date) + '</p>' +
    '</div>';
  }).join('');
}

// ---------------------------------------------------------
// 7. Login and Register forms (validation form #2)
// ---------------------------------------------------------
function setupAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm || !registerForm) return;

  clearErrorsOnInput(loginForm);
  clearErrorsOnInput(registerForm);

  // ----- Login -----
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const emailOk = showError('loginEmail', isValidEmail(email) ? '' : 'Enter a valid email address');
    const passOk = showError('loginPassword', password.length >= 6 ? '' : 'Password must be at least 6 characters');
    if (!emailOk || !passOk) return;

    const users = getData('qb_users', []);
    const user = users.find(function (u) { return u.email === email && u.password === password; });

    if (!user) {
      showError('loginPassword', 'Wrong email or password');
      return;
    }

    setData('qb_currentUser', { name: user.name, email: user.email });
    window.location.href = 'menu.html';
  });

  // ----- Register -----
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    const users = getData('qb_users', []);
    const emailTaken = users.some(function (u) { return u.email === email; });

    let emailMessage = '';
    if (!isValidEmail(email)) emailMessage = 'Enter a valid email address';
    else if (emailTaken) emailMessage = 'This email is already registered';

    let passwordMessage = '';
    if (password.length < 6) passwordMessage = 'Password must be at least 6 characters';
    else if (!/[0-9]/.test(password) || !/[A-Za-z]/.test(password)) passwordMessage = 'Use both letters and numbers';

    const nameOk = showError('regName', /^[A-Za-z ]{3,}$/.test(name) ? '' : 'Name must have at least 3 letters (letters only)');
    const emailOk = showError('regEmail', emailMessage);
    const phoneOk = showError('regPhone', isValidPhone(phone) ? '' : 'Enter a valid 10-digit phone number');
    const passOk = showError('regPassword', passwordMessage);
    if (!nameOk || !emailOk || !phoneOk || !passOk) return;

    users.push({ name: name, email: email, phone: phone, password: password });
    setData('qb_users', users);
    setData('qb_currentUser', { name: name, email: email });

    alert('Registration successful! Welcome, ' + name);
    window.location.href = 'menu.html';
  });
}

// ---------------------------------------------------------
// 8. Contact form
// ---------------------------------------------------------
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  clearErrorsOnInput(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    const nameOk = showError('contactName', name.length >= 3 ? '' : 'Please enter your name');
    const emailOk = showError('contactEmail', isValidEmail(email) ? '' : 'Enter a valid email address');
    const messageOk = showError('contactMessage', message.length >= 10 ? '' : 'Message must be at least 10 characters');
    if (!nameOk || !emailOk || !messageOk) return;

    const messages = getData('qb_messages', []);
    messages.push({ name: name, email: email, message: message, date: dateISO(0) });
    setData('qb_messages', messages);

    form.reset();
    showToast('Message sent! We will reply soon.');
  });
}

// ---------------------------------------------------------
// Start everything (each function does nothing if its page part is missing)
// ---------------------------------------------------------
setupHeader();
renderHomePage();
renderMenuPage();
renderCartPage();
setupCheckoutForm();
renderTrackPage();
setupAuthForms();
setupContactForm();
