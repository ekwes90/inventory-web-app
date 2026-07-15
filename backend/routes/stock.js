import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../lib/auth.js';
import { addStockTransaction, getTransactions, getItem } from '../db.js';

const router = Router();
router.use(authenticateToken);

router.post('/transactions', async (req, res) => {
  const { item_id, type, quantity, reason } = req.body;
  if (!item_id || !type || quantity === undefined) {
    return res.status(400).json({ error: 'item_id, type, and quantity are required' });
  }
  if (!['in', 'out'].includes(type)) {
    return res.status(400).json({ error: 'type must be either "in" or "out"' });
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }
  const item = getItem(item_id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  try {
    const transaction = await addStockTransaction(item_id, type, quantity, reason, req.user.username);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/transactions/:itemId', (req, res) => {
  const item = getItem(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const transactions = getTransactions(req.params.itemId);
  res.json(transactions);
});

router.post('/transactions/admin', authorizeRole(['admin']), async (req, res) => {
  const { item_id, type, quantity, reason } = req.body;
  if (!item_id || !type || quantity === undefined) {
    return res.status(400).json({ error: 'item_id, type, and quantity are required' });
  }
  try {
    const transaction = await addStockTransaction(item_id, type, quantity, reason, req.user.username);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
