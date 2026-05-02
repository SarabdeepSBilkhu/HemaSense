const crypto = require('crypto');

// In production, these should be loaded from env/KMS
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'hf83nf92m0dn38am2nd93mald82nf9d2'; // Must be 32 chars
const IV_LENGTH = 16; 

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(typeof text === 'object' ? JSON.stringify(text) : text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const result = decrypted.toString();
  try { return JSON.parse(result); } catch (e) { return result; }
}

module.exports = { encrypt, decrypt };
