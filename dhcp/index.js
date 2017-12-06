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

    // Add some custom DHCP options
    dhcpOptions.opts[252] = {
      name: 'ProxyUrl',
      type: 'ASCII',
      attr: 'proxyUrl'
    };
  }

  start () {

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

  stop () {

    if (this.server) {
      winston.info("stopping DHCP server");
      this.server.close();
    }

  }

}

module.exports = DHCP;
