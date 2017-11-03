/**
 * A mock GPIO interface that doesn't really do anything.
 */

const winston = require('winston');

class MockGPIO {

  static setup (pin, direction, callback) {
    winston.info('setup GPIO pin:', pin);
    (callback ? callback : () => {}).apply({
      err: null
    });
  }

  static write (pin, value, callback) {
    winston.info('mock GPIO write:', pin, '=', value);
    (callback ? callback : () => {}).apply({
      err: null
    });
  }

  static read (pin, callback) {
    winston.info('mock GPIO read:', pin);
    (callback ? callback : () => {}).apply({
      err: null,
      value: 0
    });
  }

}

module.exports = MockGPIO;
