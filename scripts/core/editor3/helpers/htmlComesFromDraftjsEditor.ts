export const htmlComesFromDraftjsEditor = (html: string) => {
    const parser = new DOMParser().parseFromString(html, 'text/html');
    const comesFromeditor = parser.querySelector('[data-offset-key]') != null;

    if (comesFromeditor) {
        return true;
    }

    // Dragging a single line in chrome removes DraftJS's data
    // and only sends a <span> containing the dragged text next
    // to a <meta> tag
    const chromeDraggedText =
        parser.querySelectorAll('span').length === 1 &&
        parser.querySelectorAll('meta').length === 1 &&
        parser.querySelectorAll(':not(span):not(meta):not(html):not(head):not(body)').length === 0;

    return chromeDraggedText;
};
