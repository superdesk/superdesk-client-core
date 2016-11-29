describe('packages service', () => {
    beforeEach(window.module('superdesk.apps.packaging'));

    it('can get reference for an item', inject((packages) => {
        var item = {headline: 'foo', type: 'text', _id: 'foo:1'};
        var ref = packages.getReferenceFor(item);
        expect(ref.type).toBe(item.type);
        expect(ref.residRef).toBe(item._id);
        expect(ref.headline).toBe(item.headline);
    }));
});
