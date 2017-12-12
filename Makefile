TARGET_USER = pi
TARGET_HOST = 10.20.1.23
TARGET_PATH = /home/${TARGET_USER}/hk-switch


run: copy just_run

just_run:
	ssh -t -t ${TARGET_USER}@${TARGET_HOST} "cd ${TARGET_PATH} && export PATH=/sbin:\$$PATH && export NODE_ENV=prod && sudo -E yarn start"

copy:
	rsync -rqa --exclude="node_modules" --exclude=".git" . ${TARGET_USER}@${TARGET_HOST}:${TARGET_PATH}

install: copy
	ssh -t -t ${TARGET_USER}@${TARGET_HOST} "sudo apt -y install git libavahi-compat-libdnssd-dev"
	ssh -t -t ${TARGET_USER}@${TARGET_HOST} "cd ${TARGET_PATH} && yarn install"
