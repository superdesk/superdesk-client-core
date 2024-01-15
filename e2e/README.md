# Working on e2e tests using Playwright

### Starting server and client

* open a terminal in `./server`
* run `docker-compose up`
* open a terminal in `./client`
* run `npm install` if needed
* run `npx grunt server`

### Running tests

`npm run playwright` - runs all tests in headless mode
`npm run playwright-interactive` - starts playwright IDE that allows to run tests individually and inspect the timeline

### VSCode plugin

https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright

In most cases it's more convenient to work with tests using the plugin and further instructions will be assuming that a plugin is used. Also see https://playwright.dev/docs/getting-started-vscode

### Running and debugging tests

When VSCode plugin is installed, and test file ends with `.spec.ts`, there will be a green play button next to the line number where the test is defined. Click the play button next to the test you want to run. By default it will run in headless mode. In most cases you'll not want the headless mode. To change it - tick "show browser" checkbox in Playwright options that are available in the sidebar.

### Auto-generating new tests

Playwright has a function where it autogenerates test code as you perform actions in the browser. It doesn't work perfectly so you'll need to tweak the resulting code, but it's a good starting point.

To create a new test, copy one of the existing ones and change the name. Leave first few lines that restore database snapshot and login. Now we will use "record at cursor" feature that VSCode extension provides. The feature allows to continue auto-generating from any line you choose by putting a cursor there. That feature doesn't run the lines before your cursor, so you'll need to get the browser into the correct state yourself. The easiest way to do this is to put a breakpoint on a line that you want to start recording from, debug the tests and when breakpoint pauses at that line - stop the debugger. Make sure you have "show browser"(inside Playwright sidebar widget) selected too, or Playwright will close the browser when you stop the debugger. After you stop the debugger you're in a correct state and can click "record at cursor" option inside Playwright widget in the sidebar. It will get vs-code started browser in a recording mode where you will be able to click elements in the browser and auto generated code will be inserted in VSCode.

### Selectors

`data-test-id` selectors are used for stability. Example:

```typescript
await page.locator('[data-test-id="comments"]').click();
```

One problem is that they can get long and repetitive.

```typescript
await page.locator('[data-test-id="authoring"] [data-test-id="comments-widget"] [data-test-id="submit"]').click();
```

To improve readability, `s` function is used where only IDs are passed:

```typescript
await page.locator(s('authoring', 'comments-widget', 'submit')).click();
```

### Known issues

* Playwright VSCode extension seems not to respect viewport size that is set in `e2e/client/playwright.config.ts`. An easy workaround is adjusting browser size manually in development. It will work in CI.