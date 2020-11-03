const execSync = require('child_process').execSync;

function ensurePackageInstalled() {
    return new Promise((resolve, reject) => {
        try {
            require.resolve('webdriver-manager');
            resolve();
        } catch (_) {
            reject('Package "webdriver-manager" was not found. Run `yarn install` to install all packages.');
        }
    });
}

function installWebdriverDriver() {
    return new Promise((resolve, reject) => {
        try {
            require.resolve('webdriver-manager/selenium/update-config.json');
            resolve();
        } catch (_) {
            // driver not installed, installing:

            let version = null;

            try {
                version = execSync('chromium-browser --product-version').toString();
            } catch (_) {
                // Chromium not installed
            }

            if (version == null) {
                try {
                    version = execSync('google-chrome --product-version --product-version').toString();
                } catch (_) {
                    // Google Chrome not installed
                }
            }

            if (version == null) {
                return reject('To launch the test server either Chromium or Google Chrome has to be installed.');
            }

            console.info('Installing webdriver...', version);
            execSync(`npx webdriver-manager update --gecko false --standalone false --versions.chrome=${version}`);

            resolve();
        }
    });
}

ensurePackageInstalled()
    .then(installWebdriverDriver)
    .then(() => {
        const argumentsToForward = process.argv.slice(2).join(' ');

        return execSync(`npx protractor protractor.conf.js ${argumentsToForward}`, {stdio: 'inherit'});
    })
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });