const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const UserSecret = require("../models/UserSecret");
const {otpauthURL} = require("speakeasy");

const CURRENT_KEY = process.env.CURRENT_ENCRYPTION_KEY;
const OLD_KEYS = (process.env.OLD_ENCRYPTION_KEYS || '').split(',').filter(k => k);
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CURRENT_KEY, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function tryDecrypt(encryptedText) {
    const keys = [CURRENT_KEY, ...OLD_KEYS];
    for (const key of keys) {
        try {
            const parts = encryptedText.split(':');
            const iv = Buffer.from(parts.shift(), 'hex');
            const encrypted = Buffer.from(parts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return decrypted.toString();
        } catch (err) {
            continue;
        }
    }
    throw new Error('Unable to decrypt secret.');
}

async function generateSecret(userId) {
    const existing = await UserSecret.findOne({ userId });

    let base32Secret;
    if (existing) {
        // Đã có -> giải mã secret
        base32Secret = tryDecrypt(existing.encryptedSecret);
    } else {
        // Chưa có -> tạo mới
        const newSecret = speakeasy.generateSecret({length: 20});
        base32Secret = newSecret.base32;
        const encryptedSecret = encrypt(base32Secret);

        await UserSecret.findOneAndUpdate(
            { userId },
            { encryptedSecret },
            { upsert: true, new: true }
        );
    }

    // Dù cũ hay mới thì đều cần tạo lại otpauth URL và QR code
    const otpauthUrl = otpauthURL({
        secret: base32Secret,
        label: `muvmuvtech:${userId}`,
        issuer: 'muvmuvtech',
        encoding: 'base32',
    });
    const encryptedSecret = encrypt(base32Secret);
    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return { encryptedSecret, qrCode };
}

function verifyToken(secret, token) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Cho phép lệch 1 khoảng thời gian nhỏ
    });
}

module.exports = { generateSecret, tryDecrypt, encrypt, verifyToken };
