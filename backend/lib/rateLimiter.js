const attempts = new Map();

export function isAllowed(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, start: now };
  if (now - rec.start > windowMs) {
    // reset
    rec.count = 1;
    rec.start = now;
    attempts.set(key, rec);
    return true;
  }
  rec.count += 1;
  attempts.set(key, rec);
  return rec.count <= limit;
}

export function resetKey(key) {
  attempts.delete(key);
}
