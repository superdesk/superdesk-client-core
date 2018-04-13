export function stripHtmlTags(value) {
    const htmlRegex = /(<([^>]+)>)/ig;

    return value ? String(value).replace(htmlRegex, '') : '';
}

export function getAngularService(name) {
    return angular.element(document.body)
        .injector()
        .get(name);
}