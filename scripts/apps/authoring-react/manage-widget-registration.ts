import {registerInternalExtension} from 'core/helpers/register-internal-extension';
// import {getDemoWidget} from './widgets/demo-widget';
import {getFindAndReplaceWidget} from './widgets/find-and-replace';
import {getInlineCommentsWidget} from './widgets/inline-comments';
import {IExtensionActivationResult} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {getSuggestionsWidget} from './widgets/suggestions';
import {getVersionsHistoryWidget} from './widgets/versions-history';

const authoringReactWidgetsExtension = 'authoring-react-widgets';

export function registerAuthoringReactWidgets() {
    const sidebarWidgets: IExtensionActivationResult['contributions']['authoringSideWidgets'] = [
        getFindAndReplaceWidget(),
        getVersionsHistoryWidget(),
    ];

    if ((appConfig.features.editorInlineComments ?? true) === true) {
        sidebarWidgets.push(getInlineCommentsWidget());
    }

    if ((appConfig.features.editorSuggestions ?? true) === true) {
        sidebarWidgets.push(getSuggestionsWidget());
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
