import {authoringReactEnabledUserSelection, extensions, setAuthoringReact} from 'appConfig';
import {registerAuthoringReactFields} from 'apps/authoring-react/fields/register-fields';
import {registerAuthoringReactWidgets, authoringReactWidgetsExtension} from 'apps/authoring-react/manage-widget-registration';
import {unregisterInternalExtension} from 'core/helpers/register-internal-extension';
import {trimStartExact} from 'core/helpers/utils';
import {flatMap} from 'lodash';
import ng from 'core/services/ng';

export const switchAuthoring = (url: string) => {
    const extensionUrls = flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) => activationResult.contributions?.pages ?? [],
    ).map((page) => page.url);

    const parsedPath = new URL(url);
    const isNavigatingToAnExtensionPage = extensionUrls.find(
        (url) => url.startsWith(trimStartExact(parsedPath.hash, '#')),
    ) != null;

    const action: 'register' | 'deregister' = (() => {
        if (isNavigatingToAnExtensionPage) {
            // regardless of user setting, authoring-react
            // must be enabled in extensions
            return 'register';
        } else {
            // respect user setting
            return authoringReactEnabledUserSelection ? 'register' : 'deregister';
        }
    })();

    if (action === 'register') {
        setAuthoringReact(true);

        registerAuthoringReactWidgets();
        registerAuthoringReactFields();
    } else {
        setAuthoringReact(false);
        unregisterInternalExtension(authoringReactWidgetsExtension);
        unregisterInternalExtension('authoring-react--fields');
    }

    if (isNavigatingToAnExtensionPage) {
        ng.get('authoringWorkspace').close();
    }
};
