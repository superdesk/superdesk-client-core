/* eslint-disable newline-per-chained-call */


var openUrl = require('./helpers/utils').open,
    analytics = require('./helpers/analytics');

describe('analytics', () => {
    beforeEach(() => {
        openUrl('/#/analytics');
    });

    it('manage activity reports', () => {
        analytics.setOperation('Publish');
        analytics.setDesk('Sports');
        analytics.setOperationDateStart('13/12/2016');
        analytics.setOperationDateEnd('13/12/2016');
        analytics.setSubject(['education', 'university']);
        analytics.setReportName('report1');
        analytics.setReportDescription('report1 description');
        analytics.setKeywords(['testkey']);
        analytics.setCategory(['Australian Weather']);
        analytics.setUrgencyStart('3');
        analytics.setUrgencyEnd('3');
        analytics.setPriorityStart('6');
        analytics.setPriorityEnd('6');
        analytics.setSubscriber('test1');
        analytics.saveReport();
        browser.sleep(100);
        expect(analytics.userReports.count()).toEqual(1);
        expect(analytics.globalReports.count()).toEqual(0);
        expect(analytics.getUserReportName(0).getText()).toEqual('report1');

        analytics.openActivityReportForm();
        analytics.setOperation('Correct');
        analytics.setOperationDateStart('13/12/2016');
        analytics.setOperationDateEnd('13/12/2016');
        analytics.setSubject(['education', 'university']);
        analytics.setReportName('report2');
        analytics.setReportDescription('report2 description');
        analytics.setKeywords(['testkey2']);
        analytics.setCategory(['Australian Weather']);
        analytics.setUrgencyStart('4');
        analytics.setUrgencyStart('4');
        analytics.setPriorityStart('5');
        analytics.setPriorityEnd('5');
        analytics.setSubscriber('test2');
        analytics.toggleGlobal();
        analytics.switchToGrouping();
        analytics.toggleGroupByDesk();
        analytics.saveReport();
        browser.sleep(100);
        expect(analytics.userReports.count()).toEqual(2);
        expect(analytics.globalReports.count()).toEqual(1);
        expect(analytics.getUserReportName(0).getText()).toEqual('report1');
        expect(analytics.getUserReportName(1).getText()).toContain('report2');
        expect(analytics.getGlobalReportName(0).getText()).toContain('report2');

        analytics.editUserReport(0);
        browser.sleep(100);
        analytics.switchToParameters();
        expect(analytics.getReportName().getAttribute('value')).toEqual('report1');
        expect(analytics.getReportDescription().getAttribute('value')).toEqual('report1 description');
        expect(analytics.getReportOperation().getAttribute('value')).toEqual('publish');
        expect(analytics.getReportDesk().getText()).toContain('Sports');
        expect(analytics.getOperationDateStart().getAttribute('value')).toEqual('13/12/2016');
        expect(analytics.getOperationDateEnd().getAttribute('value')).toEqual('13/12/2016');
        expect(analytics.getReportKeywords()).toBe('TESTKEY');

        expect(analytics.getReportGlobal().getAttribute('checked')).toBeFalsy();
        analytics.switchToGrouping();
        expect(analytics.getReportGroupByDesk().getAttribute('checked')).toBeFalsy();

        analytics.openSavedActivityReports();
        analytics.removeUserReport(0);
        expect(analytics.userReports.count()).toEqual(1);

        analytics.editUserReport(0);
        browser.sleep(100);
        analytics.switchToParameters();
        expect(analytics.getReportName().getAttribute('value')).toEqual('report2');
        expect(analytics.getReportDescription().getAttribute('value')).toEqual('report2 description');
        expect(analytics.getReportOperation().getAttribute('value')).toEqual('correct');
        expect(analytics.getOperationDateStart().getAttribute('value')).toEqual('13/12/2016');
        expect(analytics.getOperationDateEnd().getAttribute('value')).toEqual('13/12/2016');
        expect(analytics.getReportGlobal().getAttribute('checked')).toBeTruthy();
        analytics.switchToGrouping();
        expect(analytics.getReportGroupByDesk().getAttribute('checked')).toBeTruthy();
    });
});
