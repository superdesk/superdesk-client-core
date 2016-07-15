module.exports = {
    options: {
        sourceMap: true,
        presets: ['es2015']
    },
    dist: {
        files: [{
            expand: true,
            src: 'scripts/**/*.js',
            extDot: 'last',
            dest: 'build/',
            ext: '.js'
        }]
    }
};
