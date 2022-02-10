import {registerInternalExtension} from 'core/helpers/register-internal-extension';
// import {getDemoWidget} from './widgets/demo-widget';
import {getFindAndReplaceWidget} from './widgets/find-and-replace';
import {getInlineCommentsWidget} from './widgets/inline-comments';
import {IExtensionActivationResult} from 'superdesk-api';
import {appConfig} from 'appConfig';

const authoringReactWidgetsExtension = 'authoring-react-widgets';

export function registerAuthoringReactWidgets() {
    const sidebarWidgets: IExtensionActivationResult['contributions']['authoringSideWidgets'] = [
        getFindAndReplaceWidget(),
    ];

    if ((appConfig.features.editorInlineComments ?? true) === true) {
        sidebarWidgets.push(getInlineCommentsWidget());
    }

    registerInternalExtension(authoringReactWidgetsExtension, {
        contributions: {
            authoringSideWidgets: sidebarWidgets,
        },
    });
}

/**
 * It could also be unregistered while the app is running,
 * but not when authoring is open.
 */
// export function unregisterAuthoringReactWidgets() {
//     unregisterInternalExtension(authoringReactWidgetsExtension);
// }
