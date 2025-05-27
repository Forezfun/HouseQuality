const sendEmail = require('../../src/helpers/sendcode');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('sendEmail', () => {
  const sendMailMock = jest.fn((mailOptions, callback) => callback(null));

  beforeAll(() => {
    nodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock
    });
  });

  beforeEach(() => {
    sendMailMock.mockClear();
  });

  it('should send reset code email and return resetCode', () => {
    const result = sendEmail('test@example.com', 'resetCode');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0]).toMatchObject({
      to: 'test@example.com',
      subject: 'HouseQuality',
    });
    expect(result).toHaveProperty('resetCode');
    expect(typeof result.resetCode).toBe('string');
  });

  it('should send furniture delete email and return message', () => {
    const additionalData = {
      furnitureName: 'Шкаф',
      roomsNamesArray: ['Гостиная', 'Спальня']
    };
    const result = sendEmail('user@example.com', 'furnitureDelete', additionalData);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0]).toMatchObject({
      to: 'user@example.com',
      subject: 'HouseQuality',
    });
    expect(result).toEqual({ message: 'Message sent' });
  });

  it('should handle unknown email type gracefully', () => {
    const result = sendEmail('user@example.com', 'unknownType');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });
});
