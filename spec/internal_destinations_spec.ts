/* eslint-disable newline-per-chained-call */

var open = require('./helpers/utils').open;
var el = require('./helpers/e2e-helpers').el;
var els = require('./helpers/e2e-helpers').els;
var s = require('./helpers/e2e-helpers').s;
var hasElementCount = require('./helpers/e2e-helpers').hasElementCount;
var EC = protractor.ExpectedConditions;

describe('internal destinations & generic-page-list', () => {
    // The following tests also cover all other pages using generic-page-list

    beforeEach(() => {
        open('/#/settings/internal-destinations');
    });

    it('can add an item', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        el(['list-page--add-item']).click();
        el(['list-page--new-item', 'gform-input--name']).sendKeys('delta');
        el(['list-page--new-item', 'gform-input--desk'], by.cssContainingText('option', 'Sports Desk')).click();

        el(['list-page--new-item', 'item-view-edit--save']).click();

        browser.wait(hasElementCount(items, 4));
    });

    it('can edit existing item', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        var firstItem = items.get(0);

        // hover in order for action buttons to show up
        browser.actions()
            .mouseMove(firstItem)
            .perform();

        el(['edit'], null, firstItem).click();

        el(['list-page--view-edit', 'gform-input--name']).sendKeys('7');

        el(['list-page--view-edit', 'item-view-edit--save']).click();

        browser.wait(EC.textToBePresentInElement(el(['gform-output--name'], null, firstItem), 'alpha7'));
    });

    it('can preview items', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        items.get(0).click();

        browser.wait(EC.textToBePresentInElementValue(el(['list-page--view-edit', 'gform-input--name']), 'alpha'));

        items.get(1).click();
        browser.wait(EC.textToBePresentInElementValue(el(['list-page--view-edit', 'gform-input--name']), 'bravo'));

        items.get(2).click();
        browser.wait(EC.textToBePresentInElementValue(el(['list-page--view-edit', 'gform-input--name']), 'charlie'));
    });

    it('does not allow previewing when in edit mode', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        items.get(0).click();
        browser.wait(EC.textToBePresentInElementValue(el(['list-page--view-edit', 'gform-input--name']), 'alpha'));

        // hover in order for action buttons to show up
        browser.actions()
            .mouseMove(items.get(1))
            .perform();

        el(['edit'], null, items.get(1)).click();

        items.get(0).click();
        browser.wait(
            EC.not(
                EC.textToBePresentInElementValue(el(['list-page--view-edit', 'gform-input--name']), 'alpha')
            )
        );
    });

    it('can delete an item', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        var firstItem = items.get(0);

        // hover in order for action buttons to show up
        browser.actions()
            .mouseMove(firstItem)
            .perform();

        el(['delete'], null, firstItem).click();

        element(by.buttonText('OK')).click(); // confirm
        browser.wait(hasElementCount(items, 2));
    });

    it('can cancel deletion', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        var firstItem = items.get(0);

        // hover in order for action buttons to show up
        browser.actions()
            .mouseMove(firstItem)
            .perform();

        el(['delete'], null, firstItem).click();

        element(by.buttonText('Cancel')).click(); // cancel modal

        browser.wait(hasElementCount(items, 3));
    });

    it('can sort items', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        // hover in order for options dropdown to show up
        browser.actions()
            .mouseMove(el(['sortbar--selected']))
            .perform();

        element(by.cssContainingText(s(['sortbar--option']), 'Destination name')).click();

        browser.wait(EC.visibilityOf(el(['sortbar--sort-ascending'])));
        expect(el(['gform-output--name'], null, items.get(0)).getText()).toBe('alpha');
        expect(el(['gform-output--name'], null, items.get(1)).getText()).toBe('bravo');
        expect(el(['gform-output--name'], null, items.get(2)).getText()).toBe('charlie');

        el(['sortbar--sort-ascending']).click();
        browser.wait(EC.textToBePresentInElement(el(['gform-output--name'], null, items.get(0)), 'charlie'));
        browser.wait(EC.textToBePresentInElement(el(['gform-output--name'], null, items.get(1)), 'bravo'));
        browser.wait(EC.textToBePresentInElement(el(['gform-output--name'], null, items.get(2)), 'alpha'));
    });

    it('can filter items', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);

        el(['toggle-filters']).click();

        el(['list-page--filters-form', 'gform-input--desk'], by.cssContainingText('option', 'Politic Desk')).click();
        el(['list-page--filters-form', 'filters-submit']).click();

        browser.wait(hasElementCount(items, 1));
        expect(el(['gform-output--name'], null, items.get(0)).getText()).toBe('bravo');

        el(['list-page--filters-form', 'gform-input--desk'], by.cssContainingText('option', 'Sports Desk')).click();
        el(['list-page--filters-form', 'filters-submit']).click();

        browser.wait(hasElementCount(items, 2));
        expect(el(['gform-output--name'], null, items.get(0)).getText()).toBe('alpha');
        expect(el(['gform-output--name'], null, items.get(1)).getText()).toBe('charlie');
    });

    it('can display and remove active filters', () => {
        var items = els(['list-page--items', 'internal-destinations-item']);

        expect(items.count()).toEqual(3);
        expect(els(['list-page--filters-active', 'tag-label']).count()).toBe(0);

        el(['toggle-filters']).click();

        el(['list-page--filters-form', 'gform-input--desk'], by.cssContainingText('option', 'Sports Desk')).click();
        el(['list-page--filters-form', 'filters-submit']).click();
        browser.wait(hasElementCount(items, 2));
        expect(els(['list-page--filters-active', 'tag-label']).count()).toBe(1);

        var activeFilter = els(['list-page--filters-active', 'tag-label']).get(0);

        expect(activeFilter.getAttribute('textContent')).toBe('desk: Sports Desk');

        el(['tag-label--remove'], null, activeFilter).click();

        browser.wait(hasElementCount(items, 3));
        expect(els(['list-page--filters-active', 'tag-label']).count()).toBe(0);
    });
});

