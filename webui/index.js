/**
 * Web GUI server.
 */

const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const path = require('path');

class WebInterface {

  constructor (config, storage, netController, wlan) {

    this.config = config;
    this.storage = storage;
    this.netController = netController;
    this.wlan = wlan;

    // Set up the Express app
    this.app = express();
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '/views'));
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Add bootstrap static files
    this.app.use('/static', express.static(__dirname + '/../node_modules/bootstrap/dist/'));

    // Serve the "done" page
    this.app.get('/done', (req, res) => {
      res.render('pages/done');

      // Tell the network controller to give the configured network a try
      this.netController.stationMode();
    });

    // Serve the setup form for any request
    this.app.get(['/', '/*'], (req, res) => {

      // Get a list of the Wi-Fi networks
      winston.info("user requested Wi-Fi site survey via Web GUI");
      this.wlan.scan(this.config.wlan.interface, (result) => {
        winston.info("site survey result contained", result.length, "networks");

        // Render the setup page with the network list
        res.render('pages/form', {
          networks: result
        });
      });
    });

    // Save Wi-Fi credentials submitted by the user
    this.app.post('/setup', (req, res) => {
      winston.info("user submitted Wi-Fi credentials via Web GUI - persisting");
      this.storage.setItemSync('credentials', {
        ssid: req.body.networkSSID,
        key: req.body.networkKey
      });
      winston.info("new Wi-Fi credentials have been persisted");
      res.redirect('/done');
    });

  }

  start() {

    this.app.listen(this.config.web_port, () => {
      winston.info('started web interface')
    });

  }

}

module.exports = WebInterface;
