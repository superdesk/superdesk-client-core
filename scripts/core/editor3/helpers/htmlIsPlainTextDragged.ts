// Dragging a single line in chrome removes DraftJS's data
// and only sends a <span> containing the dragged text next
// to a <meta> tag
export function htmlIsPlainTextDragged(html: string): boolean {
    const parser = new DOMParser().parseFromString(html, 'text/html');

    return parser.querySelectorAll('span').length === 1 &&
        parser.querySelectorAll('meta').length === 1 &&
        parser.querySelectorAll(':not(span):not(meta):not(html):not(head):not(body)').length === 0;
}
