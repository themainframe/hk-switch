/**
 * Mock DHCP server.
 */

const winston = require('winston');

class MockDHCP {

  constructor (config) {
    this.config = config;
  }

  /**
   * Starts the mock DHCP server.
   */
  start () {
    winston.info("starting mock DHCP server");
  }

  /**
   * Stops the DHCP server.
   */
  stop () {
    winston.info("stopping mock DHCP server");
  }

}

module.exports = MockDHCP;
