const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

// check https://www.npmjs.com/package/winston and
// https://www.npmjs.com/package/winston-daily-rotate-file for more info


// directory where logs are written
const LOG_DIR = './logs';


// define format for one log entry (one line in a log file)
const lataamoFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});


// create the logger instance
const logger = createLogger({
    format: combine(
        label({ label: 'lataamo proxy' }),
        timestamp(),
        lataamoFormat
    ),
    transports: [
        // https://medium.com/@davidmcintosh/winston-a-better-way-to-log-793ac19044c5
        new DailyRotateFile({
            filename: `${LOG_DIR}/lataamo-info-%DATE%.log`,
            level: 'info',
            datePattern: 'YYYY-MM-DD'}),
        new DailyRotateFile({
            filename: `${LOG_DIR}/lataamo-warning-%DATE%.log`,
            level: 'warn',
            datePattern: 'YYYY-MM-DD'}),
        new DailyRotateFile({
            filename: `${LOG_DIR}/lataamo-error-%DATE%.log`,
            level: 'error',
            datePattern: 'YYYY-MM-DD'})
    ]
});

module.exports = logger;