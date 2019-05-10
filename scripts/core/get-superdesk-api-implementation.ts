import {ISuperdesk} from "superdesk-api";
import {gettext} from 'core/utils';

export function getSuperdeskApiImplementation(modal): ISuperdesk {
    return {
        ui: {
            alert: (message: string) => modal.alert({bodyText: message}),
            confirm: (message: string) => new Promise((resolve) => {
                modal.confirm(message, gettext('Cancel'))
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            }),
        },
        localization: {
            gettext: (message) => gettext(message),
        },
    };
}
