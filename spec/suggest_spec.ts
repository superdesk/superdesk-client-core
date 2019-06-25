
import {monitoring} from './helpers/monitoring';
import {authoring} from './helpers/authoring';

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
