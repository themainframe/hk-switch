/**
 * DHCP server.
 */

module.exports = require(
  process.env.hasOwnProperty('NODE_ENV') &&
  process.env.NODE_ENV.indexOf('dev') !== 0 ? './dhcp' : './mock'
);
