describe('limits', () => {
    beforeEach(window.module('superdesk.apps.authoring'));

    it('can get min/max length from schema', inject((limits) => {
        const schema = {headline: {minlength: 5, maxlength: 20}};

        expect(limits.minlength('headline', schema)).toBe(5);
        expect(limits.maxlength('headline', schema)).toBe(20);
    }));
});
