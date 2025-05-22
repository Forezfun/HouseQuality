const { encryptPassword, decryptPassword } = require('../../src/helpers/passwordHandlers');
require('dotenv').config();

describe('encryptPassword and decryptPassword', () => {
  const samplePassword = 'mySecret123';

  it('should encrypt the password and return a string', () => {
    const encrypted = encryptPassword(samplePassword);
    expect(typeof encrypted.toString()).toBe('string');
    expect(encrypted.toString().length).toBeGreaterThan(0);
  });

  it('should decrypt the encrypted password back to original', () => {
    const encrypted = encryptPassword(samplePassword);
    const decrypted = decryptPassword(encrypted.toString());
    expect(decrypted).toBe(samplePassword);
  });

  it('should not decrypt incorrect ciphertext to original password', () => {
    const decrypted = decryptPassword('incorrectciphertext');
    expect(decrypted).not.toBe(samplePassword);
    expect(typeof decrypted).toBe('string');
  });

  it('should return empty string when decrypting empty string', () => {
    const decrypted = decryptPassword('');
    expect(decrypted).toBe('');
  });
});
