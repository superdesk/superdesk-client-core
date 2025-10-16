/* eslint-disable comma-dangle */

module.exports = function(grunt) {
    const config = require('../../webpack.config.js')(grunt);

    return {
        build: Object.assign({mode: 'production'}, config),
    };
};
