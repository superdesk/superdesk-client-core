
'use strict';

describe('superdesk.core.features module', function() {

    beforeEach(window.module('superdesk.core.features'));
    beforeEach(inject(function(urls, $q) {
        spyOn(urls, 'links').and.returnValue($q.when({users: 'http://users'}));
    }));

    it('can detect features based on resources', inject(function(urls, features, $rootScope) {
        $rootScope.$digest();
        expect(!!features.users).toBe(true);
        expect(urls.links).toHaveBeenCalled();
    }));
});
