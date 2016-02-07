'use strict';

describe('macros', function() {
    beforeEach(module('superdesk.authoring.macros'));

    it('can trigger macro with diff', inject(function(macros, api, $q, $rootScope) {
        var diff = {foo: 'bar'};
        var item = {_id: '1'};
        spyOn(api, 'save').and.returnValue($q.when({diff: diff}));

        macros.call('test', item);
        expect(api.save).toHaveBeenCalled();
        $rootScope.$digest();

        expect(macros.diff).toBe(diff);
    }));
});
