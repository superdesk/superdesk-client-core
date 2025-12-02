/* eslint-disable comma-dangle */

module.exports = function(grunt) {
    const config = require('../../rspack.config.js')(grunt);

    return {
        build: Object.assign({mode: 'production'}, config),
    };
};
