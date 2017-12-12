/**
 * DHCP server.
 */

const winston = require('winston');
const dhcp = require('dhcp');
const dhcpOptions = require('dhcp/lib/options');

class DHCP {

  constructor (config) {
    this.config = config;
    this.server = null;
    this.running = false;

    // Add some custom DHCP options
    dhcpOptions.opts[252] = {
      name: 'ProxyUrl',
      type: 'ASCII',
      attr: 'proxyUrl'
    };
  }

  /**
   * Starts the DHCP server.
   * Careful not to start this while we're actually connected as a station.
   */
  start () {
    this.running = true;
    winston.info("starting DHCP server");
    this.server = dhcp.createServer({
      mac: this.config.wlan.mac,
      range: [
        "172.16.0.32", "172.16.0.254"
      ],
      netmask: "255.255.255.0",
      router: [
        "172.16.0.1"
      ],
      server: "172.16.0.1",
      dns: ["172.16.0.1"]
    });

    this.server.listen();

    this.server.on('bound', function(state) {
      winston.info("DHCP client bound: ", state);
    });

    this.server.on('message', function (data) {
    });

    this.server.on('error', function (error) {
      winston.warn("DHCP error: ", error);
    });

  }

  /**
   * Stops the DHCP server.
   */
  stop () {
    if (this.server && this.running) {
      winston.info("stopping DHCP server");
      this.server.close();
      this.running = false;
    }
  }

}

module.exports = DHCP;
