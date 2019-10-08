
const swaggerJsdoc = require('swagger-jsdoc');

// https://swagger.io/docs/specification/2-0/basic-structure/
const options = {
    swaggerDefinition: {
        info: {
        title: 'Unitube lataamo API',
        version: '0.0.1',
        description: 'Unitube lataamo proxy API documentation',
        },
    },
    // List of files to be processed.
    apis: ['./api/routes.js'],
    };
    
const apiSpecs = swaggerJsdoc(options);

module.exports = apiSpecs;