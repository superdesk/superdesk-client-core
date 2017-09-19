

var workspace = require('./helpers/pages').workspace,
    content = require('./helpers/pages').content,
    authoring = require('./helpers/authoring'),
    desks = require('./helpers/desks');

describe('fetch', () => {
    beforeEach(() => {
        workspace.open();
        workspace.switchToDesk('SPORTS DESK');
        content.setListView();
    });

    xit('items in personal should have copy icon and in desk should have duplicate icon',
        () => {
            var menu = content.openItemMenu('item4');

            expect(menu.element(by.partialLinkText('Duplicate')).isDisplayed()).toBe(true);
            expect(menu.element(by.partialLinkText('Copy')).isPresent()).toBe(false);

            workspace.switchToDesk('PERSONAL');
            content.setListView();

            menu = content.openItemMenu('item1');
            expect(menu.element(by.partialLinkText('Copy')).isDisplayed()).toBe(true);
            expect(menu.element(by.partialLinkText('Duplicate')).isPresent()).toBe(false);
        }
    );

    // @todo(petr): figure out how it should work for authoring+list
    xit('can fetch from ingest with keyboards', () => {
        var body;

        workspace.openIngest();
        // select & fetch item
        body = $('body');
        body.sendKeys(protractor.Key.DOWN);
        body.sendKeys('f');
        workspace.open();
        workspace.switchToDesk('SPORTS DESK');
        expect(content.count()).toBe(3);
    });

    it('can fetch from ingest with menu', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch', 0);
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch from content with menu', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch', 0);
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch as', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        content.send();
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can remove ingest item', () => {
        workspace.openIngest();
        content.actionOnItem('Remove', 0);
        expect(content.count()).toBe(0);
    });

    it('can not Fetch-and-Open if selected desk as a non-member', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);

        var btnFetchAndOpen = element(by.css('[ng-disabled="disableFetchAndOpenButton()"]'));

        expect(btnFetchAndOpen.getAttribute('disabled')).toBeFalsy();

        // Adding a new desk with no member, which serves as a non-member desk when selected
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.actionDoneOnGeneralTab();

        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        authoring.selectDeskforSendTo('Test Desk');
        expect(btnFetchAndOpen.getAttribute('disabled')).toBeTruthy();
    });

    it('can hide stage with global read OFF if selected desk as a non-member', () => {
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);

        var btnFetchAndOpen = element(by.css('[ng-disabled="disableFetchAndOpenButton()"]'));

        expect(btnFetchAndOpen.getAttribute('disabled')).toBeFalsy();

        // Adding a new desk with no member, which serves as a non-member desk when selected
        desks.openDesksSettings();
        desks.getNewDeskButton().click();
        desks.deskNameElement().sendKeys('Test Desk');
        desks.deskDescriptionElement().sendKeys('Test Description');
        desks.deskSourceElement().sendKeys('Test Source');
        desks.setDeskType('authoring');
        desks.actionSaveAndContinueOnGeneralTab(); // save desk and continue to Stages tab

        // Consider one stage with Global Read OFF and another stage with Global Read ON status.
        // create new stage with Global Read OFF
        desks.getNewStageButton().click();
        desks.stageNameElement().sendKeys('Test Stage');
        desks.stageDescriptionElement().sendKeys('Test Stage Description');
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        desks.toggleGlobalReadFlag(); // turn OFF Global Read
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeFalsy();
        desks.saveNewStage();
        // consider existing stage with Global Read ON
        desks.editStage('Working Stage');
        expect(desks.getGlobalReadFlag().getAttribute('checked')).toBeTruthy();
        desks.actionDoneOnStagesTab();

        // Now test expections for stages of Test Desk as selected desk, in Fetch To panel at workspace.
        workspace.openIngest();
        content.actionOnItem('Fetch To', 0);
        authoring.selectDeskforSendTo('Test Desk');

        var sidebar = element.all(by.css('.slide-pane')).last();

        expect(sidebar.element(by.buttonText('Working Stage')).isPresent()).toBeTruthy();
        expect(sidebar.element(by.buttonText('Test Stage')).isPresent()).toBeFalsy();
        expect(btnFetchAndOpen.getAttribute('disabled')).toBeTruthy();
    });

    it('can fetch multiple items', () => {
        workspace.openIngest();
        content.selectItem(0);
        browser.sleep(1000); // Wait for animation
        element(by.id('fetch-all-btn')).click();
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can fetch as multiple items', () => {
        workspace.openIngest();
        content.selectItem(0);
        browser.sleep(1000); // Wait for animation
        element(by.id('fetch-all-as-btn')).click();
        content.send();
        workspace.openContent();
        expect(content.count()).toBe(3);
    });

    it('can remove multiple ingest item', () => {
        workspace.openIngest();
        content.selectItem(0);
        browser.sleep(1000); // Wait for animation
        element(by.id('remove-all-as-btn')).click();
        expect(content.count()).toBe(0);
    });
});
