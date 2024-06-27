
describe('user import', () => {
    beforeEach(window.module('superdesk.apps.users.import'));
    beforeEach(window.module('superdesk.mocks'));

    it('can import a user', inject(($q, userImport, api) => {
        var model = {username: 'foo', password: 'bar', profile_to_import: 'baz'};

        spyOn(api, 'save').and.returnValue($q.when({}));
        userImport.importUser(model);
        expect(api.save).toHaveBeenCalledWith('import_profile', model);
    }));

    it('can return an error', (done) => inject(($q, $rootScope, userImport, api) => {
        const success = jasmine.createSpy('success');

        spyOn(api, 'save').and.returnValue($q.reject({status: 404, data: {_message: 'test'}}));

        userImport.importUser({}).then(success, (res) => {
            expect(res).toEqual({profile_to_import: 1, message: 'test'});
            expect(success).not.toHaveBeenCalled();

            done();
        });

        $rootScope.$digest();
    }));
});
