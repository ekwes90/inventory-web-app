import { Router } from 'express';
import { signAccessToken, signRefreshToken, authenticateToken } from '../lib/auth.js';
import { getUser, validatePassword, addRefreshToken, removeRefreshToken, hasRefreshToken, removeAllRefreshTokensForUser, findRefreshToken, removeRefreshTokensForDevice } from '../db.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { logEvent } from '../lib/audit.js';
import { isAllowed, resetKey } from '../lib/rateLimiter.js';

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
  // per-device: generate deviceId and set cookie
  const deviceId = randomUUID();
  addRefreshToken(jti, user.username, deviceId);

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

  // set deviceId cookie (non-HttpOnly so client/test can send it back)
  res.cookie('deviceId', deviceId, { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });

  // set a non-HttpOnly CSRF token cookie for double-submit protection (rotated with access token)
  const csrf = randomUUID();
  res.cookie('csrfToken', csrf, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  // audit
  logEvent('refresh.issue', { username: user.username, jti, deviceId, ip: req.ip });
  // Return user info only; access token is in HttpOnly cookie
  res.json({ user: { username: user.username, role: user.role }, csrfToken: csrf, deviceId });
});

// Refresh: rotate refresh token and return new access token
router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies && req.cookies.refreshToken;
  const deviceId = req.cookies && req.cookies.deviceId;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  // rate limiting key
  const key = req.ip + ':' + (deviceId || 'no-device');
  if (!isAllowed(key, 10, 60_000)) {
    logEvent('refresh.rate_limit', { ip: req.ip, deviceId });
    return res.status(429).json({ error: 'Too many refresh attempts' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET || 'inventory-refresh-secret');
    const jti = payload.jti || payload?.jti;
    const user = getUser(payload.username);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // If the provided jti is unknown or device mismatch, treat as possible replay for that device and revoke device tokens
    const tokenRecord = findRefreshToken(jti);
    if (!jti || !tokenRecord) {
      // suspected replay: revoke all tokens for this device (if deviceId known) and log
      if (deviceId) removeRefreshTokensForDevice(user.username, deviceId);
      logEvent('refresh.replay_detected', { username: user.username, jti, deviceId, ip: req.ip });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (tokenRecord.deviceId && deviceId && tokenRecord.deviceId !== deviceId) {
      // jti exists but device doesn't match - revoke that jti and log
      removeRefreshToken(jti);
      logEvent('refresh.device_mismatch', { username: user.username, jti, expectedDevice: tokenRecord.deviceId, receivedDevice: deviceId, ip: req.ip });
      return res.status(401).json({ error: 'Invalid refresh token for this device' });
    }

    // rotate: remove old jti and issue a new one for same device
    removeRefreshToken(jti);
    const newJti = randomUUID();
    const newRefresh = signRefreshToken(user, newJti);
    addRefreshToken(newJti, user.username, deviceId);

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

    // audit rotate
    logEvent('refresh.rotate', { username: user.username, oldJti: jti, newJti, deviceId, ip: req.ip });

    // reset rate limiter for this key on success
    resetKey(key);

    res.json({ ok: true, csrfToken: csrf });
  } catch (err) {
    logEvent('refresh.invalid_token', { err: err.message, ip: req.ip });
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
