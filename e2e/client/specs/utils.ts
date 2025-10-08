import {ElementFinder, browser, ExpectedConditions as EC} from 'protractor';

// tslint:disable-next-line: no-var-requires
var path = require('path');

export function getAbsoluteFilePath(
    relativePath: string, // relative to e2e/client dir
) {
    return path.join(__dirname, `../${relativePath}`);
}

export function waitAndClick(element: ElementFinder) {
    browser.wait(EC.elementToBeClickable(element), 1000);
    element.click();
}