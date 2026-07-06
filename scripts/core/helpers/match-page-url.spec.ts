import {matchesPageUrl} from './match-page-url';

describe('matchesPageUrl', () => {
    it('matches exact urls', () => {
        expect(matchesPageUrl('/content-lists', '/content-lists')).toBe(true);
        expect(matchesPageUrl('/content-lists', '/other-page')).toBe(false);
    });

    it('matches urls with parameter segments', () => {
        expect(matchesPageUrl('/content-lists/:id', '/content-lists/abc123')).toBe(true);
        expect(matchesPageUrl('/a/:b/c/:d', '/a/1/c/2')).toBe(true);
    });

    it('does not match when segment counts differ', () => {
        expect(matchesPageUrl('/content-lists/:id', '/content-lists')).toBe(false);
        expect(matchesPageUrl('/content-lists', '/content-lists/abc123')).toBe(false);
        expect(matchesPageUrl('/content-lists/:id', '/content-lists/abc123/extra')).toBe(false);
    });

    it('does not match when a static segment differs', () => {
        expect(matchesPageUrl('/content-lists/:id', '/other-page/abc123')).toBe(false);
    });
});
