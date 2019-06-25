/* eslint-disable newline-per-chained-call */

import {element, browser, by} from 'protractor';

import {nav} from './helpers/utils';
import {ingestDashboard} from './helpers/pages';

describe('ingest_provider', () => {
    beforeEach((done) => {
        nav('/ingest_dashboard').then(done);
    });

    function addProvider() {
        ingestDashboard.openDropDown();
        var providerButton = ingestDashboard.getProviderButton(ingestDashboard.getProvider(0));

        expect(providerButton.getAttribute('class')).not.toContain('checked');
        providerButton.click();
        expect(providerButton.getAttribute('class')).toContain('checked');

        // for the add board to appear.
        browser.wait(() => ingestDashboard.getDashboard(0).isDisplayed(), 1000);

        ingestDashboard.getDashboard(0).click();
    }

    it('add ingest provider to dashboard', () => {
        addProvider();
    });

    it('remove ingest provider to dashboard', () => {
        addProvider();
        ingestDashboard.openDropDown();
        var providerButton = ingestDashboard.getProviderButton(ingestDashboard.getProvider(0));

        expect(providerButton.getAttribute('class')).toContain('checked');
        providerButton.click();
        expect(providerButton.getAttribute('class')).not.toContain('checked');
        expect(ingestDashboard.getDashboardList().count()).toEqual(0);
    });

    it('Change settings for Ingest Provider', () => {
        addProvider();
        expect(ingestDashboard.getDashboardList().count()).toEqual(1);
        var dashboard = ingestDashboard.getDashboard(0);
        var settings = ingestDashboard.getDashboardSettings(dashboard);

        settings.click();

        // status
        expect(ingestDashboard.getDashboardStatus(dashboard).isDisplayed()).toBe(true);
        ingestDashboard.getDashboardSettingsStatusButton(settings).click();
        expect(ingestDashboard.getDashboardStatus(dashboard).isDisplayed()).toBe(false);

        // ingest count
        expect(ingestDashboard.getDashboardIngestCount(dashboard).isDisplayed()).toBe(true);
        ingestDashboard.getDashboardSettingsIngestCountButton(settings).click();
        expect(ingestDashboard.getDashboardIngestCount(dashboard).isDisplayed()).toBe(false);
    });

    it('Go to Ingest Providers', () => {
        ingestDashboard.openDropDown();
        ingestDashboard.dropDown.element(by.css('.icon-pencil')).click();

        browser.wait(() => element(by.id('ingest-settings')).isDisplayed(), 1000).then(() => {
            expect(element(by.id('ingest-settings')).isDisplayed()).toBe(true);
        });
    });

    it('Go to Ingest Providers and open dialog', () => {
        addProvider();
        var dashboard = ingestDashboard.getDashboard(0);
        var settings = ingestDashboard.getDashboardSettings(dashboard);

        settings.click();
        settings.element(by.css('.icon-pencil')).click();

        browser.wait(() => element(by.id('ingest-settings')).isDisplayed(), 1000).then(() => {
            expect(element(by.id('ingest-settings')).isDisplayed()).toBe(true);
        });
        var statusFilter = element(by.id('status_filter_button'));

        statusFilter.click();
        expect(element(by.id('status--closed-filter')).isDisplayed()).toBe(true);
        element(by.id('status--closed-filter')).click();
        var ingestProvider = element.all(by.repeater('provider in providers._items')).first();

        browser.actions().mouseMove(ingestProvider).perform();
        ingestProvider.all(by.css('.icon-pencil')).first().click();
        expect(element(by.css('.modal__dialog')).element(by.id('provider-name')).isDisplayed()).toBe(true);
    });
});
