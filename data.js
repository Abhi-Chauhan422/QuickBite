// ===== QuickBite - Shared data (used by both ClientSide and AdminSide) =====
// There is no backend, so the browser's localStorage works as our "database".
// Keys used:  qb_menu, qb_cart, qb_orders, qb_users, qb_currentUser, qb_admin, qb_messages

const STATUS_LIST = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];
const DELIVERY_FEE = 30;

const CATEGORY_EMOJI = {
  'Starters': '🥟',
  'Main Course': '🍛',
  'Desserts': '🍮',
  'Beverages': '🥤'
};

// Menu shown the very first time the site is opened
const DEFAULT_MENU = [
  { id: 1,  name: 'Paneer Tikka',    category: 'Starters',    price: 180, emoji: '🍢' },
  { id: 2,  name: 'Veg Spring Roll', category: 'Starters',    price: 150, emoji: '🥟' },
  { id: 3,  name: 'Butter Chicken',  category: 'Main Course', price: 280, emoji: '🍛' },
  { id: 4,  name: 'Dal Makhani',     category: 'Main Course', price: 220, emoji: '🍲' },
  { id: 5,  name: 'Veg Biryani',     category: 'Main Course', price: 210, emoji: '🍚' },
  { id: 6,  name: 'Hakka Noodles',   category: 'Main Course', price: 190, emoji: '🍜' },
  { id: 7,  name: 'Gulab Jamun',     category: 'Desserts',    price: 90,  emoji: '🍮' },
  { id: 8,  name: 'Rasmalai',        category: 'Desserts',    price: 110, emoji: '🍨' },
  { id: 9,  name: 'Masala Chaas',    category: 'Beverages',   price: 60,  emoji: '🥛' },
  { id: 10, name: 'Cold Coffee',     category: 'Beverages',   price: 80,  emoji: '☕' }
];

// ---------- Small helper functions ----------
function getData(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Stops user-typed text from breaking the page (e.g. an item named "<b>")
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Returns a date like 2026-11-16 (n days ago)
function dateISO(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - (daysAgo || 0));
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + month + '-' + day;
}

// 2026-11-16  ->  16/11/2026
function showDate(iso) {
  const p = iso.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

// Adds the right colour class to a status label
function statusClass(status) {
  return 'status status-' + status.replace(/ /g, '');
}

// ---------- First-time setup ----------
function setupFirstTimeData() {
  if (!localStorage.getItem('qb_menu')) {
    setData('qb_menu', DEFAULT_MENU);
  }

  // A few sample customers and orders so the admin panel is not empty
  // (sample customers can log in with password: demo123)
  if (!localStorage.getItem('qb_sample_loaded')) {
    setData('qb_users', [
      { name: 'Rahul Shah',  email: 'rahul@mail.com', phone: '9876543210', password: 'demo123' },
      { name: 'Priya Mehta', email: 'priya@mail.com', phone: '9876500000', password: 'demo123' },
      { name: 'Aman Patel',  email: 'aman@mail.com',  phone: '9876511111', password: 'demo123' }
    ]);

    setData('qb_orders', [
      makeSampleOrder('ORD4824', 'Rahul Shah', 'rahul@mail.com', '9876543210',
        [['Butter Chicken', 280, 2], ['Paneer Tikka', 180, 1]], 'Delivered', 6),
      makeSampleOrder('ORD4825', 'Priya Mehta', 'priya@mail.com', '9876500000',
        [['Dal Makhani', 220, 1], ['Rasmalai', 110, 2]], 'Delivered', 5),
      makeSampleOrder('ORD4826', 'Aman Patel', 'aman@mail.com', '9876511111',
        [['Butter Chicken', 280, 1], ['Hakka Noodles', 190, 1]], 'Delivered', 4),
      makeSampleOrder('ORD4827', 'Aman Patel', 'aman@mail.com', '9876511111',
        [['Veg Biryani', 210, 1], ['Masala Chaas', 60, 2]], 'Pending', 2),
      makeSampleOrder('ORD4828', 'Priya Mehta', 'priya@mail.com', '9876500000',
        [['Gulab Jamun', 90, 1]], 'Delivered', 1),
      makeSampleOrder('ORD4829', 'Rahul Shah', 'rahul@mail.com', '9876543210',
        [['Butter Chicken', 280, 1], ['Paneer Tikka', 180, 1]], 'Preparing', 0)
    ]);

    localStorage.setItem('qb_sample_loaded', 'yes');
  }
}

// items = [[name, price, qty], ...]
function makeSampleOrder(id, name, email, phone, items, status, daysAgo) {
  let total = DELIVERY_FEE;
  const list = items.map(function (i) {
    total += i[1] * i[2];
    return { name: i[0], price: i[1], qty: i[2] };
  });
  return {
    id: id, customer: name, email: email, phone: phone,
    address: '12, Sample Street, Rajkot',
    payment: 'Cash on Delivery',
    items: list, total: total, status: status, date: dateISO(daysAgo)
  };
}

setupFirstTimeData();
