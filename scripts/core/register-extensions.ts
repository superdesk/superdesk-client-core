import {flatMap, noop} from "lodash";
import {getSuperdeskApiImplementation} from "./get-superdesk-api-implementation";
import {extensions} from 'core/extension-imports.generated';

export function registerExtensions(superdesk, modal, privileges) {
    Promise.all(
        Object.keys(extensions).map((extensionId) => {
            const extensionObject = extensions[extensionId];

            const superdeskApi = getSuperdeskApiImplementation(extensionId, extensions, modal, privileges);

            return extensionObject.extension.activate(superdeskApi).then((activationResult) => {
                extensionObject.activationResult = activationResult;

                return activationResult;
            });
        }),
    ).then((activationResults) => {
        const pages = flatMap(activationResults, (activationResult) =>
            activationResult.contributions != null
            && activationResult.contributions.pages != null
                ? activationResult.contributions.pages
                : [],
        );

        pages.forEach((page) => {
            superdesk
                .activity(page.url, {
                    label: page.title,
                    priority: 100,
                    category: superdesk.MENU_MAIN,
                    adminTools: false,
                    controller: noop,
                    template: '<sd-extension-page></<sd-extension-page>',
                });
        });
    });
}
