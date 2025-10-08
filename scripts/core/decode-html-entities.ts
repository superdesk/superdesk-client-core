export function decodeHtmlEntities(text: string): string {
    const textArea = document.createElement('textarea');

    textArea.innerHTML = text;

    return textArea.value;
}
