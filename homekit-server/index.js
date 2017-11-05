/**
 * HomeKit server.
 */

const winston = require('winston');
const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;
const storage = require('node-persist');
const gpio = require('../gpio');

class HomeKitServer {

  constructor (config) {
    this.config = config;
    this.accessory = null;
    this.stateCache = {};
  }

  start() {

      // Initialize the storage system
      storage.initSync();

      // Create the accessory
      winston.info('setting up the hap-nodejs server');
      this.accessory = new Accessory(this.config.name, uuid.generate(this.config.uuid));

      // Listen for the accessory being identified
      this.accessory.on('identify', (paired, callback) => {
        winston.info('we have been asked to identify');
        callback();
      });

      // Add the accessory information service
      this.accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, this.config.manufacturer)
        .setCharacteristic(Characteristic.Model, this.config.model)
        .setCharacteristic(Characteristic.SerialNumber, this.config.serial);

      // Add any services defined in our configuration
      for (let index = 0; index < this.config.switches.length; index ++) {
        let switchConfig = this.config.switches[index];
        winston.info("adding service for switch", switchConfig.name);

        // Enable the associated GPIO for output
        gpio.setup(switchConfig.gpio, switchConfig.on_defalt ? gpio.DIR_HIGH : gpio.DIR_LOW);
        this.stateCache[index] = switchConfig.on_defalt;

        // Add the service for this switch
        this.accessory.addService(Service.Switch, switchConfig.name)
          .getCharacteristic(Characteristic.On)
          .on('set', (value, callback) => {
            winston.info(switchConfig.name, "is changing state, now", value);
            gpio.write(switchConfig.gpio, !(!(value)), () => {
              this.stateCache[index] = !(!(value));
              callback();
            });
          })
          .on('get', (callback) => {
            winston.info(switchConfig.name, "was asked to provide state, is currently", this.stateCache[index] ? 1 : 0);
            callback(null, this.stateCache[index]);
          });
      }

      // Publish us via mDNS
      this.accessory.publish({
        port: this.config.hap_port,
        username: this.config.username,
        pincode: this.config.pincode
      })

      // Output information for HomeKit setup
      winston.info('HomeKit PIN:', this.config.pincode);
  }

}

module.exports = HomeKitServer;
