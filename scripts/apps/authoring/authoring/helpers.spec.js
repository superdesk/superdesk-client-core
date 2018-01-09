import * as helpers from 'apps/authoring/authoring/helpers';

describe('authoring helpers', () => {
    it('cleanHTML - preserv multiple spaces', inject(() => {
        expect(helpers.cleanHtml('<b>c  c</b>')).toBe('c  c');
    }));
});
