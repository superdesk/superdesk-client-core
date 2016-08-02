
module.exports = function(grunt) {
    'use strict';

    function data(url) {
        return {
            data: {
                config: require('../../superdesk.config.js')(grunt),
                bower: 'bower_components',
                core: 'node_modules/superdesk-core/apps'
            }
        };
    }

    return {
        docs: {
            options: data('http://localhost:5000/api'),
            files: {'<%= distDir %>/docs.html': '<%= appDir %>/docs.html'}
        }
    };
};
