const crypto = require('crypto');
const {algorithm, encryptionIV, key} = require('../config/security');

const encrypt = url => {
    const cipher = crypto.createCipheriv(algorithm, key, encryptionIV);
    const encrypted = Buffer.from(
        cipher.update(url, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64');
    return encrypted;
};

const decrypt = url => {
    const buff = Buffer.from(url, 'base64');
    const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV);
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8'));
};

module.exports = {
    encrypt,
    decrypt
};
