/**
 * Network state controller.
 * Decides which WLAN mode we should be in based on configuration and connectivity.
 */

const winston = require('winston');
const isOnline = require('is-online');

/**
 * Possible modes that we can be in.
 *
 * STATION is when we're connected to an infrastructure network.
 * AP is when we're hosting an access point.
 */
const Mode = {
  STATION: 'STATION',
  AP: 'AP'
};

class NetController {

  constructor (config, wlan, storage, dhcp, homekit) {
    this.config = config;
    this.wlan = wlan;
    this.storage = storage;
    this.dhcp = dhcp;
    this.homekit = homekit;

    // The current mode
    this.mode = Mode.STATION;

    // Intervals
    this.stateSyncInterval = null;

    // The main interval time quanta
    this.stateSyncTime = 30000;

    // The amount of time between retries in AP mode (if we have credentials)
    this.accessPointModeRetryTime = 60000;
    this.accessPointModeRetryTimeLeft = this.accessPointModeRetryTime;
  }

  /**
   * Retrieve credentials from storage, or null if none exist.
   */
  getCredentials () {
    let credentials = this.storage.getItemSync('credentials');
    if (credentials && credentials.hasOwnProperty('ssid') && credentials.hasOwnProperty('key')) {
      return credentials;
    }
    return null;
  }

  /**
   * AP mode.
   * In this mode, we'll host an access point for the user to configure us.
   */
  accessPointMode () {
    winston.warn('entering AP mode');

    // Stop homekit
    this.homekit.stop();

    // Host the access point
    this.wlan.accessPointMode();
    this.dhcp.start();
    this.mode = Mode.AP;

    // Reset the countdown
    this.accessPointModeRetryTimeLeft = this.accessPointModeRetryTime;
  }

  /**
   * Station mode.
   * In this mode, we're connected to an infrastructure access point.
   * We'll periodically check to see if we're still able to access the Internet.
   */
  stationMode () {
    winston.warn('entering station mode');

    // Start homekit shortly after
    setTimeout(() => {
      this.homekit.stop();
      this.homekit.start();
    }, 2500);

    // Connect to the AP
    let credentials = this.getCredentials();
    this.dhcp.stop();
    this.wlan.stationMode(credentials.ssid, credentials.key);
    this.mode = Mode.STATION;
  }

  /**
   * Start up.
   */
  start () {
    winston.info('started network controller');

    // Decide our initial mode based on credentials presence
    let credentials = this.getCredentials();
    if (credentials) {
      // Station mode
      winston.info('we have Wi-Fi credentials stored - trying STATION mode');
      this.stationMode();
    } else {
      // We have no Wi-Fi credentials stored, so revert to AP mode.
      winston.warn('no Wi-Fi credentials are stored - AP mode');
      this.accessPointMode();
    }

    // Start the state sync interval timer
    this.stateSyncInterval = setInterval(() => {
      this.stateSync.apply(this);
    }, this.stateSyncTime);
  }

  /**
   * Triggered periodically while we're running.
   * Decide on any state transitions that need to take place.
   */
  stateSync () {

    switch (this.mode) {

      case Mode.STATION:

        // Check if we have connectivity
        isOnline().then(online => {
          if (!online) {
            // We've gone offline
            winston.warn('we have lost connectivity - switching to AP mode');
            this.accessPointMode();
          }
        });

        break;

      case Mode.AP:

        // Decrement the amount of time in AP mode
        this.accessPointModeRetryTimeLeft -= this.stateSyncTime;
        winston.info(this.accessPointModeRetryTimeLeft + 'ms left until station mode retry...');

        if (this.accessPointModeRetryTimeLeft <= 0) {

          // Give station mode another try if we have credentials now
          if (this.getCredentials()) {
            winston.info('we\'ve been in AP mode for a while - time to retry station mode');
            this.stationMode();
          }

          // Reset the countdown
          this.accessPointModeRetryTimeLeft = this.accessPointModeRetryTime;
        }

        break;

    }

  }

  /**
   * Stop.
   */
  stop () {
    this.clearIntervals();
  }

}

module.exports = NetController;
