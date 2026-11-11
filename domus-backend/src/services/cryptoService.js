const crypto = require('crypto');

function getKey() {
    const hex = process.env.META_TOKEN_KEY;

    if (!hex || hex.length !== 64) {
        throw new Error('META_TOKEN_KEY ausente ou invalida (precisa de 64 caracteres hexadecimais).');
    }

    return Buffer.from(hex, 'hex');
}

function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(payload) {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));

    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    return Buffer.concat([
        decipher.update(Buffer.from(dataHex, 'hex')),
        decipher.final()
    ]).toString('utf8');
}

module.exports = { encrypt, decrypt };