import {by, element, ElementFinder, promise, protractor} from 'protractor';
import {el, els, s} from '@superdesk/end-to-end-testing-helpers';

export class TreeSelectDriver {
    private _element: ElementFinder;

    constructor(_element: ElementFinder) {
        this._element = _element;

        this.getValue = this.getValue.bind(this);
        this.addValue = this.addValue.bind(this);
        this.setValue = this.setValue.bind(this);
    }

    getValue(): promise.Promise<Array<string>> {
        return els(['item'], null, this._element).then((elements) => {
            return protractor.promise.all(
                elements.map((_el: ElementFinder) => {
                    return _el.getAttribute('innerText');
                }),
            );
        });
    }

    addValue(value: string | Array<string>): void {
        el(['open-popover'], null, this._element).click();

        const values = typeof value === 'string' ? [value] : value;

        for (let i = 0; i < values.length; i++) {
            element(
                by.cssContainingText(
                    '[data-test-id="tree-select-popover"] [data-test-id="option"]',
                    values[i],
                ),
            ).click();
        }
    }

    setValue(value: string | Array<string>) {
        const maybeClearButton = this._element.element(s(['clear-value']));

        maybeClearButton.isPresent().then((present) => {
            if (present === true) {
                maybeClearButton.click();
            }
        });

        this.addValue(value);
    }
}
