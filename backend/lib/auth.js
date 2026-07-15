import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const ACCESS_JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret';
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || 'inventory-refresh-secret';

export function signAccessToken(user) {
  return jwt.sign({ username: user.username, role: user.role }, ACCESS_JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m'
  });
}

export function signRefreshToken(user, jti) {
  // jti should be a unique identifier for refresh token rotation
  return jwt.sign({ username: user.username }, REFRESH_JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
    jwtid: jti || randomUUID()
  });
}

export function authenticateToken(req, res, next) {
  // Check Authorization header first (fallback), then HttpOnly access cookie
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header or cookie' });
  }
  try {
    const payload = jwt.verify(token, ACCESS_JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
