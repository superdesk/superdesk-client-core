import {flatMap, noop} from 'lodash';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IExtension, ISuperdesk} from 'superdesk-api';
import {extensions as extensionsWithActivationResult} from 'appConfig';

export function registerExtensions(
    extensionLoaders: Array<{id: string; load(): Promise<IExtension>}>,
    superdesk,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata,
    preferencesService,
): Promise<void> {
    window['extensionsApiInstances'] = {};

    return Promise.all(
        extensionLoaders.map(
            ({id, load}) => {
                const apiInstance: ISuperdesk = getSuperdeskApiImplementation(
                    id,
                    extensionsWithActivationResult,
                    modal,
                    privileges,
                    lock,
                    session,
                    authoringWorkspace,
                    config,
                    metadata,
                    preferencesService,
                );

                window['extensionsApiInstances'][id] = apiInstance;

                return load().then((extension) => {
                    extensionsWithActivationResult[id] = {
                        extension,
                        activationResult: {},
                    };
                });
            },
        ),
    ).then(() => {
        return Promise.all(
            Object.keys(extensionsWithActivationResult).map((extensionId) => {
                const extensionObject = extensionsWithActivationResult[extensionId];

                return extensionObject.extension.activate(window['extensionsApiInstances'][extensionId])
                    .then((activationResult) => {
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
    });
}
