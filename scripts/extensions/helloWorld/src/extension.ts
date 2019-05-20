import {ISuperdesk} from 'superdesk-api';

export function activate(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    // superdesk.ui.alert(gettext('Hello world'));
}
