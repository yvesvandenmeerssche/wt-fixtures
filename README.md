# Winding tree fixtures

Test data for the WT platform. This repository contains:

1. Hand-crafted ("curated") data of fictitious hotels, including images.
2. A generator for hotel data.
3. An uploader that sends hotel data (curated or generated) to
   the WT platform via the WT Write API.

## Prerequisites

Install the necessary node version, e.g. like this:

```
nvm install
nvm use
```

Then install the chance dependency (only needed for data
generation):

```
cd scripts
npm install chance
```

## Uploading curated data.

First of all, verify the settings in `scripts/config.js`. Among
others, you should provide endpoints for:

  - A running Swarm provider instance.
  - A running WT Write API instance.

When you're done, do the following to upload the curated data
to WT:

```
cd scripts
node upload.js curated
```

## Generating hotel data

```
cd scripts
node generate.js 20 # Replace "20" with the desired hotel count.
```

As a result, `DATA_PATH_GENERATED` (from `config.js`) should now
contain a data directory for each generated hotel.

## Uploading generated data.

Verify the settings in `scripts/config.js` as described in the
`Uploading curated data` section. Then run the following:

```
cd scripts
node upload.js generated
```

## Running a local swarm node

For test purposes, you can run a local swarm node. To make it
easier, a utility script is provided:

```
cd scripts/utils
./localswarm.sh
```

After the script finishes, a local singleton swarm node should
be running and listening for HTTP traffic on the port 8500.
