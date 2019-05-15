'use strict';
require('dotenv').config();
const proxy = require('express-http-proxy');

const host = process.env.LATAAMO_OPENCAST_HOST;
const username = process.env.LATAAMO_OPENCAST_USER;
const password = process.env.LATAAMO_OPENCAST_PASS;
const userpass = Buffer.from(`${username}:${password}`).toString('base64');
const auth = `Basic ${userpass}`;

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

    app.use('/opencast', proxy(`${host}/api/series/`, {
        proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
            proxyReqOpts.headers['Authorization'] = `${auth}`;
            proxyReqOpts.method = 'GET';
            return proxyReqOpts;
        }
    }));

};