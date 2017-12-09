# hk-switch

**Firmware for a HomeKit-based Wi-Fi inline switch based on Raspberry Pi, Linux & Node**

## Wi-Fi operation

`hk-switch` takes over control of the Wireless interface completely, using `wpa_cli` to pilot `wpa_supplicant` according to current requirements.

When the system doesn't have an Internet connection, `hk-switch` will automatically reconfigure `wpa_supplicant` to host an access point to which users can connect and configure the device. A Captive Portal is presented to users joining the setup network prompting them to supply Wi-Fi credentials.

## Configuring

More to be said here, but essentially to get started copy `config.yml.dist` to `config.yml` and modify it to taste.

## Running

We'll use `forever` to run the program all the time on our RPi.

* Check out the project to `/home/pi/hk-switch`.
* `npm install -g forever` as root.
* Add this line to `root`'s `crontab`: `@reboot /usr/local/bin/forever start /home/pi/hk-switch/forever.json > /dev/null 2>&1`
* Reboot
* Check `hk-switch` has started with `forever list`
