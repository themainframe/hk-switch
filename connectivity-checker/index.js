/**
 * Connectivity checker.
 * Keeps an eye on Internet connectivity, triggers callbacks when state changes.
 */

const winston = require('winston');
const isOnline = require('is-online');

class ConnectivityChecker {

  constructor (config) {
    this.config = config;
    this.timeout = null;

    // Assume we're bad to start with
    this.hasConnectivity = false;

    // Callbacks to trigger when losing and gaining connectivity
    this.lostCallbacks = [];
    this.gainedCallbacks = [];
  }

  start () {
    winston.info('started connectivity checker');

    // Continually check if we have Internet access
    this.timeout = setInterval(() => {
      isOnline().then(online => {

        // If we're now offline and previously weren't...
        if (!online && this.hasConnectivity) {
          winston.info('we\'re now offline - notifying listeners');
          this.lostCallbacks.map((callback) => {
            callback.apply();
          });
        }

        // If we're now online and previously weren't...
        if (online && !this.hasConnectivity) {
          winston.info('we\'re now online - notifying listeners');
          this.gainedCallbacks.map((callback) => {
            callback.apply();
          });
        }

        this.hasConnectivity = online;

      });
    }, 3000);

  }

  stop () {
    if (this.timeout) {
      winston.info('stopped connectivity checker');
      clearInterval(this.timeout);
    }
  }

}

module.exports = ConnectivityChecker;
