# hk-switch

**Firmware for a HomeKit-based Wi-Fi inline switch based on Raspberry Pi, Linux & Node**

## Wi-Fi operation

`hk-switch` takes over control of the Wireless interface completely, using `wpa_cli` to pilot `wpa_supplicant` according to current requirements.

When the system doesn't have an Internet connection, `hk-switch` will automatically reconfigure `wpa_supplicant` to host an access point to which users can connect and configure the device. A Captive Portal is presented to users joining the setup network prompting them to supply Wi-Fi credentials.

## Installing

We'll use `forever` to run the program all the time on our RPi.

Before starting, since `hk-switch` takes over control of the Wi-Fi interface, this can be a bugger to debug on Raspberry Pi Zero W (where there's only the WLAN interface and no other access). I would suggest using a USB OTG Ethernet adapter or at least having a keyboard & monitor connected while setting up.

* Check out the project to `/home/pi/hk-switch`.
* You'll need a few packages to get started - `sudo apt -y install git libavahi-compat-libdnssd-dev`
* Ensure you have a recent (`>8.0)`) version of Node for the correct architecture (remember Raspberry Pi Zero W is `ARMv6`). Recommend obtaining that either using your package manger or as a download from the NodeJS website - [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
* Install the dependencies with `yarn install` or `npm install` (prefer `yarn`!)
* Install `forever` with `sudo npm install -g forever`
* Add this line to `root`'s `crontab`: `@reboot NODE_ENV=prod PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /usr/local/bin/forever start /home/pi/hk-switch/forever.json > /dev/null 2>&1`
* Reboot - remember when the system starts back up it might not be on your Wi-Fi network!
* Check `hk-switch` has started with `sudo forever list`

## Configuring

More to be said here, but essentially to get started copy `config.yml.dist` to `config.yml` and modify it to taste.

See the documentation inline in `config.yml.dist`.
