const host = process.env.LATAAMO_OPENCAST_HOST;
const esbHost = process.env.ESB_HOST;
const esbGroupsApiKey = process.env.ESB_GROUPS_API_KEY;
const username = process.env.LATAAMO_OPENCAST_USER;
const password = process.env.LATAAMO_OPENCAST_PASS;
const userpass = Buffer.from(`${username}:${password}`).toString('base64');
const auth = `Basic ${userpass}`;
const axios = require('axios'); // https://www.npmjs.com/package/axios

const ipaddr = require('ipaddr.js');
const localhostIP = ipaddr.process('127.0.0.1');

let ReverseProxyStrategy = require('passport-reverseproxy');

module.exports.shibbolethAuthentication = function (app, passport) {
    passport.use(new ReverseProxyStrategy({
            headers: {
                'eppn': {alias: 'eppn', required: true},
                'preferredlanguage': {alias: 'preferredLanguage', required: true},
                'hyGroupCn': {alias: 'hyGroupCn', required: true}
            },
            whitelist: localhostIP
        })
    );
    app.use(passport.initialize());
    app.use(passport.authenticate('reverseproxy', { session: false }));
}

// instance of axios with a custom config.
// ocast base url and authorization header
module.exports.opencastBase = axios.create({
    baseURL: host,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'authorization': auth}
});

module.exports.esbGroupsBase = axios.create({
    baseURL: esbHost,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'apikey': esbGroupsApiKey, 'Content-Type': 'application/json;charset=utf-8'},
});