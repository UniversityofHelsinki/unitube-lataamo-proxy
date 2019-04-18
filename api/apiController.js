'use strict';

const join = require('path').join;
const packageFilename = join(process.cwd(), 'package.json');
const exists = require('fs').existsSync;

var name = 'unknown';
var version = 'unknown';

if (exists(packageFilename)) {
    const pkg = require(packageFilename);
    name = pkg.name;
    version = pkg.version;
}

exports.apiInfo = function(req, res) {
    res.json({ status: 200,
        message: 'API alive',
        name: name,
        version: version,
        requestId: req.requestId
    });
};