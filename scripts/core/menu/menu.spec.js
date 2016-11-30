

describe('superdesk.core.menu', () => {
    beforeEach(window.module('superdesk.core.menu'));

    it('has flags', inject((superdeskFlags) => {
        expect(superdeskFlags.flags.menu).toBe(false);
    }));
});
