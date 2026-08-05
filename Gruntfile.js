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
    // Used by scripts/init.ts and scripts/reload-language.ts. Prefers build-tools' in-process
    // converter, which also validates translation placeholders; falls back to spawning
    // gettext.js's po2json per file when build-tools isn't installed (it's a devDependency
    // and may be missing when this Gruntfile is consumed from another project).
    grunt.registerTask('po-to-json', 'Compile po/*.po to dist/languages/*.json', () => {
        var fs = require('fs');
        var distDir = grunt.config.get('distDir');
        var poDir = path.join(__dirname, 'po');
        var jsonDir = path.join(process.cwd(), distDir, 'languages');

        var poToJson = null;

        try {
            poToJson = require('@superdesk/build-tools/src/po-to-json');
        } catch (err) {
            // build-tools not installed; use the fallback below
        }

        if (poToJson != null) {
            poToJson(poDir, jsonDir);
            return;
        }

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

    // Escape hatch for a stale or corrupted webpack cache; run it from the repo
    // the build runs in (superdesk/client for the root repo).
    grunt.registerTask('clear-cache', 'Delete the persistent webpack build cache', () => {
        var fs = require('fs');
        var cacheDir = path.join(process.cwd(), 'node_modules', '.cache', 'webpack');

        fs.rmSync(cacheDir, {recursive: true, force: true});
        grunt.log.writeln('Removed ' + cacheDir);
    });

    // Runs webpack directly instead of via grunt-webpack: grunt-webpack never calls
    // compiler.close(), and webpack only persists its filesystem cache on close.
    grunt.registerTask('webpack-build', 'Run the production webpack build', function() {
        var done = this.async();
        // same consumer-first resolution as webpack.config.js, so the compiler
        // and the config's plugins share one webpack copy
        var webpack = require(require.resolve('webpack', {paths: [process.cwd(), __dirname]}));
        var makeConfig = require(path.join(__dirname, 'webpack.config.js'));
        var webpackConfig = Object.assign({mode: 'production'}, makeConfig(grunt));

        // Opt-in for release builds: hidden-source-map emits .map files the bundles
        // don't reference; keep them out of what's deployed to browsers. The separate
        // cache space matters: the cache doesn't track this runtime devtool change,
        // and without it cached map-less modules are reused and no maps come out.
        if (process.env.SUPERDESK_SOURCE_MAPS === 'true') {
            webpackConfig.devtool = 'hidden-source-map';
            webpackConfig.cache = Object.assign(
                {}, webpackConfig.cache, {version: 'with-source-maps'}
            );
        }

        var compiler = webpack(webpackConfig);

        compiler.run((err, stats) => {
            if (err) {
                done(err);
                return;
            }

            grunt.log.writeln(stats.toString({preset: 'errors-warnings', colors: true}));

            var hasErrors = stats.hasErrors();

            compiler.close((closeErr) => {
                done(closeErr || !hasErrors);
            });
        });
    });

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
            'webpack-build',
            'filerev',
            'usemin',
        ]);
    });

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
