var openUrl = require('./utils').open;

module.exports = new FilterConditions();

function FilterConditions() {
    // Filter Condition Elements
    this.filterConditionMenuButton = element(by.css('[ng-click="ctrl.changeTab(\'filter_conditions\')"]'));
    this.addNewFilterConditionButton = element(by.css('[ng-click="edit()"]'));
    this.filterConditionNameField = element(by.id('filterCondition-name'));
    this.saveButton = element(by.css('[ng-click="save()"]'));
    this.cancelButton = element(by.css('[ng-click="cancel()"]'));
    this.list = element.all(
        by.repeater('filterCondition in filterConditions | filter: query track by filterCondition._id')
    );
    this.valueField = element(by.model('filterCondition.value'));
    this.addPredefinedValueButton = element(by.className('dropdown__toggle'));

    /**
     * Gets the content filters matching the given name
     **/
    this.getRow = (name) => this.list.filter((elem, index) =>
        elem.element(by.binding('filterCondition.name'))
            .getText()
            .then((text) => text.toUpperCase() === name.toUpperCase())
    );

    /**
     * Opens the filter condition settings page
     **/
    this.openFilterConditionSettings = (reload = true) => {
        if (reload) {
            openUrl('/#/settings/content-filters');
        }
        this.filterConditionMenuButton.click();
    };

    /**
     * Opens the add new filter condition pop up
     **/
    this.addNew = () => this.addNewFilterConditionButton.click();

    /**
     * Populates the name field
     **/
    this.addName = (name) => this.filterConditionNameField.sendKeys(name);

    /**
     * Selects a field, operator or value by its name
     **/
    this.selectFilterConditionParameter = (field) => element.all(by.cssContainingText('option', field)).click();

    /**
     * Adds given filter condition value
     **/
    this.addFilterConditionParameter = (value) => this.valueField.sendKeys(value);

    /**
     * Opens the multi select dropdown for filter condition value
     **/
    this.openPredefinedValues = () => this.addPredefinedValueButton.click();

    /**
     * Saves the filter condition
     **/
    this.save = () => this.saveButton.click();

    /**
     * Closes the filter condition pop up
     **/
    this.cancel = () => this.cancelButton.click();

    /**
     * Opens an exiting filter condition for edit
     **/
    this.edit = (name) => this.getRow(name).then((rows) => {
        rows[0].click();
        rows[0].element(by.className('icon-pencil')).click();
        browser.sleep(500);
    });

    /**
     * Deletes an exiting filter condition
     **/
    this.delete = (name) => this.getRow(name).then((rows) => {
        rows[0].click();
        rows[0].element(by.className('icon-trash')).click();
        browser.sleep(500);
        element(by.buttonText('OK')).click();
    });
}
