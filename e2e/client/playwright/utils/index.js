"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s = void 0;
exports.restoreDatabaseSnapshot = restoreDatabaseSnapshot;
exports.login = login;
exports.sleep = sleep;
exports.withTestContext = withTestContext;
exports.waitForToastMessage = waitForToastMessage;
exports.getCellValueByColumTitle = getCellValueByColumTitle;
const request = require("request");
const test_1 = require("@playwright/test");
function restoreDatabaseSnapshot(options) {
    return new Promise((resolve) => {
        var _a;
        request.post({
            uri: 'http://localhost:5000/api/restore_record',
            method: 'POST',
            timeout: 30000,
            json: { name: (_a = options === null || options === void 0 ? void 0 : options.snapshotName) !== null && _a !== void 0 ? _a : 'main' },
        }, resolve);
    });
}
/**
 * ['a', 'b', 'c'] computes to '[data-test-id="a"] [data-test-id="b"] [data-test-id="c"]'
 *
 * ['a', 'b=c'] computes to '[data-test-id="a"] [data-test-id="b"][data-test-value="c"]'
 */
const getTestSelector = (...testIds) => {
    const selector = testIds
        .map((testId) => {
        if (testId.includes('=')) {
            const [id, value] = testId.split('=');
            return `[data-test-id="${id}"][data-test-value="${value}"]`;
        }
        else {
            return `[data-test-id="${testId}"]`;
        }
    })
        .join(' ');
    return selector;
};
exports.s = getTestSelector;
function login(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto('/');
        yield page.locator((0, exports.s)('login-page', 'username')).fill('admin');
        yield page.locator((0, exports.s)('login-page', 'password')).fill('admin');
        yield page.locator((0, exports.s)('login-page', 'submit')).click();
        yield (0, test_1.expect)(page.locator((0, exports.s)('dashboard'))).toBeVisible();
    });
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * A helper to make code shorter, but maintain selector scoping.
 *
 * Without this helper:
 *
 * ```
 * await page.locator(s('desk-config-modal', 'field--name')).fill('desk 7');
 * await page.locator(s('desk-config-modal', 'field--source')).fill('desk 7');
 * await page.locator(s('desk-config-modal')).getByRole('button', {name: 'test'}).click();
 * ```
 *
 * With this helper:
 * ```
 * await withTestContext('desk-config-modal', async ({cs}) => {
 *      await page.locator(cs('field--name')).fill('desk 7');
 *      await page.locator(cs('field--source')).fill('from desk 7');
 *      await page.locator(cs()).getByRole('button', {name: 'test'}).click();
 * });
 */
function withTestContext(selector, callback) {
    const getTestSelectorWithContext = (...testIds) => getTestSelector(selector, ...testIds);
    return callback({ cs: getTestSelectorWithContext });
}
function waitForToastMessage(page, type, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const selector = (0, exports.s)(`notification--${type}=${text}`);
        yield (0, test_1.expect)(page.locator(selector)).toBeVisible();
        yield (0, test_1.expect)(page.locator(selector)).toHaveText(`${text}`);
        yield (0, test_1.expect)(page.locator(selector)).not.toBeVisible();
    });
}
function getCellValueByColumTitle(table, row, tableHeading) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = table.locator('thead tr th');
        const count = yield headers.count();
        let columnIndex = -1;
        for (let i = 0; i < count; i++) {
            const text = yield headers.nth(i).innerText();
            if (text === tableHeading) {
                columnIndex = i;
                break;
            }
        }
        if (columnIndex === -1) {
            throw new Error(`Column heading "${tableHeading}" not found in table`);
        }
        const item = row.locator(`td:nth-child(${columnIndex + 1})`);
        return item.innerText();
    });
}
