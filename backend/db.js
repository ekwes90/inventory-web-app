import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageFile = path.join(__dirname, 'data.json');

let db = {
  nextItemId: 1,
  nextTransactionId: 1,
  users: [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'staff', password: 'staff123', role: 'staff' }
  ],
  items: [],
  stock_transactions: [],
  refresh_tokens: []
};

async function saveData() {
  await fs.writeFile(storageFile, JSON.stringify(db, null, 2));
}

async function loadData() {
  try {
    const raw = await fs.readFile(storageFile, 'utf8');
    db = JSON.parse(raw);
  } catch (error) {
    await saveData();
  }
  // Ensure passwords are hashed (simple heuristic: bcrypt hashes start with $2)
  let changed = false;
  for (const user of db.users) {
    if (!user.password || typeof user.password !== 'string') continue;
    if (!user.password.startsWith('$2')) {
      // hash and replace
      const hash = bcrypt.hashSync(user.password, 10);
      user.password = hash;
      changed = true;
    }
  }
  if (!Array.isArray(db.refresh_tokens)) {
    db.refresh_tokens = [];
    changed = true;
  }
  // migrate legacy refresh token entries (strings) to objects { jti, username, issued_at }
  const migrated = db.refresh_tokens.map((rt) => {
    if (!rt) return null;
    if (typeof rt === 'string') {
      return { jti: rt, username: null, issued_at: new Date().toISOString() };
    }
    return rt;
  }).filter(Boolean);
  if (migrated.length !== db.refresh_tokens.length) {
    db.refresh_tokens = migrated;
    changed = true;
  }
  if (changed) await saveData();
}

export async function initDatabase() {
  await loadData();
  if (db.items.length === 0) {
    const createdAt = new Date().toISOString();
    const defaultItem = {
      id: db.nextItemId++,
      name: 'Sample Inventory Item',
      sku: 'INV-001',
      category: 'General',
      unit: 'each',
      cost: 12.5,
      quantity: 50,
      location: 'Main Warehouse',
      created_at: createdAt,
      updated_at: createdAt
    };
    db.items.push(defaultItem);
    await saveData();
  }
}

export function getUser(username) {
  return db.users.find((user) => user.username === username);
}

export function validatePassword(user, plain) {
  if (!user || !user.password) return false;
  return bcrypt.compareSync(plain, user.password);
}

// Store refresh token objects { jti, username, issued_at } for rotation and revocation
export function addRefreshToken(jti, username) {
  if (!jti) return;
  db.refresh_tokens.push({ jti, username: username || null, issued_at: new Date().toISOString() });
  // best-effort save
  saveData();
}

export function removeRefreshToken(jti) {
  const idx = db.refresh_tokens.findIndex((t) => t.jti === jti);
  if (idx !== -1) {
    db.refresh_tokens.splice(idx, 1);
    saveData();
    return true;
  }
  return false;
}

export function hasRefreshToken(jti) {
  return db.refresh_tokens.some((t) => t.jti === jti);
}

export function removeAllRefreshTokensForUser(username) {
  if (!username) return;
  const before = db.refresh_tokens.length;
  db.refresh_tokens = db.refresh_tokens.filter((t) => t.username !== username);
  if (db.refresh_tokens.length !== before) saveData();
}


export function getItems({ q, category } = {}) {
  return db.items.filter((item) => {
    const matchesQuery = q
      ? item.name.toLowerCase().includes(q.toLowerCase()) || item.sku.toLowerCase().includes(q.toLowerCase())
      : true;
    const matchesCategory = category ? item.category.toLowerCase() === category.toLowerCase() : true;
    return matchesQuery && matchesCategory;
  });
}

export function getItem(id) {
  return db.items.find((item) => item.id === Number(id));
}

export async function createItem(fields) {
  const now = new Date().toISOString();
  const item = {
    id: db.nextItemId++,
    name: fields.name || 'New item',
    sku: fields.sku || '',
    category: fields.category || 'Uncategorized',
    unit: fields.unit || 'each',
    cost: Number(fields.cost) || 0,
    quantity: Number(fields.quantity) || 0,
    location: fields.location || '',
    created_at: now,
    updated_at: now
  };
  db.items.push(item);
  await saveData();
  return item;
}

export async function updateItem(id, fields) {
  const item = getItem(id);
  if (!item) {
    return null;
  }
  Object.assign(item, {
    name: fields.name ?? item.name,
    sku: fields.sku ?? item.sku,
    category: fields.category ?? item.category,
    unit: fields.unit ?? item.unit,
    cost: fields.cost !== undefined ? Number(fields.cost) : item.cost,
    location: fields.location ?? item.location,
    quantity: fields.quantity !== undefined ? Number(fields.quantity) : item.quantity,
    updated_at: new Date().toISOString()
  });
  await saveData();
  return item;
}

export async function deleteItem(id) {
  const index = db.items.findIndex((item) => item.id === Number(id));
  if (index === -1) {
    return false;
  }
  db.items.splice(index, 1);
  await saveData();
  return true;
}

export async function addStockTransaction(itemId, type, quantity, reason, createdBy) {
  const item = getItem(itemId);
  if (!item) {
    return null;
  }
  const amount = type === 'out' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
  const newQuantity = item.quantity + amount;
  if (newQuantity < 0) {
    throw new Error('Stock cannot become negative');
  }
  item.quantity = newQuantity;
  item.updated_at = new Date().toISOString();

  const transaction = {
    id: db.nextTransactionId++,
    item_id: item.id,
    type,
    quantity: amount,
    reason: reason || '',
    created_by: createdBy,
    created_at: new Date().toISOString()
  };
  db.stock_transactions.push(transaction);
  await saveData();
  return transaction;
}

export function getTransactions(itemId) {
  return db.stock_transactions.filter((transaction) => transaction.item_id === Number(itemId));
}
