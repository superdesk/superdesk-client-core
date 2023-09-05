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

            const  version = execSync('$CHROME_BIN --product-version').toString();

            if (version == null) {
                return reject('To launch the test server a chrome based browser has to be installed and CHROME_BIN environment variable set.');
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

        execSync(
            `
                echo "chrome version:" && $CHROME_BIN --version
                echo "\n"
                echo "webdriver-manager version:" && npx webdriver-manager version
                echo "\n"
            `,
            {stdio: 'inherit'},
        );
        execSync(`npx protractor protractor.conf.js ${argumentsToForward}`, {stdio: 'inherit'});
    })
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });