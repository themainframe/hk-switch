# hk-switch

**Firmware for a HomeKit-based Wi-Fi inline switch based on Raspberry Pi, Linux & Node**

## Wi-Fi operation

`hk-switch` takes over control of the Wireless interface completely, using `wpa_cli` to pilot `wpa_supplicant` according to current requirements.

When the system doesn't have an Internet connection, `hk-switch` will automatically reconfigure wpa_supplicant to host an access point to which users can connect and configure the device.
