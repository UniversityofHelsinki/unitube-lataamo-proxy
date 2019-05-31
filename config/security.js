let ReverseProxyStrategy = require('passport-reverseproxy'); 

module.exports.shibbolethAuthentication = function (app, passport) {
    passport.use(new ReverseProxyStrategy({
            headers: {
                'eppn': {alias: 'eppn', required: true},
                'preferredlanguage': {alias: 'preferredLanguage', required: true}
            },
            whitelist: '127.0.0.1/0'
        })
    );
    app.use(passport.initialize());
    app.use(passport.authenticate('reverseproxy', { session: false }));
}

