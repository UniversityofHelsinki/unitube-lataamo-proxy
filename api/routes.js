'use strict';

const proxy = require('express-http-proxy');

module.exports = function(app) {
    let api   = require('./apiController');
    app.route('/')
        .get(api.apiInfo);

    app.use('/proxy', proxy('localhost:3000', {
        memoizeHost: false,
        timeout: 60000,
        userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
            let data = JSON.parse(proxyResData.toString('utf8'));
            return JSON.stringify(data);
        }
    }));

};