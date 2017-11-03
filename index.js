/**
 * HomeKit-Switch
 * Main executable.
 */

const CONFIG_FILE = 'config.yaml';

const yaml = require('yamljs');
const winston = require('winston');
const WebInterface = require('./web-interface');
const HomeKitServer = require('./homekit-server');

// Set up Winston for logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  level: process.env.LOG_LEVEL,
  prettyPrint: true,
  colorize: true,
  timestamp: true
});

// Parse the configuration file
let config = {};
try {
  config = yaml.load(CONFIG_FILE);
  winston.info('loaded', Object.keys(config).length, 'configuration props from', CONFIG_FILE);
} catch (e) {
  winston.error('unable to parse configuration file', CONFIG_FILE, 'error:', e);
  process.exit();
}

// Start the web GUI
const webInterface = new WebInterface(config);
webInterface.start();

// Start the HomeKit server
const homeKitServer = new HomeKitServer(config);
homeKitServer.start();
