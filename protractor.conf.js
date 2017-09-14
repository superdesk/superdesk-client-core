'use strict';

var path = require('path');

function getChromeOptions() {
    var chromeOptions = {
        args: ['no-sandbox']
    };

    if (process.env.CHROME_BIN) {
        chromeOptions.binary = process.env.CHROME_BIN;
    }

    return chromeOptions;
}

var config = {
    allScriptsTimeout: 34000,
    baseUrl: 'http://localhost:9000',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin'
    },

    suites: {
        a: path.join(__dirname, '/spec/**/[a-f]*[Ss]pec.js'),
        b: path.join(__dirname, '/spec/**/[g-m]*[Ss]pec.js'),
        c: path.join(__dirname, '/spec/**/[n-z]*[Ss]pec.js')
    },

    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 200000
    },

    capabilities: {
        browserName: 'chrome',
        chromeOptions: getChromeOptions()
    },

    directConnect: true,

    onPrepare: function() {
        require('./spec/helpers/setup')({fixture_profile: 'app_prepopulate_data'});
        var reporters = require('jasmine-reporters');
        jasmine.getEnv().addReporter(
            new reporters.JUnitXmlReporter({
                savePath: 'e2e-test-results',
                consolidateAll: true
            })
        );
        function takeScreenshot(dir, result) {
            if (!dir) {
                return
            }
            browser.takeScreenshot().then(function(png) {
                var fs = require('fs');
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                var file = path.join(dir, result.fullName + '.png'),
                    stream = fs.createWriteStream(file);
                stream.write(new Buffer(png, 'base64'));
                stream.end();
            });
        }
        function CustomReporter() {
            this.specDone = function(result) {
                if (result.failedExpectations.length > 0) {
                    var name = result.fullName.split(' ');
                    console.log('at ' + name[0] + ': ' + result.description);
                    takeScreenshot(process.env.SCREENSHOTS_DIR, result);
                }
            };
        }
        jasmine.getEnv().addReporter(new CustomReporter());
    }
};

exports.config = config;
