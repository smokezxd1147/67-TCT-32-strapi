
const crypto = require('crypto');
const md5 = require('md5');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.SECRET_KEY); // Should be a 32-byte key for aes-256
const iv = process.env.SECRET_IV; // Should be a 16-byte IV for aes-256-cbc


const encryptedmobie = (mobie) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedmobie = cipher.update(mobie, 'utf8', 'hex');
  encryptedmobie += cipher.final('hex');
 // Pad the encrypted phone number to ensure it's at least 128 characters long
  encryptedmobie = padToLength(encryptedmobie, 128);

  return encryptedmobie;
};

const decryptmobie = (encryptedmobie) => {
  encryptedmobie = removePadding(encryptedmobie);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let mobie = decipher.update(encryptedmobie, 'hex', 'utf8');
  mobie += decipher.final('utf8');

  return mobie;
};

// Custom padding function to ensure fixed length
const padToLength = (string, length) => {
  if (string.length >= length) return string; // No need to pad
  const paddingLength = length - string.length;
  const padding = crypto.randomBytes(paddingLength).toString('hex');
  return string+padding;
};

// Custom function to remove padding
const removePadding = (string) => {
  const paddingLength = 32; // Number of characters to remove
  if (string.length > paddingLength) {
    return string.slice(0, paddingLength); // Remove trailing characters
  } else {
    return string; // No padding to remove
  }
};


module.exports = {
  async beforeCreate(event) {
    console.log('beforeCreate', event.params);
    event.params.data.mobie = encryptedmobie(event.params.data.mobie);
  },
  async beforeUpdate(event) {
    console.log('beforeUpdate', event.params.data);
    event.params.data.mobie = encryptedmobie(event.params.data.mobie);
  },
  async afterFindMany(event) {
    console.log('afterFindMany', event.result);
    event.result.forEach(item => {
      if (item.mobie) {
        item.mobie = decryptmobie(item.mobie);
        console.log('afterFindMany :', item.mobie);
      }
    });
  },
  async afterFindOne(event) {
    console.log('afterFindOne', event.result);
    if (event.result && event.result.mobie) {
      event.result.mobie = decryptmobie(event.result.mobie);
      console.log('afterFindOne :', event.result.mobie);
    }
  },
};