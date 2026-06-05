var path = require('path');
var execSync = require('child_process').execSync;

module.exports = function(grunt) {
    var config = {
        pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
        appDir: 'app',
        tmpDir: '.tmp',
        distDir: 'dist',
        specDir: 'spec',
        tasksDir: 'tasks',
        bowerDir: 'bower',
        comDir: 'bower_components',
        coreDir: __dirname,
        poDir: 'po',
        livereloadPort: 35729,
    };

    grunt.initConfig(config);

    // Auto-load tasks
    require('load-grunt-tasks')(grunt, {
        config: path.join(__dirname, 'package'),
        pattern: [
            'grunt-*',
            '@*/grunt-*',
        ],
    });

    // Auto-load configuration
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options'),
    });

    // Test runner tasks and CI
    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('ci', ['test']);
    grunt.registerTask('unit', ['test']);
    grunt.registerTask('ci:travis', ['ngtemplates:gen-apps', 'ngtemplates:dev', 'karma:travis']);
    grunt.registerTask('bamboo', ['karma:bamboo']);

    // UI styling documentation
    grunt.registerTask('ui-guide', [
        'clean',
        'ngtemplates:dev',
        'ngtemplates:ui-guide',
        'copy:assets-ui-guide',
        'webpack-dev-server:ui-guide',
    ]);

    // Compile PO files to runtime JSON catalogs (gettext.js flat format with metadata under "" key).
    // Used by scripts/init.ts and scripts/reload-language.ts. Production build runs the equivalent
    // step via build-tools' build-root-repo command; this grunt task lets `grunt server` produce
    // them too. Invokes gettext.js's shipped po2json CLI directly so we don't have to depend on
    // @superdesk/build-tools at runtime (it's a devDependency and may not be installed when this
    // Gruntfile is consumed from another project).
    grunt.registerTask('po-to-json', 'Compile po/*.po to dist/languages/*.json', () => {
        var fs = require('fs');
        var distDir = grunt.config.get('distDir');
        var poDir = path.join(__dirname, 'po');
        var jsonDir = path.join(process.cwd(), distDir, 'languages');
        var po2json = path.join(
            path.dirname(require.resolve('gettext.js/package.json')),
            'bin',
            'po2json'
        );

        fs.mkdirSync(jsonDir, {recursive: true});

        fs.readdirSync(poDir).forEach((filename) => {
            var poFile = path.join(poDir, filename);

            if (!filename.endsWith('.po') || fs.statSync(poFile).isDirectory()) {
                return;
            }

            var jsonFile = path.join(jsonDir, filename.replace('.po', '.json'));

            execSync(`node "${po2json}" "${poFile}" "${jsonFile}"`, {stdio: 'inherit'});
        });
    });

    // Extension preparation tasks. These mirror what build-tools' build-root-repo does
    // around the production build, so `grunt server` produces a working dev environment
    // from a fresh checkout without needing an external wrapper command. Each task
    // requires @superdesk/build-tools lazily inside the action so a missing dep doesn't
    // break Gruntfile load for callers that don't need these tasks.
    grunt.registerTask('install-extensions', 'Install each loaded extension', () => {
        var installExtensions = require('@superdesk/build-tools/src/extensions/install-extensions');

        installExtensions(process.cwd());
    });

    grunt.registerTask('namespace-css', 'Generate the namespaced extension stylesheet', () => {
        var {namespaceCSS} = require('@superdesk/build-tools/src/extensions/css');

        namespaceCSS(process.cwd());
    });

    grunt.registerTask('merge-extension-translations', 'Merge translations from loaded extensions', () => {
        var {mergeTranslationsFromExtensions} = require('@superdesk/build-tools/src/extensions/translations');

        mergeTranslationsFromExtensions(process.cwd());
    });

    // Development server
    grunt.registerTask('server', [
        'install-extensions',
        'namespace-css',
        'clean',
        'ngtemplates:index',
        'copy:index',
        'copy:config',
        'copy:locales',
        'po-to-json',
        'merge-extension-translations',
        'ngtemplates:gen-apps',
        'ngtemplates:dev',
        'webpack-dev-server:start',
    ]);

    // gettext
    grunt.registerTask('gettext:extract', ['nggettext_extract']);

    // Production build
    grunt.registerTask('build', '', () => {
        grunt.task.run([
            'clean',
            'ngtemplates:index',
            'copy:index',
            'copy:config',
            'copy:assets',
            'copy:locales',
            'ngtemplates:gen-apps',
            'ngtemplates:core',
        ]);

        // if we have "*.po" files in "superdesk/client"
        // use them to generate "lang.generated.js"
        // to support client based translations
        var pkgName = grunt.file.readJSON('package.json').name;

        if (grunt.file.expand('po/*.po').length && pkgName != 'superdesk-core') {
            grunt.task.run([
                'nggettext_extract',
            ]);
        }

        grunt.task.run([
            'nggettext_compile',
            'webpack:build',
            'filerev',
            'usemin',
        ]);
    });

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
