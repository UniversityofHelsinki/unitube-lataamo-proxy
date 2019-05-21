let ReverseProxyStrategy = require('passport-reverseproxy'); // ReverseProxy strategy for Shibboleth preauthenticated case

module.exports.shibbolethAuthentication = function (app, passport) {
    passport.use(new ReverseProxyStrategy({
            headers: {
                'eppn': {alias: 'eppn', required: true},
                'preferredlanguage': {alias: 'preferredLanguage'}
            },
        })
    );

    app.use(passport.initialize());
    app.use(passport.authenticate('reverseproxy', { session: false }));

}

