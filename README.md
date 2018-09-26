# Winding tree fixtures

Test data for the WT platform. This repository contains:

1. Hand-crafted ("curated") data of fictitious hotels, including images.
2. A generator for hotel data.
3. An uploader that sends hotel data (curated or generated) to
   the WT platform via the WT Write API and images to Swarm.

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

Finally, make sure you have access to a running Swarm node
(e.g. via https://swarm-gateways.net/) and a WT Write API instance
(version 0.4.0 is assumed) pointing to the same Swarm network.

## Uploading curated data

First of all, verify the settings in `scripts/config.js`. Among
others, you should provide endpoints for:

  - A running Swarm provider instance.
  - A running WT Write API instance.
  - A running WT Update API instance.

When you're done, do the following to upload the curated data
to WT:

```
cd scripts
node upload.js bulk-create curated
```

## Generating hotel data

```
cd scripts
node generate.js 20 # Replace "20" with the desired hotel count.
```

As a result, `DATA_PATH_GENERATED` (from `config.js`) should now
contain a data directory for each generated hotel. All hotels
are located within 45.5 - 47.5 lat and 22.5 - 24.5 long to
simulate a metropolitan area.

## Uploading generated data

Verify the settings in `scripts/config.js` as described in the
`Uploading curated data` section. Then run the following:

```
cd scripts
node upload.js bulk-create generated
```

## Regenerating time-based data

If you need to set new randomized time-based data (for example
because they are too old now), you can replace them in the original
`definition.json` document. You might then want to update the hotel
in the platform.

Verify the settings in `scripts/config.js` as described in the
`Uploading curated data` section. Then run the following:

```
cd scripts
node regenerate.js /path/to/hotel/directory cancellationPolicies
node regenerate.js /path/to/hotel/directory ratePlans
node regenerate.js /path/to/hotel/directory availability
```


## Updating hotel data on network
Verify the settings in `scripts/config.js` as described in the
`Uploading curated data` section. Then run the following:

```
cd scripts
node upload.js update /path/to/hotel/directory 0xExisting-hotel-address
```

For example if you want to update Hotel Mazurka, you would run
```
cd scripts
node upload.js update ../data/curated/hotel-mazurka/ 0x030eA8A18069BF6a0EaE6515c1A46AbD73261C5C
```


## Running a local swarm node

For test purposes, you can run a local (singleton) swarm node. To make it
easier, a utility script is provided:

```
cd scripts/utils
./localswarm.sh
```

After the script finishes, a local singleton swarm node should
be running and listening for HTTP traffic on the port 8500.

## License

For license information, see the attached "LICENSE" file. All
images have been obtained from [Pixabay](https://pixabay.com)
and are supposed to be in the Public Domain (Creative Commons
CC0).
