const host = process.env.LATAAMO_OPENCAST_HOST;
const esbHost = process.env.ESB_HOST;
const esbPersonsApiKey = process.env.ESB_PERSONS_API_KEY;
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
            'preferredlanguage': {alias: 'preferredLanguage', required: false},
            'hyGroupCn': {alias: 'hyGroupCn', required: false},
            'displayName': {alias: 'displayName', required: false}
        },
        whitelist: localhostIP
    })
    );
    app.use(passport.initialize());

    app.use(function(req, res, next) {
        console.log(req.path);
        if (req.path === '/api' || req.path === '/api/') {
            next();
        } else {
            passport.authenticate('reverseproxy', {session: false})(req, res, next);
        }
    });
};

// instance of axios with a custom config.
// ocast base url and authorization header
module.exports.opencastBase = axios.create({
    baseURL: host,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'authorization': auth},
    validateStatus: () => { // https://github.com/axios/axios/issues/1143
        return true;        // without this axios might throw error on non 200 responses
    }
});

module.exports.opencastBaseStream = axios.create({
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'authorization': auth},
    responseType: 'stream',
    validateStatus: () => { // https://github.com/axios/axios/issues/1143
        return true;        // without this axios might throw error on non 200 responses
    }
});

module.exports.esbPersonBase = axios.create({
    baseURL: esbHost,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'apikey': esbPersonsApiKey, 'Content-Type': 'application/json;charset=utf-8'},
});



module.exports.esbGroupsBase = axios.create({
    baseURL: esbHost,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'apikey': esbGroupsApiKey, 'Content-Type': 'application/json;charset=utf-8'},
});
