
describe('superdesk.core.api.allowed', function() {
    'use strict';

    beforeEach(window.module('superdesk.core.api'));

    beforeEach(inject(function(api, $q) {
        spyOn(api, 'get').and.returnValue($q.when({
            _items: [
                {_id: 'resource.value', items: ['foo']},
                {_id: 'another.value', items: ['bar']}
            ]
        }));
    }));

    it('can get allowed values for resource/key pair', inject(function(allowed, $rootScope) {
        var values;

        allowed.get('another', 'value').then(function(_values) {
            values = _values;
        });

        $rootScope.$digest();
        expect(values).toEqual(['bar']);
    }));

    it('can filter object keys using allowed values', inject(function(allowed, $rootScope) {
        var all = {
            foo: 1,
            bar: 2,
            baz: 3,
            foox: 4
        };

        var filtered;
        allowed.filterKeys(all, 'resource', 'value').then(function(_filtered) {
            filtered = _filtered;
        });

        $rootScope.$digest();
        expect(filtered).toEqual({foo: 1, foox: 4});
    }));
});
