'use strict';

const proxy = require('express-http-proxy');

module.exports = function(app) {
    let api   = require('./apiController');
    app.route('/')
        .get(api.apiInfo);

    app.use('/proxy', proxy('localhost:3000', {
          memoizeHost: false,
          timeout: 60000,
          proxyReqPathResolver: function(req) {
            let url = require('url').parse(req.url).path;
            console.log(`Proxy request to ${url}`);
            return url;
          },
          proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
            return proxyReqOpts;
          },
          userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
            return proxyResData;
          }
        }));

};