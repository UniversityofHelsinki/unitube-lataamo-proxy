const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;


// https://github.com/winstonjs/winston
const lataamoTransports = {
    console: new transports.Console({ level: 'debug' }),
    infoFile: new transports.File({ filename: 'lataamo-info.log', level: 'info' }),
    warnFile: new transports.File({ filename: 'lataamo-warning.log', level: 'warn' }),
    errorFile: new transports.File({ filename: 'lataamo-error.log', level: 'error' })
};


const logger = createLogger({
    format: combine(
        //label({ label: 'Lataamo proxy' }),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
        //prettyPrint()
        format.json()
        ),
    transports: [
        lataamoTransports.console,
        lataamoTransports.infoFile,
        lataamoTransports.warnFile,
        lataamoTransports.errorFile
    ]
});

module.exports = logger;