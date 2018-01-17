describe('attachments', () => {
    beforeEach(window.module('superdesk.apps.authoring.attachments'));

    it('can get item by id and cache it', (done) => inject((attachments, api, $q, $rootScope) => {
        spyOn(api, 'find').and.returnValue($q.when({_id: 'foo'}));

        attachments.byId('foo').then((attachment) => {
            expect(attachment._id).toBe('foo');
            expect(api.find.calls.count()).toBe(1);
            return attachments.byId('foo');
        })
            .then((attachment) => {
                expect(api.find.calls.count()).toBe(1);
                attachments.save({_id: 'foo'}, {});
                return attachments.byId('foo');
            })
            .then((attachment) => {
                expect(api.find.calls.count()).toBe(2);
            })
            .then(done);

        $rootScope.$digest();
    }));
});
