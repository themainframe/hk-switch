/**
 * DNS server.
 */

const winston = require('winston');
const dns = require('node-named');

class DNS {

  constructor (config) {
    this.config = config;
    this.server = null;
  }

  start () {

    winston.info("starting DNS server");
    this.server = dns.createServer();
    this.server.listen(53, '::ffff:0.0.0.0', () => {
        winston.info("DNS server listening");
    });

    this.server.on("query", function(query) {
      // Respond to all queries with our HTTP config URL
      winston.info("Received DNS request for", query.name());
      let domain = query.name();
      let record = new dns.ARecord("172.16.0.1");
      query.addAnswer(domain, record, 300);
      this.send(query);
    });

  }

  stop () {

    if (this.server) {
      winston.info("stopping DNS server");
      this.server.close();
    }

  }

}

module.exports = DNS;
