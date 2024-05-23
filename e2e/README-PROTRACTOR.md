# How to run tests on chrome > 114

webdriver-manager only supports chrome <114 - https://github.com/angular/protractor/issues/5563

To use newer chrome versions, set `CHROME_BIN` and `CHROMEWEBDRIVER`(should point to folder where `chromedriver` file is located) environment variables. Use [Chrome for testing](https://developer.chrome.com/blog/chrome-for-testing) project to download desired chrome version and driver.

# MacOS Setup
Set your chrome test browser executable path:

export CHROME_BIN="/<full_path_to_chrome_folder>/chrome-mac-arm64/Google_Chrome_for_Testing.app/Contents/MacOS/Google_Chrome_for_Testing"

Replace `Google_Chrome_for_Testing` with your actual executable name

`.app` is a wrapper on top of the Chrome Test Browser executable, because of that you need to specify the exact path to the actual executable for `CHROME_BIN` env variable, so it's something like:
