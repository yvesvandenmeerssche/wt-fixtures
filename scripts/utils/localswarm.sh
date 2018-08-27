#!/bin/bash
#
# Download swarm and run it locally in singleton mode for test purposes.

# No need to do anything if swarm already runs.
nc -z localhost "8500"
if [ $? -eq 0 ]; then
    exit 0;
fi

BASE_DIR=`pwd`/swarm_data
SWARM_VERSION="0.3.2-316fc7ec"
ARCHITECTURE=amd64
BIN_DIR=$BASE_DIR/swarm-linux-$ARCHITECTURE-$SWARM_VERSION

# Download the swarm binary if necessary.
if [ ! -d $BIN_DIR ]; then
    mkdir -p $BASE_DIR
    wget  https://gethstore.blob.core.windows.net/builds/swarm-linux-$ARCHITECTURE-$SWARM_VERSION.tar.gz -O $BASE_DIR/swarm.tar.gz
    tar --directory $BASE_DIR -xvf $BASE_DIR/swarm.tar.gz swarm-linux-$ARCHITECTURE-$SWARM_VERSION/swarm
    rm $BASE_DIR/swarm.tar.gz
fi

# Prepare fixtures with an account.
DATADIR=$BASE_DIR/BZZ/`date +%s`
BZZKEY="71c95d6d54292609a62082249bccbebbf79a3f68"
PASSWORD="password"
mkdir -p $DATADIR
cp -R ./swarm-keystore $DATADIR/keystore
echo $PASSWORD > $BASE_DIR/password

# Run swarm.
$BIN_DIR/swarm --bzzaccount $BZZKEY --datadir $DATADIR --password $BASE_DIR/password --ens-api '' 2>> $DATADIR/swarm.log &

# Wait for the http listener to start; otherwise the test might fail.
echo "Waiting for the http listener to start..."
I=10
while [ $I -gt 0 ]; do
    nc -z localhost "8500"
    if [ $? -eq 0 ]; then
        exit 0;
    fi
    sleep 1
done
echo "ERROR: The http listener did not start in time."
exit 1
