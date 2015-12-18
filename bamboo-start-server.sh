#!/bin/sh

# ./start-server.sh [ENVNAME]
#
# ENVNAME: dev, stage, production (default is 'dev')
# Optional environment variables:
#	PORT (defaults to 8080)
#
# Special ENV names:
#	- CORSTest: This is the same as 'dev', but it overrides the defaultConfig.app_base
# 		to be http://127.0.0.1:8080, which is distinct enough from http://localhost:8080 that
#		cross-origin references will occur when using Phenogrid, even though the app_base is pointing
#		to the local developer server. If CORS is improperly configured in webapp.js, then these
#		references should cause an error in the browser, which a developer can detect and correct.
#		Currently, webapp.js is configured to accept CORS requests and respond correctly.
#

RUNENV=$1
if [ ! $RUNENV ]; then
	RUNENV=dev
fi

if [ $RUNENV = dev ]; then
	source /var/home/bamboo/.nvm/nvm.sh
fi

if [ $RUNENV = stage ]; then
	source /home/bamboo/.nvm/nvm.sh
fi

if [ $RUNENV = production ]; then
	source /home/bamboo/.nvm/nvm.sh
fi

if [ $PORT ]
  then
   MARGS="--port $PORT"
  else
   MARGS="--port 8080"
fi

nvm install v0.12.2
nvm use v0.12.2
npm install -g npm@3.4.0

NODE_NVM_PATH=$(which node)
echo $NODE_NVM_PATH
$NODE_NVM_PATH -v

echo 'console.log("NODEVERSION:", process.version);' |$NODE_NVM_PATH

echo 'checking aliases'
alias

export NODE_PATH=./lib/monarch
export USE_BUNDLE=1
export USE_LOG_FETCH=1
$NODE_NVM_PATH ./lib/monarch/web/webapp_launcher.js $MARGS $RUNENV

echo 'Which node after start server'
which node
