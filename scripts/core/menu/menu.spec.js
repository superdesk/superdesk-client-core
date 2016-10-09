
'use strict';

describe('superdesk.core.menu', function() {
    beforeEach(window.module('superdesk.core.menu'));

    it('has flags', inject(function(superdeskFlags) {
        expect(superdeskFlags.flags.menu).toBe(false);
    }));
});
