# How to run tests on chrome > 114

webdriver-manager only supports chrome <114 - https://github.com/angular/protractor/issues/5563

To use newer chrome versions, set `CHROME_BIN` and `CHROMEWEBDRIVER` environment variables. Use [Chrome for testing](https://developer.chrome.com/blog/chrome-for-testing) project to download desired chrome version and driver.
