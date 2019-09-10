// Dragging a single line in chrome removes DraftJS's data
// and only sends a <span> containing the dragged text next
// to a <meta> tag
export function htmlIsPlainTextDragged(html: string): boolean {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (doc.body.childElementCount !== 1) {
        return false;
    }

    const span = doc.body.childNodes[0] as HTMLElement;

    return span.tagName === 'SPAN' && span.innerHTML === span.innerText;
}
