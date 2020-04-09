import {flatMap, noop} from 'lodash';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IExtension} from 'superdesk-api';
import {extensions as extensionsWithActivationResult} from 'appConfig';

export function registerExtensions(
    extensions: Array<IExtension>,
    superdesk,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata,
): Promise<void> {
    extensions.forEach((extension) => {
        extensionsWithActivationResult[extension.id] = {
            extension,
            activationResult: {},
        };
    });

    return Promise.all(
        Object.keys(extensionsWithActivationResult).map((extensionId) => {
            const extensionObject = extensionsWithActivationResult[extensionId];

            const superdeskApi = getSuperdeskApiImplementation(
                extensionId,
                extensionsWithActivationResult,
                modal,
                privileges,
                lock,
                session,
                authoringWorkspace,
                config,
                metadata,
            );

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
