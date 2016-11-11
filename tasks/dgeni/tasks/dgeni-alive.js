/*
 * dgeni-alive
 * https://github.com/wingedfox/dgeni-alive
 *
 * Copyright (c) 2016 Ilya WingedFox Lebedev ilya@lebedev.net
 * Licensed under the MIT license.
 */

'use strict';

var docgen = require('../src/docgen')();
var _ = require('lodash');
var path = require('path');

var defaults = {
    root: process.cwd(),
    port: 10000,
    host: '127.0.0.1',
    cache: 20,
    showDir : true,
    autoIndex: true,
    ext: 'html',
    runInBackground: false,
    cors: false,
    openBrowser : false
};

module.exports = function (grunt) {
    // register task
    grunt.registerMultiTask('dgeni-alive', 'Generate live docs with ngdoc/dgeni.', function () {
        var debug = !!grunt.option('debug');

        var packages = this.options().packages;
        var serve = this.options().serve;
        var dest = path.resolve(this.data.dest);

        var apiOptions = this.data;

        docgen.Package(packages || void(packages))
        // enable debug
        .config(function(log, readFilesProcessor) {
            log.level = debug? 'debug': 'info';
        })

        .config(function(templateFinder) {
            if(apiOptions.templatePaths) {
                apiOptions.templatePaths.forEach(function(templatePath) {
                    grunt.log.writeln('Adding template path: %s', path.resolve(templatePath));
                    templateFinder.templateFolders.unshift(path.resolve(templatePath));
                });
            }
        })

        var done = this.async();
        if (this.data.title) {
            docgen.title(this.data.title);
        }
        if (this.data.version) {
            docgen.version(this.data.version);
        }
        docgen.src(this.filesSrc);
        docgen.dest(dest);
        docgen.generate().then(function (data) {
            if (serve) {
                var options = _.extend({}, defaults, {
                        root: dest
                    }, serve);
                var url = _.template('http://<%= host %>:<%= port %>/')(options);
                var server = require('http-server').createServer(options);
                server.listen(options.port, options.host, function () {
                    grunt.log.writeln('Server running on %s', url);
                    grunt.log.ok('Hit CTRL-C to stop the server');
                    if (options.openBrowser){
                        require('opener')(url, {
                            command: options.openBrowser !== true ? options.openBrowser : null
                        });
                    }
                    process.on('SIGINT', function () {
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        grunt.log.verbose.ok('http-server stopped').or.writeln('');
                        server.close();
                        done();
                        process.exit();
                    });
                });
            } else {
                done(data);
            }
        }).catch(function(data) {
            done(data);
        });
    });
};

module.exports.docgen = docgen;
