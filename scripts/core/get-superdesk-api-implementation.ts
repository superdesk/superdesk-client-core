import {ISuperdesk, IExtensions} from 'superdesk-api';
import {gettext} from 'core/utils';

export function getSuperdeskApiImplementation(
    requestingExtensionId: string,
    extensions: IExtensions,
    modal,
): ISuperdesk {
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
        extensions: {
            getExtension: (id: string) => {
                const extension = extensions[id].extension;

                if (extension == null) {
                    return Promise.reject('Extension not found.');
                }

                const {manifest} = extensions[requestingExtensionId];

                if (
                    manifest.superdeskExtension != null
                    && Array.isArray(manifest.superdeskExtension.dependencies)
                    && manifest.superdeskExtension.dependencies.includes(id)
                ) {
                    const extensionShallowCopy = {...extension};

                    delete extensionShallowCopy['activate'];

                    return Promise.resolve(extensionShallowCopy);
                } else {
                    return Promise.reject('Not authorized.');
                }
            },
        },
    };
}
