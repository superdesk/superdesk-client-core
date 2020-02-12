// converts linebreaks in paragraphs
export const plainTextToHtml = (text: string) =>
    text.replace(/.*[^\n]/g, '<p>$&</p>');

export const stringIsHtml = (text: string) =>
    /<\/?[a-z][\s\S]*>/i.test(text);
