/**
 * Web GUI server.
 */

const express = require('express');
const winston = require('winston');

class WebInterface {

  constructor (config) {

    this.config = config;
    this.app = express();

    this.app.get('/', (req, res) => {
      res.send('Hello World!');
    });

  }

  start() {

    this.app.listen(this.config.web_port, () => {
      winston.info('started web interface')
    });

  }

}

module.exports = WebInterface;
