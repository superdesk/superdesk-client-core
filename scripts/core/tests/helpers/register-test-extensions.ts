import {extensions} from 'core/extension-imports.generated';
import {registerExtensions} from 'core/register-extensions';
import {IExtension} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

export function registerTestExtensions(
    newExtensions: Array<IExtension>,
    superdesk,
    modal,
    privileges,
    lock,
    session,
    authoringWorkspace: AuthoringWorkspaceService,
    config,
    metadata,
): Promise<void> {
    for (const key in extensions) {
        delete extensions[key];
    }

    newExtensions.forEach((extension, i) => {
        extensions[i] = {
            extension: extension,
            activationResult: {},
            manifest: {
                main: '',
            },
        };
    });

    return registerExtensions(superdesk, modal, privileges, lock, session, authoringWorkspace, config, metadata);
}
