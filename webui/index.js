/**
 * Web GUI server.
 */

const express = require('express');
const winston = require('winston');
const path = require('path');

class WebInterface {

  constructor (config) {

    this.config = config;
    this.app = express();
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '/views'));

    this.app.get(['/', '/*'], (req, res) => {
      res.render('pages/home');
    });

  }

  start() {

    this.app.listen(this.config.web_port, () => {
      winston.info('started web interface')
    });

  }

}

module.exports = WebInterface;
