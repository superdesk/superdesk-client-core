/* eslint-disable newline-per-chained-call */


exports.login = LoginModal;
exports.logout = logout;
exports.workspace = require('./workspace');
exports.content = require('./content');
exports.authoring = require('./authoring');
exports.searchProvider = new SearchProvider();
exports.ingestDashboard = new IngestDashboard();
exports.ingestSettings = new IngestSettings();

require('./waitReady');

function LoginModal() {
    this.username = element(by.model('username'));
    this.password = element(by.model('password'));
    this.btn = element(by.id('login-btn'));
    this.error = element(by.css('p.error'));

    this.login = function(username, password) {
        var self = this;
        let usr = username || browser.params.username;
        let pwd = password || browser.params.password;

        return self.username.waitReady()
            .then(() => self.username.clear())
            .then(() => self.username.sendKeys(usr))
            .then(() => self.password.sendKeys(pwd))
            .then(() => self.btn.click());
    };
}

function SearchProvider() {
    var self = this;

    this.checkbox = element(by.model('provider.is_default'));
    this.addSourceButton = element(by.css('[ng-click="edit()"]'));

    this.addProvider = function(providerType, source, isDefault) {
        self.openAddProvider();
        self.selectProviderType(providerType);
        self.setProviderSource(source);
        self.setIsDefault(isDefault);
        self.saveProvider();
    };

    this.editProvider = function(index) {
        var providerElement = element.all(by.repeater('provider in providers')).get(index);

        browser.actions().mouseMove(providerElement).perform();
        providerElement.element(by.css('[ng-click="edit(provider)"]')).click();
    };

    this.closeEditNoSave = function() {
        element.all(by.css('[ng-click="cancel()"]')).first().click();
    };

    this.openAddProvider = function() {
        return self.addSourceButton.click();
    };

    this.selectProviderType = function(providerType) {
        element(by.model('provider.search_provider')).click();
        return element(by.cssContainingText('option', providerType)).click();
    };

    this.setProviderSource = function(source) {
        element(by.model('provider.source')).sendKeys(source);
    };

    this.saveProvider = function() {
        element(by.css('[ng-click="save()"]')).click();
    };

    this.setIsDefault = function(isDefault) {
        self.checkbox.isSelected().then((selected) => {
            if (selected && !isDefault || !selected && isDefault) {
                self.checkbox.click();
            }
        });
    };
}

function IngestDashboard() {
    var self = this;

    this.dropDown = element(by.id('ingest-dashboard-dropdown'));
    this.ingestDashboard = element(by.css('.ingest-dashboard-list'));

    this.openDropDown = function() {
        return self.dropDown.click();
    };

    this.getProviderList = function() {
        return self.dropDown.all(by.repeater('item in items'));
    };

    this.getProvider = function(index) {
        return self.getProviderList().get(index);
    };

    this.getProviderButton = function(provider) {
        var toggleButton = provider.element(by.model('item.dashboard_enabled'));

        return toggleButton;
    };

    this.getDashboardList = function() {
        return self.ingestDashboard.all(by.repeater('item in items'));
    };

    this.getDashboard = function(index) {
        return self.getDashboardList().get(index);
    };

    this.getDashboardSettings = function(dashboard) {
        return dashboard.element(by.css('.dropdown'));
    };

    this.getDashboardSettingsStatusButton = function(settings) {
        return settings.element(by.model('item.show_status'));
    };

    this.getDashboardStatus = function(dashboard) {
        return dashboard.element(by.css('.status'));
    };

    this.getDashboardSettingsIngestCountButton = function(settings) {
        return settings.element(by.model('item.show_ingest_count'));
    };

    this.getDashboardIngestCount = function(dashboard) {
        return dashboard.element(by.css('.ingested-count'));
    };
}

/**
 * Constructor for the "class" representing the ingest settings page.
 *
 * Contains pre-defined ElementLocator objects, representing the various UI
 * elements on the page used in tests.
 *
 */
function IngestSettings() {
    var daysButonsBox = $('.day-filter-box');

    this.saveBtn = element(by.buttonText('Save'));

    // the main input box for setting the routing scheme's name
    this.schemeNameInput = $('[placeholder="Scheme name"]');

    // the main navigation tabs on the ingest settings page
    this.tabs = {
        routingTab: element(by.buttonText('Ingest Routing')),
    };

    this.newSchemeBtn = element(by.partialButtonText('Add New'));

    this.newRoutingRuleBtn = element(by.partialButtonText('New Rule'));

    var newSchemeInput = element(by.model('editScheme.name'));

    this.writeTextToSchemeName = function(text) {
        newSchemeInput.sendKeys(text);
    };

    var newRuleInput = element(by.model('rule.name'));

    this.writeTextToRuleName = function(text) {
        newRuleInput.sendKeys(text);
    };
    this.getTextfromRuleName = function() {
        return newRuleInput.getAttribute('value');
    };

    // the settings pane for routing rule (in a modal)
    this.routingRuleSettings = {
        tabAction: element(by.buttonText('Action')),
        tabSchedule: element(by.buttonText('Schedule')),

        ruleNameInput: $('[placeholder="Rule name"]'),

        // NOTE: several elements appear twice - under the FETCH settings
        // and under the PUBLISH settings, hence the need to locate them all
        // and select them by index, e.g. .get(0)
        showFetchBtn: $$('.icon-plus-small').get(0),
        fetchDeskList: element.all(by.name('desk')).get(0),
        fetchStageList: element.all(by.name('stage')).get(0),
        fetchMacroList: element.all(by.name('macro')).get(0),

        showPublishBtn: $$('.icon-plus-small').get(1),
        publishDeskList: element.all(by.name('desk')).get(1),
        publishStageList: element.all(by.name('stage')).get(1),
        publishMacroList: element.all(by.name('macro')).get(1),

        daysButtons: {
            mon: daysButonsBox.element(by.className('sd-checkbox--button-Monday')),
            tue: daysButonsBox.element(by.className('sd-checkbox--button-Tuesday')),
            wed: daysButonsBox.element(by.className('sd-checkbox--button-Wednesday')),
            thu: daysButonsBox.element(by.className('sd-checkbox--button-Thursday')),
            fri: daysButonsBox.element(by.className('sd-checkbox--button-Friday')),
            sat: daysButonsBox.element(by.className('sd-checkbox--button-Saturday')),
            sun: daysButonsBox.element(by.className('sd-checkbox--button-Sunday')),
        },

        allDayCheckBox: $('.sd-checkbox--button-allDay'),

        timezoneLabel: element(by.id('timezone')),
        timezoneDeleteBtn: element(by.css('[ng-click="clearSelectedTimeZone()"]')),
        timezoneInput: $('[term="tzSearchTerm"]').element(by.model('term')),
        timezoneList: $('.item-list').all(by.tagName('li')),
    };
}

function logout() {
    var signOutBtn = element(by.buttonText('SIGN OUT'));

    element(by.css('button.current-user')).click();

    browser.wait(() => signOutBtn.isDisplayed(), 200);

    signOutBtn.click();
    browser.sleep(500);
    browser.refresh();
}
