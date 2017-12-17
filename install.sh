#!/usr/bin/env bash

#
# Installer script for hk-switch.
# Provisions a new HomeKit Switch Raspberry Pi remotely.
#
# Assumes default Raspbian setup (including credentials).
#

PI_USERNAME=pi
PI_HOST=$1

# Define source for Node tarball
NODE_TARBALL_URL="https://nodejs.org/dist/v8.9.3/node-v8.9.3-linux-armv6l.tar.xz"

# Define colours
ESC_SEQ="\x1b["
COL_RESET=$ESC_SEQ"39;49;00m"
COL_RED=$ESC_SEQ"31;01m"
COL_GREEN=$ESC_SEQ"32;01m"
COL_YELLOW=$ESC_SEQ"33;01m"
COL_BLUE=$ESC_SEQ"34;01m"
COL_MAGENTA=$ESC_SEQ"35;01m"
COL_CYAN=$ESC_SEQ"36;01m"

# Print a formatted log message
log() {
  echo -e " $COL_GREEN+$COL_RESET ${1}"
}
err() {
  echo -e " $COL_RED!$COL_RESET ${1}"
}

# Generate a random hex byte
rand_hex_byte() {
  echo $(od  -vN "1" -An -tx1 /dev/urandom | tr -d " \n")
}

# Generate a random 1-digit number
rand_digit() {
  echo $((1 + RANDOM % 9))
}

# We must have at least one argument
if [ $# -ne 1 ]; then
  echo " ! Usage: ./install.sh PI_HOST"
  exit
fi

# Start
log "Welcome to the HomeKit Switch provisioning script"

# Check we can talk to the Pi first
log "Generating provisioning keypair..."
yes | ssh-keygen -q  -N '' -f ./keys/${PI_HOST}.key > /dev/null

log "Installing the provisioning keypair..."
ssh-copy-id -i keys/${PI_HOST}.key ${PI_USERNAME}@${PI_HOST} > /dev/null 2>&1

log "Checking hardware..."
PI_HARDWARE_VER=$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "cat /proc/device-tree/model")

if [[ ! ${PI_HARDWARE_VER} =~ "Zero W" ]]; then
  err "Hardware model must be Raspberry Pi Zero W (found ${PI_HARDWARE_VER})"
  exit
else
  log "Hardware model is OK (${PI_HARDWARE_VER})"
fi

# Install scripts
log "Removing existing package..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "rm -rf /home/pi/hk-switch"

log "Copying package into place..."
#rsync -e "ssh -i keys/${PI_HOST}.key" -rqa --exclude="node_modules" --exclude="keys" --exclude="configuration" --exclude=".git" . ${PI_USERNAME}@${PI_HOST}:/home/pi/hk-switch

log "Installing dpkg dependencies..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo apt-get update -yqq"
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo apt -yqq install git libavahi-compat-libdnssd-dev"

log "Installing Node.js..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "wget -q -O node.tar.xz ${NODE_TARBALL_URL} && tar xf node.tar.xz"
NODE_SOURCE_DIR=$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "tar --list -f node.tar.xz | head -n 1 | tr -d '\n'")
log "Extracted Node.js to ${NODE_SOURCE_DIR}..."

log "Copying Node.js binaries into place..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo cp -r ./${NODE_SOURCE_DIR}/* /usr/"

# Check Node.js version
NODE_INSTALLED_VERSION=$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "node -v | tr -d '\n'")
if [[ ! ${NODE_INSTALLED_VERSION} =~ "v8." ]]; then
  err "Node.JS version must be >8.0.0 (found ${NODE_INSTALLED_VERSION})"
  exit
else
  log "Node.JS version is OK (found ${NODE_INSTALLED_VERSION})"
fi

# Install hk-switch deps
log "Installing hk-switch NPM dependencies..."
log "(this can take a while while node-gyp modules are built)..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "cd hk-switch && npm install"

# Copy DHCP client configuration into place
log "Configuring DHCP client (dhcpcd)..."
#scp -q -i keys/${PI_HOST}.key configuration/dhcpcd.conf ${PI_USERNAME}@${PI_HOST}:/tmp/dhcpcd.conf
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo mv /tmp/dhcpcd.conf /etc/dhcpcd.conf"

# Install forever
log "Installing forever..."
#ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo npm install -g forever"

# Add an entry to our local rc to start at boot
log "Checking for rc.local entry..."
RC_LINE="NODE_ENV=prod PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin forever start /home/pi/hk-switch/forever.json"
FILE=/etc/rc.local

# Check if it's already added
RC_MATCH=$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo grep -i '${RC_LINE}' /etc/rc.local")
if [ -z "$RC_MATCH" ]; then
  log "Adding rc.local entry..."
  ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "sudo sed -i -e '\$i ${RC_LINE}\n' /etc/rc.local"
else
  log "No need to add rc.local entry - already present"
fi

# Remove any persistent data
log "Removing stale persistent data..."
ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "rm -rf /home/pi/hk-switch/persist/*"

# Get the MAC address of the wlan0 interface
WLAN_HW_ADDR=$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "cat /sys/class/net/wlan0/address | tr -d '\n'")
log "Detected WLAN MAC address (${WLAN_HW_ADDR})"

# Generate a random username
RAND_USERNAME=$(rand_hex_byte):$(rand_hex_byte):$(rand_hex_byte):$(rand_hex_byte):$(rand_hex_byte):$(rand_hex_byte)

# Generate a serial number from the CPU's serial
SERIAL=HKS-$(ssh -q -i keys/${PI_HOST}.key -t -t ${PI_USERNAME}@${PI_HOST} "cat /proc/cpuinfo | grep Serial | cut -d' ' -f2  | tr -d '\n'")

# Generate a HomeKit PIN
HOMEKIT_PIN=$(rand_digit)$(rand_digit)$(rand_digit)-$(rand_digit)$(rand_digit)-$(rand_digit)$(rand_digit)$(rand_digit)
log "Generated HomeKit pairing PIN <${HOMEKIT_PIN}>"

# Generate the setup SSID
SETUP_SSID=HKSwitch-${WLAN_HW_ADDR:9:8}
SETUP_SSID=${SETUP_SSID//:}
log "Generated setup SSID (${SETUP_SSID})"

# Generate configuration
cat > /tmp/config.yml <<EOL
---
hap_port: 51826
web_port: 80
uuid: walshnet:accessories:hk-switch
name: Outlet
manufacturer: Walsh Industries
model: Rev-1
serial: ${SERIAL}
username: ${RAND_USERNAME}
pincode: ${HOMEKIT_PIN}
wlan:
  interface: wlan0
  mac: ${WLAN_HW_ADDR}
  broadcast: 172.16.0.255
  ap:
    ssid: ${SETUP_SSID}
switches:
  -
    name: Relay 1
    gpio: 11
    on_default: false
EOL

# Copy the generate configuration into place
log "Copying configuration into place..."
scp -q -i keys/${PI_HOST}.key /tmp/config.yml ${PI_USERNAME}@${PI_HOST}:/home/pi/hk-switch/config.yml
