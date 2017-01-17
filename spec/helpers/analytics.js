/* eslint-disable newline-per-chained-call */


module.exports = new Analytics();

function Analytics() {
    this.reportOperation = element(by.model('activityReport.operation'));
    this.reportDesk = element(by.model('activityReport.desk'));
    this.reportOperationDate = element(by.id('parameters-operation_date'));
    this.reportGroupByDesk = element(by.id('activity_report_group_desk'));
    this.reportName = element(by.id('activity_report_name'));
    this.reportDescription = element(by.id('activity_report_description'));
    this.reportGlobal = element(by.id('activity_report_global'));

    /** List of activity reports **/
    this.userReports = element.all(by.repeater('activityReport in userSavedActivityReports'));
    this.globalReports = element.all(by.repeater('activityReport in globalSavedActivityReports'));

    /**
     * Open the activity report form
     **/
    this.openActivityReportForm = function() {
        element(by.id('activity-report-edit')).click();
    };

    /**
     * Open the saved activity reports list
     **/
    this.openSavedActivityReports = function() {
        element(by.id('saved-activity-reports')).click();
    };

    /**
     * Switch to the parameters tab
     **/
    this.switchToParameters = function() {
        element(by.id('parameters-tab')).click();
    };

    /**
     * Switch to the grouping tab
     **/
    this.switchToGrouping = function() {
        element(by.id('grouping-tab')).click();
    };

    /**
     * Set the operation
     * @param {string} operation - the operation name
     **/
    this.setOperation = function(operation) {
        this.reportOperation.element(by.cssContainingText('option', operation)).click();
    };

    /**
     * Set the desk
     * @param {string} desk - the desk name
     **/
    this.setDesk = function(desk) {
        this.reportDesk.element(by.cssContainingText('option', desk)).click();
    };

    /**
     * Set the operation date
     * @param {string} date_string - the date formatted to string
     **/
    this.setOperationDate = function(dateString) {
        this.reportOperationDate.element(by.tagName('input')).sendKeys(dateString);
    };

    /**
     * Set the subject
     * @param {array} path - list of subject names
     **/
    this.setSubject = function(path) {
        var subjectElement = element(by.id('parameters-subject'));

        subjectElement.element(by.className('dropdown__toggle')).click();
        path.forEach((subjectName) => {
            subjectElement.all(by.tagName('li'))
                .filter((elem, index) => elem.getText()
                    .then((text) => text.toUpperCase() === subjectName.toUpperCase()))
                .first().click();
        });
    };

    /**
     * Set the category
     * @param {array} path - list of category names
     **/
    this.setCategory = function(path) {
        var categoryElement = element(by.id('parameters-category'));

        categoryElement.element(by.className('dropdown__toggle')).click();
        path.forEach((categoryName) => {
            categoryElement.all(by.tagName('li'))
                .filter((elem, index) => elem.getText()
                    .then((text) => text.toUpperCase() === categoryName.toUpperCase()))
                .first().click();
        });
    };

    /**
     * Set the group by desk
     **/
    this.toggleGroupByDesk = function() {
        this.reportGroupByDesk.click();
    };

    /**
     * Set the report name
     * @param {string} name - the report name
     **/
    this.setReportName = function(name) {
        this.reportName.sendKeys(name);
    };

    /**
     * Set the keywords
     * @param {string} keyword - the report's keywords
     **/
    this.setKeywords = function(keywords) {
        var keywordsElement = element(by.css('[data-field="keywords"]')).all(by.model('term'));

        keywordsElement.sendKeys(keywords);
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
    };

    /**
     * Set the urgency
     * @param {integer} urgency
     **/
    this.setUrgency = function(urgency) {
        var urgencyElement = element(by.id('parameters-urgency'));

        urgencyElement.click();
    };

    /**
     * Set the priority
     * @param {integer} priority
     **/
    this.setPriority = function(priority) {
        var priorityElement = element(by.id('parameters-priority'));

        priorityElement.click();
    };

    /**
     * Set the report subscriber
     * @param {string} subscriber - the report subscriber
     **/
    this.setSubscriber = function(subscriber) {
        var subscriberElement = element(by.id('parameters-subscriber'));

        subscriberElement.click();
    };

    /**
     * Set the report description
     * @param {string} description - the report description
     **/
    this.setReportDescription = function(description) {
        this.reportDescription.sendKeys(description);
    };

    /**
     * Set the group by desk
     **/
    this.toggleGlobal = function() {
        this.reportGlobal.click();
    };

    /**
     * Save the activity report
     **/
    this.saveReport = function() {
        element(by.id('activity_report_save')).click();
    };

    /**
     * Return the name of the n'th report from the user reports list
     * @param {integer} index
     **/
    this.getUserReportName = function(index) {
        return this.userReports.get(index).element(by.className('activity-report-name'));
    };

    /**
     * Return the name of the n'th report from the global reports list
     * @param {integer} index
     **/
    this.getGlobalReportName = function(index) {
        return this.globalReports.get(index).element(by.className('activity-report-name'));
    };

    /**
     * Edit the n'th report from the user reports list
     * @param {integer} index
     **/
    this.editUserReport = function(index) {
        var crtItem = this.userReports.get(index);

        browser.actions().mouseMove(crtItem).perform();
        crtItem.element(by.css('[ng-click="edit(activityReport)"]')).click();
    };

    /**
     * Edit the n'th report from the user reports list
     * @param {integer} index
     **/
    this.removeUserReport = function(index) {
        var crtItem = this.userReports.get(index);

        browser.actions().mouseMove(crtItem).perform();
        crtItem.element(by.css('[ng-click="remove(activityReport); $event.stopPropagation();"]')).click();
        element(by.css('[ng-click="ok()"]')).click();
    };

    /**
     * Return the operation of the report currently in edit mode
     **/
    this.getReportOperation = function() {
        return this.reportOperation;
    };

    /**
     * Return the desk of the report currently in edit mode
     **/
    this.getReportDesk = function() {
        return this.reportDesk.all(by.tagName('option'))
            .filter((elem, index) => elem.getAttribute('selected')
                .then((selected) => selected === 'true')).first();
    };

    /**
     * Returns the operation date
     **/
    this.getOperationDate = function() {
        return this.reportOperationDate.element(by.tagName('input'));
    };

    /**
     * Return the group by desk toggle of the report currently in edit mode
     **/
    this.getReportGroupByDesk = function() {
        return this.reportGroupByDesk;
    };

    /**
     * Return the name of the report currently in edit mode
     **/
    this.getReportName = function() {
        return this.reportName;
    };

    /**
     * Return the description of the report currently in edit mode
     **/
    this.getReportDescription = function() {
        return this.reportDescription;
    };

    /**
     * Return the keyword of the report currently in edit mode
     **/
    this.getReportKeywords = function() {
        return element(by.css('[data-field="keywords"]'))
            .all(by.repeater('t in item[field] track by t'))
            .first().getText();
    };

    /**
     * Return the desk of the report currently in edit mode
     **/
    this.getSubject = function() {
        return element(by.id('[data-field="parameters-subject"]'))
            .all(by.repeater('s in item[field] track by s'))
            .first().getText();
    };

    /**
     * Return the global toggle of the report currently in edit mode
     **/
    this.getReportGlobal = function() {
        return this.reportGlobal;
    };
}
