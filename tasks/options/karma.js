module.exports = {
    options: {
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false,
        reporters: ['spec'],
    },
    single: {
        reporters: 'spec',
    },
    watch: {
        singleRun: false,
        autoWatch: true,
        reporters: ['progress'],
    },
    unit: {
        coverageReporter: {
            type: 'html',
            dir: 'report/',
        },
    },
    travis: {
        reporters: ['spec'],
    },
    bamboo: {
        browsers: ['PhantomJS'],
        reporters: ['spec', 'junit'],
    },
};
