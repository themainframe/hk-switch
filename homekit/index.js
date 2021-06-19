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
const { exec } = require("child_process");

class HomeKit {

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

        // Decide if we should use the default state or the existing state (if one exists)
        let initialBrightness = switchConfig.default;
        let initialOnOff = initialBrightness ? 1 : 0;

        if (this.stateCache.hasOwnProperty(index)) {
          // Already have a state record
          winston.info(
            "re-starting: will keep state",
            this.stateCache[index],
            "for switch", switchConfig.name
          );
          initialBrightness = this.stateCache[index].brightness;
          initialOnOff = this.stateCache[index].onOff;
        }

        winston.info(
          "adding service for switch", switchConfig.name,
          "on ioplus", switchConfig.ioplus, "DAC", switchConfig.dac,
          "with on/off", initialOnOff, "and brightness", initialBrightness
        );
        
        // Enable the associated GPIO for output
        this.stateCache[index] = {
          brightness: initialBrightness,
          onOff: initialOnOff
        };

        // Add the service for this switch
        const lightbulbService = new Service.Lightbulb(switchConfig.name, "switch-" + index.toString());
        
        // Add dimming characteristic
        lightbulbService.getCharacteristic(Characteristic.Brightness)
          .on('set', (value, callback) => {

            winston.info(switchConfig.name, "is changing brightness, now", value);
            this.stateCache[index].brightness = value;

            // Scale the value & run the ioplus update command
            const scaledValue = value / 10;
            const command = "ioplus " + switchConfig.ioplus + " dacwr " + switchConfig.dac + " " + scaledValue;
            winston.info(switchConfig.name, "issuing command:", command);
            exec(command);

            // Tell HAP we've finished making changes
            callback();

          })
          .on('get', (callback) => {
            winston.info(switchConfig.name, "was asked to provide brightness, is currently", this.stateCache[index].brightness);
            callback(null, this.stateCache[index].brightness);
          });

        // Add on/off characteristic
        lightbulbService.getCharacteristic(Characteristic.On)
          .on('set', (value, callback) => {
            winston.info(switchConfig.name, "is changing on/off state, now", value);
            this.stateCache[index].onOff = value;
            
            // Scale the value
            const scaledValue =  value ? (this.stateCache[index].brightness / 10) : 0;
            const command = "ioplus " + switchConfig.ioplus + " dacwr " + switchConfig.dac + " " + scaledValue;
            winston.info(switchConfig.name, "issuing command:", command);
            exec(command);
            
            // Tell HAP we've finished making changes
            callback();
          })
          .on('get', (callback) => {
            winston.info(switchConfig.name, "was asked to provide on/off state, is currently", this.stateCache[index].onOff);
            callback(null, this.stateCache[index].onOff ? true : false);
          });

        this.accessory.addService(lightbulbService);
      }

      // Publish our accessory
      this.publish();

      // Output information for HomeKit setup
      winston.info('HomeKit PIN:', this.config.pincode);
  }

  /**
   * Publish, or republish the accessory.
   */
  publish () {

    // Publish us via mDNS
    winston.info('publishing HAP accessory...');
    this.accessory.publish({
      port: this.config.hap_port,
      username: this.config.username,
      pincode: this.config.pincode
    })

  }

  /**
   * Destroy the current accessory.
   */
  stop () {
    winston.info('stopping hap-nodejs server');
    if (this.accessory) {
      this.accessory._server.stop();
    }
  }

}

module.exports = HomeKit;
