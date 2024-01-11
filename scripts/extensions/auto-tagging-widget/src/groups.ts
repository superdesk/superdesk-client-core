import {OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';

interface IGroupLabels {
    singular: string;
    plural: string;
}

export function getGroups(superdesk: ISuperdesk): OrderedMap<string, IGroupLabels> {
    const {gettext} = superdesk.localization;

    let groups = OrderedMap<string, IGroupLabels>();

    groups = groups.set('organisation', {
        singular: gettext('Organisation'),
        plural: gettext('Organisations'),
    });

    groups = groups.set('person', {
        singular: gettext('Person'),
        plural: gettext('People'),
    });

    groups = groups.set('event', {
        singular: gettext('Event'),
        plural: gettext('Events'),
    });

    groups = groups.set('place', {
        singular: gettext('Place'),
        plural: gettext('Places'),
    });

    groups = groups.set('object', {
        singular: gettext('Object'),
        plural: gettext('Objects'),
    });

    return groups;
}
