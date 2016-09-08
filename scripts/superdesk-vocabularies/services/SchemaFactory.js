SchemaFactory.$inject = ['gettext'];
export function SchemaFactory(gettext) {
    var colorScheme = {
        name: {type: 'text', label: gettext('Name')},
        qcode: {type: 'text', label: gettext('QCode')},
        color: {type: 'color', label: gettext('Color')},
        short: {type: 'text', label: gettext('List Name')}
    };

    return {
        urgency: colorScheme,
        priority: colorScheme
    };
}
