/* Override this configuration if necessary. */

const path = require('path');

module.exports = {
  DATA_PATH_CURATED: path.resolve(__dirname, '..', 'data', 'curated'),
  DATA_PATH_GENERATED: path.resolve(__dirname, '..', 'data', 'generated'),
  WT_WRITE_API: {
    method: 'http',
    host: 'localhost',
    port: '8000',
  },
  SWARM_PROVIDER: {
    method: 'http',
    host: 'localhost',
    port: '8500',
  },
  // A sample wallet - do not use this in production.
  WT_WRITE_API_WALLET: '{"version":3,"id":"7fe84016-4686-4622-97c9-dc7b47f5f5c6","address":"d037ab9025d43f60a31b32a82e10936f07484246","crypto":{"ciphertext":"ef9dcce915eeb0c4f7aa2bb16b9ae6ce5a4444b4ed8be45d94e6b7fe7f4f9b47","cipherparams":{"iv":"31b12ef1d308ea1edacc4ab00de80d55"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"d06ccd5d9c5d75e1a66a81d2076628f5716a3161ca204d92d04a42c057562541","n":8192,"r":8,"p":1},"mac":"2c30bc373c19c5b41385b85ffde14b9ea9f0f609c7812a10fdcb0a565034d9db"}}',
  WT_WRITE_API_WALLET_PASSWORD: 'windingtree',
  WT_WRITE_API_ACCESS_KEY: null, // If specified, account creation is skipped and an existing account is reused.
  VERIFY_UPLOAD: true, // Set to false for better upload speed and lower robustness.
  WT_UPDATE_API: "http://localhost:8080/", // Optional - set to publish notifications there.
};
