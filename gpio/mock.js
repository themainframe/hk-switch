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

// Define some constants to match up with rpi-gpio
MockGPIO.DIR_IN = 'in';
MockGPIO.DIR_OUT = 'out';
MockGPIO.DIR_LOW = 'low';
MockGPIO.DIR_HIGH = 'high';
MockGPIO.MODE_RPI = 'mode_rpi';
MockGPIO.MODE_BCM = 'mode_bcm';
MockGPIO.EDGE_NONE = 'none';
MockGPIO.EDGE_RISING = 'rising';
MockGPIO.EDGE_FALLING = 'falling';
MockGPIO.EDGE_BOTH = 'both';


module.exports = MockGPIO;
