import {gettext} from 'core/ui/components/utils';

SchemaFactory.$inject = [];
export function SchemaFactory() {
    var colorScheme = {
        name: {type: 'text', label: gettext('Name')},
        qcode: {type: 'text', label: gettext('QCode')},
        color: {type: 'color', label: gettext('Color')},
        short: {type: 'short', label: gettext('List Name'), maxlength: 2},
    };

    return {
        urgency: colorScheme,
        priority: colorScheme,
    };
}
