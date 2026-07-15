import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '..', 'auth.log');

export async function logEvent(type, data = {}) {
  const entry = { time: new Date().toISOString(), type, ...data };
  try {
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
  } catch (err) {
    // best-effort logging; don't throw
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log', err);
  }
}
