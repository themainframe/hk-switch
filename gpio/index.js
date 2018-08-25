/**
 * GPIO.
 * Hides the GPIO from platforms that don't support it.
 */

module.exports = require(
  process.env.hasOwnProperty('NODE_ENV') &&
  process.env.NODE_ENV.indexOf('dev') !== 0 ? 'rpi-gpio' : './mock'
);
