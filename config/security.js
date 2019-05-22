let ReverseProxyStrategy = require('passport-reverseproxy'); // ReverseProxy strategy for Shibboleth preauthenticated case

const environment = process.env.ENVIRONMENT;

module.exports.shibbolethAuthentication = function (app, passport) {
    passport.use(new ReverseProxyStrategy({
                headers: {
                    'eppn': {alias: 'eppn', required: true},
                    'preferredlanguage': {alias: 'preferredLanguage', required: true}
                }
            })
        );
    app.use(passport.initialize());
    app.use(passport.authenticate('reverseproxy', { session: false }));
}

