import {sanitizeHtmlContent} from './sanitize-html-input';

describe('sanitizeHtmlContent', () => {
    it('removes script tags', () => {
        const value = '<p>safe</p><script>alert("xss")</script>';

        expect(sanitizeHtmlContent(value)).toBe('<p>safe</p>');
    });

    it('removes inline event handlers', () => {
        const value = '<img src="/image.jpg" onerror="alert(1)">';

        expect(sanitizeHtmlContent(value)).toBe('<img src="/image.jpg">');
    });

    it('preserves normal formatting tags', () => {
        const value = '<p><strong>hello</strong> <em>world</em></p>';

        expect(sanitizeHtmlContent(value)).toBe('<p><strong>hello</strong> <em>world</em></p>');
    });
});
