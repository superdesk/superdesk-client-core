PackageItemProxy.$inject = ['$compile'];
export function PackageItemProxy($compile) {
    var template =
        '<div sd-package-item data-id="id"' +
            ' data-item="item"' +
            ' data-setitem="setitem({selected: selected})"' +
            ' data-mode="mode">' +
        '</div>';

    return {
        scope: {
            id: '=',
            item: '=',
            setitem: '&',
            mode: '=',
        },
        link: function(scope, elem) {
            elem.append($compile(template)(scope));
        },
    };
}
