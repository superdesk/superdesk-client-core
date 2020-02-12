// converts linebreaks in paragraphs
export const plainTextToHtml = (text: string) =>
    text.replace(/.*[^\n]/g, '<p>$&</p>');

export const isStringHtml = (text: string) => {
    const doc = (new DOMParser()).parseFromString(text, 'text/html');

    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};
