const adminHost = process.env.LATAAMO_OPENCAST_HOST;
const presentationHost = process.env.LATAAMO_OPENCAST_PRESENTATION_HOST;
const esbHost = process.env.ESB_HOST;
const esbPersonsApiKey = process.env.ESB_PERSONS_API_KEY;
const esbGroupsApiKey = process.env.ESB_GROUPS_API_KEY;
const username = process.env.LATAAMO_OPENCAST_USER;
const password = process.env.LATAAMO_OPENCAST_PASS;
const userpass = Buffer.from(`${username}:${password}`).toString('base64');
const auth = `Basic ${userpass}`;
const gitlabAuth = process.env.GITLAB_TOKEN;
const gitlabHost = process.env.GITLAB_HOST;
const axios = require('axios'); // https://www.npmjs.com/package/axios
const crypto = require('crypto');
const secretKey = process.env.CRYPTO_SECRET_KEY;
const secretIV = process.env.CRYPTO_SECRET_IV;

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
        if (req.path === '/api/info') {
            next();
        } else {
            passport.authenticate('reverseproxy', {session: false})(req, res, next);
        }
    });
};

// instance of axios with a custom config.
// ocast base url and authorization header
module.exports.opencastBase = axios.create({
    baseURL: adminHost,
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    headers: {'authorization': auth},
    validateStatus: () => { // https://github.com/axios/axios/issues/1143
        return true;        // without this axios might throw error on non 200 responses
    }
});

module.exports.opencastPresentationBase = axios.create({
    baseURL: presentationHost,
    headers: {'authorization': auth},
    maxContentLength: Infinity, // https://github.com/yakovkhalinsky/backblaze-b2/issues/45
    validateStatus: () => { // https://github.com/axios/axios/issues/1143
        return true;        // without this axios might throw error on non 200 responses
    }
});

module.exports.gitlabBase = axios.create({
    baseURL: gitlabHost,
    headers: {'PRIVATE-TOKEN': gitlabAuth},
    validateStatus: () => {
        return true;
    }
});

module.exports.opencastBaseStreamWithRangeHeaders = (url, range) => {
    const streamBase = axios.create({
        maxContentLength: Infinity,
        headers: {'authorization': auth, 'Range': range},
        responseType: 'stream',
    });
    return streamBase.get(url);
};


module.exports.opencastBaseStream = (url) => {
    const streamBase = axios.create({
        maxContentLength: Infinity,
        headers: {'authorization': auth},
        responseType: 'stream',
    });
    return streamBase.get(url);
};

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

module.exports.authentication = () => {
    return auth;
};

module.exports.algorithm = 'aes-256-cbc'; //Using AES encryption
// Generate secret hash with crypto to use for encryption
module.exports.key = crypto
    .createHash('sha512')
    .update(secretKey)
    .digest('hex')
    .substring(0, 32);

module.exports.encryptionIV = crypto
    .createHash('sha512')
    .update(secretIV)
    .digest('hex')
    .substring(0, 16);

