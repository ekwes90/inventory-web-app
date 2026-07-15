import { Router } from 'express';
import { signAccessToken, signRefreshToken, authenticateToken } from '../lib/auth.js';
import { getUser, validatePassword, addRefreshToken, removeRefreshToken, hasRefreshToken } from '../db.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const router = Router();

// Login: issues access token and a httpOnly refresh cookie (refresh token is rotated server-side)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const user = getUser(username);
  if (!user || !validatePassword(user, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const access = signAccessToken(user);
  const jti = randomUUID();
  const refresh = signRefreshToken(user, jti);
  addRefreshToken(jti);

  // set HttpOnly access cookie (short-lived) and refresh cookie (longer-lived)
  res.cookie('accessToken', access, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refresh, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // set a non-HttpOnly CSRF token cookie for double-submit protection (rotated with access token)
  const csrf = randomUUID();
  res.cookie('csrfToken', csrf, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  // Return user info only; access token is in HttpOnly cookie
  res.json({ user: { username: user.username, role: user.role }, csrfToken: csrf });
});

// Refresh: rotate refresh token and return new access token
router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies && req.cookies.refreshToken;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET || 'inventory-refresh-secret');
    const jti = payload.jti || payload?.jti;
    if (!jti || !hasRefreshToken(jti)) return res.status(401).json({ error: 'Invalid refresh token' });
    const user = getUser(payload.username);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // rotate: remove old jti and issue a new one
    removeRefreshToken(jti);
    const newJti = randomUUID();
    const newRefresh = signRefreshToken(user, newJti);
    addRefreshToken(newJti);

    // set new refresh cookie
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // set new short-lived access cookie
    const access = signAccessToken(user);
    res.cookie('accessToken', access, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000
    });

    // rotate csrf token
    const csrf = randomUUID();
    res.cookie('csrfToken', csrf, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000
    });

    res.json({ ok: true, csrfToken: csrf });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout: remove refresh token and clear cookie
router.post('/logout', (req, res) => {
  const refreshToken = req.cookies && req.cookies.refreshToken;
  if (!refreshToken) {
    // still clear cookie client-side
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.json({ ok: true });
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET || 'inventory-refresh-secret');
    const jti = payload.jti || payload?.jti;
    if (jti) removeRefreshToken(jti);
  } catch (err) {
    // ignore invalid token
  }
  // clear both cookies
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.clearCookie('accessToken', { path: '/' });
  res.json({ ok: true });
});

// Returns info about the access token holder
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
