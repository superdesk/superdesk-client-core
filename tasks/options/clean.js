module.exports = {
    dist: {
        files: [{
            dot: true,
            src: [
                '<%= tmpDir %>',
                '<%= distDir %>/*',
                'templates-cache.generated.js',
                '!<%= distDir %>/.git*'
            ]
        }]
    },
    server: {
        files: '<%= tmpDir %>'
    },
    bower: {
        files: [{
            src: [
                '<%= bowerDir %>/scripts/templates-cache.js',
                '<%= bowerDir %>/scripts/superdesk.js'
            ]
        }]
    }
};
