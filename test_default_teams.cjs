const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');
// use applicationDefault instead of cert to test the container's default credential, if any.
// wait, the server uses applicationDefault, let's see.
