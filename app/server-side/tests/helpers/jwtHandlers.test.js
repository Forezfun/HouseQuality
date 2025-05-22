const JWT_SERVICE = require('jsonwebtoken');
const { isTokenNoneExpired, checkUserAccess } = require('../../src/helpers/jwtHandlers'); 
const ACCOUNT = require('../../src/models/account');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/account');

describe('isTokenNoneExpired', () => {
  it('should return true for a valid token', () => {
    JWT_SERVICE.verify.mockReturnValue({}); 
    const result = isTokenNoneExpired('validToken');
    expect(result).toBe(true);
  });

  it('should return false for an expired token', () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    JWT_SERVICE.verify.mockImplementation(() => {
      throw error;
    });
    const result = isTokenNoneExpired('expiredToken');
    expect(result).toBe(false);
  });

  it('should return true for other errors (malformed token, etc.)', () => {
    const error = new Error('invalid token');
    error.name = 'JsonWebTokenError';
    JWT_SERVICE.verify.mockImplementation(() => {
      throw error;
    });
    const result = isTokenNoneExpired('invalidToken');
    expect(result).toBe(true);
  });
});

describe('checkUserAccess', () => {
  it('should return false if token is invalid', async () => {
    JWT_SERVICE.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const result = await checkUserAccess('badToken');
    expect(result).toBe(false);
  });

  it('should return false if token is valid but decoding fails', async () => {
    JWT_SERVICE.verify.mockReturnValue(null); 
    const result = await checkUserAccess('tokenWithoutPayload');
    expect(result).toBe(false);
  });

  it('should return false if account is not found', async () => {
    JWT_SERVICE.verify.mockReturnValue({ accountId: '123' });
    ACCOUNT.findById.mockResolvedValue(null);

    const result = await checkUserAccess('validToken');
    expect(result).toBe(false);
  });

  it('should return accountId if everything is valid', async () => {
    JWT_SERVICE.verify.mockReturnValue({ accountId: '123' });
    ACCOUNT.findById.mockResolvedValue({ _id: '123' });

    const result = await checkUserAccess('validToken');
    expect(result).toBe('123');
  });
});
