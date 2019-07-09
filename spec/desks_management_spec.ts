
import {desks} from './helpers/desks';

describe('desks_management', () => {
    beforeEach(() => {
        desks.openDesksSettings();
    });

    xit('lists macros under the Macro tab for new desks', () => {
        desks.newDeskBtn.click();
        desks.showTab('macros');
        expect(desks.listedMacros.count()).toBeGreaterThan(0);
    });
});
