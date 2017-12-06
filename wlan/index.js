/**
 * WLAN Configurer.
 * Sets up the Raspberry Pi WLAN for either station mode or AP mode.
 */

const winston = require('winston');
const wpa_cli = require('wireless-tools/wpa_cli');
const Q = require('q');

class WLAN {


  /**
   * Remove a wpa_supplicant network.
   */
  remove_network (iface, id) {
    let deferred = Q.defer();
    wpa_cli.remove_network(iface, id, (error) => {
      if (!error) {
        winston.info("removed network ID", id);
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
        winston.info("setting property", key, "on network", networkId);
        let deferred = Q.defer();
        wpa_cli.set_network(iface, networkId, key, spec[key], (error) => {
          if (error) {
            winston.error("error setting property", key, "on network", networkId, error);
          }
          deferred.resolve();
        });
        return deferred.promise;
      })).then(() => {
        // Once all the properties are set, enable the network
        winston.info("all properties set - activating network", networkId);
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

    // Remove all network configurations
    winston.info("clearing down existing wireless configurations");
    Q.all(Array.from(Array(10).keys()).map((index) => {
      return this.remove_network.apply(this, [this.config.wlan.interface, index]);
    })).then(() => {
      winston.info("adding AP mode network");
      return this.add_network(this.config.wlan.interface, {
        mode: 2,
        key_mgmt: "NONE",
        ssid: "\\\"" + this.config.wlan.ap.ssid + "\\\"",
        frequency: 2412
      });
    });

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

module.exports = WLAN;
