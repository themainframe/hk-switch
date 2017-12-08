/**
 * HomeKit-Switch
 * Main executable.
 */

const CONFIG_FILE = 'config.yml';

const yaml = require('yamljs');
const winston = require('winston');
const storage = require('node-persist');
const WebUI = require('./webui');
const HomeKit = require('./homekit');
const NetController = require('./net-controller');
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

// Initialise storage
winston.info('initialising storage...');
storage.initSync();

// Parse the configuration file
let config = {};
try {
  config = yaml.load(CONFIG_FILE);
  winston.info('loaded', Object.keys(config).length, 'configuration props from', CONFIG_FILE);
} catch (e) {
  winston.error('unable to parse configuration file', CONFIG_FILE, 'error:', e);
  process.exit();
}

// Start the HomeKit server
const homeKitServer = new HomeKit(config);
homeKitServer.start();

// Set up WLAN Configurer
const wlan = new WLAN(config);

// Don't start the DHCP server yet, it's controlled by the network controller (netController)
const dhcp = new DHCP(config);

// Set up Network controller
const netController = new NetController(config, wlan, storage, dhcp);

// Start the web GUI
const webInterface = new WebUI(config, storage, netController, wlan);
webInterface.start();

// Start the DNS server
const dns = new DNS(config);
dns.start();

// Start the network controller
netController.start();
