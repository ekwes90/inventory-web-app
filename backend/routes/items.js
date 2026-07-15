import { Router } from 'express';
import { authenticateToken, authorizeRole, verifyCsrf } from '../lib/auth.js';
import { getItems, getItem, createItem, updateItem, deleteItem } from '../db.js';

const router = Router();
// require authentication for all item routes
router.use(authenticateToken);
// verify CSRF for unsafe methods
router.use(verifyCsrf);

router.get('/', (req, res) => {
  const items = getItems(req.query);
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = getItem(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

router.post('/', authorizeRole(['admin', 'staff']), async (req, res) => {
  const { name, sku, category, unit, cost, quantity, location } = req.body;
  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }
  const item = await createItem({ name, sku, category, unit, cost, quantity, location });
  res.status(201).json(item);
});

router.put('/:id', authorizeRole(['admin', 'staff']), async (req, res) => {
  const item = await updateItem(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

router.delete('/:id', authorizeRole(['admin']), async (req, res) => {
  const deleted = await deleteItem(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.status(204).end();
});

export default router;
