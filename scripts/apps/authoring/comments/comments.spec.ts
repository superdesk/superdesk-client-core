
describe('item comments', () => {
    beforeEach(window.module(($provide) => {
        $provide.provider('api', function() {
            this.api = function() { /* no-op */ };
            this.$get = function() {
                return {
                    item_comments: {
                        query: function() { /* no-op */ },
                    },
                };
            };
        });
    }));

    beforeEach(window.module('superdesk.apps.authoring.comments'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    it('can fetch comments for an item', inject((commentsService, api, $rootScope, $q) => {
        spyOn(api.item_comments, 'query').and.returnValue($q.when({_items: [{_id: 1}]}));

        commentsService.fetch('test-id').then(() => {
            expect(commentsService.comments.length).toBe(1);
        });

        $rootScope.$apply();

        expect(api.item_comments.query).toHaveBeenCalledWith({
            where: {item: 'test-id'}, embedded: {user: 1},
        });
    }));
});
