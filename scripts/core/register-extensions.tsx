import {flatMap, noop} from 'lodash';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IExtensionModule, IPage, IWorkspaceMenuItem, IExtensionActivationResult, ISuperdesk} from 'superdesk-api';
import {extensions as extensionsWithActivationResult} from 'appConfig';
import {dispatchInternalEvent} from './internal-events';
import {registerContributionsFromCustomFields} from './helpers/register-internal-extension';

export interface IExtensionLoader {
    id: string;
    load(): Promise<IExtensionModule>;
    configuration?: {[key: string]: any};
}

export function registerExtensions(
    extensionLoaders: Array<IExtensionLoader>,
    superdesk,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata,
    workspaceMenuProvider,
    preferencesService,
): Promise<void> {
    window['extensionsApiInstances'] = {};

    function registerPage(page: IPage) {
        const params: any = {
            label: page.title,
            priority: page.priority ?? 100,
            adminTools: false,
            controller: noop,
            template: '<sd-extension-page></sd-extension-page>',
        };

        if (page.addToMainMenu ?? true) {
            params.category = superdesk.MENU_MAIN;
        }

        if (page.showTopMenu === true) {
            params.topTemplateUrl = 'scripts/apps/dashboard/views/workspace-topnav.html';
        }

        if (page.showSideMenu === true) {
            params.sideTemplateUrl = 'scripts/apps/workspace/views/workspace-sidenav.html';
        }

        if (page.addToSideMenu != null) {
            workspaceMenuProvider.item({
                href: page.url,
                label: page.title,
                icon: page.addToSideMenu.icon,
                order: page.addToSideMenu.order,
                shortcut: page.addToSideMenu.keyBinding,
            });
        }

        superdesk.activity(page.url, params);
    }

    function registerWorkspaceMenu(menuItem: IWorkspaceMenuItem) {
        const entry: Dictionary<string, string | number> = {
            href: menuItem.href,
            icon: menuItem.icon,
            label: menuItem.label,
            order: menuItem.order ?? 1000,
            shortcut: menuItem.shortcut,
        };

        workspaceMenuProvider.item(entry);
    }

    return Promise.all(
        extensionLoaders.map(
            ({id, load, configuration}) => {
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

                return load()
                    .then((module) => module.default)
                    .then((extension) => {
                        extensionsWithActivationResult[id] = {
                            extension,
                            activationResult: {},
                            configuration: configuration ?? {},
                        };
                    });
            },
        ),
    )
        .then(() => {
            return Promise.all(
                Object.keys(extensionsWithActivationResult).map((extensionId) => {
                    const extensionObject = extensionsWithActivationResult[extensionId];

                    return extensionObject.extension.activate(window['extensionsApiInstances'][extensionId])
                        .then((activationResult) => {
                            extensionObject.activationResult = activationResult;

                            return activationResult;
                        });
                }),
            ).then((activationResults: Array<IExtensionActivationResult>) => {
                registerContributionsFromCustomFields(
                    flatMap(
                        activationResults,
                        (activationResult) => activationResult.contributions?.customFieldTypes ?? [],
                    ),
                );

                flatMap(
                    activationResults,
                    (activationResult) => activationResult.contributions?.pages ?? [],
                )
                    .forEach(registerPage);

                flatMap(
                    activationResults,
                    (activationResult) => activationResult.contributions?.workspaceMenuItems ?? [],
                )
                    .forEach(registerWorkspaceMenu);
            });
        })
        .then(() => {
            dispatchInternalEvent('extensionsHaveLoaded', true);
        });
}
