/**
 * WLAN Configurer.
 * Sets up the Raspberry Pi WLAN for either station mode or AP mode.
 */

const winston = require('winston');

class WLANConfigurer {

  constructor (config) {
    this.config = config;
  }

  accessPointMode () {
    winston.info("switching to AP mode");
  }

  stationMode () {
    winston.info("switching to station mode");
  }

  restartNetworking() {
    
  }

}

module.exports = WLANConfigurer;
