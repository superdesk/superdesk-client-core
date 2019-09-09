import {htmlIsPlainTextDragged} from './htmlIsPlainTextDragged';

it('should detect plain text dragged from browser', () => {
    const html = `
    <meta charset="utf-8">
    <span>Plain text dragged</span>
    `;

    expect(htmlIsPlainTextDragged(html)).toBe(true);
});

it('should not detect plain text if it contains a link', () => {
    const html = `
    <meta charset="utf-8">
    <span>
    <a href="">link</a>
    </span>
    `;

    expect(htmlIsPlainTextDragged(html)).toBe(false);
});
