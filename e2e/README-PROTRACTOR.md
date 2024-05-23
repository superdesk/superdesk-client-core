# How to run tests on chrome > 114

webdriver-manager only supports chrome <114 - https://github.com/angular/protractor/issues/5563

To use newer chrome versions, set `CHROME_BIN` and `CHROMEWEBDRIVER`(should point to folder where `chromedriver` file is located) environment variables. Use [Chrome for testing](https://developer.chrome.com/blog/chrome-for-testing) project to download desired chrome version and driver.

# MacOS Setup
`.app` is not an executable so path to chrome test browser should be pointing to the executable inside that folder

Example setup with chrome test browser executable path:

export CHROME_BIN="/Downloads/chrome-mac-arm64/Google_Chrome_for_Testing.app/Contents/MacOS/Google_Chrome_for_Testing"
