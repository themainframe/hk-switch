/**
 * WLAN Configurer.
 * Sets up the Raspberry Pi WLAN for either station mode or AP mode.
 */

const winston = require('winston');
const wpa_cli = require('wireless-tools/wpa_cli');
const Q = require('q');

class WLAN {

  /**
   * Scan for networks.
   */
  scan (iface, callback) {
    wpa_cli.scan(iface, (error, result) => {
      if (error) {
        winston.warn("failed to issue the scan command: ", error);
        return;
      }
      wpa_cli.scan_results(iface, (error, scan_results) => {
        if (error) {
          winston.warn("failed to issue the scan_results command: ", error);
          return;
        }
        callback(scan_results);
      });
    });
  }

  /**
   * Remove a wpa_supplicant network.
   */
  remove_network (iface, id) {
    let deferred = Q.defer();
    wpa_cli.remove_network(iface, id, (error) => {
      if (!error) {
        winston.debug("removed network ID", id);
      }
      deferred.resolve();
    });
    return deferred.promise;
  }

  /**
   * Add a wpa_supplicant network.
   */
  add_network (iface, spec) {

    let deferred = Q.defer();
    wpa_cli.add_network(this.config.wlan.interface, (err, result) => {
      let networkId = result.result;

      // Set up the AP mode network (other items here)
      Q.all(Object.keys(spec).map((key) => {
        winston.debug("setting property", key, "on network", networkId);
        let deferred = Q.defer();
        wpa_cli.set_network(iface, networkId, key, spec[key], (error) => {
          if (error) {
            winston.error("error setting property", key, "to", spec[key], "on network", networkId, error);
          }
          deferred.resolve();
        });
        return deferred.promise;
      })).then(() => {
        // Once all the properties are set, enable the network
        winston.debug("all properties set - activating network", networkId);
        wpa_cli.enable_network(iface, networkId, (error) => {
            if (error) {
              winston.error("error activating network", networkId, error);
            }
            deferred.resolve();
        });
      });

      return deferred.promise;
    });

  }

  constructor (config) {
    this.config = config;
  }

  /**
   * Switch to access point mode, where we host an AP others can join.
   */
  accessPointMode () {
    winston.info("switching to AP mode");
    winston.debug("clearing down existing wireless configurations");
    Q.all(Array.from(Array(10).keys()).map((index) => {
      return this.remove_network.apply(this, [this.config.wlan.interface, index]);
    })).then(() => {
      winston.debug("adding AP mode network");
      return this.add_network(this.config.wlan.interface, {
        mode: 2,
        key_mgmt: "NONE",
        ssid: "\\\"" + this.config.wlan.ap.ssid + "\\\"",
        frequency: 2412
      });
    });
  }

  /**
   * Switch to station mode, where we are connected to a standard infrastructure network.
   */
  stationMode (ssid, key) {
    winston.info("switching to station mode");
    winston.debug("clearing down existing wireless configurations");
    Q.all(Array.from(Array(10).keys()).map((index) => {
      return this.remove_network.apply(this, [this.config.wlan.interface, index]);
    })).then(() => {
      winston.debug("adding station mode network");
      return this.add_network(this.config.wlan.interface, {
        ssid: "\\\"" + ssid + "\\\"",
        scan_ssid: "1",
        key_mgmt: "WPA-PSK",
        psk: "\\\"" + key + "\\\""
      });
    });
  }

}

module.exports = WLAN;
