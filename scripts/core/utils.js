export function stripHtmlTags(value) {
    const htmlRegex = /(<([^>]+)>)/ig;

    return value ? String(value).replace(htmlRegex, '') : '';
}
