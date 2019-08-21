const host = process.env.LATAAMO_OPENCAST_HOST || 'localhost:8080';
const username = process.env.LATAAMO_OPENCAST_USER;
const password = process.env.LATAAMO_OPENCAST_PASS;
const userpass = Buffer.from(`${username}:${password}`).toString('base64');
const auth = `Basic ${userpass}`;
const axios = require('axios'); // https://www.npmjs.com/package/axios
let ReverseProxyStrategy = require('passport-reverseproxy');

module.exports.shibbolethAuthentication = function (app, passport) {
    passport.use(new ReverseProxyStrategy({
            headers: {
                'eppn': {alias: 'eppn', required: true},
                'preferredlanguage': {alias: 'preferredLanguage', required: true},
                'hyGroupCn': {alias: 'hyGroupCn', required: true}
            },
        })
    );
    app.use(passport.initialize());
    app.use(passport.authenticate('reverseproxy', { session: false }));
}

// instance of axios with a custom config.
// ocast base url and authorization header
module.exports.opencastBase = axios.create({
    baseURL: host,
    //timeout: 1000,
    headers: {'authorization': auth}
});

