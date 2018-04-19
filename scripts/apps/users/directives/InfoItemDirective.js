export function InfoItemDirective() {
    return {
        link: function(scope, element) {
            element.addClass('item');
            element.find('input, select')
                .addClass('info-value info-editable');
        },
    };
}
