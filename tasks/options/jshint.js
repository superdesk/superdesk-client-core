var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        jshintrc: '.jshintrc'
    },
    all: require('./files').scripts.concat(
        '!' + path.join(root, '**/*.generated.js')
    ),
    docs: ['<%= appDir %>/docs/**/*.js']
};
