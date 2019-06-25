var authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring');

// Live Suggest feature spec
describe('suggest', () => {
    beforeEach(() => {
        monitoring.openMonitoring();
    });

    it('should open with 0 items', () => {
        authoring.createTextItem();
        authoring.openLiveSuggest();
        expect(authoring.getSuggestedItems().count()).toBe(0);
    });
});
