/* tslint:disable:max-line-length */

import {browser, protractor} from 'protractor';

import {filterConditions} from './helpers/filter_conditions';
import {contentFilters} from './helpers/content_filters';
import {monitoring} from './helpers/monitoring';
import {workspace} from './helpers/workspace';
import {authoring} from './helpers/authoring';
import {publishQueue} from './helpers/publish_queue';
import {assertToastMsg} from './helpers/utils';

describe('content filters', () => {
    it('can manage filter conditions', () => {
        // add a new filter condition
        filterConditions.openFilterConditionSettings();
        filterConditions.addNew();
        filterConditions.addName('Test Filter Condition');
        filterConditions.selectFilterConditionParameter('Desk');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('Politic Desk');
        filterConditions.save();

        // adding the second filter condition with the same name fails
        filterConditions.addNew();
        filterConditions.addName('Test Filter Condition');
        filterConditions.selectFilterConditionParameter('Stage');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('Politic Desk: one');
        filterConditions.save();
        assertToastMsg('error', 'Error: Name needs to be unique');
        filterConditions.cancel();

        // adding the second filter condition with the same parameters fails
        filterConditions.addNew();
        filterConditions.addName('Test Filter Condition 2');
        filterConditions.selectFilterConditionParameter('Desk');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('Politic Desk');
        filterConditions.save();
        assertToastMsg('error', 'Error: Filter condition:Test Filter Condition has identical settings');
        filterConditions.cancel();

        // referenced filter condition cannot be deleted
        contentFilters.openContentFilterSettings(false);
        contentFilters.addNew();
        contentFilters.addName('Test Content Filter');
        contentFilters.selectFilterCondition('Test Filter Condition');
        contentFilters.addFilterCondition();
        contentFilters.save();
        filterConditions.openFilterConditionSettings(false);
        filterConditions.delete('Test Filter Condition');
        assertToastMsg('error', 'Error: Filter condition has been referenced in content filter: Test Content Filter');
    });

    it('can match stories', () => {
        // set up filter conditions
        filterConditions.openFilterConditionSettings();
        filterConditions.addNew();
        filterConditions.addName('Desk Condition');
        filterConditions.selectFilterConditionParameter('Desk');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('Politic Desk');
        filterConditions.save();
        filterConditions.addNew();
        filterConditions.addName('Body Condition');
        filterConditions.selectFilterConditionParameter('Body HTML');
        filterConditions.selectFilterConditionParameter('startswith');
        filterConditions.addFilterConditionParameter('Help');
        filterConditions.save();
        filterConditions.addNew();
        filterConditions.addName('Slugline Condition');
        filterConditions.selectFilterConditionParameter('Slugline');
        filterConditions.selectFilterConditionParameter('notlike');
        filterConditions.addFilterConditionParameter('amaz');
        filterConditions.save();
        filterConditions.addNew();
        filterConditions.addName('Sms Condition');
        filterConditions.selectFilterConditionParameter('SMS');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('True');
        filterConditions.save();
        filterConditions.addNew();
        filterConditions.addName('Urgency');
        filterConditions.selectFilterConditionParameter('Urgency');
        filterConditions.selectFilterConditionParameter('nin');
        filterConditions.openPredefinedValues();
        browser.actions()
            .sendKeys('1')
            .sendKeys(protractor.Key.DOWN)
            .sendKeys(protractor.Key.ENTER)
            .perform();
        filterConditions.openPredefinedValues();
        browser.actions()
            .sendKeys('2')
            .sendKeys(protractor.Key.DOWN)
            .sendKeys(protractor.Key.ENTER)
            .perform();
        filterConditions.save();

        // set up stories
        monitoring.openMonitoring();
        workspace.selectDesk('Politics Desk');
        monitoring.actionOnItem('Edit', 2, 0); // setup item5
        authoring.writeText(protractor.Key.HOME + 'Help needed');
        authoring.save();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 1); // setup item9
        authoring.setHeaderSluglineText(protractor.Key.HOME + 'Another amazing story');
        authoring.save();
        authoring.close();
        monitoring.actionOnItem('Edit', 2, 2); // setup item7
        authoring.toggleSms();
        authoring.save();
        authoring.close();

        // start testing the stories agains filter conditions
        contentFilters.openContentFilterSettings(true);
        contentFilters.addNew();
        contentFilters.selectFilterCondition('Desk Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item5');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Does Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Body Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item5');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Does Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Body Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item9');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Doesn\'t Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Slugline Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item9');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Doesn\'t Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Slugline Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item5');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Does Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Sms Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item5');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Doesn\'t Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Sms Condition');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item7');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Does Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Urgency');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item7');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Doesn\'t Match');
        contentFilters.close();

        contentFilters.addNew();
        contentFilters.selectFilterCondition('Urgency');
        contentFilters.addFilterCondition();
        contentFilters.addTestStory('item8');
        contentFilters.test();
        expect(contentFilters.testResultField.getText()).toEqual('Does Match');
        contentFilters.close();
    });

    fit('can serve as global block', () => {
        // set up filter conditions
        filterConditions.openFilterConditionSettings();
        filterConditions.addNew();
        filterConditions.addName('Body Condition');
        filterConditions.selectFilterConditionParameter('Body HTML');
        filterConditions.selectFilterConditionParameter('startswith');
        filterConditions.addFilterConditionParameter('Help');
        filterConditions.save();

        // create a global block content filter
        contentFilters.openContentFilterSettings(false);
        contentFilters.addNew();
        contentFilters.addName('Blocking Content Filter');
        contentFilters.selectFilterCondition('Body Condition');
        contentFilters.addFilterCondition();
        contentFilters.toggleGlobalBlock();
        contentFilters.save();

        // assert there's nothing in publish queue
        publishQueue.openPublishQueue();
        expect(publishQueue.getItemCount()).toBe(0);

        // publish a story to be blocked
        monitoring.openMonitoring();
        workspace.selectDesk('Politics Desk');
        monitoring.actionOnItem('Edit', 2, 0); // setup item5
        authoring.writeText(protractor.Key.HOME + 'Help needed');
        authoring.save();
        authoring.publish();

        // assert again there's nothing in publish queue
        publishQueue.openPublishQueue();
        expect(publishQueue.getItemCount()).toBe(0);

        // disable global block content filter
        contentFilters.openContentFilterSettings(true);
        contentFilters.edit('Blocking Content Filter');
        contentFilters.toggleGlobalBlock();
        contentFilters.save();

        // publish another story to be blocked
        monitoring.openMonitoring();
        workspace.selectDesk('Politics Desk');
        monitoring.actionOnItem('Edit', 2, 0); // setup item5
        authoring.writeText(protractor.Key.HOME + 'Help needed');
        authoring.save();
        authoring.publish();

        // assert again there's nothing in publish queue
        publishQueue.openPublishQueue();
        expect(publishQueue.getItemCount()).toBe(1);
    });

    it('can contain complex statements', () => {
        // set up filter conditions
        filterConditions.openFilterConditionSettings();
        filterConditions.addNew();
        filterConditions.addName('Desk Condition');
        filterConditions.selectFilterConditionParameter('Desk');
        filterConditions.selectFilterConditionParameter('eq');
        filterConditions.selectFilterConditionParameter('Politic Desk');
        filterConditions.save();
        filterConditions.addNew();
        filterConditions.addName('Body Condition');
        filterConditions.selectFilterConditionParameter('Body HTML');
        filterConditions.selectFilterConditionParameter('startswith');
        filterConditions.addFilterConditionParameter('Help');
        filterConditions.save();

        // create a content filter with AND
        contentFilters.openContentFilterSettings(false);
        contentFilters.addNew();
        contentFilters.addName('Test-1 CF');
        contentFilters.selectFilterCondition('Desk Condition');
        contentFilters.addFilterCondition();
        contentFilters.selectFilterCondition('Body Condition');
        contentFilters.addFilterCondition();
        expect(contentFilters.previewField.getAttribute('value'))
            .toEqual('[(Desk eq "Politic Desk") AND (Body HTML startswith "Help")]');
        contentFilters.save();

        // create a content filter with OR
        contentFilters.addNew();
        contentFilters.addName('Test-2 CF');
        contentFilters.selectFilterCondition('Desk Condition');
        contentFilters.addFilterCondition();
        contentFilters.addStatement();
        contentFilters.selectFilterConditionOnStatement('Body Condition', 2);
        contentFilters.addFilterCondition();
        expect(contentFilters.previewField.getAttribute('value'))
            .toEqual('[(Desk eq "Politic Desk")] OR [(Body HTML startswith "Help")]');
        contentFilters.save();

        // create a content filter with a filter condition and content filter
        contentFilters.addNew();
        contentFilters.addName('Test-3 CF');
        contentFilters.selectFilterCondition('Desk Condition');
        contentFilters.addFilterCondition();
        contentFilters.addStatement();
        contentFilters.selectFilterCondition('Test-2 CF');
        contentFilters.addContentFilter();
        /* eslint-disable max-len */
        expect(contentFilters.previewField.getAttribute('value'))
            .toEqual('[[(Desk eq "Politic Desk")] OR [(Body HTML startswith "Help")] AND (Desk eq "Politic Desk")] OR [[(Desk eq "Politic Desk")] OR [(Body HTML startswith "Help")]]');
        contentFilters.save();
    });
});
