
module.exports = {
    options: {
        jshintrc: '.jshintrc',
        ignores: '!../../scripts/superdesk/lang/lang.generated.js'
    },
    all: require('./files').scripts,
    docs: ['<%= appDir %>/docs/**/*.js']
};
