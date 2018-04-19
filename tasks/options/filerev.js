module.exports = {
    options: {
        encofing: 'utf8',
        algorithm: 'md5',
        length: 8,
    },
    js: {
        src: '<%= distDir %>/*.js',
        dest: '<%= distDir %>/',
    },
};
