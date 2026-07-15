import jwt from 'jsonwebtoken';
const token = "";
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET || 'inventory-secret');
  console.log(JSON.stringify(payload));
} catch (e) {
  console.error('verify-error', e.message);
}
