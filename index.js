/**
 * HomeKit-Switch
 * Main executable.
 */

const CONFIG_FILE = 'config.yml';

const yaml = require('yamljs');
const winston = require('winston');
const WebUI = require('./webui');
const HomeKit = require('./homekit');
const NetChecker = require('./net-checker');
const WLAN = require('./wlan');
const DHCP = require('./dhcp');
const DNS = require('./dns');

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
const webInterface = new WebUI(config);
webInterface.start();

// Start the HomeKit server
const homeKitServer = new HomeKit(config);
homeKitServer.start();

// Set up WLAN Configurer
const wlanConfigurer = new WLAN(config);

// Start the connectivity checker
const netChecker = new NetChecker(config);

// Start the DHCP & DNS servers
const dhcp = new DHCP(config);
const dns = new DNS(config);
dhcp.start();
dns.start();

// When we gain an Internet connection, enter station mode
netChecker.gainedCallbacks.push(wlanConfigurer.stationMode);

// When we lose an Internet connection, enter AP mode
netChecker.lostCallbacks.push(wlanConfigurer.accessPointMode);

netChecker.start();
