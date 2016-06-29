var search = require('./helpers/search'),
    authoring = require('./helpers/pages').authoring,
    monitoring = require('./helpers/monitoring');

describe('package', function() {
    'use strict';

    beforeEach(function() {
        monitoring.openMonitoring();
    });

    it('performs package operations', function() {
        // increment package version.
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 0);
        authoring.save();
        authoring.showVersions();
        expect(element.all(by.repeater('version in versions')).count()).toBe(2);

        authoring.showVersions(); // close version panel

        // reorder item on package
        monitoring.actionOnItemSubmenu('Add to current', 'story', 3, 2);
        authoring.moveToGroup('MAIN', 0, 'STORY', 0);
        expect(authoring.getGroupItems('MAIN').count()).toBe(0);
        expect(authoring.getGroupItems('STORY').count()).toBe(2);

        // remove both items one by one to initialize
        authoring.removeGroupItem('STORY', 0);
        authoring.removeGroupItem('STORY', 0);

        // create package from multiple items
        monitoring.selectItem(2, 0);
        monitoring.selectItem(2, 1);
        monitoring.createPackageFromItems();
        expect(authoring.getGroupItems('MAIN').count()).toBe(2);

        // remove both items one by one to initialize
        authoring.removeGroupItem('MAIN', 0);
        authoring.removeGroupItem('MAIN', 0);

        // can add an item to an existing package only once
        monitoring.actionOnItem('Edit', 3, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'main', 2, 0);
        monitoring.actionOnItemSubmenu('Add to current', 'story', 2, 0);
        authoring.save();
        expect(authoring.getGroupItems('MAIN').count()).toBe(1);
        expect(authoring.getGroupItems('STORY').count()).toBe(0);

        // remove item and unselect to initialize
        authoring.removeGroupItem('MAIN', 0);
        monitoring.selectItem(2, 0);
        monitoring.selectItem(2, 1);

        authoring.save();

        // create package by combining an item with open item
        monitoring.openAction(2, 1);
        browser.sleep(500);
        monitoring.actionOnItem('Combine with current', 3, 0);
        expect(authoring.getGroupItems('MAIN').count()).toBe(2);
        // remove both items one by one to initialize
        authoring.removeGroupItem('MAIN', 0);
        authoring.removeGroupItem('MAIN', 0);

        // add multiple items to package
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
