var search = require('./helpers/search'),
    authoring = require('./helpers/pages').authoring,
    monitoring = require('./helpers/monitoring');

describe('package', function() {
    'use strict';

    beforeEach(function() {
        monitoring.openMonitoring();
    });

    it('increment package version', function() {
        monitoring.actionOnItem('Edit', 3, 0);
        // Add item to current package.
        monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 0);
        // Save package
        authoring.save();
        // Check version number.
        authoring.showVersions();
        expect(element.all(by.repeater('version in versions')).count()).toBe(2);
        authoring.showVersions(); // close version panel
    });

    it('add to current package removed', function() {
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 0);
        // Open menu.
        var menu = monitoring.openItemMenu(2, 0);
        var header = menu.element(by.partialLinkText('Add to current'));
        expect(header.isPresent()).toBeFalsy();
        // Close menu.
        menu.element(by.css('.close-button')).click();
    });

    it('reorder group package items', function() {
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'story', 3, 2);
        // Reorder item on package
        authoring.moveToGroup('MAIN', 0, 'STORY', 0);
        expect(authoring.getGroupItems('MAIN').count()).toBe(0);
        expect(authoring.getGroupItems('STORY').count()).toBe(2);
    });

    it('create package from multiple items', function() {
        monitoring.selectItem(2, 0);
        monitoring.selectItem(2, 1);
        monitoring.createPackageFromItems();
        expect(authoring.getGroupItems('MAIN').count()).toBe(2);
    });

    it('create package by combining an item with open item', function() {
        monitoring.openAction(2, 1);
        browser.sleep(500);
        monitoring.actionOnItem('Combine with current', 3, 0);
        expect(authoring.getGroupItems('MAIN').count()).toBe(2);
    });

    it('add multiple items to package', function() {
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.selectItem(2, 0);
        monitoring.selectItem(3, 1);
        monitoring.addToCurrentMultipleItems();
        expect(authoring.getGroupItems('MAIN').count()).toBe(2);
    });

    it('create package from published item', function() {
        expect(monitoring.getTextItem(2, 0)).toBe('item5');
        monitoring.actionOnItem('Edit', 2, 0);
        authoring.writeText('some text');
        authoring.save();
        authoring.publish();
        monitoring.showSearch();
        search.setListView();
        search.showCustomSearch();
        search.toggleSearchTabs('filters');
        search.toggleByType('text');
        expect(search.getTextItem(0)).toBe('item5');
        search.actionOnItem('Create package', 0);
        expect(authoring.getGroupItems('MAIN').count()).toBe(1);
    });

    xit('can preview package in a package', function() {
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'main', 3, 1);
        authoring.save();
        authoring.close();
        monitoring.previewAction(3, 0);
        //There is no preview in preview, SD-3319
    });
});
