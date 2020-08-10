import {flatMap, noop} from 'lodash';
import {getSuperdeskApiImplementation} from './get-superdesk-api-implementation';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IExtension, IPage, IWorkspaceMenuItem, IExtensionActivationResult} from 'superdesk-api';
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
    workspaceMenuProvider,
    notify,
): Promise<void> {
    extensions.forEach((extension) => {
        extensionsWithActivationResult[extension.id] = {
            extension,
            activationResult: {},
        };
    });

    function registerPage(page: IPage) {
        const params: any = {
            label: page.title,
            priority: page.priority ?? 100,
            adminTools: false,
            controller: noop,
            template: '<sd-extension-page />',
        };

        if (page.addToMainMenu ?? true) {
            params.category = superdesk.MAIN_MENU;
        }

        if (page.showTopMenu === true) {
            params.topTemplateUrl = 'scripts/apps/dashboard/views/workspace-topnav.html';
        }

        if (page.showSideMenu === true) {
            params.sideTemplateUrl = 'scripts/apps/workspace/views/workspace-sidenav.html';
        }

        superdesk.activity(page.url, params);
    }

    function registerWorkspaceMenu(menuItem: IWorkspaceMenuItem) {
        workspaceMenuProvider.item({
            href: menuItem.href,
            icon: menuItem.icon,
            label: menuItem.label,
            order: menuItem.order ?? 1000,
            shortcut: menuItem.shortcut,
        });
    }

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
                notify,
            );

            return extensionObject.extension.activate(superdeskApi).then((activationResult) => {
                extensionObject.activationResult = activationResult;

                return activationResult;
            });
        }),
    ).then((activationResults: Array<IExtensionActivationResult>) => {
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
}
