import {flatMap, noop} from 'lodash';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import {extensions} from 'core/extension-imports.generated';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {MetadataService} from 'apps/authoring/metadata/metadata';

export function registerExtensions(
    superdesk,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata: MetadataService,
): Promise<void> {
    return Promise.all(
        Object.keys(extensions).map((extensionId) => {
            const extensionObject = extensions[extensionId];

            const superdeskApi = getSuperdeskApiImplementation(
                extensionId,
                extensions,
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
