import {registerInternalExtension} from 'core/helpers/register-internal-extension';
// import {getDemoWidget} from './widgets/demo-widget';
import {getFindAndReplaceWidget} from './article-widgets/find-and-replace';
import {getInlineCommentsWidget} from './article-widgets/inline-comments';
import {getCommentsWidget} from './article-widgets/comments';
import {IExtensionActivationResult} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {getSuggestionsWidget} from './article-widgets/suggestions';
import {getVersionsAndItemHistoryWidget} from './article-widgets/versions-and-item-history';
import {getTranslationsWidget} from './article-widgets/translations/translations';
import {getMacrosWidget} from './macros/macros';
import {getPackagesWidget} from './packages';
import {getMetadataWidget} from './article-widgets/metadata/metadata';

const authoringReactWidgetsExtension = 'authoring-react-widgets';

export function registerAuthoringReactWidgets() {
    const sidebarWidgets: IExtensionActivationResult['contributions']['authoringSideWidgets'] = [
        getFindAndReplaceWidget(),
        getVersionsAndItemHistoryWidget(),
        getTranslationsWidget(),
        getMacrosWidget(),
        getPackagesWidget(),
        getMetadataWidget(),
    ];

    // comments order: 3
    sidebarWidgets.push(getCommentsWidget());

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
