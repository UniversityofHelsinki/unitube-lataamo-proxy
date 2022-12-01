const fs = require('fs');
const path = require('path');

exports.getLicenseOptions = (event) => {
    let rawData = fs.readFileSync(path.join(__dirname, '../files/licenses.json'));
    let licenses = JSON.parse(rawData);
    return {
        ...event,
        licenses : licenses
    };
};

exports.getLicenses = (req, res) => {
    let rawData = fs.readFileSync(path.join(__dirname, '../files/licenses.json'));
    let licenses = JSON.parse(rawData);
    return res.json(licenses);
};
