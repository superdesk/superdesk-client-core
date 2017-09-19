var openUrl = require('./utils').open;

module.exports = new ContentFilters();

function ContentFilters() {
    // Content Filters Elements
    this.addNewContentFilterButton = element(by.css('[ng-click="editFilter()"]'));
    this.contentFilterMenuButton = element(by.css('[ng-click="ctrl.changeTab(\'filters\')"]'));
    this.contentFilterNameField = element(by.id('contentFilter-name'));
    this.addSelectedFilterConditionButton = element.all(by.css('[ng-click="addFilter(filterRow, \'fc\')"]'));
    this.addSelectedContentFilterButton = element.all(by.css('[ng-click="addFilter(filterRow, \'pf\')"]'));
    this.testButton = element(by.css('[ng-click="test()"]'));
    this.addStatementButton = element(by.css('[ng-click="addStatement()"]'));
    this.closeButton = element(by.css('[ng-click="close()"]'));
    this.saveButton = element(by.css('[ng-click="saveFilter()"]'));
    this.contentFilterTestField = element(by.id('contentFilter-test'));
    this.previewField = element(by.id('contentFilter-preview'));
    this.testResultField = element(by.id('test-result'));
    this.globalBlockSwitch = element(by.model('contentFilter.is_global'));
    this.list = element.all(by.repeater('filter in contentFilters track by filter._id'));
    this.filterConditionDropdown = element.all(by.model('filterRow.selected'));

    /**
     * Gets the content filters matching the given name
     **/
    this.getRow = (name) => this.list.filter((elem, index) =>
        elem.element(by.binding('filter.name'))
            .getText()
            .then((text) => text.toUpperCase() === name.toUpperCase())
    );

    /**
     * Opens the content filters settings page
     **/
    this.openContentFilterSettings = (reload = true) => {
        if (reload) {
            openUrl('/#/settings/content-filters');
        }
        this.contentFilterMenuButton.click();
    };

    /**
     * Opens the add new content filter pop up
     **/
    this.addNew = () => this.addNewContentFilterButton.click();

    /**
     * Populates the name field
     **/
    this.addName = (name) => this.contentFilterNameField.sendKeys(name);

    /**
     * Selects a filter condition by its name
     **/
    this.selectFilterCondition = (name) => element.all(by.cssContainingText('option', name)).click();

    /**
     * Clicks the add button to add the selected filter condition
     **/
    this.addFilterCondition = () => this.addSelectedFilterConditionButton.click();

    /**
     * Clicks the add button to add the selected content filter
     **/
    this.addContentFilter = () => this.addSelectedContentFilterButton.click();

    /**
     * Saves the content filter
     **/
    this.save = () => this.saveButton.click();

    /**
     * Enters given story guid into test textbox
     **/
    this.addTestStory = (guid) => this.contentFilterTestField.sendKeys(guid);

    /**
     * Adds a new filter statement
     **/
    this.addStatement = () => this.addStatementButton.click();

    /**
     * Adds a new filter statement for a given statement box
     **/
    this.selectFilterConditionOnStatement = (name, index) => {
        this.filterConditionDropdown.get(index).all(by.cssContainingText('option', name))
            .click();
    };

    /**
     * Clicks the test button
     **/
    this.test = () => this.testButton.click();

    /**
     * Closes the content filter pop up
     **/
    this.close = () => this.closeButton.click();

    /**
     * Toggles the global block switch
     **/
    this.toggleGlobalBlock = () => this.globalBlockSwitch.click();

    /**
     * Opens an exiting content filter for edit
     **/
    this.edit = (name) => this.getRow(name).then((rows) => {
        rows[0].click();
        rows[0].element(by.className('icon-pencil')).click();
        browser.sleep(500);
    });
}