/* eslint-disable comma-dangle */

var path = require('path');
const execSync = require('child_process').execSync;

function getChromeOptions() {
    var chromeOptions = {
        args: [
            '--no-sandbox',
        ],
    };

    if (process.env.CHROME_BIN) {
        chromeOptions.binary = process.env.CHROME_BIN;
    }

    if (process.env.TRAVIS) {
        chromeOptions.args.push('--headless');
    }

    return chromeOptions;
}

var config = {
    allScriptsTimeout: 34000,
    baseUrl: 'http://localhost:9000',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin',
    },

    suites: {
        a: path.join(__dirname, './specs/**/[a-k]*[Ss]pec.js'),
        b: path.join(__dirname, './specs/**/[l-z]*[Ss]pec.js'),

        // disable running e2e tests from extensions until testing environment is reconfigured
        // to run start client from the main repo with all extensions enabled

        // d: path.join(__dirname, '/scripts/extensions/*/dist/spec/*[Ss]pec.js'),
    },

    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 200000,
    },

    capabilities: {
        browserName: 'chrome',
        chromeOptions: getChromeOptions(),
    },

    directConnect: true,

    chromeDriver: process.env.CHROMEWEBDRIVER ? (process.env.CHROMEWEBDRIVER + '/chromedriver') : null,

    onPrepare: function() {
        execSync(
            `
                echo "chrome version:" && $CHROME_BIN --version
                echo "\n"
                echo "webdriver-manager version:" && npx webdriver-manager version
                echo "\n"
            `,
            {stdio: 'inherit'},
        );

        require('./specs/helpers/setup').setup({fixture_profile: 'app_prepopulate_data'});

        // so it can be used without import in tests
        // useful when debugging on CI server
        browser.screenshot = require('./specs/helpers/utils').screenshot;

        var reporters = require('jasmine-reporters');

        jasmine.getEnv().addReporter(
            new reporters.JUnitXmlReporter({
                savePath: 'e2e-test-results',
                consolidateAll: true,
            })
        );
        function CustomReporter() {
            this.specDone = function(result) {
                if (result.failedExpectations.length > 0) {
                    browser.screenshot(result.fullName.replace(/[^\w]+/g, '-'));
                }
            };
        }
        jasmine.getEnv().addReporter(new CustomReporter());
    },
};

exports.config = config;
