/**
 * Mock WLAN Configurer.
 */

const winston = require('winston');

class MockWLAN {

  /**
   * Scan for networks.
   */
  scan (iface, callback) {
    winston.debug("scan requested on mock WLAN interface");
    setTimeout(() => {
      callback([{
        ssid: "TestNetwork"
      }]);
    }, 1500);
  }

  constructor (config) {
    this.config = config;
  }

  /**
   * Switch to access point mode, where we host an AP others can join.
   */
  accessPointMode () {
    winston.info("mock WLAN switching to AP mode");
  }

  /**
   * Switch to station mode, where we are connected to a standard infrastructure network.
   */
  stationMode (ssid, key) {
    winston.info("mock WLAN switching to station mode");
  }

}

module.exports = MockWLAN;
