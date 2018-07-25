const crypto = require('crypto');
const { secret } = require('../config/keys');
const algorythm = 'aes-256-cbc';
const encoding = 'utf8';
const digest = 'hex';

module.exports = {
  encrypt(value) {
    const cipher = crypto.createCipher(algorythm, secret);
    const crypted = cipher.update(value, encoding, digest);
    return crypted + cipher.final(digest);
  },
  decrypt(value) {
    const decipher = crypto.createDecipher(algorythm, secret);
    const dec = decipher.update(value, digest, encoding);
    return dec + decipher.final(encoding);
  },
};
