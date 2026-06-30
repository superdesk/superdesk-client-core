import {resolveFieldSection} from 'apps/authoring-react/data-layer';

describe('resolveFieldSection (content profile field placement)', () => {
    it('keeps an explicit header section', () => {
        expect(resolveFieldSection('header', 'slugline')).toBe('header');
    });

    it('keeps an explicit content section', () => {
        expect(resolveFieldSection('content', 'body_html')).toBe('content');
    });

    it('defaults a missing section to content (legacy section-less profiles)', () => {
        const warn = spyOn(console, 'warn');

        expect(resolveFieldSection(undefined, 'slugline')).toBe('content');
        expect(warn).toHaveBeenCalled();
    });

    it('defaults an unrecognised section to content and warns', () => {
        const warn = spyOn(console, 'warn');

        expect(resolveFieldSection('sidebar', 'genre')).toBe('content');
        expect(warn).toHaveBeenCalled();
    });
});
