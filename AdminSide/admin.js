// ===== QuickBite - Admin Side Script =====
// Needs ../data.js to be loaded first (getData, setData, esc, etc.)

// ---------------------------------------------------------
// 1. Login / Logout / page protection
// ---------------------------------------------------------
// Every admin page except the login page calls this
function requireAdmin() {
  if (localStorage.getItem('qb_admin') !== 'yes') {
    window.location.href = 'admin-login.html';
  }
}

function adminLogout() {
  localStorage.removeItem('qb_admin');
  window.location.href = 'admin-login.html';
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId + 'Error');
  error.textContent = message;
  input.classList.toggle('invalid', message !== '');
  return message === '';
}

function setupAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.querySelectorAll('input').forEach(function (field) {
    field.addEventListener('input', function () { showError(field.id, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const userOk = showError('username', username !== '' ? '' : 'Please enter username');
    const passOk = showError('password', password !== '' ? '' : 'Please enter password');
    if (!userOk || !passOk) return;

    if (username === 'admin@gmail.com' && password === 'admin123') {
      localStorage.setItem('qb_admin', 'yes');
      window.location.href = 'dashboard.html';
    } else {
      showError('password', 'Wrong username or password');
    }
  });
}

// ---------------------------------------------------------
// 2. Dashboard
// ---------------------------------------------------------
function ordersTableRows(orders) {
  return orders.map(function (o) {
    const itemText = o.items.map(function (i) { return esc(i.name) + ' x' + i.qty; }).join(', ');
    return '<tr>' +
      '<td>' + o.id + '</td>' +
      '<td>' + esc(o.customer) + '</td>' +
      '<td>' + itemText + '</td>' +
      '<td>Rs.' + o.total + '</td>' +
      '<td><span class="' + statusClass(o.status) + '">' + o.status + '</span></td>' +
    '</tr>';
  }).join('');
}

function renderDashboard() {
  const box = document.getElementById('dashRecentOrders');
  if (!box) return;

  const orders = getData('qb_orders', []);
  let revenue = 0;
  orders.forEach(function (o) { revenue += o.total; });

  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = 'Rs.' + revenue;
  document.getElementById('statCustomers').textContent = getData('qb_users', []).length;
  document.getElementById('statItems').textContent = getData('qb_menu', []).length;

  const recent = orders.slice(-5).reverse();
  box.innerHTML = '<tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>' +
    (recent.length ? ordersTableRows(recent) : '<tr><td colspan="5">No orders yet.</td></tr>');
}

// ---------------------------------------------------------
// 3. Manage Menu (add, edit, delete)
// ---------------------------------------------------------
function renderMenuTable() {
  const table = document.getElementById('menuTable');
  if (!table) return;

  const menu = getData('qb_menu', []);
  table.innerHTML = '<tr><th>Item</th><th>Category</th><th>Price</th><th>Action</th></tr>' +
    (menu.length ? menu.map(function (m) {
      return '<tr>' +
        '<td>' + m.emoji + ' ' + esc(m.name) + '</td>' +
        '<td>' + esc(m.category) + '</td>' +
        '<td>Rs.' + m.price + '</td>' +
        '<td>' +
          '<button class="link-btn" onclick="editMenuItem(' + m.id + ')">Edit</button> | ' +
          '<button class="link-btn" onclick="deleteMenuItem(' + m.id + ')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="4">No items. Add one above.</td></tr>');
}

function editMenuItem(id) {
  const item = getData('qb_menu', []).find(function (m) { return m.id === id; });
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('formTitle').textContent = 'Edit Item';
  document.getElementById('saveItemBtn').textContent = 'Update Item';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  window.scrollTo(0, 0);
}

function resetMenuForm() {
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('formTitle').textContent = 'Add New Item';
  document.getElementById('saveItemBtn').textContent = 'Save Item';
  document.getElementById('cancelEditBtn').style.display = 'none';
  ['itemName', 'itemPrice'].forEach(function (id) { showError(id, ''); });
}

function deleteMenuItem(id) {
  if (!confirm('Delete this item from the menu?')) return;
  const menu = getData('qb_menu', []).filter(function (m) { return m.id !== id; });
  setData('qb_menu', menu);
  renderMenuTable();
}

function setupMenuForm() {
  const form = document.getElementById('itemForm');
  if (!form) return;

  form.querySelectorAll('input').forEach(function (field) {
    field.addEventListener('input', function () { showError(field.id, ''); });
  });
  document.getElementById('cancelEditBtn').addEventListener('click', resetMenuForm);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = Number(document.getElementById('itemPrice').value);

    const nameOk = showError('itemName', name.length >= 2 ? '' : 'Item name must have at least 2 characters');
    const priceOk = showError('itemPrice', price > 0 ? '' : 'Enter a price greater than 0');
    if (!nameOk || !priceOk) return;

    const menu = getData('qb_menu', []);

    if (id) {
      // Editing an existing item
      const item = menu.find(function (m) { return m.id === Number(id); });
      item.name = name;
      item.category = category;
      item.price = price;
      item.emoji = CATEGORY_EMOJI[category];
    } else {
      // Adding a new item (new id = biggest id + 1)
      let newId = 1;
      menu.forEach(function (m) { if (m.id >= newId) newId = m.id + 1; });
      menu.push({ id: newId, name: name, category: category, price: price, emoji: CATEGORY_EMOJI[category] });
    }

    setData('qb_menu', menu);
    resetMenuForm();
    renderMenuTable();
  });
}

// ---------------------------------------------------------
// 4. Manage Orders
// ---------------------------------------------------------
function renderOrdersPage() {
  const table = document.getElementById('ordersTable');
  if (!table) return;

  const orders = getData('qb_orders', []).slice().reverse();
  table.innerHTML = '<tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th><th>Action</th></tr>' +
    (orders.length ? orders.map(function (o) {
      const itemText = o.items.map(function (i) { return esc(i.name) + ' x' + i.qty; }).join(', ');
      const options = STATUS_LIST.map(function (s) {
        return '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
      return '<tr>' +
        '<td>' + o.id + '</td>' +
        '<td>' + esc(o.customer) + '<br><span class="muted">' + esc(o.phone) + '</span></td>' +
        '<td>' + itemText + '<br><span class="muted">' + esc(o.address) + '</span></td>' +
        '<td>Rs.' + o.total + '</td>' +
        '<td>' + showDate(o.date) + '</td>' +
        '<td><select id="status-' + o.id + '">' + options + '</select></td>' +
        '<td><button class="btn btn-small" onclick="updateOrderStatus(\'' + o.id + '\')">Update</button></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="7">No orders yet.</td></tr>');
}

function updateOrderStatus(orderId) {
  const orders = getData('qb_orders', []);
  const order = orders.find(function (o) { return o.id === orderId; });
  order.status = document.getElementById('status-' + orderId).value;
  setData('qb_orders', orders);
  alert('Order ' + orderId + ' marked as ' + order.status);
}

// ---------------------------------------------------------
// 5. Manage Customers
// ---------------------------------------------------------
function renderCustomersPage() {
  const table = document.getElementById('customersTable');
  if (!table) return;

  const searchBox = document.getElementById('customerSearch');

  function showCustomers() {
    const text = searchBox.value.trim().toLowerCase();
    const orders = getData('qb_orders', []);
    const users = getData('qb_users', []).filter(function (u) {
      return u.name.toLowerCase().includes(text) || u.email.toLowerCase().includes(text);
    });

    table.innerHTML = '<tr><th>Name</th><th>Email</th><th>Phone</th><th>Total Orders</th><th>Action</th></tr>' +
      (users.length ? users.map(function (u) {
        const count = orders.filter(function (o) { return o.email === u.email; }).length;
        return '<tr>' +
          '<td>' + esc(u.name) + '</td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td>' + esc(u.phone) + '</td>' +
          '<td>' + count + '</td>' +
          '<td><button class="link-btn" onclick="deleteCustomer(\'' + esc(u.email) + '\')">Delete</button></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="5">No customers found.</td></tr>');
  }

  searchBox.addEventListener('input', showCustomers);
  window.refreshCustomers = showCustomers;
  showCustomers();
}

function deleteCustomer(email) {
  if (!confirm('Delete this customer account?')) return;
  const users = getData('qb_users', []).filter(function (u) { return u.email !== email; });
  setData('qb_users', users);
  window.refreshCustomers();
}

// ---------------------------------------------------------
// 6. Reports
// ---------------------------------------------------------
function renderReportsPage() {
  const table = document.getElementById('reportTable');
  if (!table) return;

  const fromBox = document.getElementById('fromDate');
  const toBox = document.getElementById('toDate');

  function showReport() {
    const from = fromBox.value;
    const to = toBox.value;

    // Keep only orders inside the chosen date range (dates are like 2026-11-16, so text compare works)
    const orders = getData('qb_orders', []).filter(function (o) {
      return (from === '' || o.date >= from) && (to === '' || o.date <= to);
    });

    let sales = 0;
    const sold = {};   // item name -> { qty, money }
    orders.forEach(function (o) {
      sales += o.total;
      o.items.forEach(function (i) {
        if (!sold[i.name]) sold[i.name] = { qty: 0, money: 0 };
        sold[i.name].qty += i.qty;
        sold[i.name].money += i.qty * i.price;
      });
    });

    const names = Object.keys(sold).sort(function (a, b) { return sold[b].qty - sold[a].qty; });

    document.getElementById('repSales').textContent = 'Rs.' + sales;
    document.getElementById('repOrders').textContent = orders.length;
    document.getElementById('repBest').textContent = names.length ? names[0] : '-';

    table.innerHTML = '<tr><th>Item</th><th>Units Sold</th><th>Revenue</th></tr>' +
      (names.length ? names.map(function (n) {
        return '<tr><td>' + esc(n) + '</td><td>' + sold[n].qty + '</td><td>Rs.' + sold[n].money + '</td></tr>';
      }).join('') : '<tr><td colspan="3">No sales in this period.</td></tr>');
  }

  document.getElementById('applyBtn').addEventListener('click', showReport);
  document.getElementById('resetBtn').addEventListener('click', function () {
    fromBox.value = '';
    toBox.value = '';
    showReport();
  });
  showReport();
}

// ---------------------------------------------------------
// Start everything (each function does nothing if its page part is missing)
// ---------------------------------------------------------
// Every page except the login page is protected
if (!document.getElementById('adminLoginForm')) requireAdmin();

setupAdminLogin();
renderDashboard();
renderMenuTable();
setupMenuForm();
renderOrdersPage();
renderCustomersPage();
renderReportsPage();
