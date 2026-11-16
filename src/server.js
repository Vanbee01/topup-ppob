require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
const payment = require('./payment');

const app = express();
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('SESSION_SECRET minimal 32 karakter wajib di production');
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(session({
  name: 'topup.sid',
  secret: process.env.SESSION_SECRET || 'local-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 12 * 60 * 60 * 1000 }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);
app.use('/api/orders', orderLimiter);

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get()) {
  const existing = db.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').get(process.env.ADMIN_EMAIL);
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
  if (existing) {
    db.prepare("UPDATE users SET name='Administrator',password_hash=?,role='admin' WHERE id=?").run(passwordHash, existing.id);
  } else {
    db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Administrator', process.env.ADMIN_EMAIL, passwordHash, 'admin');
  }
}

const requireAuth = (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'Silakan login.' });
const requireAdmin = (req, res, next) => req.session.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Akses admin ditolak.' });
const invoice = () => `TP${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT id,category,provider_code,name,description,price FROM products WHERE active=1 ORDER BY category,id').all();
  res.json({ products });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 60 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Data pendaftaran tidak valid.' });
  }
  try {
    const info = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)')
      .run(name.trim(), email.trim(), bcrypt.hashSync(password, 12));
    req.session.user = { id: info.lastInsertRowid, name: name.trim(), email: email.trim(), role: 'customer' };
    return res.status(201).json({ user: req.session.user });
  } catch (error) {
    return res.status(409).json({ error: 'Email sudah digunakan.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }
  req.session.regenerate((error) => {
    if (error) return res.status(500).json({ error: 'Gagal membuat sesi.' });
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.json({ user: req.session.user });
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));

app.post('/api/orders', async (req, res) => {
  const productId = Number(req.body?.productId);
  const target = typeof req.body?.target === 'string' ? req.body.target.trim() : '';
  if (!Number.isSafeInteger(productId) || productId <= 0 || target.length < 3 || target.length > 100) {
    return res.status(400).json({ error: 'Data pesanan tidak valid.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(productId);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan atau tidak aktif.' });

  const orderInvoice = invoice();
  db.prepare("INSERT INTO orders(invoice,user_id,product_id,target,amount,status) VALUES(?,?,?,?,?,'PAYMENT_NOT_CONFIGURED')")
    .run(orderInvoice, req.session.user?.id || null, product.id, target, product.price);

  // The payment adapter deliberately throws until a real provider is configured.
  try {
    const charge = await payment.createPayment({ invoice: orderInvoice, amount: product.price });
    return res.status(201).json({ invoice: orderInvoice, amount: product.price, payment: charge });
  } catch (error) {
    return res.status(202).json({
      invoice: orderInvoice,
      amount: product.price,
      status: 'PAYMENT_NOT_CONFIGURED',
      notice: 'Pesanan demo tersimpan. Gateway pembayaran belum aktif; jangan melakukan transfer.'
    });
  }
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT o.invoice,o.target,o.amount,o.status,o.created_at,p.name product_name FROM orders o JOIN products p ON p.id=o.product_id WHERE o.user_id=? ORDER BY o.id DESC')
    .all(req.session.user.id);
  res.json({ orders });
});

app.get('/api/admin/summary', requireAuth, requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT COUNT(*) total,COALESCE(SUM(amount),0) gross FROM orders').get();
  const customers = db.prepare("SELECT COUNT(*) n FROM users WHERE role='customer'").get().n;
  res.json({ orders, customers });
});

app.get('/api/admin/orders', requireAuth, requireAdmin, (req, res) => {
  const orders = db.prepare(`SELECT o.*,COALESCE(u.email,'Pesanan tamu') AS email,p.name AS product_name
    FROM orders o LEFT JOIN users u ON u.id=o.user_id
    JOIN products p ON p.id=o.product_id ORDER BY o.id DESC LIMIT 200`).all();
  res.json({ orders });
});

app.use(express.static(path.join(__dirname, '../public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`TopUpKita listening on ${port}`));
