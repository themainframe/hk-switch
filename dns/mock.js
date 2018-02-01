/**
 * Mock DNS server.
 */

const winston = require('winston');

class MockDNS {

  constructor (config) {
    this.config = config;
  }

  start () {
    winston.info("starting mock DNS server");
  }

  stop () {
    winston.info("stopping mock DNS server");
  }

}

module.exports = MockDNS;
